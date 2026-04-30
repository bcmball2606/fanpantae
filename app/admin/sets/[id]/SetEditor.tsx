"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mode1SubQuestion, QuestionSet } from "@/lib/types";
import { parseCSV, buildCSV } from "@/lib/csv";

type Props = { setId: string };

export default function SetEditor({ setId }: Props) {
  const [data, setData] = useState<QuestionSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/sets/${setId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d.set);
      });
  }, [setId]);

  function update<K extends keyof QuestionSet>(k: K, v: QuestionSet[K]) {
    setData((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sets/${setId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setData(d.set);
      setSavedAt(new Date().toLocaleTimeString("th-TH"));
    } finally {
      setSaving(false);
    }
  }

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name || "set"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <div className="p-6 text-red-300">{error}</div>;
  if (!data) return <div className="p-6 text-white/60">กำลังโหลด...</div>;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex justify-between flex-wrap gap-2 items-center">
        <h1 className="text-2xl font-black">✏ แก้ไขชุดคำถาม</h1>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/dashboard" className="btn-ghost">← กลับ</Link>
          <button onClick={exportJson} className="btn-ghost">⬇ Export JSON</button>
          <button onClick={save} className="btn-primary" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
          </button>
        </div>
      </div>
      {savedAt && <div className="text-green-300 text-sm">บันทึกแล้ว {savedAt}</div>}

      {/* Basic info */}
      <section className="panel p-4 flex flex-col gap-3">
        <h2 className="font-bold">ข้อมูลทั่วไป</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="ชื่อชุด">
            <input value={data.name} onChange={(e) => update("name", e.target.value)} className="w-full" />
          </Field>
          <Field label="PIN">
            <input value={data.pin} onChange={(e) => update("pin", e.target.value)} className="w-full font-mono" />
          </Field>
          <Field label="สถานะ">
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={data.is_open} onChange={(e) => update("is_open", e.target.checked)} />
              <span>{data.is_open ? "🟢 เปิดรับผู้เล่น" : "⚪ ปิดอยู่"}</span>
            </label>
          </Field>
        </div>
        <div className="flex gap-2 text-sm flex-wrap">
          <Link href={`/leaderboard/${data.id}`} className="btn-ghost">🏆 ดูอันดับ</Link>
          <a
            href={`/?pin=${encodeURIComponent(data.pin)}`}
            className="text-white/60 underline"
          >
            ลิงก์เข้าเล่น (ใช้ PIN)
          </a>
        </div>
      </section>

      {/* Mode 1 */}
      <Mode1Editor data={data} update={update} />

      {/* Mode 2 */}
      <section className="panel p-4 flex flex-col gap-3">
        <h2 className="font-bold">โหมด 2 · คำถาม-คำตอบ</h2>
        <Field label="คำถาม">
          <textarea value={data.mode2_question} onChange={(e) => update("mode2_question", e.target.value)} className="w-full" rows={2} />
        </Field>
        <ImageField
          label="รูปประกอบ (ถ้ามี)"
          value={data.mode2_image_url ?? ""}
          onChange={(url) => update("mode2_image_url", url || null)}
        />
        <Field label="คำตอบที่ถูก (พิมพ์เป๊ะ — case-insensitive)">
          <input value={data.mode2_answer} onChange={(e) => update("mode2_answer", e.target.value)} className="w-full" />
        </Field>
        <ChoicesEditor
          label="ช่อยส์ 5 ข้อ (ถ้าผู้เล่นเปิดดู) — หนึ่งในนี้ต้องตรงกับคำตอบ"
          choices={data.mode2_choices}
          count={5}
          onChange={(arr) => update("mode2_choices", arr)}
        />
      </section>

      {/* Mode 3 */}
      <section className="panel p-4 flex flex-col gap-3">
        <h2 className="font-bold">โหมด 3 · จิ๊กซอว์ 5x5</h2>
        <Field label="คำถาม">
          <textarea value={data.mode3_question} onChange={(e) => update("mode3_question", e.target.value)} className="w-full" rows={2} />
        </Field>
        <ImageField
          label="ภาพจิ๊กซอว์ (จะถูกแบ่ง 5x5)"
          value={data.mode3_image_url ?? ""}
          onChange={(url) => update("mode3_image_url", url || null)}
        />
        <Field label="คำตอบ">
          <input value={data.mode3_answer} onChange={(e) => update("mode3_answer", e.target.value)} className="w-full" />
        </Field>
      </section>

      {/* Mode 4 */}
      <section className="panel p-4 flex flex-col gap-3">
        <h2 className="font-bold">โหมด 4 · คุณสมบัติ 5 ข้อ</h2>
        <Field label="คำถาม">
          <textarea value={data.mode4_question} onChange={(e) => update("mode4_question", e.target.value)} className="w-full" rows={2} />
        </Field>
        <Field label="คำตอบ">
          <input value={data.mode4_answer} onChange={(e) => update("mode4_answer", e.target.value)} className="w-full" />
        </Field>
        <ChoicesEditor
          label="คุณสมบัติ 5 ข้อ (เรียงจากเดายากที่สุด → ง่ายที่สุด)"
          choices={data.mode4_properties}
          count={5}
          onChange={(arr) => update("mode4_properties", arr)}
        />
      </section>

      <div className="flex justify-end gap-2 sticky bottom-2">
        <button onClick={save} className="btn-primary" disabled={saving}>
          {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
        </button>
      </div>
    </div>
  );
}

// ---------- Mode 1 sub-questions editor ----------
function Mode1Editor({
  data,
  update,
}: {
  data: QuestionSet;
  update: <K extends keyof QuestionSet>(k: K, v: QuestionSet[K]) => void;
}) {
  function setSubs(subs: Mode1SubQuestion[]) {
    update("mode1_questions", subs);
  }
  function addOne() {
    const id = Math.random().toString(36).slice(2, 10);
    setSubs([
      ...(data.mode1_questions || []),
      {
        id,
        prompt_text: "",
        prompt_image_url: null,
        choices: ["", "", "", "", "", ""],
        correct_index: 0,
      },
    ]);
  }
  function add25() {
    const newOnes: Mode1SubQuestion[] = [];
    for (let i = 0; i < 25; i++) {
      newOnes.push({
        id: Math.random().toString(36).slice(2, 10),
        prompt_text: "",
        prompt_image_url: null,
        choices: ["", "", "", "", "", ""],
        correct_index: 0,
      });
    }
    setSubs(newOnes);
  }
  function remove(i: number) {
    setSubs(data.mode1_questions.filter((_, idx) => idx !== i));
  }
  function updateSub(i: number, patch: Partial<Mode1SubQuestion>) {
    setSubs(
      data.mode1_questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q))
    );
  }
  function move(i: number, dir: -1 | 1) {
    const arr = [...data.mode1_questions];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSubs(arr);
  }

  function downloadTemplate() {
    const header = [
      "prompt_text",
      "prompt_image_url",
      "choice1",
      "choice2",
      "choice3",
      "choice4",
      "choice5",
      "choice6",
      "correct(1-6)",
    ];
    const example = [
      [
        "ภาพนี้คือประเทศอะไร",
        "https://example.com/image.jpg",
        "ไทย", "ลาว", "เวียดนาม", "กัมพูชา", "พม่า", "มาเลเซีย",
        "1",
      ],
      [
        "เมืองนี้อยู่ทวีปอะไร",
        "",
        "เอเชีย", "ยุโรป", "แอฟริกา", "อเมริกาเหนือ", "อเมริกาใต้", "ออสเตรเลีย",
        "2",
      ],
    ];
    const rows = [header, ...example];
    // Add 23 empty rows to fill up to 25
    for (let i = 0; i < 23; i++) {
      rows.push(["", "", "", "", "", "", "", "", ""]);
    }
    const csv = buildCSV(rows);
    // Prepend BOM so Excel auto-detects UTF-8 (Thai will display correctly)
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mode1_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV(replace: boolean) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const text = await f.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        alert("CSV ว่างหรืออ่านไม่ได้");
        return;
      }
      // Detect header: if first row starts with "prompt_text", treat as header
      const first = rows[0].map((c) => c.trim().toLowerCase());
      const hasHeader = first[0] === "prompt_text" || first[0].startsWith("prompt");
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const errors: string[] = [];
      const subs: Mode1SubQuestion[] = [];
      dataRows.forEach((r, idx) => {
        // Skip fully empty rows
        if (r.every((c) => !c.trim())) return;
        const cols = [...r];
        while (cols.length < 9) cols.push("");
        const [prompt, image, c1, c2, c3, c4, c5, c6, correctRaw] = cols;
        const choices = [c1, c2, c3, c4, c5, c6].map((c) => c.trim());
        const correct = parseInt(correctRaw, 10);
        if (!prompt.trim() && !image.trim()) {
          errors.push(`แถวที่ ${idx + (hasHeader ? 2 : 1)}: ไม่มี prompt_text หรือ prompt_image_url`);
          return;
        }
        if (choices.filter((c) => c).length < 2) {
          errors.push(`แถวที่ ${idx + (hasHeader ? 2 : 1)}: ต้องมีช่อยส์อย่างน้อย 2 ข้อ`);
          return;
        }
        if (!Number.isInteger(correct) || correct < 1 || correct > 6) {
          errors.push(`แถวที่ ${idx + (hasHeader ? 2 : 1)}: คอลัมน์ correct ต้องเป็นเลข 1–6 (ได้ "${correctRaw}")`);
          return;
        }
        if (!choices[correct - 1]) {
          errors.push(`แถวที่ ${idx + (hasHeader ? 2 : 1)}: ช่อยส์ที่ ${correct} ว่าง — ตั้งเป็นคำตอบไม่ได้`);
          return;
        }
        subs.push({
          id: Math.random().toString(36).slice(2, 10),
          prompt_text: prompt.trim(),
          prompt_image_url: image.trim() || null,
          choices,
          correct_index: correct - 1,
        });
      });

      if (errors.length) {
        alert(`พบข้อผิดพลาด ${errors.length} ข้อ:\n\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? "\n..." : ""}`);
        return;
      }
      if (subs.length === 0) {
        alert("ไม่พบข้อที่ใช้ได้ใน CSV");
        return;
      }
      const next = replace ? subs : [...(data.mode1_questions || []), ...subs];
      setSubs(next);
      alert(`✓ Import สำเร็จ ${subs.length} ข้อ${replace ? " (แทนของเดิม)" : " (ต่อท้าย)"}`);
    };
    input.click();
  }

  return (
    <section className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-bold">โหมด 1 · 3 วินาที ({data.mode1_questions?.length || 0}/25 ข้อย่อย)</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="btn-ghost text-sm" type="button">
            ⬇ ดาวน์โหลด CSV template
          </button>
          <button onClick={() => importCSV(true)} className="btn-ghost text-sm" type="button">
            📥 Import CSV (แทน)
          </button>
          <button onClick={() => importCSV(false)} className="btn-ghost text-sm" type="button">
            📥 Import CSV (ต่อท้าย)
          </button>
          <button onClick={addOne} className="btn-ghost text-sm" type="button">+ เพิ่ม 1 ข้อ</button>
          {(!data.mode1_questions || data.mode1_questions.length === 0) && (
            <button onClick={add25} className="btn-ghost text-sm" type="button">+ สร้างเปล่า 25 ข้อ</button>
          )}
        </div>
      </div>
      <Field label="คำถามหลัก (โชว์ตลอดโหมด)">
        <input
          value={data.mode1_main_question}
          onChange={(e) => update("mode1_main_question", e.target.value)}
          className="w-full"
          placeholder="เช่น นี่คือเมืองหลวงของประเทศอะไร"
        />
      </Field>

      <div className="flex flex-col gap-3">
        {(data.mode1_questions || []).map((q, i) => (
          <div key={q.id} className="rounded-lg border border-white/10 p-3 bg-black/20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="font-bold text-accent-orange">ข้อ {i + 1}</div>
              <div className="flex gap-1">
                <button onClick={() => move(i, -1)} className="btn-ghost !px-2 !py-0.5 text-xs">↑</button>
                <button onClick={() => move(i, +1)} className="btn-ghost !px-2 !py-0.5 text-xs">↓</button>
                <button onClick={() => remove(i)} className="btn-ghost !px-2 !py-0.5 text-xs !text-red-300">✕</button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <Field label="ข้อความย่อย">
                <input
                  value={q.prompt_text}
                  onChange={(e) => updateSub(i, { prompt_text: e.target.value })}
                  className="w-full"
                />
              </Field>
              <ImageField
                label="รูปย่อย (ถ้ามี)"
                value={q.prompt_image_url ?? ""}
                onChange={(url) => updateSub(i, { prompt_image_url: url || null })}
              />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {q.choices.map((c, ci) => (
                <label key={ci} className={`flex items-center gap-2 rounded p-2 ${q.correct_index === ci ? "bg-green-900/30 border border-green-400/40" : "bg-black/20 border border-white/10"}`}>
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correct_index === ci}
                    onChange={() => updateSub(i, { correct_index: ci })}
                  />
                  <input
                    value={c}
                    onChange={(e) => {
                      const arr = [...q.choices];
                      arr[ci] = e.target.value;
                      updateSub(i, { choices: arr });
                    }}
                    placeholder={`ช่อยส์ ${ci + 1}`}
                    className="flex-1 !py-1"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Sub components ----------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-white/70 font-bold">{label}</span>
      {children}
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error);
        return;
      }
      onChange(d.url);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Field label={label}>
      <div className="flex gap-2 items-center">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL ของรูป หรืออัพโหลดด้านขวา →"
          className="flex-1"
        />
        <label className="btn-ghost text-xs cursor-pointer whitespace-nowrap">
          {busy ? "..." : "📤 อัพโหลด"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </label>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-12 h-12 object-cover rounded border border-white/20" />
        )}
      </div>
    </Field>
  );
}

function ChoicesEditor({
  label,
  choices,
  count,
  onChange,
}: {
  label: string;
  choices: string[];
  count: number;
  onChange: (arr: string[]) => void;
}) {
  const arr = Array.from({ length: count }, (_, i) => choices?.[i] ?? "");
  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        {arr.map((c, i) => (
          <input
            key={i}
            value={c}
            onChange={(e) => {
              const next = [...arr];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={`ข้อ ${i + 1}`}
            className="w-full"
          />
        ))}
      </div>
    </Field>
  );
}
