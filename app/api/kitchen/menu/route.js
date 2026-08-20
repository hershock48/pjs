/** The menu document the owner edits. Whole-document writes, validated. */
import { NextResponse } from "next/server";
import { isKitchenAuthed } from "@/lib/ordering/auth";
import { getStore } from "@/lib/ordering/store";
import { loadMenuDoc, validateMenuDoc, invalidateMenuCache } from "@/lib/ordering/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: "Locked." }, { status: 401 });
  return NextResponse.json({ doc: await loadMenuDoc(getStore()) });
}

export async function PUT(req) {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: "Locked." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const problem = validateMenuDoc(body.doc);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  await getStore().setMenuDoc(body.doc);
  invalidateMenuCache();
  return NextResponse.json({ ok: true });
}
