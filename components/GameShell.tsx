"use client";

import { ReactNode } from "react";

/**
 * GameShell — common layout wrapper for play screens.
 * Renders the cumulative score box (top-left), 3 status lights (top-right),
 * optional points-for-question badge, and the question bar with main question.
 */
export function GameShell({
  totalScore,
  pointsAvailable,
  modeIndex,
  mainQuestion,
  hideMainQuestion,
  children,
}: {
  totalScore: number;
  pointsAvailable?: number | null;
  modeIndex: 1 | 2 | 3 | 4;
  mainQuestion: string;
  hideMainQuestion?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-5xl mx-auto px-3 py-4 md:py-6 flex-1 flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <ScoreBox total={totalScore} />
        <ModeIndicator current={modeIndex} />
        <Lights modeIndex={modeIndex} />
      </header>

      {(pointsAvailable ?? null) !== null && (
        <div className="flex justify-end">
          <PointsBadge value={pointsAvailable!} />
        </div>
      )}

      <QuestionBar text={hideMainQuestion ? "" : mainQuestion} hidden={hideMainQuestion} />

      <main className="flex-1">{children}</main>
    </div>
  );
}

export function ScoreBox({ total }: { total: number }) {
  return (
    <div className="score-box rounded-md overflow-hidden inline-flex flex-col w-[110px]">
      <div className="score-box-header text-xs text-center py-0.5 px-2">
        คะแนนสะสม
      </div>
      <div className="text-center text-3xl font-black py-1 leading-none">
        {total}
      </div>
    </div>
  );
}

export function PointsBadge({ value }: { value: number }) {
  return (
    <div className="points-badge px-4 py-1.5 inline-flex items-center gap-2">
      <span className="points-digit text-3xl leading-none">{value}</span>
      <span className="text-white text-sm font-bold tracking-wider">คะแนน</span>
    </div>
  );
}

export function Lights({ modeIndex }: { modeIndex: 1 | 2 | 3 | 4 }) {
  // 4 mode steps; rendered as 4 lights, lit ones are completed/current
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 border border-white/10">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`light-dot ${i > modeIndex ? "off" : ""}`}
          title={`โหมด ${i}`}
        />
      ))}
    </div>
  );
}

export function ModeIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  const names = {
    1: "โหมด 1 · 3 วินาที",
    2: "โหมด 2 · คำถาม-คำตอบ",
    3: "โหมด 3 · จิ๊กซอว์",
    4: "โหมด 4 · คุณสมบัติ",
  } as const;
  return (
    <div className="px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-sm md:text-base font-bold">
      {names[current]}
    </div>
  );
}

export function QuestionBar({ text, hidden }: { text: string; hidden?: boolean }) {
  return (
    <div className="question-bar flex items-center gap-3 pl-3 pr-5 py-3">
      <div className="logo-blob shrink-0 w-10 h-10 md:w-12 md:h-12" />
      <div className="text-white text-base md:text-2xl font-bold leading-tight">
        {hidden ? (
          <span className="opacity-40">— กดเริ่มเพื่อแสดงคำถาม —</span>
        ) : (
          text || <span className="opacity-50">— ไม่มีคำถามหลัก —</span>
        )}
      </div>
    </div>
  );
}
