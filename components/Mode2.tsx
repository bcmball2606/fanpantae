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

const TIMER_MS = 5 * 60 * 1000;

export default function Mode2({ attemptId, set, progress, totalScore, onProgress }: Props) {
  const [phase, setPhase] = useState<"ready" | "playing" | "result">("ready");
  const [remaining, setRemaining] = useState(TIMER_MS);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(progress.m2_revealed_choices);
  const [eliminated, setEliminated] = useState<number[]>(progress.m2_eliminated_indices || []);
  const [busy, setBusy] = useState(false);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const [resultScore, setResultScore] = useState<number>(0);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [pendingProgress, setPendingProgress] = useState<AttemptProgress | null>(null);

  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function startQuestion() {
    setPhase("playing");
    setRemaining(TIMER_MS);
    startedAtRef.current = performance.now();
    clearTick();
    tickRef.current = setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      const left = Math.max(0, TIMER_MS - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearTick();
        // Auto-submit empty (wrong)
        submit();
      }
    }, 200);
  }

  useEffect(() => () => clearTick(), []);

  // Computed score-if-correct (preview)
  function scoreIfCorrect(): number {
    if (!revealed) return 25;
    return Math.max(5, 20 - eliminated.length * 5);
  }

  async function reveal() {
    if (busy || revealed) return;
    setBusy(true);
    try {
      const res = await fetch("/api/play/mode2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, action: "reveal" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setRevealed(true);
      sfx.open();
    } finally {
      setBusy(false);
    }
  }

  async function eliminateOne() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/play/mode2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, action: "eliminate" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "ไม่สามารถตัดได้");
        return;
      }
      setEliminated((prev) => [...prev, data.eliminatedIndex]);
      sfx.tick();
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (busy || phase === "result") return;
    setBusy(true);
    clearTick();
    try {
      const res = await fetch("/api/play/mode2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, action: "submit", answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setResultCorrect(data.correct);
      setResultScore(data.score);
      setCorrectAnswer(data.correctAnswer);
      setPendingProgress(data.progress);
      setPhase("result");
      if (data.correct) sfx.correct(); else sfx.wrong();
    } finally {
      setBusy(false);
    }
  }

  function gotoNextMode() {
    if (pendingProgress) onProgress(pendingProgress);
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const lowTime = remaining <= 30000;
  const choicesRemaining = (set.mode2_choices || []).length - eliminated.length;
  const canEliminate = revealed && choicesRemaining > 2;

  return (
    <GameShell
      totalScore={totalScore}
      pointsAvailable={phase === "result" ? resultScore : scoreIfCorrect()}
      modeIndex={2}
      mainQuestion={set.mode2_question}
      hideMainQuestion={phase === "ready"}
    >
      <div className="flex flex-col gap-5">
        {set.mode2_image_url && phase !== "ready" && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={set.mode2_image_url}
              alt=""
              className="max-h-72 rounded-lg border border-white/10"
            />
          </div>
        )}

        {phase === "ready" && (
          <div className="panel p-6 text-center">
            <div className="text-white/70 mb-3">โหมดคำถาม-คำตอบ · 1 ข้อ · เวลา 5 นาที · เต็ม 25 คะแนน</div>
            <button onClick={startQuestion} className="btn-primary">▶ เริ่ม</button>
          </div>
        )}

        {phase !== "ready" && (
          <>
            {/* Timer */}
            <div className="flex flex-col items-center gap-1">
              <div className={`text-4xl font-black points-digit ${lowTime ? "timer-warn" : ""}`}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            </div>

            {/* Answer input */}
            <div className="panel p-4 flex flex-col gap-3">
              <label className="text-sm text-white/70">คำตอบของคุณ</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={phase !== "playing"}
                placeholder="พิมพ์คำตอบ..."
                className="text-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />

              {/* Choices section */}
              {revealed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {set.mode2_choices.map((c, i) => {
                    const isEliminated = eliminated.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={phase !== "playing" || isEliminated}
                        onClick={() => setAnswer(c)}
                        className={`choice-btn rounded-lg px-4 py-3 text-left ${isEliminated ? "line-through opacity-40" : ""}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}

              {phase === "playing" && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {!revealed && (
                    <button onClick={reveal} className="btn-ghost" disabled={busy}>
                      🔓 เปิดช่อยส์ 5 ข้อ (ลดเหลือ 20 คะแนน)
                    </button>
                  )}
                  {revealed && canEliminate && (
                    <button onClick={eliminateOne} className="btn-ghost" disabled={busy}>
                      ✂ ตัดช่อยส์ (ลด -5 คะแนน) · เหลือ {choicesRemaining}
                    </button>
                  )}
                  <div className="flex-1" />
                  <button onClick={submit} className="btn-primary" disabled={busy || !answer.trim()}>
                    ✓ ส่งคำตอบ
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {phase === "result" && (
          <div className="panel p-6 text-center flex flex-col items-center gap-3">
            <div className="text-2xl font-bold">
              {resultCorrect ? (
                <span className="text-green-300">✓ ถูกต้อง! +{resultScore} คะแนน</span>
              ) : (
                <span className="text-red-300">✗ ผิด — 0 คะแนน</span>
              )}
            </div>
            <div className="text-white/70">
              คำตอบที่ถูก: <span className="font-bold text-white">{correctAnswer}</span>
            </div>
            <button onClick={gotoNextMode} className="btn-primary mt-2">▶ ไปโหมด 3</button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
