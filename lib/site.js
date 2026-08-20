/**
 * Every business fact about Pastrami Joe's lives here, so a correction is one edit.
 *
 * This file is the whole argument of the rebuild, so it is worth saying why it is
 * shaped the way it is.
 *
 * Their live site publishes NO hours of operation on any page. Not the homepage,
 * not /contact/, not /contact-battle-creek/, not either menu. Eleven pages, zero
 * hours. In the vacuum, six third-party listings publish six different answers,
 * three of which say the Marshall store opens at 11am when the owner says 7am,
 * which deletes the entire breakfast menu from the listings customers check.
 *
 * The fix is not "put the hours on the contact page." The fix is one array that
 * the header, the location pages, the open/closed badge and the JSON-LD all read
 * from, so there is exactly one place hours can be wrong and one edit that fixes
 * them everywhere.
 *
 * LOCATIONS ARE AN ARRAY, NOT TWO HARD-CODED PAGES. Their current site handles
 * two stores by cloning itself: /battlecreek/ has its own nav, its own contact
 * form, its own menu page, and a second brand name. Duplicated body copy between
 * / and /battlecreek/ is verbatim identical. The owner has told Choose Marshall
 * he plans a bakehouse and more Michigan locations. A third store on the current
 * architecture means a third clone. Here it means one more object in this array.
 *
 * ANY surface that cannot read from this file gets named in the README.
 * Right now that list is: the proposal at public/pitch/pjs/index.html, which is
 * deliberately standalone, and the OG images, which are pixels.
 */

export const site = {
  name: "Pastrami Joe’s",
  legalName: "Pastrami Joe’s Deli",
  since: 2003,
  tagline: "Real, honest deli food.",

  // Their own homepage copy, kept because it is already good.
  // Note: their live hero spells it "Rueben" and their menu pages spell it
  // "Reuben". Corrected here, once.
  blurb:
    "New York style pastrami, corned beef from Sy Ginsberg, and a Reuben people drive in for. Two counters in Calhoun County.",

  email: "hello@pastramijoes.com", // PLACEHOLDER, see README
  // Their site links only Facebook. @pastramijoes exists on Instagram and is
  // linked from nowhere on the current site.
  social: {
    facebook: "https://www.facebook.com/PastramiJoes/",
    instagram: "https://www.instagram.com/pastramijoes/",
  },

  supplier: {
    // Spelled "Ginsburg" in their homepage body copy and "Ginsberg" on both menu
    // pages. Ginsberg is correct: Sy Ginsberg is the Detroit corned beef house.
    name: "Sy Ginsberg",
    note: "Detroit, since 1972. Gold Label corned beef and pastrami.",
  },

  locations: [
    {
      slug: "marshall",
      name: "Marshall",
      brand: "Pastrami Joe’s",
      opened: 2003,
      isOriginal: true,
      seats: 26,
      street: "105 N. Jefferson St.",
      city: "Marshall",
      region: "MI",
      postal: "49068",
      phone: { display: "(269) 781-8800", tel: "+12697818800" },
      // Their CURRENT ordering channel, kept as a fact and no longer linked
      // from anywhere on this site. Jelly took the online channel over; this
      // stays because the proposal quotes the hostname and because it is the
      // thing being replaced. If you find yourself linking it again, read
      // app/order/page.js first.
      orderUrl: "https://pastramijoesmarshall.hrpos.heartland.us/",
      // HOURS PLACEHOLDER, see README. Source is the owner's own account in
      // Second Wave, 26 Feb 2026. Confirm before launch, because this is the
      // fact the whole rebuild is built to get right.
      hours: [
        { days: [1, 2, 3, 4, 5], label: "Monday to Friday", open: "07:00", close: "19:00" },
        { days: [6], label: "Saturday", open: "10:00", close: "15:00" },
      ],
      serves: ["breakfast", "lunch", "dinner", "pizza", "soup", "catering"],
      blurb:
        "The original counter, on Jefferson a block off the fountain. Breakfast from seven, pizza and soup all day, twenty-six seats.",
      photo: "/assets/pjs/storefront.webp",
      photoAlt: "The Pastrami Joe’s storefront on North Jefferson Street in Marshall, with awnings and sidewalk tables.",
    },
    {
      slug: "battle-creek",
      name: "Battle Creek",
      // Their Battle Creek store is branded Little Joe's on the current site,
      // with no explanation anywhere of how the two names relate. Kept, because
      // it is real and the mascot is shared, but stated rather than left to be
      // guessed at.
      brand: "Little Joe’s",
      opened: 2024,
      isOriginal: false,
      seats: 20,
      street: "32 W. Michigan Ave., Suite 2",
      city: "Battle Creek",
      region: "MI",
      postal: "49017",
      phone: { display: "(269) 788-9345", tel: "+12697889345" },
      orderUrl: "https://pastramijoesbc.hrpos.heartland.us/",
      // HOURS PLACEHOLDER, see README. Same source.
      hours: [{ days: [1, 2, 3, 4, 5], label: "Monday to Friday", open: "10:00", close: "15:00" }],
      serves: ["lunch", "soup", "catering"],
      blurb:
        "A downtown lunch counter in the Hampton Building, back on Michigan Avenue since 2024. Twenty seats, the full sandwich board, no breakfast.",
      photo: "/assets/pjs/sub.webp",
      photoAlt: "A twelve inch Italian sub being cut on the counter.",
      // The old store at 80 W. Michigan closed in 2021. Yelp still carries that
      // address as a separate CLOSED listing holding 31 reviews, and
      // Tripadvisor's only Battle Creek entry is still at it. Named here because
      // fixing it is listings work, not code, and it belongs on the launch list.
      formerAddress: "80 W. Michigan Ave.",
    },
  ],
};

export const nav = [
  { href: "/menu", label: "Menu" },
  { href: "/specials", label: "This Week" },
  { href: "/catering", label: "Catering" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "About" },
];

export const bySlug = (slug) => site.locations.find((l) => l.slug === slug);

/** Absolute URL base. Set per environment; never a .vercel.app host in prod. */
export const SITE_URL = "https://pastramijoes.com";
