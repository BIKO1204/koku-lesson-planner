// app/welcome/page.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.admin === true;
  const role = (session?.user as any)?.role ?? "unknown";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif" }}>
      <div style={{ width: "min(720px, 95vw)", border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>ようこそ</h1>

        <div style={{ lineHeight: 1.7, fontSize: 14, background: "#fafafa", padding: 12, borderRadius: 10 }}>
          <div><b>status</b>: {status}</div>
          <div><b>email</b>: {session?.user?.email ?? "(none)"}</div>
          <div><b>admin</b>: {String(isAdmin)}</div>
          <div><b>role</b>: {String(role)}</div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {status !== "authenticated" ? (
            <button onClick={() => signIn("google", { callbackUrl: "/admin" })}>
              Googleでログイン（/adminへ）
            </button>
          ) : (
            <>
              <button onClick={() => (window.location.href = "/admin")} disabled={!isAdmin}>
                管理者ページへ
              </button>
              <button onClick={() => signOut({ callbackUrl: "/welcome" })}>
                ログアウト
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
