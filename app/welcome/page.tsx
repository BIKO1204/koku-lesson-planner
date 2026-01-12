"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

function safeCallbackUrl(raw?: string | null) {
  // 414防止：相対パスのみ許可（/admin など）
  if (!raw) return "/admin";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/admin";
}

export default function WelcomePage() {
  const { status } = useSession();
  const sp = useSearchParams();

  // sp が null と解釈されても落ちないように、optional chaining で取得
  const callbackUrl = useMemo(() => {
    const raw = sp?.get("callbackUrl"); // ← ここがポイント
    return safeCallbackUrl(raw);
  }, [sp]);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace(callbackUrl);
    }
  }, [status, callbackUrl]);

  if (status === "loading") return null;

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
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 32 }}>ようこそ！</h1>

      <button
        onClick={() => signIn("google", { callbackUrl })}
        style={{
          width: 200,
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
    </main>
  );
}
