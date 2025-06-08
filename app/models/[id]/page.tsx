// app/models/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function StyleDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const router = useRouter();
  const [style, setStyle] = useState<any>(null);
  const [relatedPlans, setRelatedPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const styleModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
    const found = styleModels.find((s: any) => s.id === id);
    setStyle(found || null);

    const plans = JSON.parse(localStorage.getItem("lessonPlans") || "[]");
    setRelatedPlans(plans.filter((p: any) => p.usedStyleName === found?.name));
  }, [id]);

  if (!style) {
    return <p style={{ padding: 24 }}>読み込み中…</p>;
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* 完全横並びナビ */}
      <nav style={navStyle}>
        {[
          ["/", "🏠 ホーム"],
          ["/plan", "📋 授業作成"],
          ["/plan/history", "📖 計画履歴"],
          ["/practice/history", "📷 実践履歴"],
          ["/models", "📚 教育観一覧"],
        ].map(([href, label]) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={navButtonStyle}
          >
            {label}
          </button>
        ))}
      </nav>

      <h1 style={{ fontSize: "1.6rem", margin: "1.5rem 0 1rem" }}>{style.name}</h1>

      <section style={detailBoxStyle}>
        <p><strong>教育観：</strong><br />{style.philosophy}</p>
        <p><strong>評価観点：</strong><br />{style.evaluationFocus}</p>
        <p><strong>言語活動：</strong><br />{style.languageFocus}</p>
        <p><strong>育てたい姿：</strong><br />{style.childFocus}</p>
      </section>

      <button
        onClick={() => router.push(`/plan?styleId=${style.id}`)}
        style={primaryButtonStyle}
      >
        ▶︎ このスタイルで授業作成
      </button>

      <h2 style={{ margin: "2rem 0 1rem", fontSize: "1.3rem" }}>このスタイルで作成した授業案</h2>
      {relatedPlans.length === 0 ? (
        <p>まだありません。</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {relatedPlans.map((p) => (
            <li key={p.id} style={cardStyle}>
              <p><strong>{p.unit}</strong> ({p.grade}・{p.genre})</p>
              <button
                onClick={() => router.push("/plan/history")}
                style={secondaryButtonStyle}
              >
                📖 履歴で確認
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// --- スタイル ---
const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  overflowX: "auto",
  flexWrap: "nowrap",
  padding: "8px 0",
  marginBottom: 24,
};

const navButtonStyle: React.CSSProperties = {
  flex: "0 0 auto",
  backgroundColor: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: "1rem",
  cursor: "pointer",
};

const detailBoxStyle: React.CSSProperties = {
  backgroundColor: "#f9f9f9",
  padding: 16,
  borderRadius: 8,
  whiteSpace: "pre-wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  backgroundColor: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 0",
  fontSize: "1.1rem",
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 16,
  border: "1px solid #ddd",
  borderRadius: 8,
  backgroundColor: "#fff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
};

const secondaryButtonStyle: React.CSSProperties = {
  marginTop: 8,
  backgroundColor: "#2196F3",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: "0.95rem",
  cursor: "pointer",
};
