/**
 * Jelly ordering: the numbers, in one place. Pastrami Joe's edition.
 *
 * Same model as the Copper and Beans builds this was ported from: a 99 cent
 * order fee paid by the guest at online checkout, split 50/49 with the deli at
 * payment time via Stripe `application_fee_amount` when payments are wired.
 * Their Heartland register is untouched by any of this; what this replaces is
 * the online ordering channel only.
 *
 * THE GUEST-FACING COPY IN HERE NEVER CARRIES THE BUSINESS MODEL. No "our own
 * website", no fee-split story, no anti-vendor line. A guest gets a menu, a
 * pickup time, and a plainly labelled fee, the same as any checkout. The split
 * belongs in the owner's proposal and nowhere else.
 */

export const ORDERING = {
  feeCents: 99,
  feeStudioCents: 49,
  feeLabel: "99¢ order fee",
  timezone: "America/Detroit",

  // Michigan 6% on prepared food. The demo computes it for display; the live
  // build hands this to Stripe Tax on the deli's connected account.
  taxRate: 0.06,

  // A deli counter makes a sandwich faster than a bar kitchen plates an entrée,
  // and slower than a truck hands over a taco. Confirm with the owner: this is
  // the number that turns into a complaint if it is optimistic.
  basePickupMinutes: 12,

  // Catering is not a pickup quote, it is a lead time. Their own catering page
  // says a person calls you back to finalise; this keeps that promise and adds
  // a real total to it.
  cateringNoticeHours: 48,

  demoNoticeShort: "Demo checkout. No card is charged.",
};

// PLACEHOLDER: demo PIN, the Marshall street number. Set KITCHEN_PIN in Vercel
// before any staff use the board for real.
export const KITCHEN_PIN_FALLBACK = "0105";
