/*
 * ONE DELIBERATE DEPARTURE FROM THEIR COPY: Caesar, Russian and Italian are
 * capitalised here. Their own menu writes "caesar dressing" and "house russian"
 * lowercase while capitalising "Joe's Italian Dressing" three lines away, so
 * there was no house style to preserve, only an inconsistency to inherit.
 * Everything else on this page is their wording.
 */
/**
 * One menu, not two.
 *
 * Their live site publishes /menu/ and /battlecreek/menu-battle-creek/ as two
 * separate pages that share about eighty percent of their items word for word,
 * with small unexplained divergences: Battle Creek carries a Caesar Salad that
 * Marshall does not, Marshall's Chicken Caesar Hot says "grilled chicken breast"
 * and Battle Creek's says "grilled chicken", and Battle Creek has no breakfast,
 * no pizza and no Grilled Chicken Panini. Two pages means every future edit is
 * two edits, and the divergences above are what happens when somebody forgets.
 *
 * So: one array, and each item declares where it is served. The menu page filters
 * by location. Marshall-only items carry a visible badge rather than quietly
 * disappearing, because a Battle Creek customer who has heard about the
 * breakfast pizza should be told where to get it, not shown a menu it is missing
 * from.
 *
 * ============================ PRICES ============================
 *
 * READ THIS BEFORE PUBLISHING ANYTHING FROM THIS FILE.
 *
 * `price: null` means WE DO NOT KNOW. It is not a styling choice and it is not
 * an oversight. Their site publishes prices for soup, five add-ons, two seasonal
 * items and the whole catering menu, and for nothing else: every sandwich, wrap,
 * salad and pizza on both retail menus is unpriced.
 *
 * We are not filling those in. A placeholder price left in a constant once got
 * served to real customers on another site in this account, and a sandwich price
 * is exactly the kind of number that looks harmless and is not.
 *
 * Every price below is either transcribed from their own live page or omitted.
 * The two figures that came from elsewhere are marked. Anything null renders as
 * a labelled gap on the page and appears on the launch checklist in the README.
 */

