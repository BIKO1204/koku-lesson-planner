// app/admin/layout.tsx (Server Component)
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // 未ログイン → サインインへ（戻り先は /admin）
  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent("/admin")}`);
  }

  // 管理者でなければトップへ
  const u: any = session.user;
  const isAdmin = u?.admin === true || u?.role === "admin";
  if (!isAdmin) redirect("/");

  return (
    <div style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/admin/users" style={{ marginRight: 20, textDecoration: "underline" }}>
          ユーザー管理
        </Link>

        {/* ★追加 */}
        <Link href="/admin/fine-tune" style={{ marginRight: 20, textDecoration: "underline" }}>
          ファインチューニング
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
