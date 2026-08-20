/**
 * Kitchen auth: a PIN and a cookie. A gate, not a vault.
 *
 * Nothing behind it moves money or exposes more than the ticket queue and the
 * menu editor, and the people using it are behind the counter on a shared
 * screen. A password nobody can remember at 11.40am on a Saturday gets written
 * on the wall, which is worse than a PIN.
 *
 * What it must not become: the gate on anything that can refund, charge, or
 * read a card. When Stripe is wired, refunds stay behind a real login.
 */

import { cookies } from "next/headers";
import { KITCHEN_PIN_FALLBACK } from "./config";

const COOKIE = "pjs_kitchen";

export function kitchenPin() {
  return process.env.KITCHEN_PIN || KITCHEN_PIN_FALLBACK;
}

export async function isKitchenAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === kitchenPin();
}

export async function setKitchenCookie() {
  const jar = await cookies();
  jar.set(COOKIE, kitchenPin(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 18,
    path: "/",
  });
}
