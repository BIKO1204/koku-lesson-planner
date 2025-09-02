"use client";

import React, { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  getDoc, // ← 追加
} from "firebase/firestore";

/* ---------- レスポンシブ判定 ---------- */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ---------- Timestamp 正規化 ---------- */
function normalizeTimestamp(input: any): number {
  if (!input) return 0;
  if (typeof input === "object" && typeof input.toDate === "function") {
    try {
      return input.toDate().getTime();
    } catch {
      return 0;
    }
  }
  if (
    typeof input === "object" &&
    typeof input.seconds === "number" &&
    typeof input.nanoseconds === "number"
  ) {
    return input.seconds * 1000 + Math.floor(input.nanoseconds / 1e6);
  }
  if (typeof input === "number") {
    if (input > 1e12) return input; // ms
    if (input > 1e9) return input * 1000; // sec
    return input;
  }
  if (typeof input === "string") {
    const t = Date.parse(input);
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

/* ---------- 全角数字→半角 & 授業の流れのキーから番号抽出 ---------- */
const toHalfWidthNumber = (s: string) =>
  s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

const extractStepNumber = (key: string) => {
  const half = toHalfWidthNumber(key);
  const m = half.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER; // 数字なしは末尾へ
};

type ParsedResult = { [key: string]: any };

type LessonPlan = {
  id: string;
  timestamp?: any;
  timestampMs: number;
  subject: string;
  grade: string;
  genre: string;
  unit: string;
  hours: number | string;
  languageActivities: string;
  usedStyleName?: string | null;
  result?: ParsedResult;
};

const LESSON_PLAN_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_writing",
  "lesson_plans_discussion",
  "lesson_plans_language_activity",
];

/* ---------- 実践記録コレクション & 警告用ラベル ---------- */
const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_writing",
  "practiceRecords_discussion",
  "practiceRecords_language_activity",
] as const;

const PRACTICE_LABELS: Record<string, string> = {
  practiceRecords_reading: "読解（実践記録）",
  practiceRecords_writing: "作文（実践記録）",
  practiceRecords_discussion: "話し合い（実践記録）",
  practiceRecords_language_activity: "言語活動（実践記録）",
};

