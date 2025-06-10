"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // アクセストークンをlocalStorageに安全に保存（存在チェックあり）
      if (session && typeof (session as any).accessToken === "string") {
        localStorage.setItem("googleAccessToken", (session as any).accessToken);
      }
      router.replace("/"); // ログイン成功後、トップページへ遷移
    }
  }, [session, status, router]);

  if (status === "loading") return null; // 読み込み中は何も表示しない

  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f2f2f5",
        padding: "2rem",
        boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={() => signIn("google")}
        style={{
          padding: "1rem 2rem",
          fontSize: "1.4rem",
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Googleアカウントでログイン
      </button>
    </main>
  );
}
