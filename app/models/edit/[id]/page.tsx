"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import UpdateApprovalUI from "@/components/UpdateApprovalUI";

export default function StyleDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const router = useRouter();

  const [style, setStyle] = useState<any>(null);
  const [relatedPlans, setRelatedPlans] = useState<any[]>([]);
  const [showUpdateUI, setShowUpdateUI] = useState(false);

  useEffect(() => {
    if (!id) return;

    const styleModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
    const foundStyle = styleModels.find((s: any) => s.id === id);
    if (foundStyle) setStyle(foundStyle);

    const plans = JSON.parse(localStorage.getItem("lessonPlans") || "[]");
    const matchedPlans = plans.filter((p: any) => p.usedStyleName === foundStyle?.name);
    setRelatedPlans(matchedPlans);
  }, [id]);

  const fetchUpdateProposal = async (feedbackText: string, currentModel: any) => {
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackText, currentModel }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("API error:", data);
        alert(`APIエラー: ${data.error || '不明なエラー'}`);
        return null;
      }

      return data;
    } catch (error) {
      alert("AI解析に失敗しました。");
      console.error(error);
      return null;
    }
  };

  const handleUpdate = (newVersion: any) => {
    if (!style) return;

    const styleModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
    const updatedModels = styleModels.map((s: any) =>
      s.id === id ? { ...s, ...newVersion } : s
    );
    localStorage.setItem("styleModels", JSON.stringify(updatedModels));
    setStyle({ ...style, ...newVersion });
    setShowUpdateUI(false);

    const history = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]");
    const newHistoryEntry = {
      id: id,
      updatedAt: new Date().toISOString(),
      ...newVersion,
      note: "AI解析による更新",
    };
    localStorage.setItem("educationStylesHistory", JSON.stringify([newHistoryEntry, ...history]));
  };

  if (!style) return <p style={{ padding: "2rem" }}>スタイルを読み込んでいます...</p>;

  return (
    <main style={{ padding: "2rem", maxWidth: "90vw", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* 上部ナビゲーション：アイコンボタンを横並びでスクロール可能に */}
      <nav
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "2rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          WebkitOverflowScrolling: "touch",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        {[
          { href: "/", label: "🏠 ホーム" },
          { href: "/plan", label: "📋 授業作成" },
          { href: "/plan/history", label: "📖 計画履歴" },
          { href: "/practice/history", label: "📷 実践履歴" },
          { href: "/models/create", label: "✏️ 教育観作成" },
          { href: "/models", label: "📚 教育観一覧" },
          { href: "/models/history", label: "🕒 教育観履歴" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              flexShrink: 0,
              padding: "0.5rem 1rem",
              backgroundColor: "#1976d2",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      <nav style={{ marginBottom: "2rem" }}>
        <Link href="/models">← スタイル一覧へ</Link>
      </nav>

      {/* スタイル詳細 */}
      <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>{style.name}</h2>
      <section
        style={{
          marginBottom: "1.5rem",
          background: "#f9f9f9",
          padding: "1rem",
          borderRadius: "10px",
          whiteSpace: "pre-wrap",
        }}
      >
        <p><strong>教育観：</strong><br />{style.philosophy}</p>
        <p><strong>評価観点の重視：</strong><br />{style.evaluationFocus}</p>
        <p><strong>言語活動の重視：</strong><br />{style.languageFocus}</p>
        <p><strong>育てたい子どもの姿：</strong><br />{style.childFocus}</p>
      </section>

      {/* 授業作成ボタン */}
      <button
        onClick={() => router.push(`/plan?styleId=${style.id}`)}
        style={{
          padding: "0.8rem 1.2rem",
          fontSize: "1.1rem",
          backgroundColor: "#4CAF50",
          color: "white",
          borderRadius: "10px",
          border: "none",
          marginBottom: "2rem",
          cursor: "pointer",
        }}
      >
        ▶︎ このスタイルで授業を作成する
      </button>

      {/* AI振り返り解析ボタン */}
      <button
        onClick={() => setShowUpdateUI(true)}
        style={{
          padding: "0.8rem 1.2rem",
          fontSize: "1.1rem",
          backgroundColor: "#FF9800",
          color: "white",
          borderRadius: "10px",
          border: "none",
          marginBottom: "2rem",
          cursor: "pointer",
        }}
      >
        🔄 振り返りをAIで解析・モデルを更新する
      </button>

      {/* 振り返りAI承認UI */}
      {showUpdateUI && (
        <UpdateApprovalUI
          currentModel={{
            philosophy: style.philosophy,
            evaluationFocus: style.evaluationFocus,
            languageFocus: style.languageFocus,
            childFocus: style.childFocus,
          }}
          onUpdate={handleUpdate}
          onCancel={() => setShowUpdateUI(false)}
          fetchUpdateProposal={fetchUpdateProposal}
        />
      )}

      {/* 関連授業案一覧 */}
      <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>このスタイルで作成した授業案</h3>
      {relatedPlans.length === 0 ? (
        <p>まだこのスタイルで作成された授業案はありません。</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {relatedPlans.map((plan) => (
            <li
              key={plan.id}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                border: "1px solid #ccc",
                borderRadius: "10px",
                backgroundColor: "#fdfdfd",
              }}
            >
              <p>
                <strong>{plan.unit}</strong>（{plan.grade}・{plan.genre}）
              </p>
              <p>授業時間：{plan.hours}時間</p>
              <Link href="/plan/history">
                <button
                  style={{
                    marginTop: "0.5rem",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  📖 履歴ページで確認
                </button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
