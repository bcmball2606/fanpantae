import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

// DELETE /api/admin/sets/[id]/attempts — clear all attempts for a set
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  const { id } = await params;
  const sb = supabaseAdmin();
  const { error } = await sb.from("attempts").delete().eq("set_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
