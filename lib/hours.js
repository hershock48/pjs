/**
 * Open / closed, computed in Michigan time.
 *
 * TWO TRAPS LIVE HERE, both of which have bitten this account before.
 *
 * 1. `new Date()` inside a statically generated page freezes at build time. A
 *    page that printed "taking orders for 2027" shipped that way. So every route
 *    that calls status() declares `export const dynamic = "force-dynamic"`, and
 *    the check in tools/flow-checks.mjs fails the build if one of them does not.
 *
 * 2. The server runs in UTC. A deli that opens at 7am Eastern reads as open at
 *    2am to a naive Date, so the badge would be wrong for five hours a day and
 *    nobody would notice until a customer drove over. Everything below resolves
 *    through Intl with an explicit America/Detroit zone rather than through the
 *    host's idea of local time, which also means DST is not our problem.
 */

const ZONE = "America/Detroit";

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  hour12: false,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Minutes since midnight, and the weekday index, in Michigan. */
export function nowInMichigan(now = new Date()) {
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  // Intl gives "24" for midnight with hour12:false in some engines. Normalize.
  const hour = Number(parts.hour) % 24;
  return {
    day: DAY_INDEX[parts.weekday],
    minutes: hour * 60 + Number(parts.minute),
  };
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "07:00" -> "7am", "15:30" -> "3:30pm". Lowercase because it reads as speech. */
export function pretty(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

/** The window covering a given weekday, or null if the store is shut that day. */
export function windowFor(location, day) {
  return location.hours.find((h) => h.days.includes(day)) ?? null;
}

/**
 * The whole state a badge needs: open or not, and the next thing that happens.
 *
 * "Closing soon" is deliberately 45 minutes rather than the usual hour, because
 * this is a made-to-order sandwich counter and an hour out is still a normal
 * order. Under 45 minutes the honest thing to tell someone is to call.
 */
export function status(location, now = new Date()) {
  const { day, minutes } = nowInMichigan(now);
  const today = windowFor(location, day);

  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (minutes >= open && minutes < close) {
      const left = close - minutes;
      return {
        open: true,
        closingSoon: left <= 45,
        until: pretty(today.close),
        // Both added for lib/ordering/window.js, which needs to stop taking
        // orders before the counter actually shuts. Nothing else reads them.
        minutesToClose: left,
        closesAt: today.close,
        message: left <= 45 ? `Closing at ${pretty(today.close)}` : `Open until ${pretty(today.close)}`,
      };
    }
    if (minutes < open) {
      return { open: false, closingSoon: false, message: `Opens at ${pretty(today.open)}` };
    }
  }

  // Walk forward for the next day with a window. Seven steps, so a location that
  // is somehow never open returns a closed state instead of looping.
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const w = windowFor(location, d);
    if (!w) continue;
    const when = i === 1 ? "tomorrow" : DAY_NAME[d];
    return { open: false, closingSoon: false, message: `Opens ${when} at ${pretty(w.open)}` };
  }
  return { open: false, closingSoon: false, message: "Call for hours" };
}

/** Rows for a printed hours table, closed days included so the gap is explicit. */
export function schedule(location) {
  const rows = [];
  for (const w of location.hours) {
    rows.push({ label: w.label, value: `${pretty(w.open)} to ${pretty(w.close)}` });
  }
  const covered = new Set(location.hours.flatMap((h) => h.days));
  const missing = [0, 1, 2, 3, 4, 5, 6].filter((d) => !covered.has(d));
  if (missing.length) {
    const names = missing.map((d) => DAY_NAME[d]);
    const label = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
    rows.push({ label, value: "Closed", closed: true });
  }
  return rows;
}

/** schema.org OpeningHoursSpecification, generated from the same array. */
export function openingHoursSpec(location) {
  return location.hours.map((w) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: w.days.map((d) => DAY_NAME[d]),
    opens: w.open,
    closes: w.close,
  }));
}
