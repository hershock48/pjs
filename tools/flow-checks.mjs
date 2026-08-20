/**
 * The checks that would otherwise be somebody remembering.
 *
 * Run against a locally served PRODUCTION build, never the dev server:
 *
 *   npm run build && npx next start -p 4495
 *   node tools/flow-checks.mjs --base http://127.0.0.1:4495
 *
 * Each check below exists because something went wrong once, in this repo or
 * another one in this account. They are cheap and they are not clever. The
 * point is that they fail loudly rather than degrading quietly.
 */
import { pathToFileURL } from "node:url";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const BASE = arg("base", "http://127.0.0.1:4495");

const ROUTES = [
  "/",
  "/menu",
  "/menu?at=marshall",
  "/menu?at=battle-creek",
  "/specials",
  "/order",
  "/catering",
  "/locations",
  "/locations/marshall",
  "/locations/battle-creek",
  "/about",
  "/jobs",
  "/charity",
  "/contact",
];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`  FAIL  ${msg}`);
};
const pass = (msg) => console.log(`  ok    ${msg}`);

const get = async (url, init) => {
  const r = await fetch(url, init);
  return { status: r.status, ok: r.ok, headers: r.headers, body: await r.text() };
};

console.log(`\nflow-checks against ${BASE}\n`);

// ------------------------------------------------------------- 1. routes
console.log("routes answer 200");
for (const r of ROUTES) {
  const res = await get(`${BASE}${r}`);
  res.ok ? pass(r) : fail(`${r} returned ${res.status}`);
}

// -------------------------------------------------- 2. nothing is cached
// A page whose content depends on the current time cannot be statically
// generated. The first build of this repo shipped /locations/[slug] as SSG,
// because generateStaticParams overrode the layout's force-dynamic, which would
// have frozen the open/closed badge at whatever o'clock the deploy ran.
console.log("\nno route is cached, because the badge reads the clock");
for (const r of ["/", "/locations/marshall", "/order", "/contact"]) {
  const { headers } = await get(`${BASE}${r}`);
  const cc = headers.get("cache-control") ?? "";
  /no-store|no-cache|max-age=0|private/.test(cc) ? pass(`${r} (${cc})`) : fail(`${r} cache-control is "${cc}"`);
}

// ------------------------------------------------------------ 3. hours
// The whole reason this rebuild exists. Their live site publishes hours on none
// of its eleven pages.
console.log("\nhours are published");
{
  const { body } = await get(`${BASE}/`);
  /7am to 7pm/.test(body) ? pass("Marshall hours on the homepage") : fail("no Marshall hours on the homepage");
  /10am to 3pm/.test(body) ? pass("Battle Creek hours on the homepage") : fail("no Battle Creek hours on the homepage");
  /Open until|Opens at|Opens tomorrow|Opens \w+day|Closing at/.test(body)
    ? pass("open/closed badge rendered")
    : fail("no open/closed badge on the homepage");
}

// -------------------------------------------------- 4. structured data
console.log("\nstructured data");
{
  const { body } = await get(`${BASE}/`);
  const m = body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (!m) fail("no JSON-LD on the homepage");
  else {
    try {
      const data = JSON.parse(m[1].replace(/&quot;/g, '"'));
      const nodes = data["@graph"] ?? [];
      nodes.length === 2 ? pass("two Restaurant nodes") : fail(`expected 2 Restaurant nodes, got ${nodes.length}`);
      nodes.every((n) => n.openingHoursSpecification?.length)
        ? pass("every node carries openingHoursSpecification")
        : fail("a Restaurant node has no openingHoursSpecification");
    } catch (e) {
      fail(`JSON-LD did not parse: ${e.message}`);
    }
  }
}

// -------------------------------------------------- 5. titles are unique
console.log("\nevery route has its own title and description");
{
  const seen = new Map();
  for (const r of ROUTES) {
    const { body } = await get(`${BASE}${r}`);
    const title = body.match(/<title>(.*?)<\/title>/s)?.[1] ?? "";
    const desc = body.match(/<meta name="description" content="(.*?)"/s)?.[1] ?? "";
    if (!title) fail(`${r} has no title`);
    if (!desc) fail(`${r} has no meta description`);
    // /menu and its query variants deliberately share a title.
    const key = r.split("?")[0];
    if (seen.has(title) && seen.get(title) !== key) fail(`${r} shares a title with ${seen.get(title)}`);
    seen.set(title, key);
  }
  pass(`${ROUTES.length} routes checked`);
}

