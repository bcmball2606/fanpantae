"use client";

import { useEffect, useRef, useState } from "react";
import { GameShell } from "./GameShell";
import { AttemptProgress, PublicQuestionSet } from "@/lib/types";
import { sfx } from "@/lib/sfx";

type Props = {
  attemptId: string;
  set: PublicQuestionSet;
  progress: AttemptProgress;
  totalScore: number;
  onProgress: (p: AttemptProgress) => void;
};

const TIMER_MS = 3000;       // visible countdown (3s)
const LOCK_MS = 500;         // first 0.5s: timer frozen at 3.0, can't answer
const GRACE_MS = 500;        // after 0.0: timer at 0.0, can still answer
const TOTAL_MS = LOCK_MS + TIMER_MS + GRACE_MS; // 4000ms total

export default function Mode1({ attemptId, set, progress, totalScore, onProgress }: Props) {
  const subs = set.mode1_questions || [];
  const idx = progress.m1_index;
  const sub = subs[idx];

  const [phase, setPhase] = useState<"ready" | "playing" | "result">("ready");
  const [remaining, setRemaining] = useState(TIMER_MS);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [resultOutcome, setResultOutcome] = useState<"correct" | "wrong" | "skip" | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingProgress, setPendingProgress] = useState<AttemptProgress | null>(null);

  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function clearGrace() {
    if (graceRef.current) {
      clearTimeout(graceRef.current);
      graceRef.current = null;
    }
  }

  function startQuestion() {
    setPhase("playing");
    setRemaining(TIMER_MS);
    setPickedIndex(null);
    setResultOutcome(null);
    setCorrectIndex(null);
    startedAtRef.current = performance.now();
    clearTick();
    clearGrace();
    tickRef.current = setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      // Visible countdown: frozen at TIMER_MS during lock, then counts down, then frozen at 0 during grace
      const countElapsed = Math.min(TIMER_MS, Math.max(0, elapsed - LOCK_MS));
      const left = Math.max(0, TIMER_MS - countElapsed);
      setRemaining(left);
      if (elapsed >= TOTAL_MS) {
        clearTick();
        submit("timeout");
      }
    }, 50);
  }

  useEffect(() => {
    return () => { clearTick(); clearGrace(); };
  }, []);

  async function submit(action: "answer" | "skip" | "timeout", choiceIndex?: number) {
    if (busy) return;
    setBusy(true);
    clearTick();
    clearGrace();
    if (action === "answer" && typeof choiceIndex === "number") {
      setPickedIndex(choiceIndex);
    }
    try {
      const res = await fetch("/api/play/mode1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, action, choiceIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาด");
        setBusy(false);
        return;
      }
      // Defer applying progress until user clicks Next/Go-to-Mode2 so the result UI is visible
      setPendingProgress(data.progress);
      setResultOutcome(data.outcome);
      setCorrectIndex(data.correctIndex);
      if (data.outcome === "correct") sfx.correct();
      else if (data.outcome === "wrong") sfx.wrong();
      else sfx.tick();
      setPhase("result");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (pendingProgress) {
      setPhase("ready");
      onProgress(pendingProgress);
      setPendingProgress(null);
    } else {
      setPhase("ready");
    }
  }

  function gotoNextMode() {
    if (pendingProgress) {
      onProgress(pendingProgress);
      setPendingProgress(null);
    }
  }

  if (!sub) {
    // No more sub-questions but still in mode 1 — shouldn't happen but guard
    return (
      <GameShell
        totalScore={totalScore}
        modeIndex={1}
        mainQuestion={set.mode1_main_question}
      >
        <div className="text-center text-white/70">— ไม่มีโจทย์ในโหมดนี้ —</div>
      </GameShell>
    );
  }

  const lastSeconds = remaining <= 1000;

  return (
    <GameShell
      totalScore={totalScore}
      modeIndex={1}
      mainQuestion={set.mode1_main_question}
    >
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center text-sm text-white/70">
          <div>
            ข้อ <span className="text-white font-bold">{idx + 1}</span> / {subs.length}
          </div>
          <div>คะแนนโหมดนี้: <span className="font-bold text-white">{pendingProgress?.m1_score ?? progress.m1_score}</span></div>
        </div>

        {/* Sub prompt area */}
        <div className="panel p-5 md:p-7 min-h-[140px] flex flex-col items-center justify-center text-center gap-3">
          {phase === "ready" ? (
            <>
              <div className="text-white/60 text-sm">กดเริ่มเมื่อพร้อมตอบในเวลา 4 วินาที</div>
              <button onClick={startQuestion} className="btn-primary">▶ เริ่มข้อนี้</button>
            </>
          ) : (
            <>
              {sub.prompt_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sub.prompt_image_url}
                  alt=""
                  className="max-h-48 rounded-md border border-white/10"
                />
              )}
              {sub.prompt_text && (
                <div className="text-2xl md:text-3xl font-bold">{sub.prompt_text}</div>
              )}
            </>
          )}
        </div>

        {/* Timer */}
        {phase !== "ready" && (
          <div className="flex flex-col items-center gap-1">
            <div className={`text-5xl font-black points-digit ${lastSeconds && phase === "playing" ? "timer-warn" : ""}`}>
              {(remaining / 1000).toFixed(1)}
            </div>
            <div className="w-full max-w-md h-2 rounded bg-black/40 overflow-hidden">
              <div
                className="h-full bg-accent-orange transition-[width] duration-100"
                style={{ width: `${(remaining / TIMER_MS) * 100}%`, background: "var(--accent-orange)" }}
              />
            </div>
          </div>
        )}

        {/* Choices grid 4 (2x2) + skip — โຊว์เฉพาะตอนเล่นข้อนี้ */}
        {phase !== "ready" && (
          <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto w-full">
            {sub.choices.map((c, i) => {
              const cls =
                phase === "result"
                  ? i === correctIndex
                    ? "correct"
                    : i === pickedIndex
                    ? "wrong"
                    : ""
                  : "";
              return (
                <button
                  key={i}
                  disabled={phase !== "playing"}
                  onClick={() => submit("answer", i)}
                  className={`choice-btn rounded-full px-4 py-3 text-base md:text-lg ${cls}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-center gap-3 flex-wrap">
          {phase === "playing" && (
            <button onClick={() => submit("skip")} className="skip-btn rounded-full px-10 py-4 text-xl md:text-2xl font-bold">
              ⏭ ข้าม
            </button>
          )}
          {phase === "result" && (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="text-lg">
                {resultOutcome === "correct" && (
                  <span className="text-green-300 font-bold">✓ ถูกต้อง! +1 คะแนน</span>
                )}
                {resultOutcome === "wrong" && (
                  <span className="text-red-300 font-bold">
                    ✗ ผิด — จบโหมด 1 (เก็บได้ {pendingProgress?.m1_score ?? progress.m1_score} คะแนน)
                  </span>
                )}
                {resultOutcome === "skip" && (
                  <span className="text-yellow-300 font-bold">⏭ ข้ามข้อนี้ — ไม่ได้คะแนน</span>
                )}
              </div>
              {pendingProgress?.m1_done ? (
                <button onClick={gotoNextMode} className="btn-primary">
                  ▶ ไปโหมด 2
                </button>
              ) : (
                <button onClick={next} className="btn-primary">▶ ข้อต่อไป</button>
              )}
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
}
