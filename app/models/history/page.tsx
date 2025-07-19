"use client";

import { useState, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

type EducationHistory = {
  id: string;
  updatedAt: string;
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  note?: string;
};

export default function EducationHistoryPage() {
  const [history, setHistory] = useState<EducationHistory[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("educationStylesHistory");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  if (history.length === 0) {
    return <p style={emptyStyle}>まだ履歴がありません。</p>;
  }

  return (
    <>
      {/* ナビバー */}
      <nav style={navBarStyle}>
        <div
          style={hamburgerStyle}
          onClick={toggleMenu}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && toggleMenu()}
        >
          <span style={barStyle}></span>
          <span style={barStyle}></span>
          <span style={barStyle}></span>
        </div>
        <h1 style={{ color: "white", marginLeft: "1rem", fontSize: "1.25rem" }}>
          国語授業プランナー
        </h1>
      </nav>

      {/* メニューオーバーレイ */}
      <div
        style={{
          ...overlayStyle,
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? "visible" : "hidden",
        }}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* メニュー全体 */}
      <div style={{ ...menuWrapperStyle, transform: menuOpen ? "translateX(0)" : "translateX(-100%)" }} aria-hidden={!menuOpen}>
        {/* ログアウトボタン */}
        <button
          onClick={() => signOut()}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

        {/* メニューリンク */}
        <div style={menuScrollStyle}>
          <Link href="/" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            🏠 ホーム
          </Link>
          <Link href="/plan" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📋 授業作成
          </Link>
          <Link href="/plan/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📖 計画履歴
          </Link>
          <Link href="/practice/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📷 実践履歴
          </Link>
          <Link href="/practice/share" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            🌐 共有版実践記録を見る
          </Link>
          <Link href="/models/create" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            ✏️ 教育観作成
          </Link>
          <Link href="/models" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📚 教育観一覧
          </Link>
          <Link href="/models/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            🕒 教育観履歴
          </Link>
        </div>
      </div>

      <main style={mainStyle}>
        <h1 style={titleStyle}>🕒 教育観モデル履歴</h1>

        <div style={listStyle}>
          {history.map((v) => (
            <article key={v.id + v.updatedAt} style={cardStyle}>
              <header style={cardHeaderStyle}>
                <time style={dateStyle}>
                  {new Date(v.updatedAt).toLocaleString()}
                </time>
                {v.note && <span style={noteStyle}>{v.note}</span>}
              </header>
              <h2 style={cardTitleStyle}>{v.name}</h2>
              <p style={fieldStyle}>
                <strong>教育観：</strong> {v.philosophy}
              </p>
              <p style={fieldStyle}>
                <strong>評価観点：</strong> {v.evaluationFocus}
              </p>
              <p style={fieldStyle}>
                <strong>言語活動：</strong> {v.languageFocus}
              </p>
              <p style={fieldStyle}>
                <strong>育てたい姿：</strong> {v.childFocus}
              </p>
              <button
                onClick={() => router.push(`/models/edit/${v.id}`)}
                style={editButtonStyle}
              >
                ✏️ このバージョンを編集
              </button>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

// --- Styles ---

const navBarStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: 56,
  backgroundColor: "#1976d2",
  display: "flex",
  alignItems: "center",
  padding: "0 1rem",
  zIndex: 1000,
};

const hamburgerStyle: CSSProperties = {
  cursor: "pointer",
  width: 30,
  height: 22,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const barStyle: CSSProperties = {
  height: 4,
  backgroundColor: "white",
  borderRadius: 2,
};

const menuWrapperStyle: CSSProperties = {
  position: "fixed",
  top: 56,
  left: 0,
  width: 250,
  height: "calc(100vh - 56px)",
  backgroundColor: "#f0f0f0",
  boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
  transition: "transform 0.3s ease",
  zIndex: 999,
  display: "flex",
  flexDirection: "column",
};

const menuScrollStyle: CSSProperties = {
  padding: "1rem",
  paddingBottom: 80,
  overflowY: "auto",
  flexGrow: 1,
};

const logoutButtonStyle: CSSProperties = {
  margin: "1rem",
  padding: "0.75rem 1rem",
  backgroundColor: "#e53935",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  zIndex: 1000,
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 56,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.3)",
  transition: "opacity 0.3s ease",
  zIndex: 998,
};

const navLinkStyle: CSSProperties = {
  display: "block",
  padding: "0.5rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  textDecoration: "none",
  marginBottom: "0.5rem",
};

const mainStyle: CSSProperties = {
  padding: 24,
  maxWidth: 800,
  margin: "0 auto",
  fontFamily: "sans-serif",
  paddingTop: 80, // ナビバー分の余白
};

const titleStyle: CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: 16,
  textAlign: "center",
};

const listStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
};

const cardStyle: CSSProperties = {
  backgroundColor: "#fafafa",
  borderRadius: 8,
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
};

const cardHeaderStyle: CSSProperties = {
  marginBottom: 8,
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: "0.9rem",
};

const dateStyle: CSSProperties = {
  color: "#555",
};

const noteStyle: CSSProperties = {
  backgroundColor: "#ffeb3b",
  borderRadius: 4,
  padding: "0 6px",
  fontSize: "0.85rem",
};

const cardTitleStyle: CSSProperties = {
  fontSize: "1.2rem",
  margin: "0 0 8px",
};

const fieldStyle: CSSProperties = {
  fontSize: "0.95rem",
  margin: "4px 0",
  lineHeight: 1.4,
  flexGrow: 1,
};

const editButtonStyle: CSSProperties = {
  marginTop: 12,
  backgroundColor: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: "0.95rem",
  cursor: "pointer",
};

const emptyStyle: CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#666",
};