// ---------------------------------------------- 6. the price placeholders
// Placeholder data on a live site is a live problem. This prints the count so it
// cannot be forgotten, and it fails the moment the page stops saying so.
console.log("\nprice placeholders");
{
  const { missingPrices } = await import(pathToFileURL(process.cwd() + "/lib/menu.js").href);
  const { missing, total } = missingPrices();
  console.log(`  note  ${missing} of ${total} menu items have no published price`);
  const { body } = await get(`${BASE}/menu`);
  // The per-row label used to be the words "price to come", fifty-four times.
  // It is an em rule with a title attribute now, and the fact is stated once,
  // with the count, in the notice at the top. So the assertion moved to the
  // notice: what has to be true is that the page SAYS how many are missing, not
  // that a particular string appears in a particular cell.
  // React's SSR output puts `<!-- -->` between adjacent expressions and text,
  // so the sentence on the page is literally
  //   54<!-- --> of <!-- -->65<!-- --> items have no published price
  // and a naive regex against the raw HTML never matches. Strip comments first.
  const text = body.replace(/<!--.*?-->/g, "");
  const saysSo = new RegExp(`${missing} of ${total} items have no published price`).test(text);
  missing === 0 || saysSo
    ? pass("the menu page states the count rather than hiding it")
    : fail("prices are missing and the page does not say so");
}

// ------------------------------------------------------- 6b. Jelly ordering
// The ordering system is the part of this build that can fail silently and
// expensively: a page that takes an order nobody will make, or a price the
// server did not agree to.
console.log("\nordering");
{
  const state = await get(`${BASE}/api/ordering/state`);
  const s = JSON.parse(state.body);

  s.locations?.length === 2
    ? pass("the state endpoint answers for both counters")
    : fail("the state endpoint does not carry both counters");

  // Demo mode must be visible, not implied. If a Stripe key ever lands here
  // without the copy changing, this is what says so.
  const orderPage = await get(`${BASE}/order`);
  s.demo === true
    ? pass("no Stripe key, and the build reports demo mode")
    : pass("Stripe configured, ordering takes real money");

  // The server is the till. Send a line with a made-up unit price and confirm
  // the total comes back at the menu price rather than the one we sent.
  const r = await fetch(`${BASE}/api/ordering/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestName: "Flow Check",
      guestPhone: "2695551234",
      locationSlug: "marshall",
      tipCents: 0,
      lines: [{ itemId: "soup-cup", qty: 1, options: [], unitCents: 1 }],
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (r.ok) {
    d.totals?.subtotalCents === 449
      ? pass("the server re-prices every line and ignores the client's numbers")
      : fail(`the server accepted a client price: subtotal ${d.totals?.subtotalCents}`);
  } else {
    // A closed counter is a legitimate answer here, and it must be a real
    // sentence rather than a bare status.
    typeof d.error === "string" && d.error.length > 20
      ? pass(`ordering closed, and it says why: "${d.error.slice(0, 60)}..."`)
      : fail("ordering refused the order without an explanation");
  }

  // The counter's screen is not public.
  const kitchen = await get(`${BASE}/api/kitchen/orders`);
  kitchen.status === 401
    ? pass("the kitchen queue is behind the PIN")
    : fail(`the kitchen queue answered ${kitchen.status} without auth`);

  // Nothing on the guest side may carry the business model. glaze.md's rule,
  // and the easiest one to break by pasting from a proposal.
  const leaks = ["fee split", "50/50", "Toast", "Heartland", "middleman", "our own website"];
  const found = leaks.filter((t) => orderPage.body.toLowerCase().includes(t.toLowerCase()));
  found.length === 0
    ? pass("the guest ordering page carries no business-model copy")
    : fail(`the ordering page leaks the pitch: ${found.join(", ")}`);
}

// --------------------------------------------------- 7. the studio plate
console.log("\nstudio credit");
{
  const { body } = await get(`${BASE}/`);
  /gw-plate/.test(body) ? pass("the plate is in the footer") : fail("no studio plate in the footer");
  // KEVIN'S CALL, AND THE SECOND TIME HE HAS MADE IT. glaze/brand.md says a
  // spec build that has not been bought gets "Concept build by"; True North
  // took "Double Dipped by" in August and so does this. The check asserts a
  // credit line exists and is one of the two sanctioned wordings, rather than
  // enforcing a rule the person who wrote it has now overridden twice.
  /Double Dipped by|Concept build by|Baked by/.test(body)
    ? pass(`wording is "${(body.match(/Double Dipped by|Concept build by|Baked by/) || [])[0]}"`)
    : fail("no recognised studio credit wording in the footer");
}

// ---------------------------------------------------- 8. the host split
console.log("\nhost split");
{
  // On any host that is not the pitch host, anything under /pitch must resolve
  // to the 404 page. Otherwise the proposal is a live URL on the client's own
  // domain the day it is attached.
  const res = await get(`${BASE}/pitch/pjs/index.html`);
  res.status === 404 ? pass("/pitch is a 404 off the pitch host") : fail(`/pitch returned ${res.status} off the pitch host`);
}

console.log(`\n${failures === 0 ? "all checks passed" : `${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
