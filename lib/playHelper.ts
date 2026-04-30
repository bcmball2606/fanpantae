import { supabaseAdmin } from "./supabase";
import { Attempt, AttemptProgress, QuestionSet } from "./types";

export async function loadAttempt(attemptId: string): Promise<{
  attempt: Attempt;
  set: QuestionSet;
} | { error: string; status: number }> {
  if (!attemptId || typeof attemptId !== "string") {
    return { error: "missing attemptId", status: 400 };
  }
  const sb = supabaseAdmin();
  const { data: attempt } = await sb
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) return { error: "ไม่พบเกม", status: 404 };
  const { data: set } = await sb
    .from("question_sets")
    .select("*")
    .eq("id", attempt.set_id)
    .single();
  if (!set) return { error: "ไม่พบชุดคำถาม", status: 404 };
  return { attempt: attempt as Attempt, set: set as QuestionSet };
}

export async function saveProgress(
  attemptId: string,
  progress: AttemptProgress,
  scores?: {
    mode1_score?: number;
    mode2_score?: number;
    mode3_score?: number;
    mode4_score?: number;
    finished?: boolean;
    finished_at?: string | null;
  }
) {
  const sb = supabaseAdmin();
  const update: Record<string, unknown> = { progress, ...(scores || {}) };
  await sb.from("attempts").update(update).eq("id", attemptId);
}
