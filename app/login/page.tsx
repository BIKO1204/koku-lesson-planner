"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  // ログイン済みならリダイレクト
  useEffect(() => {
    if (status === "authenticated") {
      // 型安全にaccessTokenをチェックしてlocalStorageに保存
      if (session && typeof (session as any).accessToken === "string") {
        localStorage.setItem("googleAccessToken", (session as any).accessToken);
      }
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return null; // 読み込み中は何も表示しない
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || pw.length < 6) {
      setError("有効なメールアドレスと6文字以上のパスワードを入力してください。");
      return;
    }
    try {
      // ここはfirebaseログインなど独自のlogin関数ならそれに置き換えてください
      await signIn("credentials", { email: email.trim(), password: pw });
    } catch (e: any) {
      setError("ログインに失敗しました。");
    }
  };

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
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", textAlign: "center", margin: 0 }}>
          ログイン
        </h1>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.4rem",
            borderRadius: 8,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="パスワード（6文字以上）"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.4rem",
            borderRadius: 8,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.4rem",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          ログイン
        </button>

        {error && (
          <p style={{ color: "red", textAlign: "center", fontSize: "1.2rem" }}>
            {error}
          </p>
        )}

        <div
          style={{
            marginTop: "1rem",
            borderTop: "1px solid #ccc",
            paddingTop: "1rem",
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={() => signIn("google")}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              backgroundColor: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Googleアカウントでログイン
          </button>
        </div>
      </form>
    </main>
  );
}
