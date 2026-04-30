"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeForm() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !pin.trim()) {
      setError("กรุณากรอกชื่อและ PIN");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/play/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เริ่มเกมไม่สำเร็จ");
        setLoading(false);
        return;
      }
      router.push(`/play/${data.attemptId}`);
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel p-6 md:p-8 w-full max-w-md flex flex-col gap-4">
      <div>
        <label className="block text-sm font-bold mb-1.5 text-white/80">ชื่อผู้เล่น</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น คุณคึกฤทธิ์"
          maxLength={40}
          className="w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-1.5 text-white/80">PIN ของชุดคำถาม</label>
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="ที่ admin แจ้งให้ทราบ"
          maxLength={20}
          className="w-full font-mono tracking-widest"
          required
        />
      </div>
      {error && (
        <div className="text-red-300 text-sm bg-red-900/30 border border-red-500/40 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      <button type="submit" className="btn-primary mt-2" disabled={loading}>
        {loading ? "กำลังเริ่ม..." : "▶ เริ่มเล่น"}
      </button>
    </form>
  );
}
