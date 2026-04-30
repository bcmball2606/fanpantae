"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SetSummary = {
  id: string;
  name: string;
  pin: string;
  is_open: boolean;
  created_at: string;
};

export default function DashboardClient() {
  const [sets, setSets] = useState<SetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/sets");
    const data = await res.json();
    if (!res.ok) setError(data.error || "โหลดไม่สำเร็จ");
    else setSets(data.sets || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createNew() {
    const res = await fetch("/api/admin/sets", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    location.href = `/admin/sets/${data.set.id}`;
  }

  async function importJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const txt = await f.text();
      let body;
      try {
        body = JSON.parse(txt);
      } catch {
        alert("JSON ไม่ถูกต้อง");
        return;
      }
      const res = await fetch("/api/admin/sets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      location.href = `/admin/sets/${data.set.id}`;
    };
    input.click();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    location.href = "/admin";
  }

  async function clearAttempts(id: string, name: string) {
    if (!confirm(`ลบคะแนนทั้งหมดของ "${name}" ?`)) return;
    const res = await fetch(`/api/admin/sets/${id}/attempts`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    alert("ลบคะแนนทั้งหมดเรียบร้อย");
  }

  async function remove(id: string, name: string) {
    if (!confirm(`ลบชุด "${name}" ?`)) return;
    const res = await fetch(`/api/admin/sets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    setSets((s) => s.filter((x) => x.id !== id));
  }

  async function toggleOpen(s: SetSummary) {
    const res = await fetch(`/api/admin/sets/${s.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_open: !s.is_open }),
    });
    if (res.ok) {
      setSets((cur) => cur.map((x) => (x.id === s.id ? { ...x, is_open: !s.is_open } : x)));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={createNew} className="btn-primary">+ สร้างชุดใหม่</button>
        <button onClick={importJson} className="btn-ghost">⬆ Import JSON</button>
        <div className="flex-1" />
        <button onClick={logout} className="btn-ghost">ออกจากระบบ</button>
      </div>

      {error && <div className="text-red-300">{error}</div>}
      {loading && <div className="text-white/60">กำลังโหลด...</div>}

      <div className="flex flex-col gap-2">
        {sets.length === 0 && !loading && (
          <div className="text-white/50 text-center p-8">— ยังไม่มีชุดคำถาม —</div>
        )}
        {sets.map((s) => (
          <div key={s.id} className="panel p-4 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="font-bold">{s.name}</div>
              <div className="text-xs text-white/60">
                PIN: <span className="font-mono text-accent-orange">{s.pin}</span> ·{" "}
                {new Date(s.created_at).toLocaleString("th-TH")}
              </div>
            </div>
            <button
              onClick={() => toggleOpen(s)}
              className={`btn-ghost text-xs ${s.is_open ? "!border-green-400 !text-green-300" : "!border-white/20"}`}
            >
              {s.is_open ? "🟢 เปิดรับ" : "⚪ ปิดอยู่"}
            </button>
            <Link href={`/admin/sets/${s.id}`} className="btn-ghost">แก้ไข</Link>
            <Link href={`/leaderboard/${s.id}`} className="btn-ghost">🏆 อันดับ</Link>
            <button onClick={() => clearAttempts(s.id, s.name)} className="btn-ghost !text-yellow-300 !border-yellow-500/40">ล้างคะแนน</button>
            <button onClick={() => remove(s.id, s.name)} className="btn-ghost !text-red-300 !border-red-500/40">ลบ</button>
          </div>
        ))}
      </div>
    </div>
  );
}