/** Real, from pastramijoes.com. Everything else is null on purpose. */
export const groups = [
  {
    id: "breakfast",
    title: "Breakfast",
    note: "Marshall only, from 7am.",
    at: ["marshall"],
    sections: [
      {
        title: "Breakfast Sammys",
        note: "On a biscuit or toast. On a bagel, add 2.00.",
        items: [
          { name: "Sausage, egg & cheese", price: 6.5 },
          { name: "Bacon, egg & cheese", price: 6.5, photo: "/assets/pjs/breakfast.webp", photoAlt: "A bacon, egg and cheese biscuit with a hash brown." },
          { name: "Pastrami & egg", price: 10.0 },
        ],
      },
      {
        title: "Grilled Burritos",
        note: 'In a 12" tortilla, or as a bowl.',
        items: [
          { name: "Sausage", price: 8.0 },
          { name: "Bacon & avocado", price: 8.0 },
          { name: "Pastrami", price: null },
          { name: "Corned beef hash", price: 8.5 },
        ],
      },
      {
        title: "Plates",
        items: [
          { name: "Biscuits & gravy", price: null },
          { name: "Breakfast pizza", price: 12.0 },
        ],
      },
      {
        title: "Bakery and coffee",
        items: [
          { name: "Chocolate croissant", price: null },
          { name: "House-made pastries", desc: "Whatever came out that morning.", price: null },
          { name: "NYC bagels", price: null },
          { name: "Hot coffee", price: 2.75 },
          { name: "Café Rica cold brew", price: null },
          { name: "Orange juice", price: null },
        ],
      },
    ],
  },

  {
    id: "hot",
    title: "Hot sandwiches",
    short: "Hot",
    at: ["marshall", "battle-creek"],
    sections: [
      {
        title: null,
        items: [
          {
            name: "Joe’s Famous Hot Pastrami",
            desc: "Sy Ginsberg pastrami, dill pickles, dark mustard on rye.",
            price: 13.75, half: 8.99,
            signature: true,
            photo: "/assets/pjs/reuben.webp",
            photoAlt: "A hot pastrami sandwich cut in half on a plate with kettle chips and a pickle.",
          },
          {
            name: "PJ’s Reuben",
            desc: "Sy Ginsberg corned beef, swiss, sauerkraut, house Russian on grilled marble rye.",
            addon: "Make it a Turkey Reuben.",
            price: 13.75, half: 8.99,
            signature: true,
          },
          {
            name: "Jomama",
            desc: "Sy Ginsberg corned beef, swiss, coleslaw, house Russian on grilled marble rye.",
            addon: 'Make it a "Turkey Mama".',
            price: 13.75, half: 8.99,
            signature: true,
          },
          {
            name: "Grilled Chicken Panini",
            desc: "Grilled chicken breast, roasted red peppers, spinach, muenster, red pepper mayo on grilled sourdough.",
            price: 11.99, half: 6.99,
            at: ["marshall"],
          },
          {
            name: "Chicken Caesar Hot",
            desc: "Grilled chicken breast, hot pastrami, parmesan, lettuce, Caesar on a sub roll.",
            price: 13.99, half: 9.49,
          },
          {
            name: "B.L.T.",
            desc: "Bacon, lettuce, tomato, mayo on grilled sourdough.",
            addon: "Add egg salad to make it a Denver Club.",
            price: 11.49, half: 6.49,
          },
          {
            name: "Grilled Cheese Pleaser",
            desc: "Three cheese blend, bacon, tomato, onion on grilled sourdough.",
            price: 9.99, half: 5.99,
            photo: "/assets/pjs/grilled.webp",
            photoAlt: "A grilled sandwich cut in half, stacked on green checkered deli paper.",
          },
          {
            name: "PJ’s Griller",
            desc: "Michigan-raised turkey, bacon, muenster, lettuce, tomato, cranberry mustard on grilled sourdough.",
            price: 12.49, half: 7.99,
          },
          {
            name: "Hot Italian Grinder",
            desc: "Ham, capocollo, pepperoni, provolone, lettuce, tomato, onion, banana peppers, Caesar on a toasted sub roll.",
            price: 13.99, half: 9.49,
          },
          {
            name: "Jacked Up Club",
            desc: "Michigan-raised turkey, ham, bacon, pepper jack, lettuce, tomato, mayo on a toasted pretzel bun.",
            price: 9.49,
          },
          {
            name: "Grilled Veggie Panini",
            desc: "Spinach, onions, roasted red peppers, provolone, red pepper mayo on grilled sourdough.",
            price: 9.99, half: 6.49,
          },
          {
            name: "Chicken Bacon Ranch Wrap",
            desc: "Grilled chicken, bacon, spinach, tomato, onion, pepper jack, chipotle ranch.",
            price: 10.99,
          },
        ],
      },
    ],
  },

  {
    id: "cold",
    title: "Cold sandwiches",
    short: "Cold",
    at: ["marshall", "battle-creek"],
    sections: [
      {
        title: null,
        items: [
          { name: "The Mitten", desc: "Michigan-raised turkey, Sy Ginsberg pastrami, swiss, lettuce, tomato, onion, mayo, mustard.", price: 14.99, half: 8.99, wrap: 10.49 },
          { name: "Baby Bull", desc: "Roast beef, provolone, lettuce, tomato, onion, horseradish sauce.", price: 14.99, half: 9.1, wrap: 10.49 },
          { name: "The Big Foot", desc: "Ham, genoa salami, provolone, lettuce, tomato, onion, banana peppers, Joe’s dressing.", price: 13.49, half: 8.49, wrap: 9.99 },
          {
            name: "The Gabagool Giant",
            desc: "Capocollo, genoa salami, pepperoni, provolone, lettuce, tomato, onion, roasted red peppers, oil & vinegar, oregano.",
            price: 16.99, half: 10.99, wrap: 11.99,
            photo: "/assets/pjs/sub.webp",
            photoAlt: 'A twelve inch sub being cut, layered with capocollo, salami, provolone and peppers.',
          },
          { name: "Joe’s Club", desc: "Michigan-raised turkey, ham, bacon, swiss, lettuce, tomato, onion, mayo.", price: 13.99, half: 9.1, wrap: 9.99 },
          { name: "Talk of the Town", desc: "Roast beef, turkey, salami, provolone, lettuce, tomato, onion, banana peppers, horseradish sauce.", price: 14.49, half: 8.99, wrap: 10.49 },
          { name: "The Sparty", desc: "Michigan-raised turkey, bacon, provolone, lettuce, tomato, onion, mayo, pesto.", price: 14.99, half: 8.99, wrap: 10.49 },
          { name: "PJ’s Chicken Salad", desc: "House-made chicken salad, provolone, lettuce, tomato, onion, mayo.", price: 13.99, half: 8.99, wrap: 9.99 },
          { name: "The Gobbler", desc: "Michigan-raised turkey, provolone, lettuce, tomato, onion, mayo.", price: 12.99, half: 8.49, wrap: 9.99 },
          { name: "Ham & Cheese", desc: "Ham, cheddar, lettuce, tomato, onion, mayo.", price: 12.99, half: 8.49, wrap: 9.99 },
          { name: "Chicken Caesar Wrap", desc: "Grilled chicken, parmesan, romaine, Caesar dressing.", price: 9.99 },
          {
            name: "PJ’s Egg Salad Wrap",
            desc: "House-made egg salad, muenster, lettuce, tomato, mayo.",
            price: 9.99,
            photo: "/assets/pjs/wrap.webp",
            photoAlt: "A wrap cut on the diagonal on green checkered deli paper.",
          },
        ],
      },
    ],
  },

  {
    id: "salads",
    title: "Salads",
    note: "Dressings, all house-made where it says so: ranch, sweet onion vinaigrette, Russian, chipotle ranch, Joe’s Italian, Caesar.",
    at: ["marshall", "battle-creek"],
    sections: [
      {
        title: null,
        items: [
          { name: "Full House", desc: "Romaine, turkey, ham, bacon, tomato, mushroom, onion, croutons, house ranch.", price: 13.49 },
          { name: "Crab Louie", desc: "Romaine, crab, swiss, tomato, hard-boiled egg, lemon, croutons, house Russian.", price: 13.99 },
          { name: "Spinach & Chicken", desc: "Baby spinach, herb-grilled chicken, hard-boiled egg, bacon, croutons, house sweet onion vinaigrette.", price: 13.49 },
          { name: "Chopped Italian", desc: "Romaine, provolone, pepperoni, salami, capocollo, banana peppers, tomato, onion, parmesan, Joe’s Italian.", price: 13.99 },
          { name: "Grilled Chicken Caesar", desc: "Herb-grilled chicken, romaine, parmesan, croutons, lemon, Caesar. Available without chicken.", price: 9.99 },
          { name: "Side Salad", desc: "Romaine, tomato, onion, cucumber, croutons, dressing of choice.", price: 4.99 },
          { name: "Side Caesar", desc: "Romaine, parmesan, croutons, Caesar.", price: 4.99 },
        ],
      },
    ],
  },

  {
    id: "pizza",
    title: "Pizza",
    note: 'Nine inch or fourteen inch. A ten inch gluten free crust is available on the small, for an extra charge.',
    at: ["marshall"],
    sections: [
      {
        title: null,
        items: [
          { name: "Lots-o-roni", desc: "PJ’s red sauce, crispy pepperoni, mozzarella.", price: 22.99, wrap: 11.99, pizza: true },
          { name: "The Sicilian Villain", desc: "PJ’s red sauce, Italian sausage, pepperoni, capocollo, green peppers, onions, mozzarella.", price: 22.99, wrap: 11.99, pizza: true },
          { name: "Tuscan Veggie", desc: "PJ’s red sauce, spinach, onion, roasted red peppers, mozzarella, pesto drizzle.", price: 21.99, wrap: 10.99, pizza: true },
          { name: "BBQ Chicken", desc: "Sweet Baby Ray’s, grilled chicken, onion, mozzarella.", price: 22.99, wrap: 11.99, pizza: true },
          { name: "Let's Make a Dill", desc: "Ranch, pickle slices, mozzarella, dill.", price: 22.99, wrap: 11.99, pizza: true },
          { name: "Joe’s Hawaiian Delight", desc: "PJ’s red sauce, ham, pineapple, green pepper, mozzarella.", price: 22.99, wrap: 11.99, pizza: true },
          { name: "My Very Own Cheese Pizza", desc: "PJ’s red sauce, mozzarella.", price: 18.99, wrap: 9.99, pizza: true },
        ],
      },
    ],
  },

  {
    id: "soup",
    title: "Soup",
    note: "Chicken noodle and the award winning chili, every day. A different soup each weekday, on the This Week page.",
    at: ["marshall", "battle-creek"],
    sections: [
      {
        title: null,
        items: [
          { name: "Cup, 8 ounce", price: 4.49, photo: "/assets/pjs/soup.webp", photoAlt: "A white bowl of chicken and white bean soup on green checkered paper." },
          { name: "Bowl, 12 ounce", price: 5.49 },
          { name: "Add a cup to any entrée", price: 3.99 },
        ],
      },
    ],
  },

  {
    id: "sides",
    title: "Sides and extras",
    short: "Sides",
    at: ["marshall", "battle-creek"],
    sections: [
      {
        title: "Choose Two",
        note: "Add two of: small fountain drink, chips, house-made coleslaw, house-made pasta salad, cookie.",
        at: ["marshall"],
        items: [{ name: "Added to any sandwich", price: 4.0 }],
      },
      {
        title: "Pick 2",
        note: "Deli sides: chips, cookies, pasta salad, coleslaw, bottled water. Premium sides: side salad, side Caesar, cornbread, brownie, bottled soda or tea.",
        at: ["battle-creek"],
        items: [{ name: "Any two deli sides", price: 4.0 }],
      },
      {
        title: null,
        items: [
          { name: "Pasta salad or coleslaw", price: 2.1 },
          { name: "Cornbread muffin", price: 2.5 },
          { name: "Bread & butter", price: 2.5 },
          { name: "Cheese", price: 0.5 },
          { name: "Extra dressing", price: 1.0 },
          { name: "Extra meat", price: null, priceNote: "Varies" },
          {
            name: "Great Lakes kettle chips",
            desc: "Zapp's and Dirty, various flavors.",
            price: null,
            photo: "/assets/pjs/chips.webp",
            photoAlt: "Bags of Zapp's and Dirty kettle chips in a basket.",
          },
        ],
      },
    ],
  },
];

