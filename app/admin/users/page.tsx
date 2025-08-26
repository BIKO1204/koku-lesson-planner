export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

function fmtJST(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function AdminUsersPage() {
  // 1) 認証（未ログイン→サインインへ）
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin?callbackUrl=/admin/users");

  // 2) 管理者チェック（Firebaseのcustom claimsを見る）
  const email = session.user?.email;
  if (!email) redirect("/");
  const auth = getAdminAuth();
  const rec = await auth.getUserByEmail(email);
  const isAdmin =
    rec.customClaims?.admin === true || rec.customClaims?.role === "admin";
  if (!isAdmin) redirect("/");

  // 3) Firestoreからusers一覧
  const db = getAdminDb();
  const snap = await db
    .collection("users")
    .orderBy("lastLogin", "desc")
    .limit(200)
    .get();

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
