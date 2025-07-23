"use client";

import React, { useState, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type EducationHistory = {
  id: string;
  modelId: string;
  updatedAt: string;
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  note?: string;
};

// タイムラインの1履歴アイテムコンポーネント
function TimelineItem({ item }: { item: EducationHistory }) {
  return (
    <div style={timelineItemStyle}>
      <div style={circleStyle} />
      <time style={timeStyle}>{new Date(item.updatedAt).toLocaleDateString()}</time>
      <h3 style={timelineTitleStyle}>{item.name}</h3>
      {item.note && <p style={noteStyle}>{item.note}</p>}
      <p style={fieldStyle}><strong>教育観：</strong> {item.philosophy}</p>
      <p style={fieldStyle}><strong>評価観点：</strong> {item.evaluationFocus}</p>
      <p style={fieldStyle}><strong>言語活動：</strong> {item.languageFocus}</p>
      <p style={fieldStyle}><strong>育てたい姿：</strong> {item.childFocus}</p>
    </div>
  );
}

export default function EducationHistoryPage() {
  const [history, setHistory] = useState<EducationHistory[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const colRef = collection(db, "educationModelsHistory");
        const q = query(colRef, orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EducationHistory, "id">),
        }));
        setHistory(data);
      } catch (e) {
        console.error("Firestore履歴読み込みエラー", e);
        setHistory([]);
      }
    }
    fetchHistory();
  }, []);

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
      <div
        style={{
          ...menuWrapperStyle,
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
        }}
        aria-hidden={!menuOpen}
      >
        {/* ログアウトボタン */}
        <button onClick={() => signOut()} style={logoutButtonStyle}>
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
          <Link
            href="/plan/history"
            style={navLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            📖 計画履歴
          </Link>
          <Link
            href="/practice/history"
            style={navLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            📷 実践履歴
          </Link>
          <Link
            href="/practice/share"
            style={navLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            🌐 共有版実践記録
          </Link>
          <Link
            href="/models/create"
            style={navLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            ✏️ 教育観作成
          </Link>
          <Link href="/models" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📚 教育観一覧
          </Link>
          <Link
            href="/models/history"
            style={navLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            🕒 教育観履歴
          </Link>
        </div>
      </div>

      <main style={mainStyle}>
        <h1 style={titleStyle}>🕒 教育観モデル履歴（タイムライン表示）</h1>

        {history.length === 0 ? (
          <p style={emptyStyle}>まだ履歴がありません。</p>
        ) : (
          <div style={timelineContainerStyle}>
            {history.map((item) => (
              <TimelineItem key={item.id} item={item} />
            ))}
          </div>
        )}
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
  paddingTop: 80,
};

const titleStyle: CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: 16,
  textAlign: "center",
};

const emptyStyle: CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#666",
};

const timelineContainerStyle: CSSProperties = {
  borderLeft: "3px solid #1976d2",
  paddingLeft: 20,
};

const timelineItemStyle: CSSProperties = {
  marginBottom: 32,
  position: "relative",
};

const circleStyle: CSSProperties = {
  position: "absolute",
  left: -12,
  top: 6,
  width: 18,
  height: 18,
  borderRadius: "50%",
  backgroundColor: "#1976d2",
};

const timeStyle: CSSProperties = {
  fontSize: 12,
  color: "#555",
  marginBottom: 4,
};

const timelineTitleStyle: CSSProperties = {
  margin: "4px 0 6px",
  fontSize: 18,
  fontWeight: "bold",
};

const noteStyle: CSSProperties = {
  fontSize: 14,
  fontStyle: "italic",
  color: "#888",
  marginBottom: 8,
};

const fieldStyle: CSSProperties = {
  fontSize: 14,
  marginBottom: 4,
  lineHeight: 1.5,
};
