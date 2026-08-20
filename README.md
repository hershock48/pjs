# Pastrami Joe's

A concept rebuild of [pastramijoes.com](https://pastramijoes.com/) plus the
proposal that goes with it, for Pastrami Joe's Deli of Marshall and Battle
Creek, Michigan. Built by [Glazed Web](https://glazedweb.com).

Nothing here has been bought yet. The footer credit still reads **Double Dipped
by**, at Kevin's direction.

`glaze/brand.md` says a spec build that has not been bought gets **Concept build
by**. This is the second time that rule has been overridden by the person who
wrote it: True North took "Double Dipped by" the same way in August. Worth
retiring the rule in `brand.md` rather than overriding it a third time.

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
node tools/width-check.mjs  --base http://127.0.0.1:4495
node tools/perf-check.mjs   --base http://127.0.0.1:4495
node ../glazedweb/glaze/scripts/audit.mjs --base http://127.0.0.1:4495 \
  --routes "/,/menu,/menu?at=marshall,/menu?at=battle-creek,/specials,/order,/catering,/locations,/locations/marshall,/locations/battle-creek,/about,/jobs,/charity,/contact"
```

**A clean axe run is not the same as a legible page, and the house auditor does
not cover everything `launch.md` asks for.** Faults found on this build that a
clean run at 390 and 1440 reported nothing about: white on white over a
background image, white on a photograph at 1.18, a nav that fitted inside a
scroll container with the primary button off the right edge, a home link with no
accessible name at 320, a form that did nothing with JavaScript off, an LCP of
3.9s, and a CLS of 0.115. That is what the extra tools are for. Run all of them.

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
  order/                  Jelly. Real ordering, both counters
  kitchen/                the counter's screen. noindex, PIN, not in the nav
  api/ordering/           state and order. The server is the till
  api/kitchen/            login, orders, state, menu. All behind the PIN
  catering/               full priced catering menu and the inquiry form
  locations/              index, and [slug] for each store
  about/ jobs/ charity/ contact/
lib/
  site.js                 EVERY business fact. Locations are an array.
  hours.js                open/closed, in America/Detroit, at request time
  menu.js                 the READ-ONLY menu the /menu page renders
  ordering/               Jelly. See the section below.
    config.js             the fee, the tax, the pickup quote, the PIN fallback
    window.js             is this counter taking orders, per location
    store.js              Postgres, or memory with a loud warning
    seed.js               the starting menu. Every price off one of their pages
    catalog.js            the live menu document and its validation
    auth.js  email.js  printing.js
components/
  HoursBar, Header, Footer, Status, LocationCard, MenuList, InquiryForm
  ordering/OrderClient          the guest flow: counter, cart, checkout
  ordering/KitchenClient        the counter's screen and the menu editor
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
  pitch/pjs/glazed-favicon.svg / .ico / glazed-apple-touch-icon.png
                          THE STUDIO'S REAL MARK, copied from glazedweb/public
                          unchanged. It was a hand-drawn two-circle data URI
                          before, which is the one thing brand.md says never to
                          do. The demo keeps Pastrami Joe's own mark, because
                          the demo is their site and the proposal is ours.
tools/
  flow-checks.mjs         the checks that would otherwise be somebody remembering
  scrim-check.mjs         hero text vs the photograph, measured on the composite
  sticky-check.mjs        the two sticky bars, measured against each other
  contrast-sweep.mjs      every element's computed colour vs its painted ground
  motion-check.mjs        transient overflow during animation, and reduced motion
  width-check.mjs         320 and 768, which the house auditor does not visit
  perf-check.mjs          LCP, CLS and JS weight on a throttled mobile profile
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

A null price renders as an em rule with the reason on its `title`, and the menu
page carries a counted notice saying how many are missing. It was the words
"price to come" on every row first; fifty-four of them made a finished page scan
as a broken one, so the loud version of the fact lives once, at the top, where
the count is. The count is computed by `missingPrices()`, so it cannot go stale,
and `flow-checks.mjs` fails if prices are missing and the notice stops saying so.

**Those em rules are the one place this repo knowingly breaks a house rule.**
`glaze.md` says no em dashes. That rule is about prose, and this is a table's
empty-value glyph, 139 of them across the menu and the two location pages. If
Kevin wants it gone the change is one line in `components/MenuList.jsx`.

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

### What the docs audit found

Checked against `glaze.md`, `glaze/launch.md`, `glaze/link-cards.md`,
`glaze/proposal.md`, `glaze/brand.md` and `glaze/intake.md`. Seven real faults,
five of them at things no check in this repo was looking at:

1. **The home link had no accessible name at 320.** The wordmark was hidden with
   `display: none`, which removes it from the accessibility tree too, and both
   images in the mark are decorative. axe reported `link-name` on all twelve
   routes at 320 and at no other width. `glaze.md` says 320 is the one that
   breaks and the house auditor runs 390 and 1440, so nothing here was ever
   going to see it. Now `tools/width-check.mjs` does.
2. **The form did nothing with JavaScript off.** `launch.md` requires every form
   to still submit. It had no `action` and no `method`, so the button was inert.
   It has a native `mailto:` POST and a `<noscript>` with both phone numbers now.
3. **LCP was 3,912ms**, against a 2.5s bar, on a 1.6Mbps 4x-CPU profile. The
   full-bleed hero shipped its 1600x1600 208KB source to every device. With
   `srcset` a 390px phone takes a 42KB copy and it measures 2,084ms.
4. **CLS was 0.1151** on the location pages, against 0.1. Entirely the webfont
   swap: blocking the font files made it exactly 0. See the note in
   `app/layout.js` for why the body face is `optional` and the display face is
   not.
5. **Three high-severity npm advisories** were unreviewed. `launch.md` requires
   them named with a reason. Fixed rather than named, by going to Next 16.3.1.
6. **The demo's `og:image` does not resolve yet.** It is
   `https://pastramijoes.com/og.jpg`, which is correct for launch and is
   currently their WordPress site, so it 404s. `link-cards.md` requires the URL
   to return 200 with an image type. It will the day the domain moves; until
   then anyone forwarding the demo link gets a bare card. On the checklist.
7. **A false alarm worth recording.** Auditing at 320 and 768 first reported 27
   contrast failures with foreground colours like `#847a71` that appear nowhere
   in the palette. They were mid-fade composited values: the reveal takes 550ms
   plus up to 210ms of stagger, and the harness measured at 400ms.
   `glaze.md` says check the harness before the code, and it was the harness.
   `width-check.mjs` waits for `getAnimations()` to finish now, skipping the one
   infinite animation, which is the breathing dot and which hung the first
   version of that tool forever.

### Jelly, and why the sandwich board is not in it

Ordering is built into the site. It was a hub before: two buttons that handed
the customer to `pastramijoesmarshall.hrpos.heartland.us` and a second Heartland
subdomain. That is the channel Jelly exists to replace, and shipping the handoff
while pitching the replacement was the wrong build.

**Their register does not move.** Heartland keeps the till. This replaces the
online channel only.

**Every price came off one of their own published pages.** Catering is fully
priced on `pastramijoes.com/catering/` and is transcribed complete. Soup and the
extras come off their menu page; the two seasonal items come off their weekly
features page. That is what is orderable.

**The sandwich board is not seeded, and that is deliberate.** Their retail menu
publishes no prices at all: 55 of 65 items are blank on their own site. The
prices do exist, inside Heartland, which is the whole argument of the proposal.
Getting them out means reverse-engineering a bundled vendor SPA's private API
rather than reading a published page, and a sandwich price is exactly the kind
of number a business gets held to. A placeholder price on another site in this
account was served to real customers.

So the system ships live on what they publish, and the board turns on the day
the owner sends a price list. That is one paste into the menu editor at
`/kitchen`, and it is the most persuasive fact in the pitch.

**What is different from the Copper and Beans builds it was ported from:**
locations. This is the first Jelly site with two counters, so `window.js` takes
a location, every order carries one, the state endpoint answers for both, and
the kitchen board filters by it. Battle Creek is shut at 3pm on a day Marshall
runs to 7, and one global window would have taken orders for a dark counter.

**The ordering window reads `lib/hours.js`**, the same module the header badge
uses. One source, on purpose: a customer who sees "Open until 7pm" cannot be
told by the order page that the counter is shut.

**No new orders inside 20 minutes of close.** Taking one four minutes before
close is how a guest arrives at a locked door holding a receipt.

**Catering and counter items cannot go in one order.** They land on different
days and print differently, so mixing is refused with a sentence rather than
guessed at. Catering needs 48 hours and is allowed at any hour; counter orders
need the window open.

**Demo mode is visible, never implied.** No `STRIPE_SECRET_KEY` means no card is
taken, and the checkout, the confirmation and the printed slip all say so. The
slip prints DUE AT PICKUP with tip and signature lines rather than PAID ONLINE.

**Without `DATABASE_URL` the kitchen screen says so in a red box.** On deployed
serverless, memory storage means orders land on whichever lambda answered and
the screen can simply miss them. A demo that half-works silently is worse than
one that says what is wrong.

**Guest-facing copy never carries the business model.** No fee-split story, no
vendor comparison, no "our own website". A guest gets a menu, a pickup time and
a plainly labelled 99¢ fee like any checkout. `tools/flow-checks.mjs` greps the
order page for that leak, because it is one paste from the proposal away.

### The debug and copy pass

**Bugs found by fuzzing the order endpoint.** All three were wrong messages
rather than wrong money, which is the kind that survives a demo and annoys a
customer:

- An option name that matched nothing reported *"needs a which picked"*, because
  the required-group check ran before the unknown-name check. The unknown-name
  check runs first now and names the option.
- A single-choice group given two picks reported *"needs a X picked"*, as if
  nothing had been picked.
- The group was called "Which", so every sentence about it read *"needs a which
  picked"*. Their menu prints pasta salad and coleslaw as one line at one price;
  here they are two items and the group is gone.

**Two name collisions that would have printed ambiguous kitchen tickets.**
"Pasta salad" existed at $2.10 as a side and $20 as a catering tray, and "Bread
and butter" at $2.50 and $2.00 a head. A ticket reading `1 x Pasta salad` could
have been either. They are "Pasta salad, side" and "Bread and butter, by the
head" now.

**Three surfaces were still sending customers to Heartland.** The Jelly work
replaced `/order` and left the location pages, the menu page's location note and
every `LocationCard` pointing at `hrpos.heartland.us`. They point at
`/order?at=<slug>` now. `site.orderUrl` stays as a fact and is linked from
nowhere, which is said next to it.

**A bug the copy pass caused.** Normalising apostrophes turned `site.name` into
"Pastrami Joe’s" while `LocationCard` still compared `location.brand` against a
hard-coded straight-quoted `"Pastrami Joe's"`. The comparison inverted silently
and Marshall's own card would have announced that it trades as Pastrami Joe's.
The fault was the duplicated literal, not the apostrophe: it reads `site.name`
now, the way the `[slug]` page already did.

**Copy, checked on the rendered page rather than the source.**

- 39 straight apostrophes and 17 curly ones, on the same pages. All curly now.
- "flavours" on the order page. American spelling, per `glaze.md`.
- The catering varieties rendered as *"chicken caesar, wrap only"*, which reads
  as an eighth variety. Parenthesised, and the `.toLowerCase()` that flattened
  Italian and Caesar is gone.
- *"$25.00 per five / Five bagels"* stuttered. Now "for five".
- The About page said the Battle Creek store "closed during the pandemic". The
  year is a fact; the reason was an inference nobody confirmed. Cut to the fact.
- Caesar, Russian and Italian are capitalised, which is a deliberate departure
  from their menu. It writes "caesar dressing" lowercase and "Joe's Italian
  Dressing" capitalised three lines apart, so there was no style to preserve.

**Two false alarms, recorded so nobody chases them again.** A navigation test
reported the first `.reveal` at opacity 0 after a mobile nav: the element was at
`top: 896` on an 844px viewport, correctly not yet revealed. And 18
`requestfailed` events on every run are all `net::ERR_ABORTED` on Next's own
`?_rsc=` prefetches, which it cancels when a navigation supersedes them.

**Verified fact, since it is a claim about the client's philanthropy.** The
Reuben Race really is co-hosted with The Fountain Clinic of Marshall
([runsignup](https://runsignup.com/Race/MI/Marshall/PastramiJoesReubenRace)),
which their own charity page does not mention. Their page does confirm the 2012
start and the 30% figure.

### The proposal audited against the demo

Every checkable promise in `public/pitch/pjs/index.html`, against what the demo
actually does. Eight were wrong, and the two worst were both created by adding
Jelly without re-reading the document.

**The proposal contradicted itself about ordering.** Build item 5 still said the
ordering page "hands off to your Heartland ordering", and the closing note still
said online ordering was "not in this quote" and "a separate conversation" —
three sections after the ordering section says it is built, and next to a price
card that lists it. Both rewritten. The later-note now points at card-present
checkout, which genuinely is the next conversation.

**"On the demo those slots say 'price to come'."** They say an em rule; that
changed in the design pass and the proposal was never updated.

**"Full hours tables on the homepage, both location pages, the ordering page and
the footer."** The rebuilt ordering page had no hours table at all. Rather than
weaken the claim, the counter picker now carries each store's opening hours,
which a person collecting food wants anyway. Note that the door time and the
ordering window are different: ordering stops twenty minutes earlier.

**"Nine pages", twice.** The sitemap has twelve, plus `/kitchen`.

**"All eleven pages of pastramijoes.com", three times.** Their `page-sitemap.xml`
lists **ten**. Fetched every one on 20 Aug 2026: all returned 200, and none
matched an hours pattern. The finding is stronger than the number was — ten
pages, zero hours — but a number an owner can check has to be right.

**"Elementor is patched to June."** Not verified this session. Their generator
meta says `Elementor 4.1.3`, which is, so the claim is now the version.

**One thing this audit cleared rather than broke.** The `week.updated` date the
specials page prints is not invented: it is the `<lastmod>` their own sitemap
publishes for `/weekly-features/`. It still needs an owner from launch, and it
is on the checklist.

**Not re-verified this session, and named rather than assumed:** "six other
websites publish six different answers", and the individual listing findings
about Yelp, Tripadvisor and the Visitors Bureau. They were checked when the
proposal was written; they have not been re-checked since.

### The UX pass

Driven on a real 390x844 phone rather than audited. None of this is anything axe
reports.

**The cart was invisible.** Measured: after adding an item the cart panel sat
**3,437px** down the page. Nothing on screen changed. A guest taps Add, the sheet
closes, and the only evidence their order exists is three screens below the
fold, so they tap Add again. There is a sticky bar at the bottom of the viewport
now, mobile only, showing the count and the total with a button that scrolls to
the cart and focuses it.

**The option sheet was not a dialog.** It had `role="dialog"` and none of the
behaviour: focus stayed on the button behind it, Escape did nothing, the
backdrop did nothing, the page behind kept scrolling, and Tab walked straight
out. All five fixed, and focus returns to the item that opened it. The backdrop
closes on `mousedown` matching the target, so a drag that starts inside and ends
outside does not throw away the guest's picks.

**The sheet never showed a price.** You picked options and tapped Add having
never seen what it cost. It carries a running total now, and the Add button says
the number.

**Quantity defaulted to 1 on per-person items.** A sub tray is $7.00 *a head*.
Defaulting to 1 invites somebody to book lunch for one and get a tray. Per-person
and serves-N items default to 10.

**The demo override contradicted the header.** With `ORDERING_DEMO_ALWAYS_OPEN`
on, `/order` showed "Battle Creek: Opens tomorrow at 10am" in the strip and
"Battle Creek: Taking orders until close" in the picker two inches below. On one
screen. The override now says what it is doing: "Demo: this counter is shut
right now".

**Every `tel:` link was an 18px-tall inline text link.** On a deli's site, on a
phone, calling is a primary action and it was the smallest target on the page.
They are 42px now, fixed at the attribute selector rather than on each link.

### The printed menu

Kevin photographed the in-store menu, which is the source that settles most of
what this repo had been carefully refusing to guess.

**It corrected an hour we had wrong.** Marshall's Saturday open was `10:00` here,
taken second-hand from a Second Wave interview. The printed menu says **11am**.
This repo exists to argue that nobody can find their hours, and it published one
that was wrong by sixty minutes for a week. The answer was sitting on their
counter.

**Prices: 55 unpriced items became 8.** Whole, half and wrap for every sandwich,
14" and 9" for every pizza, all transcribed from the photographs. The price cell
renders every size their menu prints, because showing only the whole price is
how a menu gets called expensive, and price is already the most common complaint
in their reviews.

**And it corrected a price.** Extra cheese was `1.00` here, from their website's
extras block. The printed menu says **50¢**.

What is still unpriced is what the printed menu itself does not price: the
pastries and the build-your-own platter, which it lists as "Varies".

**Two menus that disagree, which is the argument the proposal already makes.**
Their website lists a Pastrami breakfast burrito; the printed menu does not, and
lists an Egg & Cheese one instead. The printed menu is newer, it carries the
loyalty app, and it is what a customer holds.

### The steam

Three plumes rising off the sandwich in the hero, once, on load, then gone. No
loop: permanent motion beside the first line anyone reads is a distraction, and
the joke does not survive a second viewing.

**It took three wrong versions to get there, and each was wrong for a different
reason worth writing down.**

1. **Stroked bezier squiggles.** They read as squiggles. Real vapour has no
   outline: it is a soft mass with a noisy edge that thins as it rises. Each
   plume is a blurred ellipse pushed through `feTurbulence` into
   `feDisplacementMap`, which tears its smooth edge into wisps, then blurred
   again to soften what the tearing left. One filter per plume, own `seed`,
   because two plumes on one seed are the same shape twice.
2. **Over the headline.** Wrong twice over: steam does not come off lettering,
   and the top-left of this photograph is its palest, least contrasty corner
   with the scrim at its weakest. White vapour there had nothing to show
   against. It rises off the pastrami now, which is both where steam comes from
   and the darkest, most detailed part of the frame.
3. **Too solid.** `stdDeviation` 2 with 0.78 opacity produced compact white
   lumps that read as fingerprints on the lens. Bigger, softer and fainter
   reads as vapour: blur 4-5.5, peak opacity 0.5, and roughly double the size.

**Judge it at true size.** Two of those rounds were spent looking at a full-hero
screenshot downscaled to 620px, where the effect had genuinely rendered and was
invisible at that scale. A pixel diff of the region during and after the
animation settled it: 7,825 pixels differing. The house log already says to
judge at true size, and this is why.

### The About page, and the regression that caused it

`/about` rendered its headline and two paragraphs of dark green body copy over a
bright white photograph of their storefront, with no scrim. Unreadable, and
nothing like the rest of the site. Kevin's words: "you cant read the writing bc
of the picture it looks nothing like the rest of the site."

**It was a regression from the hero redesign.** `.hero-photo` had been a framed
photograph in a `.hero-grid` cell. Making it `position: absolute; inset: 0` for
the full-bleed homepage hero broke its **two other consumers**, `/about` and
`/locations/[slug]`, where the picture escaped its cell and became a background
behind the whole section. The house log already carries the rule: when a thing
appears N times, check all N. It appeared three times and one was checked.

The full-bleed behaviour is scoped to `.hero` now and the base class is the
framed photograph it always was.

**The sweep that should have caught it was also wrong**, and that is the more
useful half. `tools/contrast-sweep.mjs` walked up for the nearest painted
background *colour* and computed against it, so it reported the page clean by
measuring the cream underneath the photograph. It now notices a
`background-image` on any ancestor, and an absolutely positioned `<img>`
covering the text, and reports those as **UNMEASURED** rather than passing them.
Text on a photograph cannot be judged from computed styles at all; it needs
measuring on the composite the way `tools/scrim-check.mjs` does the hero.

Verified by disabling the tool's own `.hero` exclusion and confirming it then
flags the hero's four text elements over `IMG.hero-photo`.

### What Heartland costs, and why the ordering pitch is not a savings pitch

**Heartland's online ordering is free and takes no commission.** Three of their
own resellers say so independently:
[JCR Systems](https://www.jcrsystems.com/heartlandrestaurant-online-ordering/)
("Online Ordering is FREE to turn on. No Commissions, No Extra Fees"),
[NBS](https://www.nbsystems.com/hrposolo.html) ("provided at no cost with your
POS"), and
[Clear Solutions](https://heartlandrestaurantpos.clearsolutionsip.com/fully-integrated-online-mobile-ordering/)
("at no additional cost").

**This kills the savings argument, and it was nearly shipped anyway.** The first
version of the money box said Heartland's ordering cost was "not published" and
invited the owner to compare a statement. That framing implies there is a fee to
be saved. There is not. Pastrami Joe's pays nothing for the ordering channel
they have.

The other numbers, for completeness: the point of sale is **$89 a month and up**
on [Heartland's own page](https://www.heartland.us/pricing/restaurant-pos), and
[TechRadar](https://www.techradar.com/reviews/heartland-pos-review) reports tiers
at $80 and $160 per selling station, interchange-plus processing, a **three year
term** and **$295 per location** to leave early. Those last three matter for a
different reason: they are switching costs on the POS, which this proposal is
not asking them to switch.

**What the proposal says now.** That moving the channel does not save money,
because the channel is already free; that what it buys is the ordering living on
their own name with their hours and prices visible, plus 50¢ an order; and that
the trade is a 99¢ fee their customer does not pay today. It offers to build the
ordering without the fee if that is the sticking point.

### Why Heartland gives ordering away, and what that means for Jelly

It is not generosity and it is not a loss leader in the usual sense.

**Heartland is a payments company that sells software to acquire processing
volume.** Reforming Retail, covering the industry, puts it flatly: "90%+ of the
quoted 'revenue' is payments processing revenue", and describes Global Payments'
strategy as buying merchant portfolios and widening the payments margin. The POS
is the hook; the card rail is the business.

**And an online order is worth more to them than a counter order.** Online is
card-not-present, which carries higher interchange than card-present:
[roughly 2.25-2.65% against 1.70-2.05%](https://merchantcostconsulting.com/lower-credit-card-processing-fees/card-present-vs-card-not-present-transactions/),
about half a point. Square's own published rates show the same shape, 2.6% + 10¢
in person against 2.9% + 30¢ online. So free online ordering is a pump that moves
volume into their highest-margin channel. Charging for it would be leaving money
on the table.

**Which is the part that matters for us.** Taking the ordering channel does not
just move a page, it moves that card volume off Heartland's rail and onto
Stripe's. Two consequences, and neither is in the proposal because neither is
provable without his statement:

1. **Their rep will care.** This is their high-margin volume, and Pastrami Joe's
   is on a three-year POS term with $295 a location to exit. We are not asking
   them to leave, but somebody at Heartland may argue the point.
2. **The processing rate may get worse, not better.** Stripe standard is
   2.9% + 30¢. A negotiated interchange-plus deal on card-not-present might land
   nearer 2.6% + 10¢. On a $30 order that is roughly 29¢ more through Stripe,
   against 50¢ earned from the guest fee. **Still net positive, but it is ~21¢,
   not 50¢** — and with the fee waived, which the proposal offers, it goes
   negative.

**So do not offer the no-fee build here without pricing the processing first.**
That offer is in the proposal deliberately, because against a free incumbent it
is the difference between a conversation and a no, but it needs his rate before
it becomes a number.

**The Jelly economics that work at Beans do not transfer here.** Beans was on
Toast, paying $50 a month for a handheld and 3.69% + 15¢, so there was real money
to move. Pastrami Joe's is on a free channel. Sell the website; treat ordering as
the thing that makes the website worth having, not as a saving.

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

`next` is pinned to an exact **16.3.1**, not a range.

The first deploy of this repo went out on 15.5.4 and Vercel **refused to ship
it**: `Deploying outputs... Vulnerable version of Next.js detected`. That is
**CVE-2025-66478**, the React Server Components RCE, CVSS 10.0, affecting Next
15.x and 16.x App Router applications, which is what this is. The build itself
compiled fine, so the log reads like a success until its last line.

It went to 15.5.23 first, which cleared that advisory. `npm audit` then still
reported **three high-severity advisories** through Next's own dependencies:
postcss, for XSS via an unescaped `</style>` and arbitrary file read via
`sourceMappingURL`, and sharp, for four libvips CVEs. Both are build-time here
and neither is reachable at runtime on a site whose CSS and images are all ours,
but the only fix `npm audit` offered was Next 16. Six other repos in this account
already run 16.3.x, so this went there too. `npm audit` now reports **zero**.

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
- [ ] **Who sets the specials date.** `week.updated` in `lib/menu.js` prints as
      "Last updated ..." on `/specials`. The value is real, their sitemap's
      lastmod, but from launch it has to move when the soups move or it becomes
      a date claiming the page is current when it is not.
- [ ] **A real `KITCHEN_PIN`.** It falls back to `0105`, their street number,
      which is in this repo and in the proposal's demo instructions. Set it in
      Vercel before any staff use `/kitchen`.
- [ ] **`DATABASE_URL`.** Without it, ordering runs in memory and the counter
      screen can miss tickets. It says so in a red box; that is not a substitute.
- [ ] **Remove `ORDERING_DEMO_ALWAYS_OPEN`** at go-live. Left on, it takes
      orders for counters that are dark.
- [ ] **Re-verify the listing findings by eye** before sending: the six
      conflicting hour sources, Yelp, Tripadvisor, the Visitors Bureau entries.
      They were checked when the proposal was written and not since.
- [ ] **Mobile performance.** Never measured. No claim is made about theirs or
      ours.
- [ ] Swap the footer credit to **Double Dipped by** on signature.
- [ ] Delete `public/pitch/` and the pitch rewrites once they sign or pass.

## Retired

Nothing yet.
