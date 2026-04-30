import { NextResponse } from "next/server";
import { loadAttempt, saveProgress } from "@/lib/playHelper";
import { answerMatches, mode4Score } from "@/lib/scoring";

// Mode 4 — 5 properties.
// Body: { attemptId, action: "open" | "submit", propIndex?: number, answer?: string }
export async function POST(req: Request) {
  const body = await req.json();
  const { attemptId, action, propIndex, answer } = body || {};
  const r = await loadAttempt(attemptId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { attempt, set } = r;
  const p = attempt.progress;
  if (attempt.finished) return NextResponse.json({ error: "เกมจบไปแล้ว" }, { status: 400 });
  if (p.current_mode !== 4 || p.m4_done) {
    return NextResponse.json({ error: "ไม่ได้อยู่ในโหมด 4" }, { status: 400 });
  }

  if (action === "open") {
    if (typeof propIndex !== "number" || propIndex < 0 || propIndex > 4) {
      return NextResponse.json({ error: "คุณสมบัติไม่ถูกต้อง" }, { status: 400 });
    }
    if (!p.m4_opened.includes(propIndex)) {
      p.m4_opened.push(propIndex);
    }
    await saveProgress(attemptId, p);
    return NextResponse.json({ progress: p });
  }

  if (action === "submit") {
    if (p.m4_opened.length < 1) {
      return NextResponse.json({ error: "ต้องเปิดอย่างน้อย 1 ก่อน" }, { status: 400 });
    }
    const correct = typeof answer === "string" && answerMatches(answer, set.mode4_answer);
    const score = correct ? mode4Score(p.m4_opened.length) : 0;
    p.m4_score = score;
    p.m4_done = true;
    p.current_mode = 5;
    await saveProgress(attemptId, p, {
      mode4_score: score,
      finished: true,
      finished_at: new Date().toISOString(),
    });
    return NextResponse.json({
      progress: p,
      correct,
      score,
      correctAnswer: set.mode4_answer,
      finished: true,
    });
  }

  return NextResponse.json({ error: "action ไม่รู้จัก" }, { status: 400 });
}
