"use client";

import { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openDB } from "idb";
import { signOut, useSession } from "next-auth/react";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc as deleteDocFs,
  setDoc,            // ← 追加
  getDoc,            // ← 追加
  serverTimestamp,   // ← 追加
} from "firebase/firestore";

// ---------- 型 ----------
type BoardImage = { name: string; src: string };

type PracticeRecord = {
  lessonId: string;
  lessonTitle: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  grade?: string;
  genre?: string;       // ← 追加
  unitName?: string;    // ← 追加
  modelType?: string;   // lesson_plans_XXX / practiceRecords_XXX の短縮識別 (reading/writing/...)
  author?: string;      // 保存時のメール
  authorName?: string;  // 表示用
};

type LessonPlan = {
  id: string;
  modelType: string; // reading / writing / discussion / language_activity
  result: any;
};

// ---------- IndexedDB ----------
const DB_NAME = "PracticeDB";
const STORE_NAME = "practiceRecords";
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "lessonId" });
      }
    },
  });
}

async function getAllLocalRecords(): Promise<PracticeRecord[]> {
  const dbx = await getDB();
  return dbx.getAll(STORE_NAME);
}

async function deleteLocalRecord(lessonId: string) {
  const dbx = await getDB();
  await dbx.delete(STORE_NAME, lessonId);
}

// ---------- Firestore 取得系 ----------
const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_writing",
  "practiceRecords_discussion",
  "practiceRecords_language_activity",
];

const LESSON_PLAN_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_writing",
  "lesson_plans_discussion",
  "lesson_plans_language_activity",
];

function normalizeModelType(name: string) {
  return name.replace(/^lesson_plans_/, "").replace(/^practiceRecords_/, "");
}

async function fetchRemotePracticeRecords(
  userEmail: string
): Promise<PracticeRecord[]> {
  if (!userEmail) return [];
  const all: PracticeRecord[] = [];
  for (const coll of PRACTICE_COLLECTIONS) {
    const qy = query(collection(db, coll), where("author", "==", userEmail));
    const snap = await getDocs(qy);
    snap.forEach((d) => {
      const data = d.data() as any;
      all.push({
        lessonId: d.id,
        lessonTitle: data.lessonTitle || "",
        practiceDate: data.practiceDate || "",
        reflection: data.reflection || "",
        boardImages: Array.isArray(data.boardImages) ? data.boardImages : [],
        grade: data.grade || "",
        genre: data.genre || "",            // ← 追加
        unitName: data.unitName || "",      // ← 追加
        modelType: normalizeModelType(data.modelType || coll), // => reading など
        author: data.author || "",
        authorName: data.authorName || "",
      });
    });
  }
  return all;
}

async function fetchAllLessonPlans(): Promise<LessonPlan[]> {
  let allPlans: LessonPlan[] = [];
  for (const collectionName of LESSON_PLAN_COLLECTIONS) {
    const snap = await getDocs(collection(db, collectionName));
    const plans = snap.docs.map((d) => ({
      id: d.id,
      modelType: normalizeModelType(collectionName), // => reading など
      result: (d.data() as any).result,
    }));
    allPlans = allPlans.concat(plans);
  }
  return allPlans;
}

// ---------- 追加: PDF最適化ユーティリティ ----------
function isSmallDevice(): boolean {
  if (typeof window === "undefined") return false;
  const touch = "ontouchstart" in window || (navigator as any).maxTouchPoints > 0;
  const narrow =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 820px)").matches
      : window.innerWidth <= 820;
  return touch && narrow;
}

