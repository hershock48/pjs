/**
 * The counter board, derived from lib/menu.js rather than typed out again.
 *
 * WHY THIS FILE EXISTS AT ALL. The ordering catalogue used to be a hand-written
 * list living in seed.js, and it was written when their retail prices were
 * genuinely unobtainable: 55 of 65 items published no price anywhere, so the
 * board shipped with catering, soup and the weekly features and nothing else.
 * Then the owner photographed the printed in-store menu, those prices went into
 * lib/menu.js, and the ordering catalogue did not follow. The site could show
 * you a $13.75 Reuben and the order page could not sell you one.
 *
 * That is exactly the failure the proposal accuses their current site of: the
 * same fact typed in two places, and one of them going stale. Fixing it by
 * typing the sandwiches into seed.js as well would have rebuilt the same trap.
 * So the board is generated. A price changes in lib/menu.js and it changes on
 * the menu page, on the ordering page and on the kitchen ticket, or it changes
 * nowhere.
 *
 * WHAT IS STILL HAND-WRITTEN, AND WHY. Catering stays in seed.js. Its items
 * carry option shapes lib/menu.js has no concept of (a sub tray priced per
 * person with a multi-select of seven varieties, a salad that comes in
 * serves-10 and serves-20), and their catering menu is a separate published
 * document. The weekly features stay hand-written for the same reason: they
 * come off /weekly-features/, not off the printed board.
 *
 * SIZES ARE OPTIONS WITH POSITIVE DELTAS, NEVER NEGATIVE ONES. Their menu
 * prices a sandwich as whole/half/wrap and a pizza as 14"/9". The base price
 * here is always the CHEAPEST size and every other size is an upcharge, because
 * a negative choice price would have to be allowed through validateMenuDoc,
 * which currently rejects them, and a menu where options can subtract is a menu
 * where a crafted cart can reach zero. Deltas are computed in integer cents off
 * both dollar figures, never by subtracting floats.
 *
 * ONE PRICE IS NOT DERIVED FROM ANOTHER. Every number in the generated board is
 * a number the owner printed. Nothing is interpolated, and an item their menu
 * leaves blank stays off the ordering board entirely rather than being guessed
 * at. See the note at the top of lib/menu.js.
 */

import { groups as MENU } from "../menu";

const cents = (n) => Math.round(n * 100);

/**
 * Ids have to be stable across builds, unique across the whole document, and
 * safe in a URL and a JSON key. Group-prefixed, because "pasta-salad" exists in
 * three different senses on this menu and a kitchen ticket cannot be ambiguous.
 */
const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const idFor = (groupId, name) => `${groupId}-${slug(name)}`;

/**
 * Items their menu prints as a modifier rather than as a thing you can be
 * handed. "Cheese", on its own, is not an order the kitchen can fill, and a
 * ticket line reading "1 x Extra dressing" tells them nothing about what to put
 * it on. They come back below as option groups on the items they modify, at the
 * prices their own menu prints.
 */
const MODIFIERS = new Set([
  "sides-cheese",
  "sides-extra-dressing",
  "sides-extra-meat",
  "soup-add-a-cup-to-any-entree",
]);

/**
 * Add-ons, priced off their own menu. `sides` prints cheese at 50c and extra
 * dressing at a dollar; those are the numbers used, and nothing else is
 * invented. Optional and multi, so the guest can ignore the whole group.
 */
const SANDWICH_EXTRAS = {
  name: "Add",
  required: false,
  multi: true,
  choices: [{ name: "Extra cheese", priceCents: cents(0.5) }],
};

/**
 * Which pot. Chicken noodle and the chili are their every-day soups, and
 * "today's pot" is the rotation the specials page publishes. Required, because
 * the whole point is that the ticket stops being a guess.
 */
const SOUP_CHOICE = {
  name: "Which soup",
  required: true,
  multi: false,
  choices: [
    { name: "Chicken noodle", priceCents: 0 },
    { name: "The chili", priceCents: 0 },
    { name: "Today's pot", priceCents: 0 },
  ],
};

const SALAD_EXTRAS = {
  name: "Add",
  required: false,
  multi: true,
  choices: [{ name: "Extra dressing", priceCents: cents(1.0) }],
};

/**
 * The handful of items that need ordering-specific treatment, keyed by the id
 * the generator would give them. Each one is here for a stated reason; this is
 * not a place to retitle things because a name reads oddly.
 */
const OVERRIDES = {
  // Their menu prints one line, "Pasta salad or coleslaw", at one price. On a
  // menu page that is fine because a human reads the "or". On a kitchen ticket
  // "1 x Pasta salad or coleslaw" is a question, not an instruction, so it is
  // two items at the same printed price.
  "sides-pasta-salad-or-coleslaw": {
    split: [
      { name: "Pasta salad, side", id: "sides-pasta-salad-side" },
      { name: "Coleslaw, side", id: "sides-coleslaw-side" },
    ],
  },

  // The Grilled Burritos section names its items by filling alone, because the
  // heading above them supplies the word "burrito". An order line does not
  // carry the heading, so "1 x Sausage" would reach the kitchen next to a
  // "Sausage, egg & cheese" sammy with nothing to tell them apart. The section
  // heading is folded into the name instead of being lost.
  "breakfast-sausage": { rename: "Sausage burrito" },
  "breakfast-bacon-avocado": { rename: "Bacon & avocado burrito" },
  "breakfast-corned-beef-hash": { rename: "Corned beef hash burrito" },

  // A soup order has to say WHICH soup. Their board keeps three pots going —
  // chicken noodle and the chili every day, plus the day's rotation — and a
  // ticket reading "1 x Cup, 8 ounce" makes the kitchen guess or call. The
  // menu page can say "and today's pot"; an order line cannot. All three
  // choices are theirs, at no upcharge, off their own Weekly Features page.
  "soup-cup-8-ounce": { rename: "Soup, cup", addGroups: [SOUP_CHOICE] },
  "soup-bowl-12-ounce": { rename: "Soup, bowl", addGroups: [SOUP_CHOICE] },
};

