/**
 * The seed menu Jelly starts from, and the reason it is the shape it is.
 *
 * EVERY PRICE IN THIS FILE CAME OFF ONE OF THEIR OWN PUBLISHED PAGES. Nothing
 * is estimated, averaged, or carried over from a third-party listing. The
 * sources are pastramijoes.com/catering/ (transcribed complete),
 * pastramijoes.com/menu/ for the soup and extras, and
 * pastramijoes.com/weekly-features/ for the two seasonal items.
 *
 * WHY THE SANDWICH BOARD IS NOT IN HERE. Their retail menu publishes no prices
 * at all: 55 of 65 items are blank on their own website. The prices do exist,
 * inside their Heartland ordering system, and that is exactly the problem the
 * proposal is about. They are not in this file because getting them out of
 * Heartland means reverse-engineering a bundled vendor SPA's private API rather
 * than reading a published page, and a sandwich price is precisely the kind of
 * number that looks harmless and gets a business held to it. A placeholder
 * price on another site in this account was served to real customers.
 *
 * So Jelly ships live on what they publish, which is catering, soup and the
 * seasonal board, and the sandwich board arrives the day the owner sends a
 * price list. That is one paste into the menu editor at /kitchen. It is also
 * the single most persuasive thing in the proposal: the system is built, the
 * menu is a text field, and the only missing input is his.
 *
 * `hidden: true` on an item means off the menu entirely, invisible to guests.
 * That is different from 86'd, which is the kitchen board saying sold out
 * today. Both exist and they are not the same switch.
 */

const dollars = (n) => Math.round(n * 100);

// Their seven tray varieties, offered on every tray and boxed lunch. Chicken
// Caesar is wrap-only on their own page, so it is a choice on the wrap tray and
// not on the sub tray.
const SUB_VARIETIES = ["Turkey", "Ham", "Club", "Italian", "Chicken Salad", "Veggie"];
const WRAP_VARIETIES = [...SUB_VARIETIES, "Chicken Caesar"];
const asChoices = (names) => names.map((name) => ({ name, priceCents: 0 }));

export const SEED_MENU = [
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
      {
        id: "salad-garden",
        name: "Garden salad",
        desc: "Romaine, tomato, cucumber, croutons. Italian, ranch and balsamic.",
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
        desc: "Provides eight cups. Today’s pot or the chili.",
        priceCents: dollars(35),
        unit: "per gallon",
        image: "/assets/pjs/soup.webp",
        groups: [],
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
    name: "At the counter",
    ageRestricted: false,
    items: [
      {
        id: "soup-cup",
        name: "Soup, cup",
        desc: "Eight ounces. Chicken noodle and the chili every day, plus today’s pot.",
        priceCents: dollars(4.49),
        unit: "",
        image: "/assets/pjs/soup.webp",
        groups: [],
      },
      {
        id: "soup-bowl",
        name: "Soup, bowl",
        desc: "Twelve ounces.",
        priceCents: dollars(5.49),
        unit: "",
        image: null,
        groups: [],
      },
      {
        // Their menu prints these as one line at one price. Split, because a
        // required "Which" group made every error sentence read "needs a which
        // picked", and because two items is one fewer tap for the guest.
        id: "side-pasta-salad",
        // NOT just "Pasta salad": the catering section already has one at $20
        // for ten people, and a kitchen ticket that reads "1 x Pasta salad"
        // would be ambiguous between a $2.10 side and a $20 tray.
        name: "Pasta salad, side",
        desc: "",
        priceCents: dollars(2.1),
        unit: "",
        image: null,
        groups: [],
      },
      {
        id: "side-coleslaw",
        name: "Coleslaw, side",
        desc: "",
        priceCents: dollars(2.1),
        unit: "",
        image: null,
        groups: [],
      },
      {
        id: "cornbread",
        name: "Cornbread muffin",
        desc: "",
        priceCents: dollars(2.5),
        unit: "",
        image: null,
        groups: [],
      },
      {
        id: "bread-butter",
        name: "Bread and butter",
        desc: "",
        priceCents: dollars(2.5),
        unit: "",
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
        image: "/assets/pjs/grilled.webp",
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
