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
  missing === 0 || /price to come/.test(body)
    ? pass("the menu page labels them rather than hiding them")
    : fail("prices are missing and the page does not say so");
}

// --------------------------------------------------- 7. the studio plate
console.log("\nstudio credit");
{
  const { body } = await get(`${BASE}/`);
  /gw-plate/.test(body) ? pass("the plate is in the footer") : fail("no studio plate in the footer");
  /Concept build by/.test(body) ? pass('wording is "Concept build by"') : fail("wrong credit wording for a spec build");
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
