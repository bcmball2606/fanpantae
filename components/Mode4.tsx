"use client";

import { useState } from "react";
import { GameShell } from "./GameShell";
import { AttemptProgress, PublicQuestionSet } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import { mode4Score } from "@/lib/scoring";

type Props = {
  attemptId: string;
  set: PublicQuestionSet;
  progress: AttemptProgress;
  totalScore: number;
  onProgress: (p: AttemptProgress) => void;
  onFinish: () => void;
};

export default function Mode4({ attemptId, set, progress, totalScore, onFinish }: Props) {
  const [opened, setOpened] = useState<number[]>(progress.m4_opened || []);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const [resultScore, setResultScore] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState("");

  async function openProp(i: number) {
    if (busy || opened.includes(i) || phase !== "playing") return;
    setBusy(true);
    try {
      const res = await fetch("/api/play/mode4", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, action: "open", propIndex: i }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setOpened([...opened, i]);
      sfx.open();
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (busy) return;
    if (opened.length < 1) {
      alert("ต้องเปิดอย่างน้อย 1 คุณสมบัติก่อนตอบ");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/play/mode4", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, action: "submit", answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setResultCorrect(data.correct);
      setResultScore(data.score);
      setCorrectAnswer(data.correctAnswer);
      setPhase("result");
      if (data.correct) sfx.correct(); else sfx.wrong();
    } finally {
      setBusy(false);
    }
  }

  const previewScore = mode4Score(Math.max(1, opened.length || 1));

  return (
    <GameShell
      totalScore={totalScore}
      pointsAvailable={phase === "result" ? resultScore : previewScore}
      modeIndex={4}
      mainQuestion={set.mode4_question}
    >
      <div className="flex flex-col gap-4">
        <div className="text-sm text-white/70 text-center">
          เปิดคุณสมบัติทีละข้อเพื่อช่วยเดา — เปิด 1 = 25 / 2 = 20 / 3 = 15 / 4 = 10 / 5 = 5 คะแนน
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(set.mode4_properties || []).map((p, i) => {
            const isOpen = opened.includes(i);
            return (
              <button
                key={i}
                onClick={() => openProp(i)}
                disabled={isOpen || phase !== "playing" || busy}
                className={`prop-card text-left flex items-center gap-3 ${isOpen ? "opened" : ""}`}
              >
                <span className="w-9 h-9 rounded-full bg-black/40 border border-white/20 flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <span className={`flex-1 ${isOpen ? "text-white text-base md:text-lg" : "text-white/40 italic"}`}>
                  {isOpen ? p : "— กดเพื่อเปิดคุณสมบัตินี้ —"}
                </span>
              </button>
            );
          })}
        </div>

        {phase === "playing" && (
          <div className="panel p-4 flex flex-col gap-3">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="พิมพ์คำตอบ..."
              className="text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            <div className="flex justify-between items-center text-sm text-white/70">
              <div>เปิดแล้ว {opened.length}/5 · ตอบถูกได้ <span className="font-bold text-white">{previewScore}</span> คะแนน</div>
              <button onClick={submit} className="btn-primary" disabled={busy || !answer.trim() || opened.length < 1}>
                ✓ ส่งคำตอบ
              </button>
            </div>
          </div>
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
            <button onClick={onFinish} className="btn-primary mt-2">
              🏁 ดูผลสรุป
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
