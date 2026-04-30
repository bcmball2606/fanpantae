"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";

type Row = {
  id: string;
  player_name: string;
  mode1_score: number;
  mode2_score: number;
  mode3_score: number;
  mode4_score: number;
  total_score: number;
};

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = use(params);
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leaderboard?setId=${setId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setName(d.set?.name || "");
          setRows(d.leaderboard || []);
        }
      });
  }, [setId]);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-black">🏆 อันดับ — {name}</h1>
        <Link href="/" className="btn-ghost">หน้าหลัก</Link>
      </div>
      {error && <div className="text-red-300">{error}</div>}
      <div className="panel p-4">
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-[36px_1fr_auto_auto] gap-3 px-2 text-xs text-white/50 uppercase tracking-wider">
            <div>#</div>
            <div>ชื่อ</div>
            <div className="hidden md:block">โหมด 1·2·3·4</div>
            <div>รวม</div>
          </div>
          {rows.length === 0 && <div className="text-white/50 text-center p-6">— ยังไม่มีผู้เล่นจบเกม —</div>}
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="grid grid-cols-[36px_1fr_auto_auto] gap-3 items-center px-2 py-2 rounded bg-black/20"
            >
              <div className="font-black">{i + 1}</div>
              <div className="font-bold truncate">{row.player_name}</div>
              <div className="hidden md:flex gap-2 text-xs text-white/60">
                <span>{row.mode1_score}</span>·
                <span>{row.mode2_score}</span>·
                <span>{row.mode3_score}</span>·
                <span>{row.mode4_score}</span>
              </div>
              <div className="points-digit text-xl w-12 text-right">{row.total_score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