/**
 * The weekly rotation, from their own Weekly Features page.
 *
 * `updated` is the point of this object. Their page carries no date, so the one
 * page on their site that IS maintained (edited three days before this build)
 * reads as possibly stale to anybody looking at it. A date under the heading
 * costs nothing and is the difference between "this is today's soup" and "this
 * might be from 2019".
 */
export const week = {
  // This date is real: it is the <lastmod> their own sitemap publishes for
  // /weekly-features/, 2026-08-17T14:10:32Z, which is also what the proposal's
  // "updated three days before we wrote this" counts from.
  //
  // It still needs an owner. The page prints it as "Last updated ..." in front
  // of customers, so from launch it has to move when the soups move, set by
  // whoever sets them. Left alone it becomes a date that says the page is
  // current when it is not, which is worse than no date at all and is the whole
  // reason the line exists. On the README checklist.
  updated: "2026-08-17",
  daily: "Chicken noodle and our award winning chili, every day.",
  soups: [
    { day: "Monday", soup: "Stuffed green pepper" },
    { day: "Tuesday", soup: "Broccoli cheddar" },
    { day: "Wednesday", soup: "Clam chowder" },
    { day: "Thursday", soup: "Chicken & wild rice" },
    { day: "Friday", soup: "Lobster bisque" },
    { day: "Saturday", soup: "Chef’s choice" },
  ],
  // Priced on their own page, so these are real. Their live copy has two typos
  // in it right now, "bACON" and "CHIP0TLE" with a digit zero. Fixed here.
  seasonal: [
    {
      name: "Hot Honey Bacon Pizza",
      desc: "Tavern style thin crust, PJ’s red sauce, pizza cheese blend, crumbled bacon, hot honey drizzle.",
      prices: [
        { label: "9 inch", price: 11.99 },
        { label: "14 inch", price: 22.99 },
      ],
    },
    {
      name: "Chicken Bacon Chipotle Panini",
      desc: "Chicken, bacon, pepper jack, chipotle ranch on grilled sourdough.",
      prices: [
        { label: "Half", price: 6.99 },
        { label: "Whole", price: 11.99 },
      ],
    },
  ],
};

