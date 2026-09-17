/**
 * The PIN door. Order of checks matters and is deliberate:
 *
 *   1. Is this deployment able to sign anyone in? Production with no
 *      KITCHEN_SESSION_SECRET is a closed door, and the message says whose
 *      problem that is (the operator's), not "wrong PIN".
 *   2. Can we tell who is knocking? No trusted address, no throttle, no login.
 *   3. Has this address knocked ten times in ten minutes? Then it waits.
 *   4. Only now is the PIN read and compared, in constant time.
 *
 * The PIN is checked last so a throttled or unconfigured request costs no
 * comparison at all and reveals nothing about the PIN.
 */
import { NextResponse } from "next/server";
import { kitchenSessionReady, pinMatches, setKitchenCookie } from "@/lib/ordering/auth";
import { allowLogin, clearLoginAttempts, loginClient } from "@/lib/workroom/login-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!kitchenSessionReady()) {
    return NextResponse.json(
      { error: "Sign-in is not set up on this deployment yet.", reason: "unconfigured" },
      { status: 503 },
    );
  }

  let client;
  try {
    client = loginClient(req);
  } catch {
    return NextResponse.json(
      {
        error: "Sign-in is off until the hosting settings let the site see your connection address.",
        reason: "trusted_address_unavailable",
      },
      { status: 503 },
    );
  }

  try {
    if (!(await allowLogin(client))) {
      return NextResponse.json(
        { error: "Too many tries. Wait ten minutes." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }
  } catch {
    return NextResponse.json({ error: "Sign-in storage is unavailable. Please try again later." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!pinMatches(pin)) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  try {
    await clearLoginAttempts(client);
    await setKitchenCookie(pin);
  } catch {
    return NextResponse.json({ error: "Sign-in could not finish. Please try again." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
