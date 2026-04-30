import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthed, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import AdminLoginForm from "./LoginForm";

export default async function AdminIndex() {
  const c = await cookies();
  if (isAdminAuthed(c.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin/dashboard");
  }
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="panel p-6 md:p-8 w-full max-w-sm">
        <h1 className="text-xl font-black mb-1">เข้าระบบผู้ดูแล</h1>
        <p className="text-white/60 text-sm mb-4">
          ใส่รหัสผ่าน admin ที่ตั้งไว้ใน <code>ADMIN_PASSWORD</code>
        </p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
