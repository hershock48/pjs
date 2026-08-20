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

import { status, pretty, windowFor, nowInMichigan } from "@/lib/hours";
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
  if (forcedOpen()) {
    return { open: true, placeName: location.name, until: "close", demoForced: true };
  }

  const s = status(location, now);

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

/**
 * The first counter that can take an order right now, or null. Used to pick a
 * sensible default on the order page rather than making a guest discover that
 * the one preselected for them shut at three.
 */
export function firstOpen(locations, now = new Date()) {
  return locations.find((l) => orderingWindow(l, now).open) ?? null;
}

/** Today's closing time for a location, for the pickup-time picker. */
export function closesToday(location, now = new Date()) {
  const { day } = nowInMichigan(now);
  const w = windowFor(location, day);
  return w ? w.close : null;
}

/** Quote in minutes, base plus whatever the kitchen has added for being busy. */
export function quoteMinutes(busyMinutes = 0) {
  return ORDERING.basePickupMinutes + busyMinutes;
}
