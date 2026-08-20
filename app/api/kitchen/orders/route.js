/** The ticket queue, and the one button that moves a ticket along. */
import { NextResponse } from "next/server";
import { isKitchenAuthed } from "@/lib/ordering/auth";
import { getStore } from "@/lib/ordering/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: "Locked." }, { status: 401 });
  const store = getStore();
  return NextResponse.json({ orders: await store.listActiveOrders(), backend: store.backend });
}

export async function POST(req) {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: "Locked." }, { status: 401 });
  const { id, status } = await req.json().catch(() => ({}));
  if (!id || !["accepted", "done", "refunded"].includes(status)) {
    return NextResponse.json({ error: "Malformed." }, { status: 400 });
  }
  // Refund is a status here and nothing more. When Stripe is wired this is
  // where the refund call goes, and it does NOT belong behind a four digit PIN
  // at that point.
  await getStore().setOrderStatus(id, status);
  return NextResponse.json({ ok: true });
}
