/**
 * Largest Contentful Paint, Cumulative Layout Shift and JavaScript weight, on a
 * throttled mobile profile.
 *
 * `glaze/launch.md` puts the bar at LCP under 2.5s, CLS under 0.1 and total
 * JavaScript under 150KB compressed. None of the other tools here measures any
 * of that, and the one that broke was LCP: the full-bleed hero shipped its
 * 1600x1600 208KB source to every device and measured **3,912ms**. The menu
 * page, which has no hero, measured 772ms on the same run, which is what
 * identified the image rather than the framework.
 *
 *   node tools/perf-check.mjs [--base http://127.0.0.1:4499]
 *
 * The profile is 1.6Mbps down, 150ms latency, 4x CPU throttling, at 390x844 and
 * DPR 2. It is a slow-phone approximation, not a lab, so treat the absolute
 * numbers as directional and the comparison between routes as the real signal.
 * Run it against the deployment as well as locally: a local server has no
 * network in front of it and will always flatter the result.
 */

import { chromium } from "playwright-core";

const argv = process.argv;
const BASE = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : "http://127.0.0.1:4499";
const ROUTES = ["/", "/menu", "/locations/marshall", "/catering"];
const LCP_MAX = 2500;
const CLS_MAX = 0.1;
const JS_MAX = 150 * 1024;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let bad = 0;

for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForTimeout(4000);

  const m = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let lcp = 0;
        let cls = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) lcp = Math.max(lcp, e.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve({ lcp: Math.round(lcp), cls: +cls.toFixed(4) }), 600);
      })
  );

  // encodedBodySize is what actually crossed the wire, so this is the
  // compressed figure the bar is written against.
  const js = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((e) => e.name.endsWith(".js"))
      .reduce((n, e) => n + (e.encodedBodySize || 0), 0)
  );

  const fails = [];
  if (m.lcp > LCP_MAX) fails.push(`LCP ${m.lcp}ms > ${LCP_MAX}`);
  if (m.cls > CLS_MAX) fails.push(`CLS ${m.cls} > ${CLS_MAX}`);
  if (js > JS_MAX) fails.push(`JS ${(js / 1024).toFixed(0)}KB > ${(JS_MAX / 1024).toFixed(0)}KB`);
  if (fails.length) bad += 1;

  console.log(
    `  ${fails.length ? "FAIL" : "ok  "}  ${route.padEnd(20)} LCP ${String(m.lcp).padStart(5)}ms   CLS ${String(
      m.cls
    ).padStart(6)}   JS ${(js / 1024).toFixed(0).padStart(4)}KB${fails.length ? "   " + fails.join(", ") : ""}`
  );
  await context.close();
}

await browser.close();
console.log(bad === 0 ? "\nevery route inside the launch.md budget" : `\n${bad} route(s) over budget.`);
process.exit(bad === 0 ? 0 : 1);