/**
 * The two combo lines, transcribed rather than parsed out of the section note.
 *
 * Marshall prints "Choose Two" and Battle Creek prints "Pick 2", both at $4,
 * and both put the actual list of sides in prose underneath. Splitting that
 * prose on commas is what a first version did, and Battle Creek's note names
 * two tiers in one sentence — deli sides and premium sides — so the machine
 * produced a choice called "Bottled water. Premium sides: side salad". The item
 * is "Any two DELI sides", so only the deli list belongs on it. Transcribed by
 * hand from their own note, like everything else in this build.
 */
const COMBOS = {
  "Choose Two": [
    "Small fountain drink",
    "Chips",
    "House-made coleslaw",
    "House-made pasta salad",
    "Cookie",
  ],
  "Pick 2": ["Chips", "Cookies", "Pasta salad", "Coleslaw", "Bottled water"],
};

/** Which counters an item is served at: item wins, then section, then group. */
const servedAt = (group, section, item) => item.at ?? section.at ?? group.at;

/**
 * Size choices for one item, or null when their menu prints one size.
 *
 * Reading the fields as their menu prints them:
 *   pizza    price = 14", wrap = 9"
 *   sandwich price = whole, half = half, wrap = wrap
 */
function sizeGroup(item) {
  if (item.pizza && item.wrap != null) {
    return {
      name: "Size",
      required: true,
      multi: false,
      base: cents(item.wrap),
      choices: [
        { name: '9"', priceCents: 0 },
        { name: '14"', priceCents: cents(item.price) - cents(item.wrap) },
      ],
    };
  }
  if (item.half == null && item.wrap == null) return null;

  const base = cents(item.half ?? item.wrap);
  const choices = [];
  if (item.half != null) choices.push({ name: "Half", priceCents: 0 });
  if (item.wrap != null) {
    choices.push({ name: "Wrap", priceCents: cents(item.wrap) - base });
  }
  choices.push({ name: "Whole", priceCents: cents(item.price) - base });
  return { name: "Size", required: true, multi: false, base, choices };
}

/** Which extras group, if any, belongs on an item from this group. */
function extrasFor(groupId) {
  if (groupId === "hot" || groupId === "cold") return SANDWICH_EXTRAS;
  if (groupId === "salads") return SALAD_EXTRAS;
  return null;
}

function toOrderableItem(group, section, item) {
  const id = idFor(group.id, item.name);
  if (MODIFIERS.has(id)) return [];

  // An item their menu leaves blank does not get a made-up price; it stays off
  // the ordering board. Eight items are in this state, all of them breakfast
  // bakery and drinks, and the counter still sells them in person.
  if (item.price == null || item.priceNote) return [];

  const size = sizeGroup(item);
  const extras = extrasFor(group.id);
  const override = OVERRIDES[id];
  const groups = [];
  if (size) groups.push({ name: size.name, required: size.required, multi: size.multi, choices: size.choices });
  if (extras) groups.push(extras);
  if (override?.addGroups) groups.push(...override.addGroups);

  const desc = [item.desc, item.addon].filter(Boolean).join(" ");
  const base = {
    desc,
    priceCents: size ? size.base : cents(item.price),
    unit: "",
    image: item.photo ?? null,
    at: servedAt(group, section, item) ?? null,
    groups,
  };

  if (override?.split) {
    return override.split.map((s) => ({ ...base, id: s.id, name: s.name }));
  }
  return [{ ...base, id, name: override?.rename ?? item.name }];
}

/**
 * The combo lines, "Choose Two" at Marshall and "Pick 2" at Battle Creek.
 *
 * Their menu prints the price on an item called "Added to any sandwich" and
 * leaves the list of sides in the prose underneath, which is unorderable as
 * written: the guest has to be able to say which two. So the section title
 * becomes the item name, the note stays as the description, and the choices
 * come from COMBOS above. The price is theirs.
 */
function comboItem(group, section) {
  const item = section.items[0];
  const list = COMBOS[section.title];
  if (!item || item.price == null || !list) return [];
  return [
    {
      id: idFor(group.id, section.title),
      name: section.title,
      desc: section.note ?? "",
      priceCents: cents(item.price),
      unit: "",
      image: null,
      at: servedAt(group, section, item) ?? null,
      groups: [
        {
          name: "Pick two",
          required: true,
          multi: true,
          choices: list.map((name) => ({ name, priceCents: 0 })),
        },
      ],
    },
  ];
}

/** The generated counter board, in the order a guest should meet it. */
export function counterSections() {
  const order = ["hot", "cold", "salads", "pizza", "breakfast", "soup", "sides"];
  const byId = new Map(MENU.map((g) => [g.id, g]));

  return order
    .map((gid) => {
      const group = byId.get(gid);
      if (!group) return null;
      const items = group.sections.flatMap((section) =>
        COMBOS[section.title]
          ? comboItem(group, section)
          : section.items.flatMap((it) => toOrderableItem(group, section, it))
      );
      return items.length ? { name: group.title, ageRestricted: false, items } : null;
    })
    .filter(Boolean);
}
