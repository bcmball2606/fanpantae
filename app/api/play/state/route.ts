import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { publicSet } from "@/lib/publicSet";
import { Attempt, QuestionSet } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const attemptId = url.searchParams.get("attemptId");
  if (!attemptId) {
    return NextResponse.json({ error: "missing attemptId" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  const { data: attempt, error } = await sb
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!attempt) return NextResponse.json({ error: "ไม่พบเกม" }, { status: 404 });

  const { data: setRow } = await sb
    .from("question_sets")
    .select("*")
    .eq("id", attempt.set_id)
    .single();
  if (!setRow) return NextResponse.json({ error: "ไม่พบชุดคำถาม" }, { status: 404 });

  return NextResponse.json({
    attempt: attempt as Attempt,
    set: publicSet(setRow as QuestionSet),
  });
}
