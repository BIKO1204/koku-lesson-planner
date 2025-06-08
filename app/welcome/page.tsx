"use client";

import { useAuth } from "../contexts/AuthContext";

export default function WelcomePage() {
  const { user, loading, loginWithGoogle } = useAuth();

  if (!loading && user) {
    // 認証済みならトップページへリダイレクト
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

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
        onClick={loginWithGoogle}
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
