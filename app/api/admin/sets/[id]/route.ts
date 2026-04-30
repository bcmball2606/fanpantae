import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

const ALLOWED_FIELDS = [
  "name",
  "pin",
  "is_open",
  "mode1_main_question",
  "mode1_questions",
  "mode2_question",
  "mode2_image_url",
  "mode2_answer",
  "mode2_choices",
  "mode3_question",
  "mode3_image_url",
  "mode3_answer",
  "mode4_question",
  "mode4_answer",
  "mode4_properties",
] as const;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("question_sets")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ set: data });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) {
    if (k in body) update[k] = body[k];
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("question_sets")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ set: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  const { id } = await params;
  const sb = supabaseAdmin();
  const { error } = await sb.from("question_sets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
