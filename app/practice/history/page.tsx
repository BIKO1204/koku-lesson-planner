"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openDB } from "idb";

type BoardImage = { name: string; src: string };
type PracticeRecord = {
  lessonId: string;
  lessonTitle: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
};
type LessonPlan = {
  id: string;
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

export default function HistoryPage() {
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [sortKey, setSortKey] = useState<"practiceDate" | "lessonTitle">(
    "practiceDate"
  );
  const router = useRouter();

  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 800
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getAllRecords()
      .then(setRecords)
      .catch(() => setRecords([]));

    const plans = localStorage.getItem("lessonPlans");
    if (plans) {
      try {
        setLessonPlans(JSON.parse(plans));
      } catch {
        setLessonPlans([]);
      }
    }
  }, []);

  const sorted = [...records].sort((a, b) => {
    if (sortKey === "lessonTitle")
      return a.lessonTitle.localeCompare(b.lessonTitle);
    return a.practiceDate.localeCompare(b.practiceDate);
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

  const handleExportRecordPdf = async (lessonId: string) => {
    const { default: html2pdf } = await import("html2pdf.js");
    const el = document.getElementById(`record-${lessonId}`);
    if (!el) return alert("PDF化用の要素が見つかりませんでした。");

    const oldMargin = el.style.margin;
    const oldPadding = el.style.padding;
    el.style.margin = "0";
    el.style.padding = "0";

    el.scrollTop = 0;
    el.scrollLeft = 0;

    await Promise.all(
      Array.from(el.querySelectorAll("img")).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve(null);
            else {
              img.onload = () => resolve(null);
              img.onerror = () => resolve(null);
            }
          })
      )
    );

    await html2pdf()
      .from(el)
      .set({
        margin: [5, 5, 5, 5],
        filename:
          `${sorted.find((r) => r.lessonId === lessonId)?.lessonTitle || lessonId}_実践記録.pdf`,
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        html2canvas: { useCORS: true, scale: 1.5 },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .save();

    el.style.margin = oldMargin;
    el.style.padding = oldPadding;
  };

  const handleDriveSave = async (lessonId: string) => {
    const { default: html2pdf } = await import("html2pdf.js");
    const el = document.getElementById(`record-${lessonId}`);
    if (!el) return alert("Drive保存用の要素が見つかりませんでした。");

    await Promise.all(
      Array.from(el.querySelectorAll("img")).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve(null);
            else {
              img.onload = () => resolve(null);
              img.onerror = () => resolve(null);
            }
          })
      )
    );

    const pdfBlob: Blob = await html2pdf()
      .from(el)
      .set({
        margin: [5, 5, 5, 5],
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        html2canvas: { useCORS: true, scale: 1.5 },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .outputPdf("blob");

    const { uploadToDrive } = await import("../../../lib/drive");

    try {
      await uploadToDrive(
        pdfBlob,
        `${sorted.find((r) => r.lessonId === lessonId)?.lessonTitle || lessonId}_実践記録.pdf`,
        "application/pdf"
        // フォルダIDは渡さずマイドライブ直下に保存
      );
      alert("Driveへの保存が完了しました。");
    } catch (e) {
      console.error(e);
      alert("Drive保存に失敗しました。");
    }
  };

  // スタイル定義
  const navLinkStyle: React.CSSProperties = {
    padding: "8px 12px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: "1rem",
    textDecoration: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const cardStyle: React.CSSProperties = {
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

  const buttonBaseStyle: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: "0.9rem",
    borderRadius: 6,
    cursor: "pointer",
    width: "120px",
    height: "36px",
    boxSizing: "border-box",
    color: "white",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const pdfBtn: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#FF9800",
  };
  const driveBtn: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#2196F3",
  };
  const actionBtn: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#4CAF50",
  };
  const deleteBtn: React.CSSProperties = {
    ...buttonBaseStyle,
    backgroundColor: "#f44336",
  };

  const planBlockStyle: React.CSSProperties = {
    backgroundColor: "#fafafa",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    whiteSpace: "normal",
    fontFamily: "sans-serif",
    fontSize: "0.9rem",
  };

  const mainContainerStyle: React.CSSProperties = {
    padding: 16,
    fontFamily: "sans-serif",
    maxWidth: windowWidth > 768 ? 900 : 600,
    width: "100%",
    margin: "0 auto",
  };

  const boardImageContainerStyle: React.CSSProperties = {
    width: "100%",
    marginBottom: 12,
    pageBreakInside: "avoid",
  };

  return (
    <main style={mainContainerStyle}>
      <nav
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          marginBottom: 24,
          justifyContent: "center",
        }}
      >
        <Link href="/" style={navLinkStyle}>
          🏠 ホーム
        </Link>
        <Link href="/plan" style={navLinkStyle}>
          📋 授業作成
        </Link>
        <Link href="/plan/history" style={navLinkStyle}>
          📖 計画履歴
        </Link>
        <Link href="/practice/history" style={navLinkStyle}>
          📷 実践履歴
        </Link>
        <Link href="/models/create" style={navLinkStyle}>
          ✏️ 教育観作成
        </Link>
        <Link href="/models" style={navLinkStyle}>
          📚 教育観一覧
        </Link>
        <Link href="/models/history" style={navLinkStyle}>
          🕒 教育観履歴
        </Link>
      </nav>

      <h2 style={{ fontSize: "1.8rem", marginBottom: 16 }}>実践記録一覧</h2>

      <label style={{ display: "block", textAlign: "right", marginBottom: 16 }}>
        並び替え：
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as any)}
          style={{ marginLeft: 8, padding: 6, fontSize: "1rem" }}
        >
          <option value="practiceDate">実施日順</option>
          <option value="lessonTitle">タイトル順</option>
        </select>
      </label>

      {sorted.length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
          まだ実践記録がありません。
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sorted.map((r, idx) => {
            const plan = lessonPlans.find((p) => p.id === r.lessonId);
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
                            <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                              {Object.entries(plan.result["評価の観点"]).map(
                                ([key, values]) => {
                                  let numberedValues = values;
                                  if (Array.isArray(values)) {
                                    numberedValues = values.map(
                                      (v, i) => `（${i + 1}）${v}`
                                    );
                                  }
                                  return (
                                    <li key={key}>
                                      <strong>{key}:</strong>{" "}
                                      {Array.isArray(numberedValues)
                                        ? numberedValues.join("、")
                                        : String(numberedValues)}
                                    </li>
                                  );
                                }
                              )}
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
                              {Object.entries(plan.result["授業の流れ"]).map(
                                ([key, val]) => {
                                  const content =
                                    typeof val === "string" ? val : JSON.stringify(val);
                                  return (
                                    <li key={key}>
                                      <strong>{key}:</strong> {content}
                                    </li>
                                  );
                                }
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <p style={{ marginTop: 16 }}>
                    <strong>実施日：</strong> {r.practiceDate}
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
                        <div key={`${img.name}-${i}`} style={boardImageContainerStyle}>
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
                    onClick={() => handleExportRecordPdf(r.lessonId)}
                    style={pdfBtn}
                  >
                    📄 PDF出力
                  </button>
                  <button
                    onClick={() => handleDriveSave(r.lessonId)}
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
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
