import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { QuestionSet } from "@/lib/types";

function emptySet(): Partial<QuestionSet> {
  return {
    name: "ชุดใหม่",
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    is_open: false,
    mode1_main_question: "",
    mode1_questions: [],
    mode2_question: "",
    mode2_image_url: null,
    mode2_answer: "",
    mode2_choices: [],
    mode3_question: "",
    mode3_image_url: null,
    mode3_answer: "",
    mode4_question: "",
    mode4_answer: "",
    mode4_properties: [],
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("question_sets")
    .select("id, name, pin, is_open, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sets: data });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  const body = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();
  const payload = { ...emptySet(), ...body };
  const { data, error } = await sb
    .from("question_sets")
    .insert(payload)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ set: data });
}
