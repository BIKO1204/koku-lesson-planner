// app/admin/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminDb } from "@/lib/firebaseAdmin";
import Link from "next/link";

// 環境変数（カンマ区切りメール）または Firestore の roles コレクションで判定
async function isAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false;

  // ① 環境変数で判定（例: ADMIN_EMAILS="taro@example.com,hanako@example.jp"）
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.includes(email.toLowerCase())) return true;

  // ② Firestore で判定（roles/{email}.role === "admin"）
  try {
    const db = getAdminDb();
    const snap = await db.collection("roles").doc(email).get();
    const role = (snap.exists && (snap.data() as any)?.role) || "";
    if (role === "admin") return true;
  } catch {
    // 読み取り失敗時は admin 扱いしない
  }

  return false;
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    // 未ログインはウェルカムへ
    redirect("/welcome?error=signin_required");
  }

  const ok = await isAdmin(email);
  if (!ok) {
    // 非管理者はトップへ
    redirect("/?error=forbidden");
  }

  // --- ここから下は管理者のみ表示 ---
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
