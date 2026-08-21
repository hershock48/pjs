/**
 * The seed menu Jelly starts from, and the reason it is the shape it is.
 *
 * EVERY PRICE IN THIS FILE CAME OFF ONE OF THEIR OWN PUBLISHED PAGES. Nothing
 * is estimated, averaged, or carried over from a third-party listing. The
 * sources are pastramijoes.com/catering/ (transcribed complete) and
 * pastramijoes.com/weekly-features/ for the two seasonal items.
 *
 * WHERE THE SANDWICH BOARD IS. Generated, in ./board.js, off lib/menu.js. It
 * used to be absent, because their retail menu published no prices at all and
 * the real ones lived inside Heartland. Then the owner photographed the printed
 * in-store menu, those prices went into lib/menu.js, and this file became the
 * stale copy: the site could show a $13.75 Reuben that the order page could not
 * sell. Typing the sandwiches in here as well would have rebuilt exactly the
 * drift the proposal accuses their current site of, so the counter board is
 * derived instead, and this file holds only what lib/menu.js cannot express —
 * catering, a separate published document with its own option shapes, and the
 * weekly features, which come off a different page.
 *
 * `hidden: true` on an item means off the menu entirely, invisible to guests.
 * That is different from 86'd, which is the kitchen board saying sold out
 * today. Both exist and they are not the same switch.
 *
 * `at` is an array of location slugs, or null for "served at both counters".
 * Pizza, breakfast and one panini are Marshall only, so the moment the counter
 * board became orderable this stopped being cosmetic. Filtering lives in
 * ./catalog.js and is enforced again server-side in the order route.
 */

import { counterSections } from "./board";

const dollars = (n) => Math.round(n * 100);

// Their seven tray varieties, offered on every tray and boxed lunch. Chicken
// Caesar is wrap-only on their own page, so it is a choice on the wrap tray and
// not on the sub tray.
const SUB_VARIETIES = ["Turkey", "Ham", "Club", "Italian", "Chicken Salad", "Veggie"];
const WRAP_VARIETIES = [...SUB_VARIETIES, "Chicken Caesar"];
const asChoices = (names) => names.map((name) => ({ name, priceCents: 0 }));

/**
 * Catering and the weekly features, hand-written, in the order a guest meets
 * them after the generated counter board.
 */
