"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";
import { getAuth, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";

/* =========================================================
 * HomeRedirect（変更なし）
 * ======================================================= */
export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/welcome");
  }, [user, loading, router]);

  if (loading || !user) {
    return <p style={{ textAlign: "center", marginTop: 100 }}>読み込み中…</p>;
  }
  return <Dashboard />;
}

/* =========================================================
 * Dashboard（3デザイン切替）
 * ======================================================= */

/** 初期表示するデザイン: "tiles" | "split" | "list" */
const DEFAULT_VARIANT: "tiles" | "split" | "list" = "tiles";

type MenuItem = { href: string; emoji: string; label: string; bg?: string };

function buildMenu(isAdmin: boolean): MenuItem[] {
  const base: MenuItem[] = [
    { href: "/plan",            emoji: "📝", label: "授業案を作成する",             bg: "#1976d2" },
    { href: "/plan/history",    emoji: "📖", label: "保存された授業案を見る",       bg: "#00acc1" },
    { href: "/practice/history",emoji: "📷", label: "授業実践の記録を見る",         bg: "#00897b" },
    { href: "/practice/share",  emoji: "🌐", label: "共有版実践記録を見る",         bg: "#7b1fa2" },
    { href: "/models/create",   emoji: "✏️", label: "新しい教育観モデルを作成する", bg: "#43a047" },
    { href: "/models",          emoji: "🌱", label: "教育観モデルを一覧で見る",     bg: "#8bc34a" },
    { href: "/models/history",  emoji: "🕒", label: "教育観モデル履歴を見る",       bg: "#e53935" },
  ];
  return isAdmin
    ? [...base, { href: "/admin/users", emoji: "🔧", label: "管理者ページ", bg: "#455A64" }]
    : base;
}

function Dashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [variant, setVariant] = useState<"tiles" | "split" | "list">(DEFAULT_VARIANT);

  // NextAuth → Firebase ブリッジ（未ログインなら custom token サインイン）
  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (auth.currentUser) return;
      try {
        const res = await fetch("/api/firebase/custom-token", { cache: "no-store" });
        if (!res.ok) return;
        const { token } = await res.json();
        if (!token) return;
        await signInWithCustomToken(auth, token);
      } catch { /* noop */ }
    })();
  }, []);

  // Firebase claimsで管理者判定
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setIsAdmin(false);
      try {
        await u.getIdToken(true);
        const { claims } = await u.getIdTokenResult();
        setIsAdmin(claims.admin === true || claims.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  const items = buildMenu(isAdmin);

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          h1.home-title {
            font-size: 1.75rem !important;
            line-height: 1.35 !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
        }
        .seg { display:inline-flex; border:1px solid #cfe0ff; border-radius:10px; overflow:hidden; }
        .seg button { padding:8px 12px; border:0; background:#f6f9ff; color:#2a4aa0; cursor:pointer; }
        .seg button + button { border-left:1px solid #cfe0ff; }
        .seg button.active { background:#2a6df6; color:#fff; }
      `}</style>

      <main
        style={{
          padding: 24,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif",
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        {/* ヘッダー */}
        <header style={{ textAlign: "center", margin: "8px 0 18px" }}>
          <h1 className="home-title" style={{ fontSize: "2.1rem", margin: 0 }}>
            🌟 国語授業プランナーへ ようこそ！
          </h1>
          <p style={{ margin: "8px 0 14px", color: "#546e7a" }}>
            授業案の作成・実践記録の共有・教育観の蓄積をこの1画面から。
          </p>

          {/* 表示切替（デモ用。不要なら丸ごと削除OK） */}
          <div className="seg" role="tablist" aria-label="表示切替">
            <button
              className={variant === "tiles" ? "active" : ""}
              onClick={() => setVariant("tiles")}
              role="tab" aria-selected={variant === "tiles"}
            >
              タイル
            </button>
            <button
              className={variant === "split" ? "active" : ""}
              onClick={() => setVariant("split")}
              role="tab" aria-selected={variant === "split"}
            >
              スプリット
            </button>
            <button
              className={variant === "list" ? "active" : ""}
              onClick={() => setVariant("list")}
              role="tab" aria-selected={variant === "list"}
            >
              リスト
            </button>
          </div>
        </header>

        {/* 3パターン */}
        {variant === "tiles" && <Tiles items={items} />}
        {variant === "split" && <Split items={items} />}
        {variant === "list" && <List items={items} />}

        {/* 補助リンクなど入れたい場合はここに */}
      </main>
    </>
  );
}

/* ---------------- パターンA：カードタイル（視認性＆タップ性重視） ---------------- */
function Tiles({ items }: { items: MenuItem[] }) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
      }}
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          style={{
            border: "1px solid #e0e7ff",
            borderRadius: 16,
            padding: 16,
            background: "linear-gradient(180deg, #ffffff, rgba(246, 248, 255, 0.9))",
            boxShadow: "0 8px 22px rgba(25,118,210,0.06)",
            textDecoration: "none",
            color: "#123",
            display: "flex",
            gap: 14,
            alignItems: "center",
            transition: "transform .12s ease, box-shadow .12s ease",
          }}
        >
          <div
            aria-hidden
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: it.bg || "#1976d2",
              color: "#fff",
              fontSize: 28,
              boxShadow: "0 6px 16px rgba(0,0,0,.15)",
              flexShrink: 0,
            }}
          >
            {it.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
              {it.label}
            </div>
            <p
              style={{
                margin: 0,
                color: "#5f6b7a",
                fontSize: 13,
                overflowWrap: "anywhere",
              }}
            >
              {hintText(it.href)}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}

/* ---------------- パターンB：スプリット（左：主要導線 / 右：サブ） ---------------- */
function Split({ items }: { items: MenuItem[] }) {
  const main = items.slice(0, 4);
  const sub  = items.slice(4);

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px, 1fr) minmax(220px, .8fr)",
        gap: 18,
      }}
    >
      {/* 左：主要 */}
      <div
        style={{
          border: "1px solid #e0e7ff",
          borderRadius: 14,
          padding: 16,
          background:
            "linear-gradient(135deg, rgba(25,118,210,.08), rgba(33,150,243,.06))",
        }}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: 18, color: "#1a237e" }}>主要メニュー</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {main.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #cfe0ff",
                textDecoration: "none",
                color: "#123",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: it.bg || "#1976d2",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  boxShadow: "0 3px 10px rgba(0,0,0,.12)",
                  flexShrink: 0,
                }}
              >
                {it.emoji}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{it.label}</div>
                <div style={{ color: "#607d8b", fontSize: 12 }}>{hintText(it.href)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 右：サブ */}
      <div
        style={{
          border: "1px solid #e0e7ff",
          borderRadius: 14,
          padding: 16,
          background: "#fff",
        }}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: 18, color: "#1a237e" }}>その他</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sub.map((it) => (
            <li key={it.href} style={{ marginBottom: 8 }}>
              <Link
                href={it.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "#1565c0",
                  background: "rgba(33,150,243,.06)",
                  border: "1px solid #cfe0ff",
                }}
              >
                <span aria-hidden style={{ fontSize: 18 }}>{it.emoji}</span>
                <span style={{ fontWeight: 700 }}>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- パターンC：シンプルリスト（今の延長で上品に） ---------------- */
function List({ items }: { items: MenuItem[] }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560, margin: "0 auto" }}>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 18px",
            backgroundColor: it.bg || "#1976d2",
            borderRadius: 10,
            textDecoration: "none",
            color: "white",
            fontSize: "1.08rem",
            fontWeight: 600,
            boxShadow: "0 6px 16px rgba(0,0,0,.12)",
          }}
        >
          <span aria-hidden style={{ fontSize: "1.6rem", marginRight: 10 }}>{it.emoji}</span>
          <span style={{ overflowWrap: "anywhere" }}>{it.label}</span>
        </Link>
      ))}
    </section>
  );
}

/* 小さな説明文（ヒント）。必要なければ編集/削除OK */
function hintText(href: string): string {
  switch (true) {
    case href.startsWith("/plan?") || href === "/plan":
      return "教育観から素早く授業案を組み立てます。";
    case href === "/plan/history":
      return "保存済みの授業案を再編集・PDF化できます。";
    case href === "/practice/history":
      return "自分の実践記録を一覧で確認。";
    case href === "/practice/share":
      return "他の先生の板書・振り返りからヒントを得ましょう。";
    case href === "/models/create":
      return "あなたの教育観を言語化し、土台に。";
    case href === "/models":
      return "みんなの教育観を参照。授業案の出発点に。";
    case href === "/models/history":
      return "教育観の変更履歴を確認。";
    case href.startsWith("/admin"):
      return "ユーザー管理などの管理者向け機能。";
    default:
      return "";
  }
}
