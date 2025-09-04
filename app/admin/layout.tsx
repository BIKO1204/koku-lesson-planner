// app/admin/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic"; // SSR

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  // 未ログインはサインインへ
  if (!email) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  // Firestore で roles/{email} をチェック
  const db = getAdminDb();
  const snap = await db.collection("roles").doc(email).get();
  const role = snap.exists ? (snap.data()?.role as string | undefined) : undefined;

  if (role !== "admin") {
    redirect("/forbidden");
  }

  // 認可OK
  return (
    <div style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <a href="/admin/users" style={{ marginRight: 20, textDecoration: "underline" }}>
          ユーザー管理
        </a>
        <a href="/admin/notifications" style={{ textDecoration: "underline" }}>
          通知管理
        </a>
      </nav>
      <hr />
      <main style={{ marginTop: 20 }}>{children}</main>
    </div>
  );
}
