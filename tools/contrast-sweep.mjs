import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const req = createRequire(pathToFileURL(process.cwd() + "/"));
const mod = await import(pathToFileURL(req.resolve("playwright-core")).href);
const chromium = mod.chromium ?? mod.default?.chromium;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const routes = ["/","/menu","/specials","/order","/catering","/locations","/locations/marshall","/locations/battle-creek","/about","/jobs","/charity","/contact","/nope"];
const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0,3).map(Number);
const lum = ([r,g,bl]) => { const f=(c)=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(bl); };
const cr = (a,bg) => { const la=lum(parse(a)), lb=lum(parse(bg)); const hi=Math.max(la,lb),lo=Math.min(la,lb); return (hi+0.05)/(lo+0.05); };
let bad = 0;
for (const route of routes) {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto("http://127.0.0.1:4499" + route, { waitUntil: "networkidle" });
  await p.evaluate(async () => { document.querySelectorAll(".reveal").forEach(e=>e.classList.add("in")); });
  const r = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll("h1,h2,h3,p,li,span,a,b,dt,dd,button,label").forEach((el) => {
      // The hero is deliberately skipped. Its backdrop is a photograph plus a
      // gradient on a pseudo-element, and this sweep can only walk to the
      // nearest ancestor with a painted background colour, which is the body
      // cream. It reports 1.06 there and the true worst pixel is 6.75. The
      // hero is measured properly by tools/scrim-check.mjs; two tools reporting
      // on the same element, one of them wrongly, is worse than one.
      if (el.closest(".hero")) return;
      if (!el.textContent || !el.textContent.trim()) return;
      if (el.querySelector("h1,h2,h3,p,li,span,a,b,dt,dd,button,label")) return; // leaf text only
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return;
      let bg = "rgba(0, 0, 0, 0)", n = el;
      while (n && bg === "rgba(0, 0, 0, 0)") { bg = getComputedStyle(n).backgroundColor; n = n.parentElement; }
      out.push({ tag: el.tagName, text: el.textContent.trim().slice(0,50), color: cs.color, bg, size: cs.fontSize, weight: cs.fontWeight });
    });
    return out;
  });
  const fails = r.filter(x => {
    const ratio = cr(x.color, x.bg);
    const px = parseFloat(x.size);
    const large = px >= 24 || (px >= 18.66 && +x.weight >= 700);
    return ratio < (large ? 3 : 4.5);
  });
  if (fails.length) {
    bad += fails.length;
    console.log(`\n${route}`);
    fails.slice(0,8).forEach(x => console.log(`  ${cr(x.color,x.bg).toFixed(2)} ${x.tag} ${x.size} ${x.color} on ${x.bg}  "${x.text}"`));
  }
  await p.close();
}
console.log(bad === 0 ? "\ncomputed-contrast sweep: 0 failures across " + routes.length + " routes" : `\n${bad} failures`);
await b.close();
