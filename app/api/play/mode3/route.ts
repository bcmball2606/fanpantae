import { NextResponse } from "next/server";
import { loadAttempt, saveProgress } from "@/lib/playHelper";
import { answerMatches, mode3Score } from "@/lib/scoring";

// Mode 3 — Jigsaw 5x5.
// Body: { attemptId, action: "open" | "submit", tile?: number, answer?: string }
export async function POST(req: Request) {
  const body = await req.json();
  const { attemptId, action, tile, answer } = body || {};
  const r = await loadAttempt(attemptId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { attempt, set } = r;
  const p = attempt.progress;
  if (attempt.finished) return NextResponse.json({ error: "เกมจบไปแล้ว" }, { status: 400 });
  if (p.current_mode !== 3 || p.m3_done) {
    return NextResponse.json({ error: "ไม่ได้อยู่ในโหมด 3" }, { status: 400 });
  }

  if (action === "open") {
    if (typeof tile !== "number" || tile < 0 || tile > 24) {
      return NextResponse.json({ error: "ช่องไม่ถูกต้อง" }, { status: 400 });
    }
    if (!p.m3_opened.includes(tile)) {
      p.m3_opened.push(tile);
    }
    await saveProgress(attemptId, p);
    return NextResponse.json({ progress: p });
  }

  if (action === "submit") {
    if (p.m3_opened.length < 1) {
      return NextResponse.json({ error: "ต้องเปิดอย่างน้อย 1 ช่องก่อนตอบ" }, { status: 400 });
    }
    const correct = typeof answer === "string" && answerMatches(answer, set.mode3_answer);
    const score = correct ? mode3Score(p.m3_opened.length) : 0;
    p.m3_score = score;
    p.m3_done = true;
    p.current_mode = 4;
    await saveProgress(attemptId, p, { mode3_score: score });
    return NextResponse.json({
      progress: p,
      correct,
      score,
      correctAnswer: set.mode3_answer,
    });
  }

  return NextResponse.json({ error: "action ไม่รู้จัก" }, { status: 400 });
}
