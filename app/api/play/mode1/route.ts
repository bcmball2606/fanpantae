import { NextResponse } from "next/server";
import { loadAttempt, saveProgress } from "@/lib/playHelper";

// Mode 1 — 3-second mode.
// Body: { attemptId, action: "answer" | "skip" | "timeout", choiceIndex?: number }
export async function POST(req: Request) {
  const body = await req.json();
  const { attemptId, action, choiceIndex } = body || {};
  const r = await loadAttempt(attemptId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { attempt, set } = r;
  const p = attempt.progress;

  if (attempt.finished) {
    return NextResponse.json({ error: "เกมจบไปแล้ว" }, { status: 400 });
  }
  if (p.current_mode !== 1 || p.m1_done) {
    return NextResponse.json({ error: "ไม่ได้อยู่ในโหมด 1" }, { status: 400 });
  }

  const idx = p.m1_index;
  const subs = set.mode1_questions || [];
  if (idx >= subs.length) {
    // Already at end — finalize
    p.m1_done = true;
    p.m1_ended_reason = "complete";
    p.current_mode = 2;
    await saveProgress(attemptId, p, { mode1_score: p.m1_score });
    return NextResponse.json({ progress: p, doneMode: true });
  }
  const sub = subs[idx];

  let outcome: "correct" | "wrong" | "skip" = "skip";
  if (action === "answer") {
    if (typeof choiceIndex !== "number" || choiceIndex < 0 || choiceIndex > 5) {
      return NextResponse.json({ error: "ช่อยส์ไม่ถูกต้อง" }, { status: 400 });
    }
    outcome = choiceIndex === sub.correct_index ? "correct" : "wrong";
  } else if (action === "skip") {
    outcome = "skip";
  } else if (action === "timeout") {
    outcome = "wrong"; // per spec: timeout = wrong = end mode
  } else {
    return NextResponse.json({ error: "action ไม่รู้จัก" }, { status: 400 });
  }

  p.m1_results = p.m1_results || [];
  p.m1_results.push({
    qIndex: idx,
    outcome,
    correct_index: sub.correct_index,
  });

  if (outcome === "correct") {
    p.m1_score += 1;
    p.m1_index += 1;
    if (p.m1_index >= subs.length) {
      p.m1_done = true;
      p.m1_ended_reason = "complete";
      p.current_mode = 2;
    }
  } else if (outcome === "skip") {
    p.m1_index += 1;
    if (p.m1_index >= subs.length) {
      p.m1_done = true;
      p.m1_ended_reason = "complete";
      p.current_mode = 2;
    }
  } else {
    // wrong / timeout → end mode immediately
    p.m1_done = true;
    p.m1_ended_reason = action === "timeout" ? "timeout" : "wrong";
    p.current_mode = 2;
  }

  await saveProgress(attemptId, p, p.m1_done ? { mode1_score: p.m1_score } : undefined);
  return NextResponse.json({
    outcome,
    correctIndex: sub.correct_index,
    progress: p,
  });
}