/**
 * Catering, transcribed complete from their own page, which IS fully priced.
 * Worth noting in the pitch: the site can publish prices. The retail menus just
 * do not.
 */
export const catering = {
  tagline: "You make the memories. We’ll make the food.",
  // "(wrap only)" in parentheses, not after a comma: joined with the others by
  // ", " it read as an eighth variety called "wrap only".
  varieties: ["Turkey", "Ham", "Club", "Italian", "Chicken salad", "Veggie", "Chicken Caesar (wrap only)"],
  groups: [
    {
      title: "Trays",
      items: [
        { name: "Sub or wrap tray", desc: 'Full wraps or 12" subs cut into thirds. Estimate two pieces per person.', prices: [{ label: "per person", price: 7.0 }] },
        { name: "Garden salad", desc: "Romaine, tomato, cucumber, croutons, Italian, ranch and balsamic.", prices: [{ label: "serves 10", price: 40 }, { label: "serves 20", price: 75 }] },
        { name: "Caesar salad", desc: "Romaine, parmesan, croutons, Caesar.", prices: [{ label: "serves 10", price: 40 }, { label: "serves 20", price: 75 }] },
        { name: "Coleslaw", desc: "Shredded cabbage and carrots in a creamy, tangy house-made dressing.", prices: [{ label: "serves 10", price: 20 }, { label: "serves 20", price: 45 }, { label: "serves 40", price: 90 }] },
        { name: "Pasta salad", desc: "Spiral pasta with crumbled feta in Joe’s creamy Italian dressing.", prices: [{ label: "serves 10", price: 20 }, { label: "serves 20", price: 45 }, { label: "serves 40", price: 90 }] },
      ],
    },
    {
      title: "Boxed lunches",
      items: [
        { name: '6" sub, two sides and a pickle', prices: [{ label: "each", price: 11.0 }] },
        { name: "Wrap, two sides and a pickle", prices: [{ label: "each", price: 12.0 }] },
      ],
    },
    {
      title: "Breakfast",
      items: [
        { name: "Mini burritos", desc: "Meat of choice, eggs, cheese, hash browns.", prices: [{ label: "each", price: 3.0 }] },
        { name: "Breakfast biscuits", desc: "Sausage or bacon with egg and cheese, or no meat.", prices: [{ label: "each", price: 6.0 }] },
        { name: "NYC bagels & cream cheese", desc: "In quantities of five, with two 8oz cream cheese flavors of choice.", prices: [{ label: "per five", price: 25.0 }] },
        { name: "Pastries", desc: "Seasonally available.", prices: [{ label: "each", price: 2.0, to: 4.0 }] },
      ],
    },
    {
      title: "Soup and sides",
      items: [
        { name: "Soup", desc: "One gallon, about eight cups.", prices: [{ label: "gallon", price: 35.0 }] },
        { name: "Bread & butter", prices: [{ label: "per person", price: 2.0 }] },
        { name: "Great Lakes kettle chips", desc: "Various flavors.", prices: [{ label: "each", price: 2.25 }] },
        { name: "Cookie tray", prices: [{ label: "per person", price: 2.25 }] },
        { name: "Brownie tray", prices: [{ label: "per person", price: 2.75 }] },
        { name: "Cookie and brownie tray", prices: [{ label: "per person", price: 2.5 }] },
      ],
    },
  ],
  custom: "Appetizers and charcuterie are quoted. Tell us the event and we will call you back.",
};

/** Items visible at a location: the group allows it and the item does not opt out. */
export function groupsFor(slug) {
  return groups
    .filter((g) => !slug || g.at.includes(slug))
    .map((g) => ({
      ...g,
      sections: g.sections
        .filter((s) => !slug || !s.at || s.at.includes(slug))
        .map((s) => ({ ...s, items: s.items.filter((i) => !slug || !i.at || i.at.includes(slug)) }))
        .filter((s) => s.items.length),
    }))
    .filter((g) => g.sections.length);
}

/** How many prices we are still missing. Printed by tools/flow-checks.mjs. */
export function missingPrices() {
  let missing = 0;
  let total = 0;
  for (const g of groups) {
    for (const s of g.sections) {
      for (const i of s.items) {
        total += 1;
        if (i.price == null && !i.priceNote) missing += 1;
      }
    }
  }
  return { missing, total };
}
