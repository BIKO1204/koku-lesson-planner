"use client";

import { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore";
import { signOut } from "next-auth/react";

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
  const [menuOpen, setMenuOpen] = useState(false);
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

  const toggleMenu = () => setMenuOpen((prev) => !prev);

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

  // --- スタイル ---
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
    transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.3s ease",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
  };
  const menuScrollStyle: CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    paddingBottom: 0,
  };
  const logoutButtonStyle: CSSProperties = {
    padding: "0.75rem 1rem",
    backgroundColor: "#e53935",
    color: "white",
    fontWeight: "bold",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    margin: "1rem",
    position: "relative",
    zIndex: 1000,
  };
  const overlayStyle: CSSProperties = {
    position: "fixed",
    top: 56,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.3)",
    opacity: menuOpen ? 1 : 0,
    visibility: menuOpen ? "visible" : "hidden",
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

  return (
    <>
      <style>{`
        /* スマホ向け */
        @media (max-width: 600px) {
          article {
            flex-direction: column !important;
          }
          article > div:first-child {
            max-width: 100% !important;
          }
          article > div:last-child {
            flex-direction: row !important;
            width: 100% !important;
            gap: 8px !important;
          }
          article > div:last-child > button {
            flex: 1 1 auto !important;
          }
        }
      `}</style>

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
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* メニュー全体 */}
      <div style={menuWrapperStyle} aria-hidden={!menuOpen}>
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

      {/* メインコンテンツ */}
      <main style={{ padding: "72px 24px 24px 24px", maxWidth: 960, margin: "auto" }}>
        <h2>保存された授業案一覧</h2>

        <label style={{ display: "block", marginBottom: 16, textAlign: "right" }}>
          並び替え：
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            style={{ marginLeft: 8, padding: 6, fontSize: 16 }}
          >
            <option value="timestamp">新着順</option>
            <option value="grade">学年順</option>
            <option value="subject">教材名順</option>
          </select>
        </label>

        {sortedPlans.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: 18 }}>まだ授業案が保存されていません。</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {sortedPlans.map((plan) => (
              <article
                key={plan.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  backgroundColor: "#fdfdfd",
                  border: "2px solid #ddd",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    maxWidth: "calc(100% - 160px)",
                    boxSizing: "border-box",
                  }}
                >
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1.4rem" }}>{plan.unit}</h3>
                  <p>
                    <strong>学年・ジャンル：</strong>
                    {plan.grade}・{plan.genre}
                  </p>
                  <p>
                    <strong>スタイル：</strong>
                    {plan.usedStyleName ?? "（未設定）"}
                  </p>
                  <p>
                    <strong>時間数：</strong>
                    {plan.hours}時間
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#555" }}>
                    {new Date(plan.timestamp).toLocaleString()}
                  </p>

                  {plan.result && (
                    <>
                      <div
                        style={{
                          backgroundColor: "#fafafa",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 12,
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: "1rem" }}>
                          授業の概要
                        </div>
                        <p>教科書名：{plan.result["教科書名"]}</p>
                        <p>学年：{plan.result["学年"]}</p>
                        <p>ジャンル：{plan.result["ジャンル"]}</p>
                        <p>単元名：{plan.result["単元名"]}</p>
                        <p>授業時間数：{plan.result["授業時間数"]}時間</p>
                        <p>育てたい子どもの姿：{plan.result["育てたい子どもの姿"] || ""}</p>
                      </div>

                      <div
                        style={{
                          backgroundColor: "#fafafa",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 12,
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: "1rem" }}>
                          単元の目標
                        </div>
                        <p>{plan.result["単元の目標"]}</p>
                      </div>

                      <div
                        style={{
                          backgroundColor: "#fafafa",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 12,
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: "1rem" }}>
                          評価の観点
                        </div>

                        <strong>知識・技能</strong>
                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                          {(Array.isArray(plan.result["評価の観点"]?.["知識・技能"])
                            ? plan.result["評価の観点"]["知識・技能"]
                            : plan.result["評価の観点"]?.["知識・技能"]
                            ? [plan.result["評価の観点"]["知識・技能"]]
                            : []
                          ).map((v: string, i: number) => (
                            <li key={`知識技能-${plan.id}-${v}-${i}`}>{v}</li>
                          ))}
                        </ul>

                        <strong>思考・判断・表現</strong>
                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                          {(Array.isArray(plan.result["評価の観点"]?.["思考・判断・表現"])
                            ? plan.result["評価の観点"]["思考・判断・表現"]
                            : plan.result["評価の観点"]?.["思考・判断・表現"]
                            ? [plan.result["評価の観点"]["思考・判断・表現"]]
                            : []
                          ).map((v: string, i: number) => (
                            <li key={`思考判断表現-${plan.id}-${v}-${i}`}>{v}</li>
                          ))}
                        </ul>

                        <strong>主体的に学習に取り組む態度</strong>
                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                          {(Array.isArray(plan.result["評価の観点"]?.["主体的に学習に取り組む態度"])
                            ? plan.result["評価の観点"]["主体的に学習に取り組む態度"]
                            : plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
                            ? [plan.result["評価の観点"]["主体的に学習に取り組む態度"]]
                            : plan.result["評価の観点"]?.["態度"]
                            ? [plan.result["評価の観点"]["態度"]]
                            : []
                          ).map((v: string, i: number) => (
                            <li key={`主体的-${plan.id}-${v}-${i}`}>{v}</li>
                          ))}
                        </ul>
                      </div>

                      <div
                        style={{
                          backgroundColor: "#fafafa",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 12,
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: "1rem" }}>
                          言語活動の工夫
                        </div>
                        <p>{plan.result["言語活動の工夫"]}</p>
                      </div>

                      <div
                        style={{
                          backgroundColor: "#fafafa",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 12,
                        }}
                      >
                        <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: "1rem" }}>
                          授業の流れ
                        </div>
                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                          {plan.result["授業の流れ"] &&
                            typeof plan.result["授業の流れ"] === "object" &&
                            Object.entries(plan.result["授業の流れ"]).map(
                              ([key, val], i) => (
                                <li key={`授業の流れ-${plan.id}-${key}-${i}`}>
                                  <strong>{key}：</strong> {String(val)}
                                </li>
                              )
                            )}
                        </ul>
                      </div>
                    </>
                  )}

                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    width: 140,
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    onClick={() => router.push(`/practice/add/${plan.id}`)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 6,
                      fontSize: "1rem",
                      cursor: "pointer",
                      color: "white",
                      border: "none",
                      textAlign: "center",
                      backgroundColor: "#4caf50",
                    }}
                  >
                    ✍️ 実践記録
                  </button>

                  <button
                    onClick={() => {
                      localStorage.setItem("editLessonPlan", JSON.stringify(plan));
                      router.push("/plan");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 6,
                      fontSize: "1rem",
                      cursor: "pointer",
                      color: "white",
                      border: "none",
                      textAlign: "center",
                      backgroundColor: "#ffb300",
                    }}
                  >
                    ✏️ 編集
                  </button>

                  <button
                    onClick={() => handleDeleteBoth(plan.id)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 6,
                      fontSize: "1rem",
                      cursor: "pointer",
                      color: "white",
                      border: "none",
                      textAlign: "center",
                      backgroundColor: "#f44336",
                    }}
                  >
                    🗑 削除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
