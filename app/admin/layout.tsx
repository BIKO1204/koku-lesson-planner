// app/admin/layout.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminDb } from "@/lib/firebaseAdmin";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // ← ここで emailLower を“必ず”定義する
  const session = await getServerSession(authOptions);
  const email = session?.user?.email || null;
  const emailLower = email ? email.toLowerCase() : null;

  // 未ログインならサインインへ
  if (!emailLower) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  // Firestore の roles/{emailLower} を確認
  const db = getAdminDb();
  const snap = await db.collection("roles").doc(emailLower!).get();
  const roleDoc = snap.exists ? (snap.data() as any) : undefined;
  const isAdmin = !!roleDoc && (roleDoc.role === "admin" || roleDoc.isAdmin === true);

  if (!isAdmin) {
    redirect("/forbidden");
  }

  // 管理者OK
  return (
    <div style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/admin/users" style={{ marginRight: 20, textDecoration: "underline" }}>
          ユーザー管理
        </Link>
        <Link href="/admin/notifications" style={{ textDecoration: "underline" }}>
          通知管理
        </Link>
      </nav>
      <hr />
      <main style={{ marginTop: 20 }}>{children}</main>
    </div>
  );
}
