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
    <>
      <style>{`
        /* ベース */
        body {
          font-family: sans-serif;
          padding: 24px;
          margin: 0 auto;
          max-width: 960px;
          font-size: 14px;
        }
        nav {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          margin-bottom: 24px;
          justify-content: center;
        }
        nav button, nav a {
          padding: 8px 12px;
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          flex-shrink: 0;
        }
        h2 {
          font-size: 1.8rem;
          margin-bottom: 16px;
        }
        label {
          display: block;
          text-align: right;
          margin-bottom: 16px;
        }
        select {
          margin-left: 8px;
          padding: 6px;
          font-size: 1rem;
        }
        p.empty-message {
          text-align: center;
          font-size: 1.2rem;
        }

        /* 授業案カード */
        article.card {
          display: flex;
          flex-wrap: wrap;
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
          background-color: #fdfdfd;
          border: 2px solid #ddd;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          gap: 16px;
        }
        .left-content {
          flex: 1 1 auto;
          min-width: 0;
          max-width: calc(100% - 160px);
          box-sizing: border-box;
        }
        .result-card {
          background-color: #fafafa;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
        }
        .result-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 1rem;
        }
        ul.list-no-style {
          list-style: none;
          padding-left: 0;
          margin: 0;
        }

        /* ボタン群 */
        .button-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 140px;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        button.action-button {
          width: 100%;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          color: white;
          border: none;
          text-align: center;
          box-sizing: border-box;
        }
        button.action-button.practice {
          background-color: #4caf50;
        }
        button.action-button.edit {
          background-color: #ffb300;
        }
        button.action-button.delete {
          background-color: #f44336;
        }

        /* スマホ向け */
        @media (max-width: 600px) {
          body {
            font-size: 16px;
            padding: 12px;
          }
          article.card {
            flex-direction: column;
          }
          .left-content {
            max-width: 100%;
          }
          .button-container {
            width: 100%;
            flex-direction: row;
            gap: 8px;
          }
          .button-container button {
            flex: 1;
          }
          nav {
            justify-content: flex-start;
          }
        }

        /* タブレット向け */
        @media (min-width: 601px) and (max-width: 900px) {
          body {
            font-size: 15px;
            padding: 20px;
          }
          article.card {
            flex-direction: row;
          }
          .left-content {
            max-width: calc(100% - 160px);
          }
          .button-container {
            width: 140px;
            flex-direction: column;
          }
          nav {
            justify-content: center;
          }
        }
      `}</style>

      <main>
        <nav>
          <button onClick={() => router.push("/")}>🏠 ホーム</button>
          <Link href="/plan">📋 授業作成</Link>
          <Link href="/plan/history">📖 計画履歴</Link>
          <Link href="/practice/history">📷 実践履歴</Link>
          <Link href="/models/create">✏️ 教育観作成</Link>
          <Link href="/models">📚 教育観一覧</Link>
          <Link href="/models/history">🕒 教育観履歴</Link>
        </nav>

        <h2>保存された授業案一覧</h2>

        <label>
          並び替え：
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
          >
            <option value="timestamp">新着順</option>
            <option value="grade">学年順</option>
            <option value="subject">教材名順</option>
          </select>
        </label>

        {sortedPlans.length === 0 ? (
          <p className="empty-message">まだ授業案が保存されていません。</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {sortedPlans.map((plan) => (
              <article key={plan.id} className="card">
                <div className="left-content">
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1.4rem" }}>
                    {plan.unit}
                  </h3>
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
                      <div className="result-card">
                        <div className="result-title">授業の概要</div>
                        <p>教科書名：{plan.result["教科書名"]}</p>
                        <p>学年：{plan.result["学年"]}</p>
                        <p>ジャンル：{plan.result["ジャンル"]}</p>
                        <p>単元名：{plan.result["単元名"]}</p>
                        <p>授業時間数：{plan.result["授業時間数"]}時間</p>
                        <p>育てたい子どもの姿：{plan.result["育てたい子どもの姿"] || ""}</p>
                      </div>

                      <div className="result-card">
                        <div className="result-title">単元の目標</div>
                        <p>{plan.result["単元の目標"]}</p>
                      </div>

                      <div className="result-card">
                        <div className="result-title">評価の観点</div>

                        <strong>知識・技能</strong>
                        <ul className="list-no-style">
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
                        <ul className="list-no-style">
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
                        <ul className="list-no-style">
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

                      <div className="result-card">
                        <div className="result-title">言語活動の工夫</div>
                        <p>{plan.result["言語活動の工夫"]}</p>
                      </div>

                      <div className="result-card">
                        <div className="result-title">授業の流れ</div>
                        <ul className="list-no-style">
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

                <div className="button-container">
                  <button
                    onClick={() => router.push(`/practice/add/${plan.id}`)}
                    className="action-button practice"
                  >
                    ✍️ 実践記録
                  </button>

                  <button onClick={() => handleEdit(plan)} className="action-button edit">
                    ✏️ 編集
                  </button>

                  <button onClick={() => handleDeleteBoth(plan.id)} className="action-button delete">
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
