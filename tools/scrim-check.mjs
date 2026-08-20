/**
 * Contrast of the hero text over the hero photograph, measured on the composite.
 *
 * axe skips any element whose background resolves to an image, so a scrim that
 * is far too weak passes a clean audit. The first scrim on this hero did: it
 * was picked by eye, it looked fine in a screenshot, and the kicker measured
 * 1.18 against the bread.
 *
 * This renders the hero, hides the text, screenshots what is behind it, and
 * walks EVERY pixel of that backdrop inside each text box against that text's
 * own computed colour. The number that matters is the worst pixel, not the
 * median: on the failing version the kicker's median was 3.11 and its worst was
 * 1.18, and it is the worst that decides whether a word disappears.
 *
 *   node tools/scrim-check.mjs [--base http://127.0.0.1:4499]
 *
 * Run it whenever the hero photograph, the scrim, or the hero type colours
 * change. Nothing else in this toolchain will catch it.
 *
 * The pixel walk happens back inside the browser, on a canvas, so the whole
 * check is one command with no image library and no second toolchain.
 */

import { chromium } from "playwright-core";

const argv = process.argv;
const BASE = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : "http://127.0.0.1:4499";
const MIN = 4.5;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let failed = 0;

for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  const boxes = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".hero-in .kicker, .hero-in h1, .hero-in .lede, .hero-in .btn").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      out.push({
        label: el.className ? String(el.className).split(" ")[0] : el.tagName.toLowerCase(),
        x: Math.max(0, Math.round(r.x)),
        y: Math.max(0, Math.round(r.y)),
        w: Math.round(r.width),
        h: Math.round(r.height),
        color: getComputedStyle(el).color,
      });
    });
    return out;
  });

  // The solid button paints its own opaque ground, so what is behind it is not
  // what its text sits on and its number here is only informational. The ghost
  // button is translucent and genuinely does sit on the photograph.
  await page.evaluate(() => {
    document.querySelector(".hero-in").style.visibility = "hidden";
  });
  const shot = (await page.screenshot({ type: "png" })).toString("base64");
  await page.evaluate(() => {
    document.querySelector(".hero-in").style.visibility = "";
  });

  const results = await page.evaluate(
    async ({ shot, boxes }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${shot}`;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const lum = (r, g, b) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);

      return boxes.map((box) => {
        const [fr, fg, fb] = box.color.match(/\d+/g).map(Number);
        const lf = lum(fr, fg, fb);
        const w = Math.min(Math.max(1, box.w), cv.width - box.x);
        const h = Math.min(Math.max(1, box.h), cv.height - box.y);
        const d = ctx.getImageData(box.x, box.y, w, h).data;
        let worst = Infinity;
        let sum = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const lb = lum(d[i], d[i + 1], d[i + 2]);
          const hi = Math.max(lf, lb);
          const lo = Math.min(lf, lb);
          const ratio = (hi + 0.05) / (lo + 0.05);
          if (ratio < worst) worst = ratio;
          sum += ratio;
          n += 1;
        }
        return { label: box.label, color: box.color, worst, mean: sum / n };
      });
    },
    { shot, boxes }
  );

  console.log(`\n=== hero text over the photograph at ${width}px ===`);
  for (const r of results) {
    const bad = r.worst < MIN;
    if (bad) failed += 1;
    console.log(
      `  ${bad ? "FAIL" : "ok  "}  ${r.label.padEnd(8)} worst ${r.worst.toFixed(2).padStart(6)}   mean ${r.mean
        .toFixed(2)
        .padStart(6)}   ${r.color}`
    );
  }

  await context.close();
}

await browser.close();
console.log(
  failed === 0
    ? `\nevery hero text box clears ${MIN} against its worst backdrop pixel`
    : `\n${failed} hero text box(es) below ${MIN}. Deepen the scrim in .hero::after.`
);
process.exit(failed === 0 ? 0 : 1);
