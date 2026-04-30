"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Attempt, PublicQuestionSet } from "@/lib/types";

type LBRow = {
  id: string;
  player_name: string;
  mode1_score: number;
  mode2_score: number;
  mode3_score: number;
  mode4_score: number;
  total_score: number;
};

export default function SummaryPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [set, setSet] = useState<PublicQuestionSet | null>(null);
  const [leaderboard, setLeaderboard] = useState<LBRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/play/state?attemptId=${attemptId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setAttempt(d.attempt);
          setSet(d.set);
          fetch(`/api/leaderboard?setId=${d.attempt.set_id}`)
            .then((r) => r.json())
            .then((lb) => setLeaderboard(lb.leaderboard || []));
        }
      });
  }, [attemptId]);

  if (error) return <div className="p-6 text-red-300">{error}</div>;
  if (!attempt || !set) return <div className="p-6 text-white/60">กำลังโหลด...</div>;

  const myRank =
    leaderboard.findIndex((r) => r.id === attempt.id) >= 0
      ? leaderboard.findIndex((r) => r.id === attempt.id) + 1
      : null;

  const scores = [
    { label: "โหมด 1 · 3 วินาที", value: attempt.mode1_score, max: 25 },
    { label: "โหมด 2 · คำถาม-คำตอบ", value: attempt.mode2_score, max: 25 },
    { label: "โหมด 3 · จิ๊กซอว์", value: attempt.mode3_score, max: 25 },
    { label: "โหมด 4 · คุณสมบัติ", value: attempt.mode4_score, max: 25 },
  ];

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="logo-blob w-10 h-10" />
          <h1 className="text-2xl md:text-3xl font-black">สรุปผล</h1>
        </div>
        <div className="text-white/70 text-sm">
          ชุด: <span className="text-white font-bold">{set.name}</span>
        </div>
      </div>

      <div className="panel p-6 flex flex-col items-center gap-3">
        <div className="text-white/70 text-sm">ผู้เล่น</div>
        <div className="text-2xl font-bold">{attempt.player_name}</div>
        <div className="points-badge px-6 py-2 mt-2">
          <span className="points-digit text-5xl">{attempt.total_score}</span>
          <span className="text-white/80 ml-2 font-bold">/ 100 คะแนน</span>
        </div>
        {myRank && (
          <div className="text-accent-orange font-bold mt-1">
            อันดับที่ {myRank} จาก {leaderboard.length}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {scores.map((s) => (
          <div key={s.label} className="panel p-4">
            <div className="text-xs text-white/60">{s.label}</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="points-digit text-3xl">{s.value}</span>
              <span className="text-white/50">/ {s.max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="panel p-4">
        <div className="text-lg font-bold mb-3 flex items-center gap-2">
          🏆 อันดับ — Top {leaderboard.length}
        </div>
        <div className="flex flex-col gap-1">
          {leaderboard.length === 0 && (
            <div className="text-white/50 text-sm">— ยังไม่มีผู้เล่นจบเกม —</div>
          )}
          {leaderboard.map((row, i) => {
            const isMe = row.id === attempt.id;
            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 px-3 py-2 rounded ${isMe ? "bg-accent-orange/20 border border-accent-orange/50" : "bg-black/20"}`}
              >
                <div className="w-8 text-center font-black">{i + 1}</div>
                <div className="flex-1 truncate font-bold">{row.player_name} {isMe && <span className="text-accent-orange text-xs">(คุณ)</span>}</div>
                <div className="hidden md:flex gap-2 text-xs text-white/60">
                  <span>{row.mode1_score}</span>·
                  <span>{row.mode2_score}</span>·
                  <span>{row.mode3_score}</span>·
                  <span>{row.mode4_score}</span>
                </div>
                <div className="points-digit text-xl w-12 text-right">{row.total_score}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="btn-ghost">← กลับหน้าหลัก</Link>
      </div>
    </div>
  );
}
