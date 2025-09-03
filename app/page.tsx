"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";
import { getAuth, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/welcome");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <p style={{ textAlign: "center", marginTop: 100 }}>読み込み中…</p>;
  }
  return <Dashboard />;
}

function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false);

  // ① NextAuth セッション → Firebase へブリッジ（未ログインならcustom-tokenでサインイン）
  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (auth.currentUser) return; // 既にFirebaseにログイン済みなら何もしない
      try {
        const res = await fetch("/api/firebase/custom-token", { cache: "no-store" });
        if (!res.ok) return; // 未ログイン(NextAuth)なら401
        const { token } = await res.json();
        if (!token) return;
        await signInWithCustomToken(auth, token);
      } catch (e) {
        // noop（未ログイン時などはここに来る）
      }
    })();
  }, []);

  // ② Firebaseログイン状態を監視し、claimsを強制更新して管理者判定
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setIsAdmin(false);
      try {
        await u.getIdToken(true); // ★ ここが重要：claimsを確実に反映
        const { claims } = await u.getIdTokenResult();
        const ok = claims.admin === true || claims.role === "admin";
        setIsAdmin(ok);
      } catch {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  const baseItems: {
    href: string;
    emoji: string;
    label: string;
    bg: string;
  }[] = [
    { href: "/plan", emoji: "📝", label: "授業案を作成する", bg: "#42A5F5" },
    { href: "/plan/history", emoji: "📖", label: "保存された授業案を見る", bg: "#00BCD4" },
    { href: "/practice/history", emoji: "📷", label: "授業実践の記録を見る", bg: "#009688" },
    { href: "/practice/share", emoji: "🌐", label: "共有版実践記録を見る", bg: "#9C27B0" },
    { href: "/models/create", emoji: "✏️", label: "新しい教育観モデルを作成する", bg: "#66BB6A" },
    { href: "/models", emoji: "🌱", label: "教育観モデルを一覧で見る", bg: "#AED581" },
    { href: "/models/history", emoji: "🕒", label: "教育観モデル履歴を見る", bg: "#E53935" },
  ];

  const menuItems = isAdmin
    ? [...baseItems, { href: "/admin/users", emoji: "🔧", label: "管理者ページ", bg: "#455A64" }]
    : baseItems;

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          h1 {
            font-size: 1.8rem !important;
            line-height: 1.4 !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
        }
      `}</style>

      <main
        style={{
          padding: 24,
          fontFamily: "sans-serif",
          maxWidth: 500,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 24,
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          🌟 国語授業プランナーへ
          <br />
          ようこそ！
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {menuItems.map(({ href, emoji, label, bg }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px",
                backgroundColor: bg,
                borderRadius: 8,
                textDecoration: "none",
                color: "white",
                fontSize: "1.1rem",
                fontWeight: "500",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "1.6rem", marginRight: 8 }}>{emoji}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
