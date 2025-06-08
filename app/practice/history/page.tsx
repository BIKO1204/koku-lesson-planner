"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";

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
  result: any; // object expected for detailed display
};

export default function HistoryPage() {
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [sortKey, setSortKey] = useState<"practiceDate" | "lessonTitle">(
    "practiceDate"
  );
  const router = useRouter();

  useEffect(() => {
    const recs = localStorage.getItem("practiceRecords");
    if (recs) {
      try {
        setRecords(JSON.parse(recs));
      } catch {
        setRecords([]);
      }
    }
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
    if (sortKey === "lessonTitle") return a.lessonTitle.localeCompare(b.lessonTitle);
    return a.practiceDate.localeCompare(b.practiceDate);
  });

  const handleDelete = async (lessonId: string) => {
    if (!confirm("この実践記録を削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "practice_records", lessonId));
    } catch {
      alert("Firestore 上の削除に失敗しました。");
      return;
    }
    const next = records.filter((r) => r.lessonId !== lessonId);
    setRecords(next);
    localStorage.setItem("practiceRecords", JSON.stringify(next));
  };

  const handleExportRecordPdf = async (lessonId: string) => {
    const { default: html2pdf } = await import("html2pdf.js");
    const el = document.getElementById(`record-${lessonId}`);
    if (!el) return alert("PDF化用の要素が見つかりませんでした。");

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
        margin: 5,
        filename: `${sorted.find(r => r.lessonId === lessonId)?.lessonTitle || lessonId}_実践記録.pdf`,
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        html2canvas: { useCORS: true, scale: 2 },
        pagebreak: { mode: ["avoid-all"] },
      })
      .save();
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
        margin: 5,
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        html2canvas: { useCORS: true, scale: 2 },
        pagebreak: { mode: ["avoid-all"] },
      })
      .outputPdf("blob");

    const { uploadToDrive } = await import("../../../lib/drive");
    const folderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) return alert("DriveフォルダIDが未設定です。");

    try {
      await uploadToDrive(
        pdfBlob,
        `${sorted.find(r => r.lessonId === lessonId)?.lessonTitle || lessonId}_実践記録.pdf`,
        "application/pdf",
        folderId
      );
      alert("Driveへの保存が完了しました。");
    } catch {
      alert("Drive保存に失敗しました。");
    }
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
    whiteSpace: "nowrap",
  };
  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#fdfdfd",
    border: "2px solid #ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  };
  const actionBtn: React.CSSProperties = {
    padding: "8px 12px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: "0.9rem",
    cursor: "pointer",
    width: "100%",
  };
  const deleteBtn: React.CSSProperties = { ...actionBtn, backgroundColor: "#f44336" };
  const pdfBtn: React.CSSProperties = { ...actionBtn, backgroundColor: "#607D8B" };
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

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 960, margin: "0 auto" }}>
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
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>まだ実践記録がありません。</p>
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
                        <p><strong>教科書名：</strong>{plan.result["教科書名"] || "－"}</p>
                        <p><strong>単元名：</strong>{plan.result["単元名"] || "－"}</p>
                        <p><strong>授業時間数：</strong>{plan.result["授業時間数"] || "－"}時間</p>
                        <p><strong>単元の目標：</strong>{plan.result["単元の目標"] || "－"}</p>

                        {plan.result["評価の観点"] && (
                          <div style={{ marginTop: 8 }}>
                            <strong>評価の観点：</strong>
                            <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                              {Object.entries(plan.result["評価の観点"]).map(([key, values]) => (
                                <li key={key}>
                                  <strong>{key}:</strong>{" "}
                                  {Array.isArray(values) ? values.join("、") : String(values)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p><strong>育てたい子どもの姿：</strong>{plan.result["育てたい子どもの姿"] || "－"}</p>

                        <p><strong>言語活動の工夫：</strong>{plan.result["言語活動の工夫"] || "－"}</p>

                        {plan.result["授業の流れ"] && (
                          <div style={{ marginTop: 8 }}>
                            <strong>授業の流れ：</strong>
                            <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                              {Object.entries(plan.result["授業の流れ"]).map(([key, val]) => {
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
                    <strong>実施日：</strong> {r.practiceDate}
                  </p>

                  <p>
                    <strong>振り返り：</strong>
                    <br />
                    {r.reflection}
                  </p>

                  {r.boardImages.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                      {r.boardImages.map((img, i) => (
                        <div key={`${img.name}-${i}`} style={{ width: "100%" }}>
                          <div style={{ marginBottom: 6, fontWeight: "bold" }}>板書{i + 1}</div>
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
                    flexDirection: "column",
                    gap: 8,
                    marginLeft: 16,
                    width: 120,
                  }}
                >
                  <button onClick={() => handleExportRecordPdf(r.lessonId)} style={pdfBtn}>
                    📄 PDF出力
                  </button>
                  <button onClick={() => handleDriveSave(r.lessonId)} style={pdfBtn}>
                    ☁️ Drive保存
                  </button>
                  <Link href={`/practice/add/${r.lessonId}`}>
                    <button style={actionBtn}>✏️ 編集</button>
                  </Link>
                  <button onClick={() => handleDelete(r.lessonId)} style={deleteBtn}>
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
