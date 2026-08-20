/**
 * The two widths the standing auditor does not visit.
 *
 * `glaze/scripts/audit.mjs` runs 390 and 1440. `glaze.md` and `glaze/launch.md`
 * both require 320, 390, 768 and 1440, and say plainly that 320 is the one that
 * breaks. It was: at 320 the header wordmark was hidden with `display: none`,
 * which removes it from the accessibility tree as well as the screen, and since
 * both images inside the mark are decorative the home link was left with no
 * accessible name on all twelve routes. Nothing at 390 or 1440 could see it.
 *
 *   node tools/width-check.mjs [--base http://127.0.0.1:4499]
 *
 * SETTLING MATTERS HERE MORE THAN IN THE HOUSE AUDITOR. This site's reveal is a
 * 550ms fade with up to 210ms of stagger delay, so the last element finishes at
 * about 760ms. Auditing before that reports the mid-fade composited colour as a
 * contrast failure: 27 nodes of it at 768, all of them blends like #847a71 where
 * the settled colour is #5E5248. They are not real. This waits for every
 * transition and animation to finish before it measures, and if you shorten that
 * wait you will get a page of failures that describe the harness rather than the
 * site.
 *
 * The same is true of the house auditor's own 400ms settle: it passes this repo
 * at 390 and 1440 by timing rather than by margin. Worth knowing before trusting
 * a contrast number from it here.
 */

import { chromium } from "playwright-core";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core");

const argv = process.argv;
const BASE = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : "http://127.0.0.1:4499";
const WIDTHS = [320, 768];
const ROUTES = [
  "/", "/menu", "/specials", "/order", "/catering", "/locations",
  "/locations/marshall", "/locations/battle-creek", "/about", "/jobs",
  "/charity", "/contact",
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let violations = 0;
let overflow = 0;
let consoleErrors = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") {
      consoleErrors += 1;
      console.log(`  console error at ${width}: ${m.text().slice(0, 120)}`);
    }
  });

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });

    // Reveal-on-scroll content does not exist for axe until it has been
    // revealed, so scroll the whole page first, then force the rest.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    });

    // Then wait for the page to actually stop moving. getAnimations() covers
    // both the CSS transitions on .reveal and the hero's keyframe entrance.
    await page.evaluate(async () => {
      // Infinite animations never resolve `finished`, and this site has one: the
      // breathing dot on the open/closed badge. Awaiting it hangs the harness
      // forever, which is what it did on the first run of this file. Only wait
      // for animations that actually end.
      const ending = document
        .getAnimations()
        .filter((a) => {
          const it = a.effect?.getTiming?.().iterations;
          return it !== Infinity;
        })
        .map((a) => a.finished.catch(() => {}));
      await Promise.all(ending);
    });
    await page.waitForTimeout(120);

    await page.addScriptTag({ path: axePath });
    const res = await page.evaluate(async () =>
      window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      })
    );
    for (const v of res.violations) {
      violations += v.nodes.length;
      console.log(`  FAIL ${width} ${route}  ${v.id} (${v.nodes.length})  ${v.nodes[0].target.join(" ")}`);
    }

    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > width + 1) {
      overflow += 1;
      console.log(`  FAIL ${width} ${route}  horizontal overflow, scrollWidth ${sw}`);
    }
  }
  await context.close();
}

await browser.close();
console.log(
  `\n=== ${BASE} — ${ROUTES.length} route(s) at ${WIDTHS.join(" and ")}px ===\n` +
    `axe violations total: ${violations}\n` +
    `horizontal overflow:  ${overflow === 0 ? "none" : `${overflow} route(s)`}\n` +
    `console errors:       ${consoleErrors === 0 ? "none" : consoleErrors}`
);
process.exit(violations + overflow + consoleErrors === 0 ? 0 : 1);
