"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setBusy(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="รหัสผ่าน"
        autoFocus
        className="w-full"
      />
      {error && (
        <div className="text-red-300 text-sm bg-red-900/30 border border-red-500/40 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "กำลังเข้า..." : "เข้าระบบ"}
      </button>
      <a href="/" className="text-white/50 text-xs text-center underline">← หน้าหลัก</a>
    </form>
  );
}
