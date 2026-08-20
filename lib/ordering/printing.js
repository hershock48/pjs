/**
 * Kitchen and front-of-house slips, as plain text for a 42-column thermal
 * printer. Ported from the Beans build.
 *
 * Printers are configured by env, never hard-coded, because the deli may run
 * one, two, or none. Format is `id:role:location`, comma separated:
 *
 *   ORDERING_PRINTERS="mar-kitchen:kitchen:marshall,mar-front:front:marshall"
 *
 * The location segment is optional and is this build's addition: with two
 * counters, a Battle Creek order must not print in Marshall. Omit it and the
 * printer takes everything.
 *
 * NO PRINTERS CONFIGURED IS A SUPPORTED STATE, not a broken one. The kitchen
 * screen at /kitchen is the primary surface; paper is a convenience for a
 * counter that would rather have a ticket.
 */

const WIDTH = 42;

const rule = (ch = "-") => ch.repeat(WIDTH);
const centre = (s) => {
  const t = s.slice(0, WIDTH);
  const pad = Math.max(0, Math.floor((WIDTH - t.length) / 2));
  return " ".repeat(pad) + t;
};
const money = (cents) => `$${(cents / 100).toFixed(2)}`;

/** Left text, right amount, dots between, wrapping the left if it is long. */
function row(left, right) {
  const r = right ?? "";
  const room = WIDTH - r.length - 1;
  if (left.length <= room) return left + " ".repeat(WIDTH - left.length - r.length) + r;
  const head = left.slice(0, room);
  const tail = left.slice(room);
  return head + " " + r + "\n" + tail;
}

function clock(ms) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

export function configuredPrinters() {
  const raw = process.env.ORDERING_PRINTERS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [id, role, location] = s.split(":");
      return { id, role: role === "front" ? "front" : "kitchen", location: location || null };
    })
    .filter((p) => p.id);
}

/** What the line cook needs: items, options, note. No money at all. */
function kitchenSlip(order) {
  const out = [];
  out.push(centre(order.kind === "catering" ? "CATERING" : "ONLINE ORDER"));
  out.push(centre(`#${order.number}  ${order.locationName}`));
  out.push(rule("="));
  out.push(`${order.guestName}   ${order.guestPhone}`);
  out.push(order.kind === "catering" ? `WANTED: ${order.wantedAt}` : `QUOTED: ${order.quotedMinutes} min`);
  out.push(`PLACED: ${clock(order.createdAt)}`);
  out.push(rule());
  for (const l of order.lines) {
    out.push(`${l.qty} x ${l.name}`);
    for (const o of l.options) out.push(`    - ${o}`);
  }
  if (order.note) {
    out.push(rule());
    out.push("NOTE:");
    out.push(order.note);
  }
  out.push(rule("="));
  return out.join("\n");
}

/** What the counter needs: money, and whether it has been paid. */
function frontSlip(order) {
  const out = [];
  out.push(centre("PASTRAMI JOE'S"));
  out.push(centre(order.locationName));
  out.push(centre(`Order #${order.number}`));
  out.push(rule("="));
  out.push(`${order.guestName}   ${order.guestPhone}`);
  out.push(clock(order.createdAt));
  out.push(rule());
  for (const l of order.lines) {
    out.push(row(`${l.qty} x ${l.name}`, money(l.lineCents)));
    for (const o of l.options) out.push(`    - ${o}`);
  }
  out.push(rule());
  out.push(row("Subtotal", money(order.subtotalCents)));
  out.push(row("Order fee", money(order.feeCents)));
  if (order.tipCents) out.push(row("Tip", money(order.tipCents)));
  out.push(row("Tax", money(order.taxCents)));
  out.push(row("TOTAL", money(order.totalCents)));
  out.push(rule("="));
  if (order.paid) {
    out.push(centre("PAID ONLINE"));
  } else {
    // The demo takes no money, and a slip that implied otherwise would put
    // somebody behind the counter in an argument they cannot win.
    out.push(centre("DUE AT PICKUP"));
    out.push("");
    out.push("Tip: ______________");
    out.push("");
    out.push("Sign: _____________");
  }
  out.push("");
  out.push("");
  return out.join("\n");
}

export function renderFor(role, order) {
  return role === "front" ? frontSlip(order) : kitchenSlip(order);
}
