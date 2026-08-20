/**
 * The two sticky bars, measured against each other.
 *
 * The site header is sticky and the menu page's section bar sticks directly
 * under it, at --hdr-h. If that token stops matching the header's real height
 * the bars overlap, and the failure is a few pixels of one bar hidden behind
 * the other: visible in a screenshot, invisible to axe, and invisible to any
 * check that only asks whether an element exists.
 *
 *   node tools/sticky-check.mjs [--base http://127.0.0.1:4499]
 *
 * Run it after changing .hdr-in padding, the mark size, or --hdr-h.
 */
import { chromium } from "playwright-core";
const BASE = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "http://127.0.0.1:4499";
let bad = 0;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const w of [1440, 390]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await c.newPage();
  await p.goto(`${BASE}/menu`, { waitUntil: "networkidle" });
  const hdr = await p.evaluate(() => document.querySelector(".hdr").getBoundingClientRect().height);
  await p.evaluate(() => window.scrollTo(0, 2400));
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => {
    const h = document.querySelector(".hdr").getBoundingClientRect();
    const m = document.querySelector(".menubar").getBoundingClientRect();
    const active = document.querySelector('.menujump [aria-current="true"]');
    return { hdrBottom: h.bottom, barTop: m.top, barBottom: m.bottom, active: active?.textContent ?? null, overlap: +(h.bottom - m.top).toFixed(1) };
  });
  const overlap = r.hdrBottom - r.barTop;
  const ok = overlap <= 1.5;
  if (!ok) bad += 1;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${String(w).padStart(4)}px  header ${hdr.toFixed(1)}px  bar top ${r.barTop.toFixed(1)}  overlap ${overlap.toFixed(1)}px  active chip "${r.active}"`
  );
  await c.close();
}
await b.close();
console.log(bad === 0 ? "\nthe menu bar sits under the header at every width" : `\n${bad} width(s) overlap. Fix --hdr-h.`);
process.exit(bad === 0 ? 0 : 1);
