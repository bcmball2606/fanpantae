import { NextResponse } from "next/server";
import { loadAttempt, saveProgress } from "@/lib/playHelper";
import { answerMatches, mode2Score } from "@/lib/scoring";

// Mode 2 — Q&A.
// Body: { attemptId, action: "reveal" | "eliminate" | "submit", answer?: string }
export async function POST(req: Request) {
  const body = await req.json();
  const { attemptId, action, answer } = body || {};
  const r = await loadAttempt(attemptId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { attempt, set } = r;
  const p = attempt.progress;
  if (attempt.finished) return NextResponse.json({ error: "เกมจบไปแล้ว" }, { status: 400 });
  if (p.current_mode !== 2 || p.m2_done) {
    return NextResponse.json({ error: "ไม่ได้อยู่ในโหมด 2" }, { status: 400 });
  }

  if (action === "reveal") {
    p.m2_revealed_choices = true;
    await saveProgress(attemptId, p);
    return NextResponse.json({ progress: p });
  }

  if (action === "eliminate") {
    if (!p.m2_revealed_choices) {
      return NextResponse.json({ error: "ต้องเปิดช่อยส์ก่อน" }, { status: 400 });
    }
    const total = (set.mode2_choices || []).length;
    const eliminated = p.m2_eliminated_indices || [];
    // Determine candidates: indices not yet eliminated and not the correct answer
    const correctIndex = (set.mode2_choices || []).findIndex((c) =>
      answerMatches(c, set.mode2_answer)
    );
    const candidates: number[] = [];
    for (let i = 0; i < total; i++) {
      if (i === correctIndex) continue;
      if (eliminated.includes(i)) continue;
      candidates.push(i);
    }
    if (candidates.length === 0 || p.m2_eliminated >= total - 2) {
      return NextResponse.json({ error: "ไม่สามารถตัดต่อได้แล้ว" }, { status: 400 });
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    eliminated.push(pick);
    p.m2_eliminated_indices = eliminated;
    p.m2_eliminated += 1;
    await saveProgress(attemptId, p);
    return NextResponse.json({ progress: p, eliminatedIndex: pick });
  }

  if (action === "submit") {
    const correct = typeof answer === "string" && answerMatches(answer, set.mode2_answer);
    const score = correct ? mode2Score(p.m2_eliminated, p.m2_revealed_choices) : 0;
    p.m2_score = score;
    p.m2_done = true;
    p.current_mode = 3;
    await saveProgress(attemptId, p, { mode2_score: score });
    return NextResponse.json({
      progress: p,
      correct,
      score,
      correctAnswer: set.mode2_answer,
    });
  }

  return NextResponse.json({ error: "action ไม่รู้จัก" }, { status: 400 });
}
