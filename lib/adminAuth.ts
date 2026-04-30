import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "fp_admin";

export function isAdminAuthed(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && cookieValue === expected;
}

export async function requireAdmin(): Promise<true | NextResponse> {
  const c = await cookies();
  if (!isAdminAuthed(c.get(COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return true;
}

export const ADMIN_COOKIE_NAME = COOKIE;
