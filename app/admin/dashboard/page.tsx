import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthed, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  const c = await cookies();
  if (!isAdminAuthed(c.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-black">📚 ชุดคำถามทั้งหมด</h1>
        <Link href="/" className="btn-ghost">หน้าหลัก</Link>
      </div>
      <DashboardClient />
    </div>
  );
}
