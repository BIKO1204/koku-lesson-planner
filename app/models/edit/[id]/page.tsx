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

  // AIに振り返り文章を送り更新案を取得する関数
  const fetchUpdateProposal = async (feedbackText: string, currentModel: any) => {
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackText, currentModel }),
      });
      if (!res.ok) throw new Error("APIエラー");
      return await res.json();
    } catch (error) {
      alert("AI解析に失敗しました。");
      console.error(error);
      return null;
    }
  };

  const handleUpdate = (newVersion: any) => {
    if (!style) return;

    // ローカルの教育観モデルを更新
    const styleModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
    const updatedModels = styleModels.map((s: any) =>
      s.id === id ? { ...s, ...newVersion } : s
    );
    localStorage.setItem("styleModels", JSON.stringify(updatedModels));
    setStyle({ ...style, ...newVersion });
    setShowUpdateUI(false);

    // 教育観履歴に追記（最新が先頭）
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
      {/* ナビゲーション */}
      <nav
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link href="/" style={linkStyle}>🏠 ホーム</Link>
        <Link href="/plan" style={linkStyle}>📋 授業作成</Link>
        <Link href="/plan/history" style={linkStyle}>📖 計画履歴</Link>
        <Link href="/practice/history" style={linkStyle}>📷 実践履歴</Link>
        <Link href="/models/create" style={linkStyle}>✏️ 教育観作成</Link>
        <Link href="/models" style={linkStyle}>📚 教育観一覧</Link>
        <Link href="/models/history" style={linkStyle}>🕒 教育観履歴</Link>
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
        style={buttonStyleGreen}
      >
        ▶︎ このスタイルで授業を作成する
      </button>

      {/* AI振り返り解析ボタン */}
      <button
        onClick={() => setShowUpdateUI(true)}
        style={buttonStyleOrange}
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

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.3rem",
  padding: "0.4rem 0.8rem",
  backgroundColor: "#e0e0e0",
  borderRadius: "8px",
  textDecoration: "none",
  color: "#333",
  fontWeight: "bold",
  fontSize: "1rem",
  cursor: "pointer",
};

const buttonStyleGreen = {
  padding: "0.8rem 1.2rem",
  fontSize: "1.1rem",
  backgroundColor: "#4CAF50",
  color: "white",
  borderRadius: "10px",
  border: "none",
  marginBottom: "2rem",
  cursor: "pointer",
};

const buttonStyleOrange = {
  padding: "0.8rem 1.2rem",
  fontSize: "1.1rem",
  backgroundColor: "#FF9800",
  color: "white",
  borderRadius: "10px",
  border: "none",
  marginBottom: "2rem",
  cursor: "pointer",
};
