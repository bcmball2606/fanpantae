import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  AttemptProgress,
  initialProgress,
  QuestionSet,
} from "@/lib/types";

export async function POST(req: Request) {
  const { name, pin } = await req.json();
  if (typeof name !== "string" || typeof pin !== "string") {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const cleanName = name.trim();
  const cleanPin = pin.trim();
  if (!cleanName || !cleanPin) {
    return NextResponse.json({ error: "กรุณากรอกชื่อและ PIN" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: setRow, error: setErr } = await sb
    .from("question_sets")
    .select("*")
    .eq("pin", cleanPin)
    .maybeSingle();
  if (setErr) {
    return NextResponse.json({ error: setErr.message }, { status: 500 });
  }
  if (!setRow) {
    return NextResponse.json({ error: "ไม่พบชุดคำถามที่ตรงกับ PIN นี้" }, { status: 404 });
  }
  const set = setRow as QuestionSet;
  if (!set.is_open) {
    return NextResponse.json({ error: "ชุดคำถามนี้ยังไม่เปิดให้เล่น" }, { status: 403 });
  }

  // Check if this name has already played this set (1 attempt per name)
  const { data: existing } = await sb
    .from("attempts")
    .select("id, finished")
    .eq("set_id", set.id)
    .eq("player_name", cleanName)
    .maybeSingle();

  if (existing) {
    if (existing.finished) {
      return NextResponse.json(
        { error: "ชื่อนี้เล่นชุดนี้ไปแล้ว — ใช้ชื่ออื่น" },
        { status: 409 }
      );
    }
    // Resume unfinished attempt
    return NextResponse.json({ attemptId: existing.id, resumed: true });
  }

  const progress: AttemptProgress = initialProgress();
  const { data: ins, error: insErr } = await sb
    .from("attempts")
    .insert({
      set_id: set.id,
      player_name: cleanName,
      progress,
    })
    .select("id")
    .single();
  if (insErr || !ins) {
    return NextResponse.json({ error: insErr?.message || "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
  return NextResponse.json({ attemptId: ins.id, resumed: false });
}
