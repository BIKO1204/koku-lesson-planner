"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

function safeCallbackUrl(raw?: string | null) {
  if (!raw) return "/admin";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/admin";
}

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const sp = useSearchParams();
  const router = useRouter();

  const callbackUrl = useMemo(() => {
    const raw = sp?.get("callbackUrl");
    return safeCallbackUrl(raw);
  }, [sp]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const isAdmin = (session?.user as any)?.admin === true;

    // ✅ adminなら戻す
    if (isAdmin) {
      router.replace(callbackUrl);
      return;
    }

    // ✅ adminじゃないならループを止める（ここが重要）
    //   - いったんトップへ逃がす
    router.replace("/");
  }, [status, session, callbackUrl, router]);

  if (status === "loading") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>認証中…</p>
      </main>
    );
  }

  const authed = status === "authenticated";
  const isAdmin = (session?.user as any)?.admin === true;

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 16,
        boxSizing: "border-box",
        fontFamily: "sans-serif",
        gap: 12,
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>ようこそ！</h1>

      {!authed && (
        <button
          onClick={() => signIn("google", { callbackUrl })}
          style={{
            width: 220,
            height: 60,
            fontSize: 20,
            borderRadius: 8,
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            userSelect: "none",
          }}
        >
          Googleでログイン
        </button>
      )}

      {authed && !isAdmin && (
        <>
          <p>このアカウントは管理者権限がありません。</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.replace("/")}>トップへ</button>
            <button onClick={() => signOut({ callbackUrl: "/welcome" })}>
              ログアウト
            </button>
          </div>
        </>
      )}

      {authed && isAdmin && <p>権限確認中…</p>}
    </main>
  );
}
