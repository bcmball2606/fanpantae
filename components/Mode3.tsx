"use client";

import { useEffect, useState } from "react";
import { GameShell } from "./GameShell";
import { AttemptProgress, PublicQuestionSet } from "@/lib/types";
import { sfx } from "@/lib/sfx";
import { mode3Score } from "@/lib/scoring";

type Props = {
  attemptId: string;
  set: PublicQuestionSet;
  progress: AttemptProgress;
  totalScore: number;
  onProgress: (p: AttemptProgress) => void;
};

export default function Mode3({ attemptId, set, progress, totalScore, onProgress }: Props) {
  const [opened, setOpened] = useState<number[]>(progress.m3_opened || []);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const [resultScore, setResultScore] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [pendingProgress, setPendingProgress] = useState<AttemptProgress | null>(null);
  const [aspect, setAspect] = useState<number>(1);

  useEffect(() => {
    if (!set.mode3_image_url) return;
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspect(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = set.mode3_image_url;
  }, [set.mode3_image_url]);

  async function openTile(i: number) {
    if (busy || opened.includes(i) || phase !== "playing") return;
    setBusy(true);
    try {
      const res = await fetch("/api/play/mode3", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, action: "open", tile: i }),
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
      alert("ต้องเปิดอย่างน้อย 1 ช่องก่อนตอบ");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/play/mode3", {
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
      setPendingProgress(data.progress);
      setPhase("result");
      if (data.correct) sfx.correct(); else sfx.wrong();
    } finally {
      setBusy(false);
    }
  }

  const previewScore = mode3Score(Math.max(1, opened.length || 1));

  return (
    <GameShell
      totalScore={totalScore}
      pointsAvailable={phase === "result" ? resultScore : previewScore}
      modeIndex={3}
      mainQuestion={set.mode3_question}
    >
      <div className="flex flex-col gap-4">
        <div className="text-sm text-white/70 text-center">
          เปิดช่องเพื่อค่อย ๆ เผยภาพ — ต้องเปิดอย่างน้อย 1 ช่องก่อนตอบ · เปิด 1 = 25 คะแนน, แต่ละช่องต่อไปลด 5
        </div>

        {/* Jigsaw 5x5 */}
        <div
          className="relative mx-auto w-full max-w-xl panel p-3"
          style={{ aspectRatio: `${aspect}` }}
        >
          <div className="relative w-full h-full">
            {/* Image as background */}
            {set.mode3_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={set.mode3_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover rounded-md"
              />
            )}
            {/* Tile overlay grid (hidden on result to reveal full image) */}
            {phase !== "result" && (
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
                {Array.from({ length: 25 }).map((_, i) => {
                  const isOpen = opened.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => openTile(i)}
                      disabled={isOpen || phase !== "playing" || busy}
                      className={`jigsaw-tile ${isOpen ? "opened" : ""}`}
                    >
                      {!isOpen && <span>{i + 1}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Answer input */}
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
              <div>เปิดแล้ว {opened.length}/25 ช่อง · ตอบถูกได้ <span className="font-bold text-white">{previewScore}</span> คะแนน</div>
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
            <button onClick={() => pendingProgress && onProgress(pendingProgress)} className="btn-primary mt-2">
              ▶ ไปโหมด 4
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
