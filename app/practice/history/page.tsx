"use client";

import { useState, useEffect, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openDB } from "idb";
import { signOut, useSession } from "next-auth/react";
import { doc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type BoardImage = { name: string; src: string };

type PracticeRecord = {
  lessonId: string;
  lessonTitle: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  grade?: string;
  modelType?: string;  // 正規化した短縮形
  author?: string;     // ← メールアドレス（本人確認用）
  authorName?: string; // ← 手動入力のユーザー名（表示用）
};

type LessonPlan = {
  id: string;
  modelType: string;  // 正規化した短縮形
  result: any;
};

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

async function getAllRecords(): Promise<PracticeRecord[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

async function deleteRecord(lessonId: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, lessonId);
}

async function uploadRecordToFirebase(
  record: PracticeRecord,
  authorEmail: string,
  authorName: string
) {
  const practiceRecordCollection = record.modelType
    ? `practiceRecords_${record.modelType}`
    : "practiceRecords";

  const docRef = doc(db, practiceRecordCollection, record.lessonId);
  await setDoc(docRef, {
    practiceDate: record.practiceDate,
    reflection: record.reflection,
    boardImages: record.boardImages,
    lessonTitle: record.lessonTitle,
    grade: record.grade || "",
    modelType: record.modelType || "",
    createdAt: serverTimestamp(),
    author: authorEmail,
    authorName: authorName,
  });
}

function normalizeModelType(collectionName: string): string {
  return collectionName.replace(/^lesson_plans_/, "").replace(/^practiceRecords_/, "");
}

const LESSON_PLAN_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_writing",
  "lesson_plans_discussion",
  "lesson_plans_language_activity",
];

async function fetchAllLessonPlans(): Promise<LessonPlan[]> {
  let allPlans: LessonPlan[] = [];

  for (const collectionName of LESSON_PLAN_COLLECTIONS) {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      modelType: normalizeModelType(collectionName),
      result: doc.data().result,
    }));
    allPlans = allPlans.concat(plans);
  }
  return allPlans;
}

