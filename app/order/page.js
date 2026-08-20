import OrderClient from "@/components/ordering/OrderClient";
import { getStore } from "@/lib/ordering/store";
import { guestMenu } from "@/lib/ordering/catalog";
import { schedule } from "@/lib/hours";
import { site } from "@/lib/site";

export const metadata = {
  title: "Order online",
  description:
    "Order ahead from the Marshall or Battle Creek counter, and book catering trays, boxed lunches and soup by the gallon.",
  alternates: { canonical: "/order" },
};

// The ordering window reads the Michigan clock. See the note in app/layout.js:
// a cached page here would take orders at a counter that closed hours ago.
export const dynamic = "force-dynamic";

/**
 * Ordering, on their own domain.
 *
 * WHAT THIS REPLACED. The first version of this page was a hub: two buttons
 * that handed the customer off to `pastramijoesmarshall.hrpos.heartland.us` and
 * a second Heartland subdomain for Battle Creek. It knew whether each counter
 * was open, which their own site does not, and then sent the customer to
 * somebody else's domain to actually order. That is the channel Jelly exists to
 * replace, and shipping the handoff while pitching the replacement was the
 * wrong build. Their register is untouched; this is the online channel only.
 *
 * WHAT IS ORDERABLE, AND WHY IT IS NOT EVERYTHING. Every price here came off
 * one of their own published pages. Their catering menu is fully priced and is
 * transcribed complete. Their retail menu publishes prices for soup, five
 * extras and two seasonal items, and nothing else: 55 of 65 items are blank on
 * their own website. Those prices do exist, inside Heartland, which is the
 * whole argument of the proposal, and they are not guessed at here. See the
 * long note at the top of lib/ordering/seed.js.
 *
 * So this ships live on catering, soup and the seasonal board, and the sandwich
 * board arrives the day the owner sends a price list. That is one paste into
 * the menu editor at /kitchen, and it is the most persuasive fact in the pitch:
 * the system is built and the only missing input is his.
 */
export default async function Order() {
  const { sections } = await guestMenu(getStore());

  return (
    <>
      <section className="tight">
        <div className="wrap">
          <span className="kicker">Order ahead</span>
          <h1>Order online</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            Pick a counter, build the order, and it is waiting when you get there. Catering
            books the same way, with a real total instead of a callback.
          </p>
        </div>
      </section>

      <section className="tight" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <OrderClient
            sections={sections}
            locations={site.locations.map((l) => ({ slug: l.slug, name: l.name, open: false, until: "" }))}
            hours={Object.fromEntries(
              site.locations.map((l) => [
                l.slug,
                schedule(l)
                  .filter((r) => !r.closed)
                  .map((r) => `${r.label} ${r.value}`)
                  .join(", "),
              ])
            )}
          />
        </div>
      </section>
    </>
  );
}
