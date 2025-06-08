// app/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";  // updateDoc を外しました
import { db } from "../firebaseConfig.js";

export default function RegisterPage() {
  const { user, signup, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [pw, setPw]             = useState("");
  const [inviteCode, setInvite] = useState("");
  const [error, setError]       = useState("");

  // 認証済みならトップへ
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 招待コードチェック
    if (!inviteCode.trim()) {
      setError("招待コードを入力してください。");
      return;
    }
    const inviteRef = doc(db, "invites", inviteCode.trim());
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) {
      setError("招待コードが見つかりません。");
      return;
    }
    // 「used」フラグのチェックは行いません

    // パスワード長チェック
    if (pw.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }

    try {
      // Firebase Auth でユーザー作成
      await signup(email.trim(), pw);

      // 使用済みフラグ更新は行わないので、このままトップへ
      router.replace("/");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "登録に失敗しました。");
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
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", textAlign: "center", margin: 0 }}>
          招待制 新規登録
        </h1>

        <input
          type="text"
          placeholder="招待コード"
          value={inviteCode}
          onChange={(e) => setInvite(e.target.value)}
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
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          登録する
        </button>

        {error && (
          <p style={{ color: "red", textAlign: "center", fontSize: "1.2rem" }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: "1rem", color: "#666", textAlign: "center", margin: 0 }}>
          ※ 事前に配布された招待コードを入力してください。
        </p>
      </form>
    </main>
  );
}
