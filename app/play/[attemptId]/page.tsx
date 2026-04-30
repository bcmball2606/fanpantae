"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Attempt, AttemptProgress, PublicQuestionSet } from "@/lib/types";
import Mode1 from "@/components/Mode1";
import Mode2 from "@/components/Mode2";
import Mode3 from "@/components/Mode3";
import Mode4 from "@/components/Mode4";

export default function PlayPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [set, setSet] = useState<PublicQuestionSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/play/state?attemptId=${attemptId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setAttempt(d.attempt);
          setSet(d.set);
        }
      })
      .catch(() => setError("โหลดเกมไม่สำเร็จ"));
  }, [attemptId]);

  // When attempt finished, redirect to summary
  useEffect(() => {
    if (attempt?.finished) {
      router.replace(`/summary/${attemptId}`);
    }
  }, [attempt?.finished, attemptId, router]);

  function updateProgress(p: AttemptProgress) {
    setAttempt((prev) => (prev ? { ...prev, progress: p } : prev));
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="panel p-6 max-w-md text-center">
          <p className="text-red-300 mb-3">{error}</p>
          <a className="btn-primary" href="/">กลับหน้าหลัก</a>
        </div>
      </div>
    );
  }
  if (!attempt || !set) {
    return <div className="flex-1 flex items-center justify-center text-white/60">กำลังโหลด...</div>;
  }

  const totalScore =
    (attempt.progress.m1_score || 0) +
    (attempt.progress.m2_score || 0) +
    (attempt.progress.m3_score || 0) +
    (attempt.progress.m4_score || 0);

  const cur = attempt.progress.current_mode;

  return (
    <>
      {cur === 1 && (
        <Mode1
          attemptId={attemptId}
          set={set}
          progress={attempt.progress}
          totalScore={totalScore}
          onProgress={updateProgress}
        />
      )}
      {cur === 2 && (
        <Mode2
          attemptId={attemptId}
          set={set}
          progress={attempt.progress}
          totalScore={totalScore}
          onProgress={updateProgress}
        />
      )}
      {cur === 3 && (
        <Mode3
          attemptId={attemptId}
          set={set}
          progress={attempt.progress}
          totalScore={totalScore}
          onProgress={updateProgress}
        />
      )}
      {cur === 4 && (
        <Mode4
          attemptId={attemptId}
          set={set}
          progress={attempt.progress}
          totalScore={totalScore}
          onProgress={updateProgress}
          onFinish={() => router.replace(`/summary/${attemptId}`)}
        />
      )}
      {cur >= 5 && (
        <div className="flex-1 flex items-center justify-center text-white/60">
          กำลังพาไปหน้าสรุป...
        </div>
      )}
    </>
  );
}
