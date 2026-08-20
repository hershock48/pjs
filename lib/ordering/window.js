/**
 * When ordering is open, per counter.
 *
 * THIS IS THE ONE PART OF JELLY THAT IS GENUINELY DIFFERENT HERE. Copper's
 * version opens and closes on one venue's fixed hours; the Beans version
 * follows a truck's stops. Pastrami Joe's has two counters with two different
 * schedules, and Battle Creek is shut at 3pm on a day Marshall runs until 7.
 * So the window is a function of a location, not of the site, and everything
 * downstream carries a location with it: the state endpoint, the order, the
 * ticket, and the kitchen board's filter.
 *
 * It reads `lib/hours.js`, which is the same module the open/closed badge in
 * the header uses. That is deliberate: if a customer sees "Open until 7pm" the
 * order page cannot simultaneously believe the counter is shut, and the way to
 * guarantee that is one source rather than two that agree today.
 *
 * The last-order cutoff is the only thing added on top. Taking an order four
 * minutes before close is how a guest arrives to a locked door holding a
 * receipt.
 */

import { status, pretty } from "@/lib/hours";
import { ORDERING } from "./config";

/** No new orders inside this many minutes of closing time. */
export const LAST_ORDER_BUFFER_MIN = 20;

/**
 * ORDERING_DEMO_ALWAYS_OPEN=1 forces the window open so the system can be
 * shown at 9pm on a Sunday. Same convention as the Copper and Beans builds.
 * REMOVE IT AT GO-LIVE: left on, it takes orders at counters that are dark.
 */
function forcedOpen() {
  return process.env.ORDERING_DEMO_ALWAYS_OPEN === "1";
}

export function orderingWindow(location, now = new Date()) {
  const s = status(location, now);

  // ORDERING_DEMO_ALWAYS_OPEN forces the window open so the system can be shown
  // at 9pm on a Sunday. It must NOT contradict the header badge, which always
  // reads the real clock: the first version produced "Opens tomorrow at 10am" in
  // the strip and "Taking orders until close" in the counter picker, on the same
  // screen. So when it is forcing a genuinely closed counter open, it says that
  // is what it is doing.
  if (forcedOpen()) {
    return s.open
      ? { open: true, placeName: location.name, until: pretty(s.closesAt), demoForced: true }
      : { open: true, placeName: location.name, until: "", demoForced: true, demoNote: "Demo: this counter is shut right now" };
  }

  if (!s.open) {
    return { open: false, reason: `${location.name} is closed. ${s.message}.` };
  }

  // Inside the buffer the counter is open and ordering is not, which is a
  // different sentence and has to read like one.
  if (s.minutesToClose != null && s.minutesToClose <= LAST_ORDER_BUFFER_MIN) {
    return {
      open: false,
      reason: `${location.name} closes in ${s.minutesToClose} minute${
        s.minutesToClose === 1 ? "" : "s"
      }, so online orders are done for today. The counter is still open if you are close by.`,
    };
  }

  return { open: true, placeName: location.name, until: s.closesAt ? pretty(s.closesAt) : "close" };
}

/*
 * `firstOpen` and `closesToday` lived here and were never called: the order
 * page picks its default counter from the state endpoint's answer instead, on
 * the client, where it can re-pick when a counter closes mid-session. Removed
 * rather than left, because dead code that looks load-bearing is worse than no
 * code.
 */

/** Quote in minutes, base plus whatever the kitchen has added for being busy. */
export function quoteMinutes(busyMinutes = 0) {
  return ORDERING.basePickupMinutes + busyMinutes;
}
