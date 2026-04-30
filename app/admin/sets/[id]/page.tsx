import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthed, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import SetEditor from "./SetEditor";

export default async function AdminSetEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const c = await cookies();
  if (!isAdminAuthed(c.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }
  const { id } = await params;
  return <SetEditor setId={id} />;
}
