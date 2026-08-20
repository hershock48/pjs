# Pastrami Joe's

A concept rebuild of [pastramijoes.com](https://pastramijoes.com/) plus the
proposal that goes with it, for Pastrami Joe's Deli of Marshall and Battle
Creek, Michigan. Built by [Glazed Web](https://glazedweb.com).

Nothing here has been bought yet. The footer credit reads **Concept build by**,
which is the spec-build wording, and it changes to **Double Dipped by** the day
they sign.

Read `glaze.md` in the `glazedweb` repo before working on this.

---

## Running it

```bash
npm install
npm run build
npx next start -p 4495          # audit the PRODUCTION build, never `next dev`
```

Then, in another shell:

```bash
node tools/flow-checks.mjs --base http://127.0.0.1:4495
node tools/scrim-check.mjs  --base http://127.0.0.1:4495
node tools/sticky-check.mjs --base http://127.0.0.1:4495
node tools/contrast-sweep.mjs
node tools/motion-check.mjs --base http://127.0.0.1:4495
node ../glazedweb/glaze/scripts/audit.mjs --base http://127.0.0.1:4495 \
  --routes "/,/menu,/menu?at=marshall,/menu?at=battle-creek,/specials,/order,/catering,/locations,/locations/marshall,/locations/battle-creek,/about,/jobs,/charity,/contact"
```

**A clean axe run is not the same as a legible page.** Three of the four faults
found on this build were invisible to axe: white on white over a background
image, white on a photograph, and a nav that fitted inside a scroll container
with the primary button off the right edge. That is what the three extra tools
are for.

**Confirm the port is free and the served CSS hash matches `.next/static/css/`
before believing any audit result.** A stale server on the port serves a build
you deleted, the stylesheet 400s, every page renders unstyled, and the auditor
reports 280 violations and 1600px of overflow on a site that is fine. That
happened twice while building this.

---

## What is where

```
app/
  layout.js               fonts, metadata, JSON-LD, force-dynamic (read the note)
  page.js                 home
  menu/                   one menu, filtered by ?at=<slug>
  specials/               the soup rotation and seasonal board, with a date
  order/                  the ordering hub, both counters
  catering/               full priced catering menu and the inquiry form
  locations/              index, and [slug] for each store
  about/ jobs/ charity/ contact/
lib/
  site.js                 EVERY business fact. Locations are an array.
  hours.js                open/closed, in America/Detroit, at request time
  menu.js                 the whole menu, per-location, prices where real
components/
  HoursBar, Header, Footer, Status, LocationCard, MenuList, InquiryForm
  GlazedCredit / GlazedPlate    copied verbatim from glaze/assets. Do not rebuild.
  Reveal                        copied verbatim. Re-arms on navigation.
public/
  assets/pjs/             their logo and photography, lifted from their site
    logo.svg              the whole mark. Favicon, JSON-LD, anywhere static
    logo-plate.svg        the disc and lettering. Never moves
    logo-figure.svg       the man. The only thing that moves
  og.jpg                  the demo's link card, theirs
  pitch/pjs/index.html    the proposal, standalone, no build step
  pitch/pjs/og.jpg        the proposal's link card, Glazed Web's argument
tools/
  flow-checks.mjs         the checks that would otherwise be somebody remembering
  scrim-check.mjs         hero text vs the photograph, measured on the composite
  sticky-check.mjs        the two sticky bars, measured against each other
  contrast-sweep.mjs      every element's computed colour vs its painted ground
  motion-check.mjs        transient overflow during animation, and reduced motion
```

---

## The decisions, and why

### Everything renders per request

`app/layout.js` declares `export const dynamic = "force-dynamic"` and
`app/locations/[slug]/page.js` declares it again.

Every page carries the open/closed strip, which reads the Michigan clock. A page
whose content depends on the current time cannot be statically generated:
regeneration is request-triggered, so on a quiet site a cached page ages
indefinitely and the badge tells people the deli is open at three in the morning.

**The `[slug]` route originally had `generateStaticParams` and the build marked
it `● SSG`, overriding the layout.** That was caught by reading the build output,
not by assuming the layout setting propagated. `tools/flow-checks.mjs` now
asserts `cache-control` on four routes so it cannot come back quietly.

### Locations are an array

The whole pitch is that their current site handles two stores by cloning itself,
and the owner has told Choose Marshall he plans a bakehouse and more Michigan
locations. Adding a third store here is one object in `site.locations`. It grows
a location page, a footer entry, a sitemap entry, a JSON-LD node, an hours table
and an entry in the ordering hub on its own.

**If you add one, the only thing you have to write by hand is its photo and
blurb.** Check `/sitemap.xml` and the homepage after, because those are the two
surfaces where a missing field shows up as a gap rather than an error.

### One menu, filtered

`lib/menu.js` holds every item once with an `at` array. `/menu?at=marshall`
filters. Their two menu pages have already drifted apart in small ways nobody
intended, which is what two copies of a list always do.

### The prices are deliberately missing

**54 of 65 items have no price, and none has been invented.**

Their retail menus publish prices for soup, five add-ons and two seasonal items,
and nothing else. Catering is fully priced and is transcribed complete. Every
number in this repo is either from their own live page or absent.

A null price renders as an italic "price to come" and the menu page carries a
counted notice saying how many are missing. The count is computed by
`missingPrices()`, so it cannot go stale, and `flow-checks.mjs` fails if prices
are missing and the page stops saying so.

A placeholder price on another site in this account was served to real customers.
Do not fill these in from a third-party menu; allmenus.com has a complete priced
menu for them and it is from about 2019.

### Contrast

Palette and measured ratios are in the header comment of `app/globals.css`. The
short version: `#00703C` is their own logo green and it clears 4.5 in both
directions, which is unusual, so there is one green rather than three.

Two faults were fixed at the class and the token, not on the element that got
named:

- The header Order button rendered `#14231B` on `#00703C`, a ratio of **2.63**,
  because `.hdr-nav a` (0,1,1) beat `.btn` (0,1,0). It looked deliberate. axe
  found it on eleven routes at once, which is the tell.
- The "closing soon" ink was `#8A6F12` at **4.45** on its amber ground. Close
  enough to the line to feel fine and still a fail. It is `--amber-ink` at 5.48
  now. Do not lighten it back.

**One fault axe did not find.** The catering band on the homepage had
`color: #fff` on the section, and the white h2 landed on the white card inside it
at **1.00**: in the DOM, selectable, invisible. axe declines to compute contrast
over a background image, and that section has one. It was found by walking every
element's computed color against its painted background. If you add a section
with a patterned background, run that sweep rather than trusting a clean axe run.

### The design pass, and the four faults a clean audit missed

The first build passed everything: zero axe violations at 390 and 1440 across
fourteen routes, no overflow at 320, no console errors. It was also worse than
it looks in that sentence. Four faults, none of which any of those checks can
see, found by screenshotting every route and looking at it:

1. **The mobile nav hid the primary action.** The nav was a horizontal scroll
   strip, which genuinely does not overflow the page, so the overflow check
   passed it. On a 390px screen "Order online" sat off the right edge with no
   affordance saying to swipe. It is a disclosure now, with the phone number and
   an Order button always on screen.
2. **The hours strip was clipped mid-word.** Same cause, same clean audit. It is
   a two-column grid below 720 and nothing scrolls.
3. **The hero text was white on nearly-white.** The scrim was picked by eye and
   looked fine in a screenshot. Measured on the composite, the kicker was
   **1.18** against the bread. axe skips any element whose background resolves
   to an image, so it will never report this. `tools/scrim-check.mjs` does.
4. **The `.wrap` padding was being reset by a shorthand.** `.hero-in` carried
   both `.wrap` and its own `padding: X 0 Y`, which zeroed the 20px that keeps
   text off the edge of a phone. `padding-block` now.

The menu page was the other half of the pass. It is 11,000px tall, which is
correct because it is their whole board, but the only way to the bottom half was
scrolling past the top half. It has a sticky section index and a filter now, and
their own photography inside it, which was already in `lib/menu.js` on the items
and rendered nowhere.

### Motion

The rule in `app/globals.css` is that the un-animated state is the finished
state. Everything is either a transition on an interaction the visitor started
or a one-shot entrance that ends. There is exactly one loop on the site: a 2.8s
opacity pulse on the open/closed dot, which is the only element whose job is to
say the value was computed now.

`tools/motion-check.mjs` checks the two things that actually break:

- **Transient horizontal overflow.** The hero photograph scales to 1.055 on
  load. The route audit measures a settled page, so a scrollbar that exists for
  1.6s is invisible to it. Sampling `scrollWidth` every 100ms through the
  entrance found a real 40px overflow at 320 — not from the animation, from the
  hours strip's two columns, at a width the audit never visits.
- **That reduced motion is really no motion.** It loads the page with the media
  feature forced and asserts every element reports `animation-name: none`. A
  reduced-motion block that a later rule overrides is worse than none, because
  it looks handled.

### The mascot

`components/Mark.jsx` renders their mark as two layered images so the man can
move and the badge cannot:

- `logo-plate.svg` — disc, inner field, and the "Pastrami" and "Joe's" scripts
- `logo-figure.svg` — him: his silhouette plus the thirty-three white paths that
  draw his cap, glasses, beard and hands

The first version animated `logo.svg` whole, and rotating it rotated the
lettering too, which read as a wobbling badge rather than a nod.

**Not one coordinate changed in the split.** Both files keep the original
`viewBox` and `<defs>`, with the original elements in the original order,
partitioned. Composited back together they are pixel-identical to `logo.svg`: a
600px render diffs to a maximum channel difference of 1 and zero pixels
differing by more than 8. **If you edit either file, redo that diff.**

**He leans; he does not wave.** In their artwork the whole figure is a single
green path with `fill-rule="evenodd"` — head, cap, shoulders and both folded
forearms are one 3,998-character `d` string. There is no arm to raise. A wave
means drawing a new arm, which is redrawing part of a client's logo, and that is
theirs to approve rather than something to ship quietly.

### Forms have no mailbox

`InquiryForm` composes a `mailto:` with every field prefilled and says on the
page that that is what it is doing. There is no SMTP mailbox and no API key on
this build, and a stub that says "Thanks, we got it" while sending nowhere is not
an acceptable stand-in. At launch this becomes a server action posting through a
mailbox Pastrami Joe's already owns.

### The host split

`next.config.mjs`, in `beforeFiles`. A plain `rewrites()` array is `afterFiles`,
which only runs once Next has failed to find a page, and `app/page.js` already
answers `/`, so the root rewrite would silently never fire and the prospect would
land on the demo instead of the pitch.

`/pitch/*` resolves to the 404 page on any host that is not the pitch host, so
the proposal is not a live URL on their own domain the day it is attached.

**Attach the apex form of `pjs.glazedweb.com` in Vercel and send the link without
`www`.** Adding only the apex leaves `www` without a certificate.

### Next.js is pinned, and the pin is a security decision

`next` is pinned to an exact **15.5.23**, not a range.

The first deploy of this repo went out on 15.5.4 and Vercel's install step warned
about **CVE-2025-66478**, the React Server Components RCE, rated CVSS 10.0. It
affects Next 15.x and 16.x App Router applications, which is what this is. The
fix on the 15.5 line is 15.5.7 or later; 15.5.23 is the current backport.

An exact pin means builds are reproducible and it also means **somebody has to
bump this deliberately**. Check the release line when you touch this repo.

### robots

`app/robots.js` is the only robots source in the repo. A static
`public/robots.txt` would take precedence and silently win, so there is not one.
Crawling is allowed on purpose and the pitch host is kept out of the index with
an `X-Robots-Tag` header instead. They are different switches.

---

## Before this goes live

Nothing on this list is code. All of it is facts we do not have.

- [ ] **The real hours, both stores.** Currently in `lib/site.js` from the owner's
      own account in Second Wave, February 2026: Marshall 7am to 7pm weekdays and
      10 to 3 Saturday, Battle Creek 10 to 3 weekdays. Confirm with him. This is
      the one fact the whole rebuild exists to get right.
- [ ] **Holiday and seasonal hours.** The current model has no exceptions in it.
      If they close between Christmas and New Year, that needs a date override
      before the badge tells people otherwise.
- [ ] **The price list.** 54 items. One file.
- [ ] **A mailbox.** `site.email` is `hello@pastramijoes.com` and is a
      PLACEHOLDER; it does not exist yet. Both forms point at it.
- [ ] **Photo and logo permission, in writing.** Everything in
      `public/assets/pjs/` was lifted from pastramijoes.com for the concept.
      Permission has not been asked for or granted. If they pass on the proposal,
      delete the directory.
- [ ] **Confirm the owner's name** before it goes in any document. Two
      independent articles name Andrew Scibbe'; nothing on their own site does.
- [ ] **Open both Heartland ordering pages on a phone.** They refuse automated
      access, so nobody has seen them. Nothing in the proposal claims anything
      about the ordering experience for that reason.
- [ ] **Verify the Yelp and Tripadvisor findings by eye.** Both sites block
      automated reading, so the CLOSED flag, the 31 reviews and the 80 W.
      Michigan address all come from search result titles. They are almost
      certainly right and they have not been read.
- [ ] **Google reviews.** The 4.5/380 and 4.8/18 figures came through Wanderlog's
      aggregation, not from Google. Nothing in the proposal uses them.
- [ ] **Mobile performance.** Never measured. No claim is made about theirs or
      ours.
- [ ] Swap the footer credit to **Double Dipped by** on signature.
- [ ] Delete `public/pitch/` and the pitch rewrites once they sign or pass.

## Retired

Nothing yet.
