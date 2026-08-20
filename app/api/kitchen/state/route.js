/**
 * The 86 board, the busy dial, and the pause.
 *
 * A pause ALWAYS carries a timer. "Paused until somebody remembers" is how a
 * restaurant turns online ordering off on a Friday and discovers it on Monday.
 */
import { NextResponse } from "next/server";
import { isKitchenAuthed } from "@/lib/ordering/auth";
import { effectiveState, getStore, DEFAULT_STATE } from "@/lib/ordering/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: "Locked." }, { status: 401 });
  return NextResponse.json({ state: effectiveState(await getStore().getState()) });
}

export async function POST(req) {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: "Locked." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const store = getStore();
  const current = effectiveState(await store.getState());
  const next = { ...DEFAULT_STATE, ...current };

  if (Array.isArray(body.unavailable)) {
    next.unavailable = body.unavailable.map(String).slice(0, 300);
  }
  if ([0, 15, 30].includes(body.busyMinutes)) {
    next.busyMinutes = body.busyMinutes;
  }
  if (body.pauseMinutes === 0) {
    next.pausedUntil = null;
  } else if ([10, 20, 30, 60].includes(body.pauseMinutes)) {
    next.pausedUntil = Date.now() + body.pauseMinutes * 60000;
  }

  await store.setState(next);
  return NextResponse.json({ state: next });
}
