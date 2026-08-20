import { NextResponse } from "next/server";
import { kitchenPin, setKitchenCookie } from "@/lib/ordering/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { pin } = await req.json().catch(() => ({}));
  if (String(pin ?? "") !== kitchenPin()) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }
  await setKitchenCookie();
  return NextResponse.json({ ok: true });
}
