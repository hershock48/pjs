/**
 * Motion, checked for the two things that actually break.
 *
 * 1. DOES ANY ANIMATION PUSH THE DOCUMENT SIDEWAYS WHILE IT RUNS? The hero
 *    photograph scales to 1.055 on load. The audit's overflow check measures a
 *    settled page and would never see a scrollbar that exists for 1.6s. This
 *    samples scrollWidth every 100ms through the whole entrance.
 *
 * 2. DOES prefers-reduced-motion ACTUALLY STOP IT? A reduced-motion block that
 *    is overridden by a later rule is worse than none, because it looks handled.
 *    This loads the page with the media feature forced and asserts that every
 *    animated element reports animation-name: none.
 *
 *   node tools/motion-check.mjs [--base http://127.0.0.1:4499]
 */
import { chromium } from "playwright-core";

const argv = process.argv;
const BASE = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : "http://127.0.0.1:4499";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let bad = 0;

// ---- 1. transient horizontal overflow, sampled through the entrance
for (const width of [1440, 390, 320]) {
  const c = await browser.newContext({ viewport: { width, height: 900 } });
  const p = await c.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "commit" });
  // Sample only once the stylesheet has applied. Before that the document is
  // unstyled and reports its raw content width at every viewport, which is not
  // a layout fault and would report an identical false failure at 320, 390 and
  // 1440 — which is exactly how this check first "failed".
  await p.waitForFunction(() => getComputedStyle(document.body).backgroundColor === "rgb(251, 247, 240)", null, { timeout: 5000 });
  let worst = 0;
  for (let i = 0; i < 26; i += 1) {
    const w = await p.evaluate(() => document.documentElement.scrollWidth).catch(() => 0);
    if (w > worst) worst = w;
    await p.waitForTimeout(100);
  }
  const over = worst - width;
  const ok = over <= 1;
  if (!ok) bad += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${String(width).padStart(4)}px  widest document during the entrance ${worst}px (${over > 0 ? "+" : ""}${over})`);
  await c.close();
}

// ---- 2. reduced motion really is no motion
{
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await c.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const running = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.animationName && cs.animationName !== "none") {
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} -> ${cs.animationName}`);
      }
    });
    return out;
  });
  const ok = running.length === 0;
  if (!ok) bad += 1;
  console.log(`  ${ok ? "ok  " : "FAIL"}  reduced motion: ${ok ? "nothing animates" : running.join(", ")}`);
  await c.close();
}

await browser.close();
console.log(bad === 0 ? "\nmotion is contained and reduced motion is honoured" : `\n${bad} motion problem(s).`);
process.exit(bad === 0 ? 0 : 1);
