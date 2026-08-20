/**
 * Public ordering state, per counter: is ordering open, what is 86'd, what is
 * the quote. The order page polls this. It must never require auth and never
 * cache.
 *
 * `?at=<slug>` picks the counter. Without one it answers for every location at
 * once, which is what the order page's first render wants so it can preselect
 * a counter that is actually open rather than one that shut at three.
 */

import { NextResponse } from "next/server";
import { ORDERING } from "@/lib/ordering/config";
import { orderingWindow, quoteMinutes } from "@/lib/ordering/window";
import { effectiveState, getStore } from "@/lib/ordering/store";
import { site, bySlug } from "@/lib/site";

export const dynamic = "force-dynamic";

function forLocation(location, state) {
  const w = orderingWindow(location);
  let open = w.open;
  let reason = w.open ? "" : w.reason;

  // A paused kitchen beats an open window. The reason has to give the guest
  // somewhere to go, which is the phone, and it has to name a real number of
  // minutes rather than "shortly".
  if (open && state.pausedUntil !== null) {
    open = false;
    const mins = Math.max(1, Math.ceil((state.pausedUntil - Date.now()) / 60000));
    reason = `The counter is slammed. Online ordering is paused for about ${mins} more minute${
      mins === 1 ? "" : "s"
    }. The phone still works: ${location.phone.display}.`;
  }

  return {
    slug: location.slug,
    name: location.name,
    phone: location.phone.display,
    tel: location.phone.tel,
    open,
    reason,
    until: w.open ? w.until : "",
  };
}

export async function GET(req) {
  const store = getStore();
  const state = effectiveState(await store.getState());
  const at = new URL(req.url).searchParams.get("at");
  const chosen = at ? bySlug(at) : null;
  const locations = (chosen ? [chosen] : site.locations).map((l) => forLocation(l, state));

  return NextResponse.json({
    locations,
    unavailable: state.unavailable,
    quoteMinutes: quoteMinutes(state.busyMinutes),
    feeCents: ORDERING.feeCents,
    feeLabel: ORDERING.feeLabel,
    taxRate: ORDERING.taxRate,
    cateringNoticeHours: ORDERING.cateringNoticeHours,
    // No Stripe key means no charge is possible, and the UI has to say so
    // rather than let anybody believe a card was taken.
    demo: !process.env.STRIPE_SECRET_KEY,
    backend: store.backend,
  });
}
