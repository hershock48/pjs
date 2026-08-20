/**
 * The guest's confirmation email. Best-effort, always.
 *
 * AN EMAIL PROBLEM MUST NEVER FAIL AN ORDER. Every caller invokes this without
 * awaiting the result and swallows rejections. A guest whose order is in the
 * kitchen and whose receipt bounced has an order; a guest whose order was
 * rejected because SMTP was down has nothing.
 *
 * When RESEND_API_KEY is absent this logs the whole payload and returns. That
 * is the honest unconfigured state per glaze.md: the delivery is what is
 * missing, and that is the operator's problem to see in the log rather than
 * the visitor's problem to see in a red box.
 */

import { ORDERING } from "./config";

const money = (c) => `$${(c / 100).toFixed(2)}`;

function body(order) {
  const lines = order.lines
    .map((l) => `  ${l.qty} x ${l.name}${l.options.length ? ` (${l.options.join(", ")})` : ""}   ${money(l.lineCents)}`)
    .join("\n");

  const when =
    order.kind === "catering"
      ? `We have it down for ${order.wantedAt}. Someone will call to confirm the details.`
      : `Ready in about ${order.quotedMinutes} minutes at ${order.locationName}.`;

  return [
    `Order #${order.number}, Pastrami Joe's ${order.locationName}`,
    "",
    when,
    "",
    lines,
    "",
    `Subtotal  ${money(order.subtotalCents)}`,
    `${ORDERING.feeLabel}  ${money(order.feeCents)}`,
    order.tipCents ? `Tip  ${money(order.tipCents)}` : null,
    `Tax  ${money(order.taxCents)}`,
    `Total  ${money(order.totalCents)}`,
    "",
    order.paid ? "Paid online." : "Due at pickup.",
    order.note ? `\nYour note: ${order.note}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export async function sendOrderConfirmation(order) {
  if (!order.guestEmail) return;

  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM || "orders@glazedweb.com";

  if (!key) {
    // Unconfigured is a state, not an error. The payload goes to the log whole
    // so nothing is lost while mail is pending.
    console.log("[jelly] no RESEND_API_KEY, confirmation not sent:\n" + body(order));
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [order.guestEmail],
      reply_to: process.env.ORDER_REPLY_TO || undefined,
      subject: `Pastrami Joe's order #${order.number}`,
      text: body(order),
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}`);
}
