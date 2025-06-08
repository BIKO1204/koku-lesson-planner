"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore";

type ParsedResult = { [key: string]: any };

type LessonPlan = {
  id: string;
  timestamp: string;
  subject: string;
  grade: string;
  genre: string;
  unit: string;
  hours: number | string;
  languageActivities: string;
  usedStyleName?: string | null;
  result?: ParsedResult;
};

export default function HistoryPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [sortKey, setSortKey] = useState<"timestamp" | "grade" | "subject">("timestamp");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("lessonPlans");
    if (stored) {
      try {
        setPlans(JSON.parse(stored));
      } catch {
        setPlans([]);
      }
    }
  }, []);

  const sortedPlans = [...plans].sort((a, b) => {
    if (sortKey === "grade") {
      return String(a.grade).localeCompare(String(b.grade));
    }
    if (sortKey === "subject") {
      return String(a.subject).localeCompare(String(b.subject));
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleDeleteBoth = async (id: string) => {
    if (!confirm("この授業案を本当に削除しますか？")) return;

    try {
      await deleteDoc(doc(db, "lesson_plans", id));
    } catch (e) {
      console.error("Firestore 削除エラー:", e);
      alert("Firestore 上の削除に失敗しました。");
      return;
    }

    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);
    localStorage.setItem("lessonPlans", JSON.stringify(updated));
  };

  const handleEdit = (plan: LessonPlan) => {
    localStorage.setItem("editLessonPlan", JSON.stringify(plan));
    router.push("/plan");
  };

  return (
    <main style={mainStyle}>
      <nav style={navStyle}>
        <button onClick={() => router.push("/")} style={navLinkStyle}>🏠 ホーム</button>
        <Link href="/plan" style={navLinkStyle}>📋 授業作成</Link>
        <Link href="/plan/history" style={navLinkStyle}>📖 計画履歴</Link>
        <Link href="/practice/history" style={navLinkStyle}>📷 実践履歴</Link>
        <Link href="/models/create" style={navLinkStyle}>✏️ 教育観作成</Link>
        <Link href="/models" style={navLinkStyle}>📚 教育観一覧</Link>
        <Link href="/models/history" style={navLinkStyle}>🕒 教育観履歴</Link>
      </nav>

      <h2 style={{ fontSize: "1.8rem", marginBottom: 16 }}>保存された授業案一覧</h2>

      <label style={{ display: "block", textAlign: "right", marginBottom: 16 }}>
        並び替え：
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as any)}
          style={{ marginLeft: 8, padding: 6, fontSize: "1rem" }}
        >
          <option value="timestamp">新着順</option>
          <option value="grade">学年順</option>
          <option value="subject">教材名順</option>
        </select>
      </label>

      {sortedPlans.length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
          まだ授業案が保存されていません。
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {sortedPlans.map((plan) => (
            <article key={plan.id} style={cardStyle}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.4rem" }}>
                  {plan.unit}
                </h3>
                <p style={{ margin: "4px 0" }}>
                  <strong>学年・ジャンル：</strong>
                  {plan.grade}・{plan.genre}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>スタイル：</strong>
                  {plan.usedStyleName ?? "（未設定）"}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>時間数：</strong>
                  {plan.hours}時間
                </p>
                <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
                  {new Date(plan.timestamp).toLocaleString()}
                </p>

                {plan.result && (
                  <>
                    <div style={resultCardStyle}>
                      <div style={resultTitleStyle}>授業の概要</div>
                      <p>教科書名：{plan.result["教科書名"]}</p>
                      <p>学年：{plan.result["学年"]}</p>
                      <p>ジャンル：{plan.result["ジャンル"]}</p>
                      <p>単元名：{plan.result["単元名"]}</p>
                      <p>授業時間数：{plan.result["授業時間数"]}時間</p>
                      <p>
                        育てたい子どもの姿：
                        {plan.result["育てたい子どもの姿"] || ""}
                      </p>
                    </div>

                    <div style={resultCardStyle}>
                      <div style={resultTitleStyle}>単元の目標</div>
                      <p>{plan.result["単元の目標"]}</p>
                    </div>

                    <div style={resultCardStyle}>
                      <div style={resultTitleStyle}>評価の観点</div>

                      <strong>知識・技能</strong>
                      <ul style={listStyle}>
                        {(Array.isArray(plan.result["評価の観点"]?.["知識・技能"])
                          ? (plan.result["評価の観点"]!["知識・技能"] as string[])
                          : plan.result["評価の観点"]?.["知識・技能"]
                          ? [plan.result["評価の観点"]!["知識・技能"] as string]
                          : []
                        ).map((v, i) => (
                          <li key={`知識技能-${plan.id}-${v}-${i}`}>{v}</li>
                        ))}
                      </ul>

                      <strong>思考・判断・表現</strong>
                      <ul style={listStyle}>
                        {(Array.isArray(plan.result["評価の観点"]?.["思考・判断・表現"])
                          ? (plan.result["評価の観点"]!["思考・判断・表現"] as string[])
                          : plan.result["評価の観点"]?.["思考・判断・表現"]
                          ? [plan.result["評価の観点"]!["思考・判断・表現"] as string]
                          : []
                        ).map((v, i) => (
                          <li key={`思考判断表現-${plan.id}-${v}-${i}`}>{v}</li>
                        ))}
                      </ul>

                      <strong>主体的に学習に取り組む態度</strong>
                      <ul style={listStyle}>
                        {(Array.isArray(plan.result["評価の観点"]?.["主体的に学習に取り組む態度"])
                          ? (plan.result["評価の観点"]!["主体的に学習に取り組む態度"] as string[])
                          : plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
                          ? [plan.result["評価の観点"]!["主体的に学習に取り組む態度"] as string]
                          : plan.result["評価の観点"]?.["態度"]
                          ? [plan.result["評価の観点"]!["態度"] as string]
                          : []
                        ).map((v, i) => (
                          <li key={`主体的-${plan.id}-${v}-${i}`}>{v}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={resultCardStyle}>
                      <div style={resultTitleStyle}>言語活動の工夫</div>
                      <p>{plan.result["言語活動の工夫"]}</p>
                    </div>

                    <div style={resultCardStyle}>
                      <div style={resultTitleStyle}>授業の流れ</div>
                      <ul style={listStyle}>
                        {plan.result["授業の流れ"] &&
                          typeof plan.result["授業の流れ"] === "object" &&
                          Object.entries(plan.result["授業の流れ"] as Record<string, string>).map(
                            ([key, val], i) => (
                              <li key={`授業の流れ-${plan.id}-${key}-${i}`}>
                                <strong>{key}：</strong> {val}
                              </li>
                            )
                          )}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              <div style={buttonContainerStyle}>
                <button onClick={() => router.push(`/practice/add/${plan.id}`)} style={actionButtonStyle}>
                  ✍️ 実践記録
                </button>

                <button onClick={() => handleEdit(plan)} style={editButtonStyle}>
                  ✏️ 編集
                </button>

                <button onClick={() => handleDeleteBoth(plan.id)} style={deleteButtonStyle}>
                  🗑 削除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  padding: 24,
  fontFamily: "sans-serif",
  maxWidth: 960,
  margin: "0 auto",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  overflowX: "auto",
  marginBottom: 24,
  justifyContent: "center",
};

const navLinkStyle: React.CSSProperties = {
  padding: "8px 12px",
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: "1rem",
  textDecoration: "none",
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  backgroundColor: "#fdfdfd",
  border: "2px solid #ddd",
  borderRadius: 12,
  padding: "16px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

const resultCardStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 12,
  marginTop: 12,
};

const resultTitleStyle: React.CSSProperties = {
  fontWeight: "bold",
  marginBottom: 8,
  fontSize: "1rem",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  paddingLeft: 0,
  margin: 0,
};

const buttonContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 140,
  flexShrink: 0,
};

const commonButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  borderRadius: 6,
  fontSize: "1rem",
  cursor: "pointer",
  color: "white",
  border: "none",
  textAlign: "center",
  boxSizing: "border-box",
};

const actionButtonStyle: React.CSSProperties = {
  ...commonButtonStyle,
  backgroundColor: "#4CAF50",
};

const editButtonStyle: React.CSSProperties = {
  ...commonButtonStyle,
  backgroundColor: "#FFB300",
};

const deleteButtonStyle: React.CSSProperties = {
  ...commonButtonStyle,
  backgroundColor: "#f44336",
};