/** 授業案 id に紐づく実践記録の有無を横断チェック（自分の記録のみ） */
async function findLinkedPracticeRecords(id: string, userEmail: string) {
  const linked: string[] = [];
  for (const coll of PRACTICE_COLLECTIONS) {
    try {
      const snap = await getDoc(doc(db, coll, id));
      if (snap.exists()) {
        const data = snap.data() as any;
        if (!userEmail || data?.author === userEmail) {
          linked.push(PRACTICE_LABELS[coll] || coll);
        }
      }
    } catch {
      /* 読み取りできないコレクションはスキップ */
    }
  }
  return linked;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [sortKey, setSortKey] = useState<"timestamp" | "grade" | "subject">(
    "timestamp"
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // Firestore から取得
  async function fetchMyPlansFromFirestore(): Promise<LessonPlan[]> {
    if (!userEmail) return [];
    const all: LessonPlan[] = [];
    for (const coll of LESSON_PLAN_COLLECTIONS) {
      const q = query(collection(db, coll), where("author", "==", userEmail));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = d.data() as any;
        const rawTs = data.timestamp ?? data.updatedAt ?? data.createdAt ?? null;
        const tsMs = normalizeTimestamp(rawTs);
        all.push({
          id: d.id,
          timestamp: rawTs,
          timestampMs: tsMs,
          subject: data.subject || "",
          grade: data.grade || "",
          genre: data.genre || "",
          unit: data.unit || "",
          hours: data.hours ?? "",
          languageActivities: data.languageActivities || "",
          usedStyleName: data.usedStyleName ?? null,
          result: data.result,
        });
      });
    }
    return all;
  }

  useEffect(() => {
    // ローカル保存分（timestamp を正規化）
    let local: LessonPlan[] = [];
    const stored = localStorage.getItem("lessonPlans");
    if (stored) {
      try {
        const arr = JSON.parse(stored) as any[];
        local = (arr || []).map((p) => {
          const tsRaw = p?.timestamp ?? p?.updatedAt ?? p?.createdAt ?? null;
          return {
            id: String(p.id),
            timestamp: tsRaw,
            timestampMs: normalizeTimestamp(tsRaw),
            subject: String(p.subject ?? ""),
            grade: String(p.grade ?? ""),
            genre: String(p.genre ?? ""),
            unit: String(p.unit ?? ""),
            hours: p.hours ?? "",
            languageActivities: String(p.languageActivities ?? ""),
            usedStyleName: p.usedStyleName ?? null,
            result: p.result,
          } as LessonPlan;
        });
      } catch {
        local = [];
      }
    }

    (async () => {
      const remote = await fetchMyPlansFromFirestore();

      // id で重複排除（優先：リモート > ローカル）
      const map = new Map<string, LessonPlan>();
      for (const r of local) map.set(r.id, r);
      for (const r of remote) map.set(r.id, r);

      const merged = Array.from(map.values());

      // 並び替え（既定：新着）
      const sorted = [...merged].sort((a, b) => {
        if (sortKey === "grade") {
          return String(a.grade).localeCompare(String(b.grade), "ja");
        }
        if (sortKey === "subject") {
          return String(a.subject).localeCompare(String(b.subject), "ja");
        }
        return (b.timestampMs || 0) - (a.timestampMs || 0);
      });

      setPlans(sorted);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, sortKey]);

  const sortedPlans = plans; // すでに sort 済み

  // Firestore 横断削除（事前に実践記録の存在を警告）
  const handleDeleteBoth = async (id: string) => {
    // 紐づく実践記録を事前チェック
    const linked = await findLinkedPracticeRecords(id, userEmail);

    const warnMsg = linked.length
      ? `この授業案に紐づく「実践記録」が見つかりました。\n${linked
          .map((l) => `・${l}`)
          .join(
            "\n"
          )}\n\n授業案を削除すると、これらの実践記録は残り、以後「授業案から編集」ができなくなります。\n（必要であれば「実践履歴」から個別に削除してください）\n\n授業案のみ削除してよろしいですか？`
      : "この授業案を本当に削除しますか？";

    if (!confirm(warnMsg)) return;

    let remoteDeleted = false;
    try {
      for (const coll of LESSON_PLAN_COLLECTIONS) {
        try {
          await deleteDoc(doc(db, coll, id));
          remoteDeleted = true;
        } catch {
          /* そのコレクションに無ければ無視 */
        }
      }
    } catch (e) {
      console.error("Firestore 削除エラー:", e);
      alert("Firestore 上の削除に失敗しました。");
      return;
    }

    // ローカルも更新
    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);

    const raw = localStorage.getItem("lessonPlans");
    if (raw) {
      try {
        const arr: any[] = JSON.parse(raw);
        const next = arr.filter((p) => String(p.id) !== id);
        localStorage.setItem("lessonPlans", JSON.stringify(next));
      } catch {}
    }

    alert(
      `削除しました（${remoteDeleted ? "Firestore・" : ""}ローカル）。${
        linked.length
          ? "\n※実践記録は残っています。必要に応じて「実践履歴」から削除してください。"
          : ""
      }`
    );
  };

  /* ---------- 共通ボタンスタイル ---------- */
  const buttonStyle = (bg: string): CSSProperties => ({
    flex: isMobile ? 1 : undefined,
    width: isMobile ? "auto" : "100%",
    padding: "10px 16px",
    borderRadius: 6,
    fontSize: "1rem",
    cursor: "pointer",
    color: "white",
    border: "none",
    textAlign: "center",
    backgroundColor: bg,
  });

  /* ---------- スタイル ---------- */
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
    textAlign: "left",
  };

  // ★ 追加：注釈ボックス
  const infoNoteStyle: CSSProperties = {
    background: "#fffef7",
    border: "1px solid #ffecb3",
    borderRadius: 8,
    padding: "12px",
    color: "#604a00",
    marginBottom: "12px",
    lineHeight: 1.6,
    fontSize: "0.95rem",
  };

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
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* メニュー全体 */}
      <div style={menuWrapperStyle} aria-hidden={!menuOpen}>
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
          <Link href="/plan/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📖 計画履歴
          </Link>
          <Link href="/practice/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📷 実践履歴
          </Link>
          <Link href="/practice/share" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            🌐 共有版実践記録
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
      <main
        style={{
          padding: isMobile ? "72px 16px 24px" : "72px 24px 24px",
          maxWidth: 960,
          margin: "auto",
        }}
      >
        <h2 style={{ fontSize: isMobile ? "1.6rem" : "2rem", marginBottom: 16 }}>
          保存された授業案一覧
        </h2>

        {/* ★ 追加：注釈ボックス */}
        <section style={infoNoteStyle} role="note">
          <p style={{ margin: 0 }}>
            このページには<strong>保存された授業案</strong>が一覧表示されます。各カードの
            <strong>「✍️ 実践記録」</strong>ボタンを押すと、その授業案に基づいた
            <strong>実践記録</strong>を作成できます。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            作成した実践記録は、
            <Link href="/practice/share" style={{ textDecoration: "underline" }}>
              共有版実践記録
            </Link>
            ページで公開し、他の先生方と実践を共有できます。ぜひ活用してください。
          </p>
        </section>

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
          <p style={{ textAlign: "center", fontSize: 18 }}>
            まだ授業案が保存されていません。
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sortedPlans.map((plan) => (
              <article
                key={plan.id}
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 16,
                  backgroundColor: "#fdfdfd",
                  border: "2px solid #ddd",
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                {/* 詳細 */}
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: isMobile ? "1.1rem" : "1.4rem",
                    }}
                  >
                    {plan.unit}
                  </h3>
                  <p>
                    <strong>学年・ジャンル：</strong>
                    {plan.grade}・{plan.genre}
                  </p>
                  <p>
                    <strong>モデル：</strong>
                    {plan.usedStyleName ?? "（未設定）"}
                  </p>
                  <p>
                    <strong>時間数：</strong>
                    {plan.hours}時間
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#555" }}>
                    {plan.timestampMs
                      ? new Date(plan.timestampMs).toLocaleString("ja-JP")
                      : ""}
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
                          {(Array.isArray(
                            plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
                          )
                            ? plan.result["評価の観点"]["主体的に学習に取り組む態度"]
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
                          育てたい子どもの姿
                        </div>
                        <p>{plan.result["育てたい子どもの姿"] || ""}</p>
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
                            Object.entries(plan.result["授業の流れ"])
                              .sort((a, b) => extractStepNumber(a[0]) - extractStepNumber(b[0]))
                              .map(([key, val], i) => (
                                <li key={`授業の流れ-${plan.id}-${key}-${i}`}>
                                  <strong>{key}：</strong> {String(val)}
                                </li>
                              ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>

                {/* ボタン列：PC=縦／スマホ=横 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    gap: 12,
                    width: isMobile ? "100%" : 140,
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    onClick={() => router.push(`/practice/add/${plan.id}`)}
                    style={buttonStyle("#4caf50")}
                  >
                    ✍️ 実践記録
                  </button>

                  <button
                    onClick={() => {
                      localStorage.setItem("editLessonPlan", JSON.stringify(plan));
                      router.push("/plan");
                    }}
                    style={buttonStyle("#ffb300")}
                  >
                    ✏️ 編集
                  </button>

                  <button
                    onClick={() => handleDeleteBoth(plan.id)}
                    style={buttonStyle("#f44336")}
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