function sanitizeFilename(name: string) {
  const fallback = "実践記録";
  const base = (name || fallback).trim();
  return base.replace(/[\\\/:*?"<>|]+/g, "_").slice(0, 100);
}

// コンポーネント内に注入する印刷向けCSS
const H2PDF_PRINT_CSS = `
/* 分割回避ヘルパー */
.h2pdf-avoid { break-inside: avoid; page-break-inside: avoid; }
.h2pdf-root img, .h2pdf-root figure, .h2pdf-root .h2pdf-block { break-inside: avoid; page-break-inside: avoid; }
.h2pdf-break-before { break-before: page; page-break-before: always; }
.h2pdf-break-after { break-after: page; page-break-after: always; }

/* 画像が大きすぎる時のはみ出し防止 */
.h2pdf-root img { max-width: 100%; height: auto; }

/* リストの孤立行回避（できる範囲） */
.h2pdf-root li { break-inside: avoid; page-break-inside: avoid; }
`;

// ---------- コンポーネント本体 ----------
export default function PracticeHistoryPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [sortKey, setSortKey] = useState<
    "practiceDate" | "lessonTitle" | "grade"
  >("practiceDate");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null); // ← 追加

  const router = useRouter();
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  useEffect(() => {
    (async () => {
      // ローカル
      const local = await getAllLocalRecords();

      // リモート（自分の記録のみ）
      const remote = await fetchRemotePracticeRecords(userEmail);

      // lesson plans（表示補助用）
      fetchAllLessonPlans()
        .then(setLessonPlans)
        .catch(() => setLessonPlans([]));

      // lessonId をキーにマージ（優先：リモート > ローカル）
      const map = new Map<string, PracticeRecord>();
      for (const r of local) map.set(r.lessonId, r);
      for (const r of remote) map.set(r.lessonId, r);
      const merged = Array.from(map.values());

      // 並び替え
      setRecords(sortRecords(merged, sortKey));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  useEffect(() => {
    setRecords((prev) => sortRecords(prev, sortKey));
  }, [sortKey]);

  const gradeOrder = ["1年", "2年", "3年", "4年", "5年", "6年"];

  function sortRecords(list: PracticeRecord[], key: typeof sortKey) {
    const arr = [...list];
    if (key === "practiceDate") {
      return arr.sort((a, b) =>
        (b.practiceDate || "").localeCompare(a.practiceDate || "")
      );
    } else if (key === "grade") {
      return arr.sort((a, b) => {
        const ai = gradeOrder.indexOf(a.grade || "");
        const bi = gradeOrder.indexOf(b.grade || "");
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    } else {
      return arr.sort((a, b) =>
        (a.lessonTitle || "").localeCompare(b.lessonTitle || "")
      );
    }
  }

  async function handleDelete(lessonId: string) {
    if (!confirm("この実践記録を削除しますか？")) return;
    setDeletingId(lessonId);
    try {
      // 1) ローカル削除
      await deleteLocalRecord(lessonId);

      // 2) リモート削除（存在するコレクションだけ）
      for (const coll of PRACTICE_COLLECTIONS) {
        try {
          await deleteDocFs(doc(db, coll, lessonId));
        } catch {
          // そのコレクションに無ければ無視
        }
      }

      setRecords((prev) => prev.filter((r) => r.lessonId !== lessonId));
      alert("削除しました（ローカル・Firestore）");
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました。");
    } finally {
      setDeletingId(null);
    }
  }

  // ← 追加：実践記録から授業案を復元
  async function handleRestoreFromPractice(rec: PracticeRecord) {
    const short = normalizeModelType(rec.modelType || "reading");
    const coll = `lesson_plans_${short}`;
    const unit = rec.unitName || rec.lessonTitle || "";

    // 念のため Firestore 最新を確認（既に存在したらスキップ）
    try {
      const existing = await getDoc(doc(db, coll, rec.lessonId));
      if (existing.exists()) {
        alert("この授業案は既に存在します。");
        // 一覧の補助データも更新しておく
        setLessonPlans((prev) =>
          prev.some((p) => p.id === rec.lessonId)
            ? prev
            : [
                ...prev,
                {
                  id: rec.lessonId,
                  modelType: short,
                  result: (existing.data() as any)?.result ?? {},
                },
              ]
        );
        return;
      }
    } catch {
      /* 読み取り失敗時は続行して作成を試みる */
    }

    if (
      !confirm(
        `実践記録から授業案を復元します。\n\n作成先: ${coll}\n単元名: ${unit || "（未設定）"}\n学年: ${
          rec.grade || "（未設定）"
        }\nジャンル: ${rec.genre || "（未設定）"}\n\nよろしいですか？`
      )
    ) {
      return;
    }

    setRestoringId(rec.lessonId);
    try {
      const authorEmail = rec.author || userEmail || "";
      const resultPayload = {
        "教科書名": "",
        "学年": rec.grade || "",
        "ジャンル": rec.genre || "",
        "単元名": unit,
        "授業時間数": "",
        "単元の目標": "",
        "育てたい子どもの姿": "",
        "言語活動の工夫": "",
        "授業の流れ": "",
      };

      await setDoc(
        doc(db, coll, rec.lessonId),
        {
          author: authorEmail,
          grade: rec.grade || "",
          genre: rec.genre || "",
          unit: unit,
          subject: "",               // 不明なため空で作成
          hours: "",                 // 不明なため空で作成
          languageActivities: "",    // 不明なため空で作成
          usedStyleName: null,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          result: resultPayload,
        },
        { merge: true }
      );

      // UI側の補助データにも追加
      setLessonPlans((prev) => [
        ...prev,
        { id: rec.lessonId, modelType: short, result: resultPayload },
      ]);

      alert("授業案を復元しました。授業案一覧から編集できます。");
    } catch (e) {
      console.error(e);
      alert("授業案の復元に失敗しました。");
    } finally {
      setRestoringId(null);
    }
  }

  // --- スタイル群（既存UI踏襲） ---
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
    height: "100vh",
    backgroundColor: "#f0f0f0",
    boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
    transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
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

  const cardStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fdfdfd",
    border: "2px solid #ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
    wordBreak: "break-word",
  };

  const buttonBaseStyle: CSSProperties = {
    padding: "8px 12px",
    fontSize: "0.9rem",
    borderRadius: 6,
    cursor: "pointer",
    width: "140px",
    height: "36px",
    boxSizing: "border-box",
    color: "white",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
  };

  const pdfBtn: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#FF9800",
  };
  const driveBtn: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#2196F3",
  };
  const actionBtn: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#4CAF50",
  };
  const deleteBtn: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#f44336",
  };
  const restoreBtn: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#673ab7", // 紫系
  };

  const planBlockStyle: CSSProperties = {
    backgroundColor: "#fafafa",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    whiteSpace: "normal",
    fontFamily: "sans-serif",
    fontSize: "0.9rem",
  };

  const mainContainerStyle: CSSProperties = {
    padding: 16,
    fontFamily: "sans-serif",
    maxWidth: 960,
    width: "100%",
    margin: "0 auto",
    paddingTop: 72,
  };

  // ヘルパー（配列化）
  const asArray = (v: any): string[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.trim()) return [v];
    return [];
  };

  return (
    <>
      {/* PDF分割回避用CSSを注入 */}
      <style dangerouslySetInnerHTML={{ __html: H2PDF_PRINT_CSS }} />

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
      <main style={mainContainerStyle}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: 16 }}>実践記録一覧</h2>

        {/* 共有ページへのリンク */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/practice/share"
            style={{
              display: "inline-block",
              backgroundColor: "#2196F3",
              color: "white",
              padding: "8px 16px",
              borderRadius: 6,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            共有版実践記録を見る
          </Link>
        </div>

        {/* 並び替え */}
        <label style={{ display: "block", textAlign: "right", marginBottom: 16 }}>
          並び替え：
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            style={{ marginLeft: 8, padding: 6, fontSize: "1rem" }}
          >
            <option value="practiceDate">新着順</option>
            <option value="grade">学年順</option>
            <option value="lessonTitle">教材名順</option>
          </select>
        </label>

        {records.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
            まだ実践記録がありません。
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {records.map((r) => {
              // ※ 表示用 detail は modelType が一致する plan を優先
              const planForDisplay = lessonPlans.find(
                (p) =>
                  p.id === r.lessonId &&
                  p.modelType === normalizeModelType(r.modelType || "")
              );
              // 存在チェックはコレクション横断（id 一致のみで判定）
              const planAny = lessonPlans.find((p) => p.id === r.lessonId);

              // 編集ページへ modelType を付けて渡す（別端末同期を確実・高速化）
              const editHref = `/practice/add/${r.lessonId}?modelType=practiceRecords_${normalizeModelType(
                r.modelType || "reading"
              )}`;

              // PDF設定（端末に応じて最適値）
              const scaleVal = isSmallDevice() ? 2.2 : 2.6;

              return (
                <article key={r.lessonId} style={cardStyle}>
                  {/* PDF化対象ルート。分割回避ルールを適用 */}
                  <div
                    id={`record-${r.lessonId}`}
                    className="h2pdf-root h2pdf-avoid"
                    style={{ flex: 1 }}
                  >
                    <h3 style={{ margin: "0 0 8px" }}>
                      {r.lessonTitle || "タイトルなし"}
                    </h3>

                    {planForDisplay && typeof planForDisplay.result === "object" && (
                      <div className="h2pdf-avoid h2pdf-block" style={planBlockStyle}>
                        <strong>授業案</strong>
                        <div>
                          <p>
                            <strong>教科書名：</strong>
                            {planForDisplay.result["教科書名"] || "－"}
                          </p>
                          <p>
                            <strong>単元名：</strong>
                            {planForDisplay.result["単元名"] || "－"}
                          </p>
                          <p>
                            <strong>授業時間数：</strong>
                            {planForDisplay.result["授業時間数"] ?? "－"}時間
                          </p>
                          <p style={{ whiteSpace: "pre-wrap" }}>
                            <strong>単元の目標：</strong>
                            {planForDisplay.result["単元の目標"] || "－"}
                          </p>

                          {/* ▼ 評価の観点 */}
                          {planForDisplay.result["評価の観点"] && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                                評価の観点
                              </div>

                              <div>
                                <strong>知識・技能</strong>
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                  {asArray(
                                    planForDisplay.result["評価の観点"]?.["知識・技能"]
                                  ).map((v, i) => (
                                    <li
                                      key={`eval-k-${r.lessonId}-${i}`}
                                      style={{ whiteSpace: "pre-wrap" }}
                                      className="h2pdf-avoid"
                                    >
                                      {v}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div style={{ marginTop: 4 }}>
                                <strong>思考・判断・表現</strong>
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                  {asArray(
                                    planForDisplay.result["評価の観点"]?.["思考・判断・表現"]
                                  ).map((v, i) => (
                                    <li
                                      key={`eval-t-${r.lessonId}-${i}`}
                                      style={{ whiteSpace: "pre-wrap" }}
                                      className="h2pdf-avoid"
                                    >
                                      {v}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div style={{ marginTop: 4 }}>
                                <strong>主体的に学習に取り組む態度</strong>
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                  {asArray(
                                    planForDisplay.result["評価の観点"]?.[
                                      "主体的に学習に取り組む態度"
                                    ] ?? planForDisplay.result["評価の観点"]?.["態度"]
                                  ).map((v, i) => (
                                    <li
                                      key={`eval-a-${r.lessonId}-${i}`}
                                      style={{ whiteSpace: "pre-wrap" }}
                                      className="h2pdf-avoid"
                                    >
                                      {v}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          {/* ▲ 評価の観点 */}

                          {/* ▼ 育てたい子どもの姿 */}
                          <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                            <strong>育てたい子どもの姿：</strong>
                            {planForDisplay.result["育てたい子どもの姿"] || "－"}
                          </p>
                          {/* ▲ */}

                          {/* ▼ 言語活動の工夫 */}
                          <p style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                            <strong>言語活動の工夫：</strong>
                            {planForDisplay.result["言語活動の工夫"] || "－"}
                          </p>
                          {/* ▲ */}
                        </div>

                        {/* ▼ 授業の流れ（PDFにも入る） */}
                        {planForDisplay.result["授業の流れ"] && (
                          <div style={{ marginTop: 12 }} className="h2pdf-avoid">
                            <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                              授業の流れ
                            </div>

                            {typeof planForDisplay.result["授業の流れ"] === "string" && (
                              <p style={{ whiteSpace: "pre-wrap" }}>
                                {planForDisplay.result["授業の流れ"]}
                              </p>
                            )}

                            {Array.isArray(planForDisplay.result["授業の流れ"]) && (
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {planForDisplay.result["授業の流れ"].map(
                                  (item: any, i: number) => (
                                    <li
                                      key={`flow-${r.lessonId}-${i}`}
                                      style={{ whiteSpace: "pre-wrap" }}
                                      className="h2pdf-avoid"
                                    >
                                      {typeof item === "string"
                                        ? item
                                        : JSON.stringify(item)}
                                    </li>
                                  )
                                )}
                              </ul>
                            )}

                            {typeof planForDisplay.result["授業の流れ"] === "object" &&
                              !Array.isArray(planForDisplay.result["授業の流れ"]) && (
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                  {Object.entries(
                                    planForDisplay.result["授業の流れ"]
                                  )
                                    .sort((a, b) => {
                                      const numA = parseInt(
                                        (a[0].match(/\d+/) || ["0"])[0],
                                        10
                                      );
                                      const numB = parseInt(
                                        (b[0].match(/\d+/) || ["0"])[0],
                                        10
                                      );
                                      return numA - numB;
                                    })
                                    .map(([key, val], i) => (
                                      <li
                                        key={`flow-${r.lessonId}-${key}-${i}`}
                                        style={{ whiteSpace: "pre-wrap" }}
                                        className="h2pdf-avoid"
                                      >
                                        <strong>{key}：</strong>{" "}
                                        {typeof val === "string"
                                          ? val
                                          : JSON.stringify(val)}
                                      </li>
                                    ))}
                                </ul>
                              )}
                          </div>
                        )}
                        {/* ▲ 授業の流れ */}
                      </div>
                    )}

                    <p style={{ marginTop: 16 }} className="h2pdf-avoid">
                      <strong>実践開始日：</strong> {r.practiceDate}
                    </p>
                    <p className="h2pdf-avoid">
                      <strong>作成者：</strong> {r.authorName || "不明"}
                    </p>
                    <p className="h2pdf-avoid">
                      <strong>学年：</strong> {r.grade || "－"}
                      {r.genre ? `　/　ジャンル：${r.genre}` : ""}
                    </p>
                    <p style={{ whiteSpace: "pre-wrap" }} className="h2pdf-avoid">
                      <strong>振り返り：</strong>
                      <br />
                      {r.reflection}
                    </p>

                    {r.boardImages?.length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                        className="h2pdf-avoid"
                      >
                        {r.boardImages.map((img, i) => (
                          <div
                            key={`${img.name}-${i}`}
                            style={{ width: "100%" }}
                            className="h2pdf-avoid h2pdf-block"
                          >
                            <div style={{ marginBottom: 6, fontWeight: "bold" }}>
                              板書{i + 1}
                            </div>
                            <img
                              src={img.src}
                              alt={img.name}
                              crossOrigin="anonymous"
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: 8,
                                border: "1px solid #ccc",
                                display: "block",
                                maxWidth: "100%",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 16,
                      justifyContent: "flex-start",
                    }}
                  >
                    <button
                      onClick={() => {
                        import("html2pdf.js").then(({ default: html2pdf }) => {
                          const el = document.getElementById(
                            `record-${r.lessonId}`
                          );
                          if (!el)
                            return alert(
                              "PDF化用の要素が見つかりませんでした。"
                            );
                          html2pdf()
                            .from(el)
                            .set({
                              margin: [5, 5, 5, 5],
                              filename: `${sanitizeFilename(r.lessonTitle)}.pdf`,
                              jsPDF: {
                                unit: "mm",
                                format: "a4",
                                orientation: "portrait",
                              },
                              html2canvas: { useCORS: true, scale: scaleVal },
                              pagebreak: { mode: ["css", "legacy", "avoid-all"] },
                            })
                            .save();
                        });
                      }}
                      style={pdfBtn}
                    >
                      📄 PDF保存
                    </button>

                    <button
                      onClick={() => {
                        import("html2pdf.js").then(
                          async ({ default: html2pdf }) => {
                            const el = document.getElementById(
                              `record-${r.lessonId}`
                            );
                            if (!el)
                              return alert(
                                "Drive保存用の要素が見つかりませんでした。"
                              );
                            const pdfBlob = await html2pdf()
                              .from(el)
                              .set({
                                margin: [5, 5, 5, 5],
                                jsPDF: {
                                  unit: "mm",
                                  format: "a4",
                                  orientation: "portrait",
                                },
                                html2canvas: { useCORS: true, scale: scaleVal },
                                pagebreak: { mode: ["css", "legacy", "avoid-all"] },
                              })
                              .outputPdf("blob");
                            try {
                              const { uploadToDrive } = await import(
                                "../../../lib/drive"
                              );
                              await uploadToDrive(
                                pdfBlob,
                                `${sanitizeFilename(r.lessonTitle)}.pdf`,
                                "application/pdf"
                              );
                              alert("Driveへの保存が完了しました。");
                            } catch (e) {
                              console.error(e);
                              alert("Drive保存に失敗しました。");
                            }
                          }
                        );
                      }}
                      style={driveBtn}
                    >
                      ☁️ Drive保存
                    </button>

                    {/* 授業案が見つからない時だけ 復元ボタンを表示 */}
                    {!planAny && (
                      <button
                        onClick={() => handleRestoreFromPractice(r)}
                        style={restoreBtn}
                        disabled={restoringId === r.lessonId}
                        title="実践記録の基本情報から授業案を再作成します"
                      >
                        {restoringId === r.lessonId ? "復元中..." : "🔁 授業案を復元"}
                      </button>
                    )}

                    <Link href={editHref}>
                      <button style={actionBtn}>✏️ 編集</button>
                    </Link>

                    <button
                      onClick={() => handleDelete(r.lessonId)}
                      style={deleteBtn}
                      disabled={deletingId === r.lessonId}
                    >
                      {deletingId === r.lessonId ? "削除中..." : "🗑 削除"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
