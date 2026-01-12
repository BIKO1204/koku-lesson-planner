"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

function safeCallbackUrl(raw?: string | null) {
  if (!raw) return "/admin";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/admin";
}

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const sp = useSearchParams();

  const callbackUrl = useMemo(() => {
    const raw = sp?.get("callbackUrl");
    return safeCallbackUrl(raw);
  }, [sp]);

  const isAdmin = (session?.user as any)?.admin === true;
  const role = (session?.user as any)?.role ?? "unknown";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>ようこそ！</h1>

      {/* いま何が起きてるかを可視化 */}
      <div
        style={{
          width: "min(720px, 95vw)",
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          background: "#fafafa",
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        <div><b>status</b>: {status}</div>
        <div><b>email</b>: {session?.user?.email ?? "(none)"}</div>
        <div><b>admin</b>: {String(isAdmin)}</div>
        <div><b>role</b>: {String(role)}</div>
        <div><b>callbackUrl</b>: {callbackUrl}</div>
      </div>

      {status !== "authenticated" ? (
        <button
          onClick={() => signIn("google", { callbackUrl })}
          style={{
            width: 220,
            height: 56,
            fontSize: 18,
            borderRadius: 8,
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          Googleでログイン
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => (window.location.href = "/")}>トップへ</button>

          <button
            disabled={!isAdmin}
            onClick={() => (window.location.href = callbackUrl)}
            title={!isAdmin ? "admin=false なので /admin に進めません" : ""}
          >
            管理者ページへ
          </button>

          <button onClick={() => signOut({ callbackUrl: "/welcome" })}>
            ログアウト
          </button>
        </div>
      )}
    </main>
  );
}
