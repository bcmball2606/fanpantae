import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/leaderboard?setId=...
// or /api/leaderboard?pin=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const setId = url.searchParams.get("setId");
  const pin = url.searchParams.get("pin");
  const sb = supabaseAdmin();

  let resolvedSetId = setId;
  if (!resolvedSetId && pin) {
    const { data } = await sb
      .from("question_sets")
      .select("id")
      .eq("pin", pin.trim())
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "ไม่พบชุด" }, { status: 404 });
    resolvedSetId = data.id;
  }
  if (!resolvedSetId) {
    return NextResponse.json({ error: "missing setId or pin" }, { status: 400 });
  }

  const { data: setRow } = await sb
    .from("question_sets")
    .select("id, name")
    .eq("id", resolvedSetId)
    .single();
  if (!setRow) return NextResponse.json({ error: "ไม่พบชุด" }, { status: 404 });

  const { data: rows } = await sb
    .from("attempts")
    .select(
      "id, player_name, mode1_score, mode2_score, mode3_score, mode4_score, total_score, finished, finished_at"
    )
    .eq("set_id", resolvedSetId)
    .eq("finished", true)
    .order("total_score", { ascending: false })
    .order("finished_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ set: setRow, leaderboard: rows || [] });
}
