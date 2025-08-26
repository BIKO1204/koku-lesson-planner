export const runtime = "nodejs";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import NotificationAdmin from "./Client"; // ← クライアントUI（下の Client.tsx）

export default async function AdminNotificationsPage() {
  // 1) 未ログインならサインインへ
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin?callbackUrl=/admin/notifications");

  // 2) 管理者チェック（Firebase custom claims）
  const email = session.user?.email;
  if (!email) redirect("/");
  const rec = await getAdminAuth().getUserByEmail(email);
  const isAdmin =
    rec.customClaims?.admin === true || rec.customClaims?.role === "admin";
  if (!isAdmin) redirect("/");

  // 3) OKならクライアント側の管理UIを表示
  return <NotificationAdmin />;
}
