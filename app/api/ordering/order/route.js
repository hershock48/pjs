/**
 * Place an order (POST) and check one order's status (GET ?id=).
 *
 * THE SERVER IS THE TILL. Every price is recomputed here from the stored menu
 * document. The client's numbers are a display convenience and nothing else,
 * because a request body is guest input even when our own page wrote it.
 *
 * PAYMENT SEAM. In demo mode, meaning no STRIPE_SECRET_KEY, the order is
 * accepted without a charge and the UI says so plainly. The live wiring
 * replaces the marked block below with a Stripe Checkout session created on the
 * deli's connected account:
 *
 *   POST /v1/checkout/sessions   header  Stripe-Account: {acct_...}
 *     line_items: the order lines, the 99 cent order fee, the tip
 *     payment_intent_data[application_fee_amount]: ORDERING.feeStudioCents
 *     automatic_tax[enabled]: true
 *     success_url: /order/confirmed?id={id}
 *
 * The fee split needs no rebate machinery: the fee settles into the deli's own
 * account and only the application fee leaves. Env names are in .env.example
 * and nothing here reads a key until one exists.
 */

import { NextResponse } from "next/server";
import { ORDERING } from "@/lib/ordering/config";
import { guestMenu, isCateringSection } from "@/lib/ordering/catalog";
import { orderingWindow, quoteMinutes } from "@/lib/ordering/window";
import { effectiveState, getStore } from "@/lib/ordering/store";
import { bySlug } from "@/lib/site";

export const dynamic = "force-dynamic";