export default function PracticeHistoryPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [sortKey, setSortKey] = useState<"practiceDate" | "lessonTitle" | "grade">("practiceDate");
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    getAllRecords()
      .then((recs) => {
        const normalizedRecs = recs.map(r => ({
          ...r,
          modelType: r.modelType ? normalizeModelType(r.modelType) : "",
        }));
        setRecords(normalizedRecs);
      })
      .catch(() => setRecords([]));

    fetchAllLessonPlans()
      .then(setLessonPlans)
      .catch(() => setLessonPlans([]));
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const gradeOrder = ["1年", "2年", "3年", "4年", "5年", "6年"];

  const sorted = [...records].sort((a, b) => {
    if (sortKey === "practiceDate") {
      return b.practiceDate.localeCompare(a.practiceDate);
    } else if (sortKey === "grade") {
      const aIndex = gradeOrder.indexOf(a.grade || "");
      const bIndex = gradeOrder.indexOf(b.grade || "");
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    } else if (sortKey === "lessonTitle") {
      return a.lessonTitle.localeCompare(b.lessonTitle);
    }
    return 0;
  });

  const handleDelete = async (lessonId: string) => {
    if (!confirm("この実践記録を削除しますか？")) return;
    try {
      await deleteRecord(lessonId);
      setRecords(records.filter((r) => r.lessonId !== lessonId));
    } catch {
      alert("IndexedDB上の削除に失敗しました。");
    }
  };

  const handlePostToShared = async (lessonId: string) => {
    if (!confirm("この実践記録を共有版に投稿しますか？")) return;

    try {
      setUploadingRecordId(lessonId);
      const dbLocal = await getDB();
      const record = await dbLocal.get(STORE_NAME, lessonId);

      if (!record) {
        alert("ローカルの実践記録が見つかりませんでした。");
        setUploadingRecordId(null);
        return;
      }

      if (!record.lessonTitle) record.lessonTitle = "タイトルなし";
      if (!record.modelType) {
        alert("modelTypeが設定されていません。投稿できません。");
        setUploadingRecordId(null);
        return;
      }

      record.modelType = normalizeModelType(record.modelType);

      const authorNameToSave = record.authorName || "";

      await uploadRecordToFirebase(record, userEmail, authorNameToSave);

      alert("共有版に投稿しました。");
      router.push("/practice/share");
    } catch (e: any) {
      console.error("投稿エラー:", e);
      alert("投稿に失敗しました。\n" + (e.message || e.toString()));
    } finally {
      setUploadingRecordId(null);
    }
  };

  // --- スタイル群 ---
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
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
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
  const postBtn: CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#800080",
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

  const boardImageContainerStyle: CSSProperties = {
    width: "100%",
    marginBottom: 12,
    pageBreakInside: "avoid",
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
        <button
          onClick={() => {
            signOut();
            setMenuOpen(false);
          }}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

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

        {/* 並び替えセレクト */}
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

        {sorted.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
            まだ実践記録がありません。
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sorted.map((r, idx) => {
              const plan = lessonPlans.find(
                (p) => p.id === r.lessonId && p.modelType === r.modelType
              );
              return (
                <article key={`${r.lessonId}-${idx}`} style={cardStyle}>
                  <div id={`record-${r.lessonId}`} style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 8px" }}>{r.lessonTitle}</h3>

                    {plan && typeof plan.result === "object" && (
                      <div style={planBlockStyle}>
                        <strong>授業案</strong>
                        <div>
                          <p>
                            <strong>教科書名：</strong>
                            {plan.result["教科書名"] || "－"}
                          </p>
                          <p>
                            <strong>単元名：</strong>
                            {plan.result["単元名"] || "－"}
                          </p>
                          <p>
                            <strong>授業時間数：</strong>
                            {plan.result["授業時間数"] || "－"}時間
                          </p>
                          <p>
                            <strong>単元の目標：</strong>
                            {plan.result["単元の目標"] || "－"}
                          </p>

                          {plan.result["評価の観点"] && (
                            <div style={{ marginTop: 8 }}>
                              <strong>評価の観点：</strong>

                              <strong>知識・技能</strong>
                              <ul style={{ marginTop: 4, paddingLeft: 16 }}>
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
                              <ul style={{ marginTop: 4, paddingLeft: 16 }}>
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
                              <ul style={{ marginTop: 4, paddingLeft: 16 }}>
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
                          )}

                          <p>
                            <strong>育てたい子どもの姿：</strong>
                            {plan.result["育てたい子どもの姿"] || "－"}
                          </p>

                          <p>
                            <strong>言語活動の工夫：</strong>
                            {plan.result["言語活動の工夫"] || "－"}
                          </p>

                          {plan.result["授業の流れ"] && (
                            <div style={{ marginTop: 8 }}>
                              <strong>授業の流れ：</strong>
                              <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                                {Object.entries(plan.result["授業の流れ"])
                                  .sort((a, b) => {
                                    const numA = parseInt(a[0].match(/\d+/)?.[0] ?? "0", 10);
                                    const numB = parseInt(b[0].match(/\d+/)?.[0] ?? "0", 10);
                                    return numA - numB;
                                  })
                                  .map(([key, val]) => {
                                    const content = typeof val === "string" ? val : JSON.stringify(val);
                                    return (
                                      <li key={key}>
                                        <strong>{key}:</strong> {content}
                                      </li>
                                    );
                                  })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p style={{ marginTop: 16 }}>
                      <strong>実践開始日：</strong> {r.practiceDate}
                    </p>

                    <p>
                      <strong>振り返り：</strong>
                      <br />
                      {r.reflection}
                    </p>

                    {r.boardImages.length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {r.boardImages.map((img, i) => (
                          <div
                            key={`${img.name}-${i}`}
                            style={boardImageContainerStyle}
                          >
                            <div style={{ marginBottom: 6, fontWeight: "bold" }}>
                              板書{i + 1}
                            </div>
                            <img
                              src={img.src}
                              alt={img.name}
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: 8,
                                border: "1px solid #ccc",
                                display: "block",
                                maxWidth: "100%",
                                objectFit: "contain",
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
                          const el = document.getElementById(`record-${r.lessonId}`);
                          if (!el) return alert("PDF化用の要素が見つかりませんでした。");

                          html2pdf()
                            .from(el)
                            .set({
                              margin: [5, 5, 5, 5],
                              filename: `${r.lessonTitle}_実践記録.pdf`,
                              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                              html2canvas: { useCORS: true, scale: 3 },
                              pagebreak: { mode: ["css", "legacy"] },
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
                        import("html2pdf.js").then(async ({ default: html2pdf }) => {
                          const el = document.getElementById(`record-${r.lessonId}`);
                          if (!el) return alert("Drive保存用の要素が見つかりませんでした。");

                          const pdfBlob = await html2pdf()
                            .from(el)
                            .set({
                              margin: [5, 5, 5, 5],
                              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                              html2canvas: { useCORS: true, scale: 3 },
                              pagebreak: { mode: ["css", "legacy"] },
                            })
                            .outputPdf("blob");

                          try {
                            const { uploadToDrive } = await import("../../../lib/drive");
                            await uploadToDrive(
                              pdfBlob,
                              `${r.lessonTitle}_実践記録.pdf`,
                              "application/pdf"
                            );
                            alert("Driveへの保存が完了しました。");
                          } catch (e) {
                            console.error(e);
                            alert("Drive保存に失敗しました。");
                          }
                        });
                      }}
                      style={driveBtn}
                    >
                      ☁️ Drive保存
                    </button>
                    <Link href={`/practice/add/${r.lessonId}`}>
                      <button style={actionBtn}>✏️ 編集</button>
                    </Link>
                    <button
                      onClick={() => handleDelete(r.lessonId)}
                      style={deleteBtn}
                    >
                      🗑 削除
                    </button>
                    <button
                      onClick={() => handlePostToShared(r.lessonId)}
                      style={postBtn}
                      disabled={uploadingRecordId === r.lessonId}
                    >
                      {uploadingRecordId === r.lessonId ? "投稿中..." : "🌐 投稿"}
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
