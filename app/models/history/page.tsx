// app/models/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("educationStylesHistory");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  if (history.length === 0) {
    return <p style={emptyStyle}>まだ履歴がありません。</p>;
  }

  return (
    <main style={mainStyle}>
      {/* ナビゲーション */}
      <nav style={navStyle}>
        {[
          ["/", "🏠 ホーム"],
          ["/plan", "📋 授業作成"],
          ["/plan/history", "📖 計画履歴"],
          ["/practice/history", "📷 実践履歴"],
          ["/models/create", "✏️ 教育観作成"],   // ←追加
          ["/models", "📚 教育観一覧"],
          ["/models/history", "🕒 教育観履歴"],  // ←アクティブ
                  ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            style={{
              padding: "8px 12px",
              backgroundColor:
                href === "/models/history" ? "#4CAF50" : "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

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
  );
}

// --- Styles ---
const mainStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 800,
  margin: "0 auto",
  fontFamily: "sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  overflowX: "auto",
  flexWrap: "nowrap",
  paddingBottom: 16,
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: 16,
  textAlign: "center",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderRadius: 8,
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
};

const cardHeaderStyle: React.CSSProperties = {
  marginBottom: 8,
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: "0.9rem",
};

const dateStyle: React.CSSProperties = {
  color: "#555",
};

const noteStyle: React.CSSProperties = {
  backgroundColor: "#ffeb3b",
  borderRadius: 4,
  padding: "0 6px",
  fontSize: "0.85rem",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  margin: "0 0 8px",
};

const fieldStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  margin: "4px 0",
  lineHeight: 1.4,
  flexGrow: 1,
};

const editButtonStyle: React.CSSProperties = {
  marginTop: 12,
  backgroundColor: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: "0.95rem",
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#666",
};