function bad(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return bad("Malformed request.");
  }

  const guestName = String(body.guestName ?? "").trim().slice(0, 60);
  const guestPhone = String(body.guestPhone ?? "").trim().slice(0, 25);
  const note = String(body.note ?? "").trim().slice(0, 300);
  const guestEmail = String(body.guestEmail ?? "").trim().slice(0, 120);

  if (guestEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guestEmail)) {
    return bad("That email does not look right. It is optional, so blank works too.");
  }
  if (!guestName) return bad("A name for the order is required.");
  if (guestPhone.replace(/\D/g, "").length < 10) {
    return bad("A phone number is required so the counter can reach you.");
  }

  const location = bySlug(String(body.locationSlug ?? ""));
  if (!location) return bad("Pick a counter to order from.");

  if (!Array.isArray(body.lines) || body.lines.length === 0) return bad("The cart is empty.");
  if (body.lines.length > 40) {
    return bad("That is a big one. Call the counter and they will take it by hand.");
  }

  const store = getStore();
  const state = effectiveState(await store.getState());
  const { index: ITEM_INDEX, sections } = await guestMenu(store);

  // Which sections a line belongs to decides whether this is a pickup order,
  // which has to happen inside opening hours, or a catering order, which is a
  // lead time and can be placed at any hour. Mixing them is refused rather than
  // guessed at, because the two print differently and land on different days.
  const sectionOf = new Map(sections.flatMap((s) => s.items.map((i) => [i.id, s.name])));

  const lines = [];
  let anyCatering = false;
  let anyCounter = false;

  for (const raw of body.lines) {
    const item = ITEM_INDEX.get(String(raw.itemId));
    if (!item) return bad("An item in the cart is no longer on the menu.");
    if (state.unavailable.includes(item.id)) {
      return bad(`${item.name} just sold out. Take it out of the cart and the rest can go through.`, 409);
    }
    if (isCateringSection(sectionOf.get(item.id) ?? "")) anyCatering = true;
    else anyCounter = true;

    const qty = Math.floor(Number(raw.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > 200) return bad("Quantity out of range.");

    const chosen = Array.isArray(raw.options) ? raw.options.map(String) : [];

    // Reject names that match no group FIRST. Silence here would misprice
    // quietly, and running the required-group check first reported a confusing
    // reason for a correct rejection.
    const legal = new Set(item.options.flatMap((g) => g.choices.map((c) => c.name)));
    const stray = chosen.filter((c) => !legal.has(c));
    if (stray.length) return bad(`${stray[0]} is not an option on ${item.name}.`);

    let optionCents = 0;
    for (const group of item.options) {
      const inGroup = group.choices.filter((c) => chosen.includes(c.name));
      if (group.multi) {
        if (group.required && inGroup.length === 0) {
          return bad(`${item.name} needs at least one ${group.name.toLowerCase()}.`);
        }
      } else {
        if (inGroup.length > 1) {
          return bad(`${item.name} takes one ${group.name.toLowerCase()}, not ${inGroup.length}.`);
        }
        if (group.required && inGroup.length === 0) {
          return bad(`${item.name} needs a ${group.name.toLowerCase()} picked.`);
        }
      }
      optionCents += inGroup.reduce((sum, c) => sum + c.priceCents, 0);
    }
    const unitCents = item.priceCents + optionCents;
    lines.push({ itemId: item.id, name: item.name, qty, unitCents, options: chosen, lineCents: unitCents * qty });
  }

  if (anyCatering && anyCounter) {
    return bad(
      "Catering and counter items land on different days, so they go in as two orders. Send the catering one first and the counter one after."
    );
  }
  const kind = anyCatering ? "catering" : "pickup";

  // A pickup order has to be inside the window. A catering order is a lead
  // time, so it is allowed at any hour and carries a wanted date instead.
  let wantedAt = "";
  if (kind === "pickup") {
    const w = orderingWindow(location);
    if (!w.open) return bad(w.reason, 409);
    if (state.pausedUntil !== null) {
      return bad("The counter just paused online ordering. Give it a few minutes.", 409);
    }
  } else {
    wantedAt = String(body.wantedAt ?? "").trim().slice(0, 40);
    if (!wantedAt) return bad("Catering needs a date. Pick the day you want it.");
    const when = new Date(`${wantedAt}T12:00:00`);
    if (Number.isNaN(when.getTime())) return bad("That date did not parse.");
    const hoursOut = (when.getTime() - Date.now()) / 36e5;
    if (hoursOut < ORDERING.cateringNoticeHours) {
      return bad(
        `Catering needs ${ORDERING.cateringNoticeHours} hours' notice. Pick a later day, or call ${location.phone.display} and ask.`
      );
    }
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const feeCents = ORDERING.feeCents;
  const tipCents = Math.floor(Number(body.tipCents ?? 0));
  if (!Number.isFinite(tipCents) || tipCents < 0 || tipCents > subtotalCents * 2) {
    return bad("Tip out of range.");
  }
  // Michigan 6% on the food and the fee; the tip is not taxable. The live build
  // hands this to Stripe Tax instead of computing it here.
  const taxCents = Math.round((subtotalCents + feeCents) * ORDERING.taxRate);
  const totalCents = subtotalCents + feeCents + tipCents + taxCents;

  const order = {
    id: crypto.randomUUID(),
    number: await store.nextTicketNumber(),
    locationSlug: location.slug,
    locationName: location.name,
    kind,
    wantedAt,
    guestName,
    guestPhone,
    guestEmail,
    note,
    lines,
    subtotalCents,
    feeCents,
    tipCents,
    taxCents,
    totalCents,
    quotedMinutes: kind === "pickup" ? quoteMinutes(state.busyMinutes) : 0,
    // PAYMENT SEAM: flips to true when Stripe confirms the charge. Until then
    // the front slip prints DUE AT PICKUP with tip and signature lines.
    paid: false,
    status: "new",
    createdAt: Date.now(),
    acceptedAt: null,
  };

  await store.createOrder(order);

  // Fan out one job per configured printer. No printers configured means no
  // jobs, and the kitchen screen carries.
  const { configuredPrinters, renderFor } = await import("@/lib/ordering/printing");
  for (const printer of configuredPrinters()) {
    if (printer.location && printer.location !== order.locationSlug) continue;
    await store.enqueuePrintJob({
      id: crypto.randomUUID(),
      printerId: printer.id,
      orderId: order.id,
      body: renderFor(printer.role, order),
      status: "queued",
      createdAt: Date.now(),
    });
  }

  // Courtesy copy of what the confirmation screen shows. Best-effort by
  // design: an email problem must never fail an order.
  const { sendOrderConfirmation } = await import("@/lib/ordering/email");
  sendOrderConfirmation(order).catch(() => {});

  return NextResponse.json({
    id: order.id,
    number: order.number,
    kind: order.kind,
    quotedMinutes: order.quotedMinutes,
    locationName: order.locationName,
    totals: { subtotalCents, feeCents, tipCents, taxCents, totalCents },
  });
}

export async function GET(req) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("Missing id.");
  const order = await getStore().getOrder(id);
  if (!order) return bad("No such order.", 404);
  // Only what the confirmation screen needs; the phone number stays server-side.
  return NextResponse.json({
    number: order.number,
    status: order.status,
    kind: order.kind,
    quotedMinutes: order.quotedMinutes,
    locationName: order.locationName,
    createdAt: order.createdAt,
  });
}
