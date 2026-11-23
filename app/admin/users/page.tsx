export const runtime = "nodejs";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

function fmtJST(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function AdminNotice({ message, retry = false }: { message: string; retry?: boolean }) {
  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1>ユーザー一覧（管理者）</h1>
      <p role="alert">{message}</p>
      <nav aria-label="管理者ページの案内" style={{ display: "flex", gap: 16 }}>
        {retry && <a href="/admin/users">再読み込み</a>}
        <Link href="/">ホームへ戻る</Link>
      </nav>
    </main>
  );
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
        <h1>ユーザー一覧（管理者）</h1>
        <p>ユーザー一覧を見るにはログインしてください。</p>
        <a href="/api/auth/signin?callbackUrl=%2Fadmin%2Fusers">ログインする</a>
      </main>
    );
  }

  const email = session.user?.email;
  if (!email) {
    return <AdminNotice message="ログイン中のアカウントのメールアドレスを確認できませんでした。" />;
  }

  try {
    const account = await getAdminAuth().getUserByEmail(email);
    const isAdmin =
      account.customClaims?.admin === true || account.customClaims?.role === "admin";
    if (account.disabled || !isAdmin) {
      return <AdminNotice message="このアカウントには管理者ページを表示する権限がありません。" />;
    }
  } catch (error) {
    if (typeof error === "object" && error !== null &&
        "code" in error && error.code === "auth/user-not-found") {
      return <AdminNotice message="ログイン中のアカウントを確認できませんでした。管理者用のアカウントでログインしているか確認してください。" />;
    }
    console.error("管理者権限の確認に失敗しました");
    return <AdminNotice message="管理者権限を確認できませんでした。" retry />;
  }

  const snap = await (async () => {
    try {
      return await getAdminDb().collection("users").orderBy("lastLogin", "desc").limit(200).get();
    } catch {
      return null;
    }
  })();
  if (!snap) {
    console.error("管理者ユーザー一覧の取得に失敗しました");
    return <AdminNotice message="ユーザー一覧を取得できませんでした。" retry />;
  }

  const rows = snap.docs.map((d) => {
    const v = d.data() as any;
    const last =
      v.lastLogin?.toDate?.() instanceof Date ? v.lastLogin.toDate() : null;
    return {
      id: d.id,
      name: v.name ?? "",
      email: v.email ?? "",
      lastLogin: last,
    };
  });

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 16 }}>ユーザー一覧（管理者）</h1>
      <p>最終ログインが新しい順に最大200件を表示します。</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>名前</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>メール</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>最終ログイン（JST）</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 12, color: "#666" }}>
                  ユーザーがまだいません。
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {r.name || "（未設定）"}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {r.email}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {fmtJST(r.lastLogin)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