const HAND_WRITTEN = [
  {
    name: "Catering trays",
    ageRestricted: false,
    items: [
      {
        id: "tray-sub",
        name: "Sub tray",
        desc: '12" subs cut into thirds. Estimate two pieces a person.',
        priceCents: dollars(7),
        unit: "per person",
        image: "/assets/pjs/sub.webp",
        groups: [
          { name: "Variety", required: true, multi: true, choices: asChoices(SUB_VARIETIES) },
        ],
      },
      {
        id: "tray-wrap",
        name: "Wrap tray",
        desc: "Full wraps cut into thirds. Estimate two pieces a person.",
        priceCents: dollars(7),
        unit: "per person",
        image: "/assets/pjs/wrap.webp",
        groups: [
          { name: "Variety", required: true, multi: true, choices: asChoices(WRAP_VARIETIES) },
        ],
      },
      {
        id: "boxed-sub",
        name: 'Boxed lunch, 6" sub',
        desc: "Two sides and a pickle.",
        priceCents: dollars(11),
        unit: "each",
        image: null,
        groups: [{ name: "Variety", required: true, multi: false, choices: asChoices(SUB_VARIETIES) }],
      },
      {
        id: "boxed-wrap",
        name: "Boxed lunch, wrap",
        desc: "Two sides and a pickle.",
        priceCents: dollars(12),
        unit: "each",
        image: null,
        groups: [{ name: "Variety", required: true, multi: false, choices: asChoices(WRAP_VARIETIES) }],
      },
    ],
  },
  {
    name: "Catering sides and desserts",
    ageRestricted: false,
    items: [
      // NO GARDEN SALAD. Their catering page prints no price for it — the
      // Caesar directly under it is 40/75 and for a while those numbers were
      // copied up a row, which is an invented price with a checkout attached.
      // It comes back the moment the owner sends the number: one entry here or
      // one edit in the menu editor at /kitchen.
      {
        id: "salad-Caesar",
        name: "Caesar salad",
        desc: "Romaine, parmesan, croutons, Caesar dressing.",
        priceCents: dollars(40),
        unit: "serves 10",
        image: null,
        groups: [
          {
            name: "Size",
            required: true,
            multi: false,
            choices: [
              { name: "Serves 10", priceCents: 0 },
              { name: "Serves 20", priceCents: dollars(35) },
            ],
          },
        ],
      },
      {
        id: "coleslaw",
        name: "Coleslaw",
        desc: "Shredded cabbage and carrots in a creamy, tangy house dressing.",
        priceCents: dollars(20),
        unit: "serves 10",
        image: null,
        groups: [
          {
            name: "Size",
            required: true,
            multi: false,
            choices: [
              { name: "Serves 10", priceCents: 0 },
              { name: "Serves 20", priceCents: dollars(25) },
              { name: "Serves 40", priceCents: dollars(70) },
            ],
          },
        ],
      },
      {
        id: "pasta-salad",
        name: "Pasta salad",
        desc: "Spiral pasta with crumbled feta, dressed in Joe’s creamy Italian.",
        priceCents: dollars(20),
        unit: "serves 10",
        image: null,
        groups: [
          {
            name: "Size",
            required: true,
            multi: false,
            choices: [
              { name: "Serves 10", priceCents: 0 },
              { name: "Serves 20", priceCents: dollars(25) },
              { name: "Serves 40", priceCents: dollars(70) },
            ],
          },
        ],
      },
      {
        id: "soup-gallon",
        name: "Soup, one gallon",
        desc: "Provides eight cups.",
        priceCents: dollars(35),
        unit: "per gallon",
        image: "/assets/pjs/soup.webp",
        // Their catering page offers the gallon as "today's pot or the chili".
        // Asked, not implied: a gallon of the wrong soup at a party is not a
        // mistake anybody gets to quietly fix.
        groups: [
          {
            name: "Which soup",
            required: true,
            multi: false,
            choices: [
              { name: "Today’s pot", priceCents: 0 },
              { name: "The chili", priceCents: 0 },
            ],
          },
        ],
      },
      {
        id: "bread-butter-person",
        // The counter section has a "Bread and butter" too, at $2.50 for one.
        // Same reason as the pasta salad: a ticket has to say which.
        name: "Bread and butter, by the head",
        desc: "",
        priceCents: dollars(2),
        unit: "per person",
        image: null,
        groups: [],
      },
      {
        id: "kettle-chips",
        name: "Great Lakes kettle chips",
        desc: "Various flavors.",
        priceCents: dollars(2.25),
        unit: "each",
        image: "/assets/pjs/chips.webp",
        groups: [],
      },
      {
        id: "tray-cookie",
        name: "Cookie tray",
        desc: "",
        priceCents: dollars(2.25),
        unit: "per person",
        image: null,
        groups: [],
      },
      {
        id: "tray-brownie",
        name: "Brownie tray",
        desc: "",
        priceCents: dollars(2.75),
        unit: "per person",
        image: null,
        groups: [],
      },
      {
        id: "tray-combo",
        name: "Cookie and brownie tray",
        desc: "",
        priceCents: dollars(2.5),
        unit: "per person",
        image: null,
        groups: [],
      },
    ],
  },
  {
    name: "Catering breakfast",
    ageRestricted: false,
    items: [
      {
        id: "mini-burrito",
        name: "Mini breakfast burritos",
        desc: "Meat of choice, eggs, cheese and hashbrowns.",
        priceCents: dollars(3),
        unit: "each",
        image: null,
        groups: [
          {
            name: "Meat",
            required: true,
            multi: false,
            choices: [
              { name: "Sausage", priceCents: 0 },
              { name: "Bacon", priceCents: 0 },
              { name: "Pastrami", priceCents: 0 },
            ],
          },
        ],
      },
      {
        id: "breakfast-biscuit",
        name: "Breakfast biscuits",
        desc: "Egg and cheese, with or without meat.",
        priceCents: dollars(6),
        unit: "each",
        image: "/assets/pjs/breakfast.webp",
        groups: [
          {
            name: "Meat",
            required: true,
            multi: false,
            choices: [
              { name: "Sausage", priceCents: 0 },
              { name: "Bacon", priceCents: 0 },
              { name: "No meat", priceCents: 0 },
            ],
          },
        ],
      },
      {
        id: "bagels-five",
        name: "NYC bagels and cream cheese",
        desc: "With two 8oz cream cheeses of your choice.",
        priceCents: dollars(25),
        unit: "for five",
        image: null,
        groups: [],
      },
    ],
  },
  {
    name: "This week",
    ageRestricted: false,
    items: [
      {
        // Their weekly-features page prices these as small/large. Both numbers
        // are theirs; the difference is expressed as an option so the base
        // price stays the one they printed.
        id: "seasonal-pizza",
        name: "Hot honey bacon pizza",
        desc: "Tavern style thin crust, PJ’s red sauce, pizza cheese, crumbled bacon, hot honey drizzle.",
        priceCents: dollars(11.99),
        unit: "",
        image: null,
        groups: [
          {
            name: "Size",
            required: true,
            multi: false,
            choices: [
              { name: '9"', priceCents: 0 },
              { name: '14"', priceCents: dollars(11) },
            ],
          },
        ],
      },
      {
        id: "seasonal-panini",
        name: "Chicken bacon chipotle panini",
        desc: "Chicken, bacon, pepper jack and chipotle ranch on grilled sourdough.",
        priceCents: dollars(6.99),
        unit: "",
        // No photo. The only candidate was the marble-rye corned beef shot,
        // which is the Jomama, and a photo of the wrong sandwich on an order
        // card is a wrong fact a customer pays for. See lib/menu.js.
        image: null,
        groups: [
          {
            name: "Size",
            required: true,
            multi: false,
            choices: [
              { name: "Half", priceCents: 0 },
              { name: "Whole", priceCents: dollars(5) },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * The whole document: generated counter board first, then catering and the
 * weekly features.
 *
 * Order matters to the guest, not to the code — the order route decides pickup
 * versus catering from the section NAME via isCateringSection, never from
 * position, so this list can be reordered freely.
 *
 * Catering and the weekly board carry `at: null`: both counters cater, and the
 * weekly features run at both. Only the generated board varies by location.
 */
export const SEED_MENU = [
  ...counterSections(),
  ...HAND_WRITTEN.map((s) => ({
    ...s,
    items: s.items.map((i) => ({ at: null, ...i })),
  })),
];
