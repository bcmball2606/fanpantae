import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้ง ADMIN_PASSWORD" }, { status: 500 });
  }
  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  const c = await cookies();
  c.set(ADMIN_COOKIE_NAME, password, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8h
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
