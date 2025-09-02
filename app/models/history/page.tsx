"use client";

import React, { useEffect, useState, CSSProperties } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ---------- 型 ---------- */
type EducationHistory = {
  id: string;
  modelId: string;
  updatedAt: any; // Firestore Timestamp | string | Date を許容
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  note?: string;
  creatorId: string;
  triggerReason?: string; // ← きっかけ・理由（なぜ変えたか）
};

type GroupedHistory = {
  modelId: string;
  modelName: string;
  histories: EducationHistory[];
};

/* ---------- 表示コンポーネント ---------- */
function FieldWithDiff({
  current,
  previous,
  label,
}: {
  current: string;
  previous?: string;
  label: string;
}) {
  const cur = (current ?? "").trim();
  const prev = (previous ?? "").trim();
  const isChanged = previous === undefined || cur !== prev;

  return (
    <p
      style={{
        backgroundColor: isChanged ? "#fff9c4" : undefined,
        position: "relative",
        cursor: isChanged ? "help" : undefined,
        whiteSpace: "pre-wrap",
        marginBottom: 6,
        padding: isChanged ? "4px 8px" : undefined,
        borderRadius: isChanged ? 4 : undefined,
        transition: "background-color 0.3s ease",
      }}
      title={isChanged && previous ? `${label}（前回）: ${prev || "—"}` : undefined}
    >
      <strong>{label}：</strong> {cur || "—"}
    </p>
  );
}

function TimelineItem({ date, children }: { date: string; children: React.ReactNode }) {
  return (
    <div
      className="h2pdf-avoid"
      style={{
        display: "flex",
        alignItems: "flex-start",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <time
        style={{
          width: 140,
          color: "#555",
          whiteSpace: "nowrap",
          flexShrink: 0,
          fontSize: 14,
          fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
        }}
      >
        {date}
      </time>
      <div
        className="h2pdf-avoid h2pdf-block"
        style={{
          marginLeft: 12,
          borderLeft: "4px solid #1976d2",
          paddingLeft: 12,
          flexGrow: 1,
          backgroundColor: "#f9fbff",
          borderRadius: 8,
          paddingTop: 12,
          paddingBottom: 12,
          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.1)",
          fontSize: 15,
          fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
          minWidth: 0,
          wordBreak: "break-word",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- PDF用CSS（分割回避など） ---------- */
const H2PDF_PRINT_CSS = `
.h2pdf-avoid { break-inside: avoid; page-break-inside: avoid; }
.h2pdf-root img, .h2pdf-root figure, .h2pdf-root .h2pdf-block { break-inside: avoid; page-break-inside: avoid; }
.h2pdf-break-before { break-before: page; page-break-before: always; }
.h2pdf-break-after { break-after: page; page-break-after: always; }
.h2pdf-root img { max-width: 100%; height: auto; }
.h2pdf-root li { break-inside: avoid; page-break-inside: avoid; }
`;

/* ---------- ユーティリティ ---------- */
function formatDateTime(anyDate: any): string {
  const d: Date =
    anyDate?.toDate?.() instanceof Date
      ? anyDate.toDate()
      : typeof anyDate === "string"
      ? new Date(anyDate)
      : anyDate instanceof Date
      ? anyDate
      : new Date(NaN);
  if (isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

function sanitizeFilename(name: string) {
  const base = (name || "教育観").trim();
  return base.replace(/[\\\/:*?"<>|]+/g, "_").slice(0, 100);
}

function isSmallDevice(): boolean {
  if (typeof window === "undefined") return false;
  const touch = "ontouchstart" in window || (navigator as any).maxTouchPoints > 0;
  const narrow =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 820px)").matches
      : window.innerWidth <= 820;
  return touch && narrow;
}

/* =========================================================
 * ページ本体
 * ======================================================= */
export default function GroupedHistoryPage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "";

  const [groupedHistories, setGroupedHistories] = useState<GroupedHistory[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  // 追加：検索
  const [q, setQ] = useState("");
  const [exportingGroupId, setExportingGroupId] = useState<string | null>(null);

  // 展開状態をlocalStorageと同期
  useEffect(() => {
    const saved = localStorage.getItem("expandedIds");
    if (saved) {
      try {
        const parsed: string[] = JSON.parse(saved);
        setExpandedIds(new Set(parsed));
      } catch {
        /* noop */
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("expandedIds", JSON.stringify(Array.from(expandedIds)));
  }, [expandedIds]);

  // Firestore購読
  useEffect(() => {
    if (!userId) {
      setGroupedHistories([]);
      return;
    }
    const colRef = collection(db, "educationModelsHistory");
    const qy = query(colRef, where("creatorId", "==", userId), orderBy("updatedAt", "desc"));

    const unsub = onSnapshot(
      qy,
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EducationHistory, "id">),
        })) as EducationHistory[];

        // モデルごとにグループ化
        const map = new Map<string, GroupedHistory>();
        rows.forEach((h) => {
          if (!map.has(h.modelId)) {
            map.set(h.modelId, { modelId: h.modelId, modelName: h.name, histories: [] });
          }
          map.get(h.modelId)!.histories.push(h);
        });

        setGroupedHistories(Array.from(map.values()));
      },
      (e) => {
        console.error("Firestore購読エラー", e);
        setGroupedHistories([]);
      }
    );
    return () => unsub();
  }, [userId]);

  const toggleExpand = (modelId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  };

  const deleteHistory = async (id: string) => {
    if (!confirm("この履歴を削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "educationModelsHistory", id));
      setGroupedHistories((prev) =>
        prev
          .map((g) => ({ ...g, histories: g.histories.filter((h) => h.id !== id) }))
          .filter((g) => g.histories.length > 0)
      );
      alert("削除しました");
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました");
    }
  };

  // 検索フィルタ
  const norm = (s: string) => (s || "").toLowerCase();
  const matchHistory = (h: EducationHistory, keyword: string) => {
    const k = norm(keyword);
    if (!k) return true;
    return (
      norm(h.name).includes(k) ||
      norm(h.philosophy).includes(k) ||
      norm(h.evaluationFocus).includes(k) ||
      norm(h.languageFocus).includes(k) ||
      norm(h.childFocus).includes(k) ||
      norm(h.note || "").includes(k) ||
      norm(h.triggerReason || "").includes(k)
    );
  };

  // PDF（モデル単位）エクスポート
  const exportGroupPdf = async (modelId: string, modelName: string) => {
    const el = document.getElementById(`group-${modelId}`);
    if (!el) {
      alert("PDF化対象の要素が見つかりませんでした。");
      return;
    }
    setExportingGroupId(modelId);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const scaleVal = isSmallDevice() ? 2.2 : 2.6;
      await html2pdf()
        .from(el)
        .set({
          margin: [5, 5, 5, 5],
          filename: `教育観_${sanitizeFilename(modelName)}.pdf`,
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          html2canvas: { useCORS: true, scale: scaleVal },
          pagebreak: { mode: ["css", "legacy", "avoid-all"] },
        })
        .save();
    } catch (e) {
      console.error(e);
      alert("PDFの作成に失敗しました。");
    } finally {
      setExportingGroupId(null);
    }
  };

  // 統計（表示件数）
  const totalCount = groupedHistories.reduce((sum, g) => sum + g.histories.length, 0);
  const visibleCount = groupedHistories.reduce(
    (sum, g) => sum + g.histories.filter((h) => matchHistory(h, q)).length,
    0
  );

  return (
    <>
      {/* PDF分割回避CSS */}
      <style dangerouslySetInnerHTML={{ __html: H2PDF_PRINT_CSS }} />

      {/* ナビバー */}
      <nav style={navBarStyle}>
        <div
          style={hamburgerStyle}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setMenuOpen((v) => !v)}
        >
          <span style={barStyle} />
          <span style={barStyle} />
          <span style={barStyle} />
        </div>
        <h1 style={navTitleStyle}>国語授業プランナー</h1>
      </nav>

      {/* メニューオーバーレイ */}
      <div
        style={{
          ...overlayStyle,
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? "visible" : "hidden",
        }}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* メニュー */}
      <div
        style={{
          ...menuWrapperStyle,
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
        }}
        aria-hidden={!menuOpen}
      >
        <button onClick={() => signOut()} style={logoutButtonStyle}>
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

      {/* 本文 */}
      <main style={mainStyle}>
        <h1 style={titleStyle}>🕒 教育観履歴（教育観ポートフォリオ）</h1>
        <p style={subNoteStyle}>
          ※「ポートフォリオ」＝これまでの変化と学びをまとめて見直す記録。<br />
          ※各項目には注釈付き：教育観（授業の考え方）／評価の観点（何を見て評価するか）／言語活動（話す・聞く・書く等）／育てたい子どもの姿（目指す姿）／
          きっかけ・理由（なぜ変えたか）。
        </p>

        {/* 検索 */}
        <div style={searchRowStyle}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="キーワードで絞り込み（名前／教育観／評価観点／言語活動／育てたい姿／メモ／きっかけ）"
            aria-label="教育観履歴の検索"
            style={searchInputStyle}
          />
          {q && (
            <button onClick={() => setQ("")} style={clearBtnStyle} aria-label="検索をクリア">
              ×
            </button>
          )}
        </div>
        <div style={countNoteStyle}>
          表示：{visibleCount} / {totalCount} 件
        </div>

        {groupedHistories.length === 0 ? (
          <p style={emptyStyle}>まだ履歴がありません。</p>
        ) : (
          groupedHistories.map(({ modelId, modelName, histories }) => {
            // 検索適用後の配列（新→旧の配列を受け、表示は昇順に並べ替え）
            const filtered = histories.filter((h) => matchHistory(h, q));
            if (filtered.length === 0) return null;

            const historiesAsc = [...filtered].reverse();

            return (
              <section key={modelId} style={groupSectionStyle}>
                <div style={groupHeaderRowStyle}>
                  <button
                    onClick={() => toggleExpand(modelId)}
                    style={groupToggleBtnStyle}
                    aria-expanded={expandedIds.has(modelId)}
                    aria-controls={`section-${modelId}`}
                  >
                    {expandedIds.has(modelId) ? "▼" : "▶"} {modelName}（このモデルの記録 {filtered.length} 件）
                  </button>

                  <button
                    onClick={() => exportGroupPdf(modelId, modelName)}
                    style={pdfBtnStyle}
                    disabled={exportingGroupId === modelId}
                    title="このモデルの履歴をPDFに保存します"
                  >
                    {exportingGroupId === modelId ? "PDF作成中…" : "📄 PDF保存"}
                  </button>
                </div>

                {expandedIds.has(modelId) && (
                  <div
                    id={`group-${modelId}`}
                    className="h2pdf-root h2pdf-avoid"
                    style={historyListStyle}
                  >
                    {historiesAsc.map((h, i) => {
                      const prev = i > 0 ? historiesAsc[i - 1] : undefined;
                      return (
                        <TimelineItem key={h.id} date={formatDateTime(h.updatedAt)}>
                          <h2 style={cardTitleStyle}>{h.name || "（名称未設定）"}</h2>

                          <FieldWithDiff
                            current={h.philosophy}
                            previous={prev?.philosophy}
                            label="教育観（授業の考え方）"
                          />
                          <FieldWithDiff
                            current={h.evaluationFocus}
                            previous={prev?.evaluationFocus}
                            label="評価の観点（何を見て評価するか）"
                          />
                          <FieldWithDiff
                            current={h.languageFocus}
                            previous={prev?.languageFocus}
                            label="言語活動（話す・聞く・書く等）"
                          />
                          <FieldWithDiff
                            current={h.childFocus}
                            previous={prev?.childFocus}
                            label="育てたい子どもの姿（目指す姿）"
                          />

                          <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 0" }}>
                            <strong>きっかけ・理由（なぜ変えたか）：</strong>{" "}
                            {h.triggerReason?.trim() || "—"}
                          </p>

                          {h.note?.trim() && (
                            <p style={{ whiteSpace: "pre-wrap", margin: "6px 0 0", color: "#555" }}>
                              <strong>メモ：</strong> {h.note}
                            </p>
                          )}

                          <button
                            style={{
                              marginTop: 10,
                              backgroundColor: "#e53935",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              padding: "0.5rem 1rem",
                              cursor: "pointer",
                            }}
                            onClick={() => deleteHistory(h.id)}
                          >
                            削除
                          </button>
                        </TimelineItem>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </>
  );
}

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
const barStyle: CSSProperties = { height: 4, backgroundColor: "white", borderRadius: 2 };
const navTitleStyle: CSSProperties = { color: "white", marginLeft: 16, fontSize: "1.25rem", userSelect: "none" };

const menuWrapperStyle: CSSProperties = {
  position: "fixed",
  top: 56,
  left: 0,
  width: "80vw",
  maxWidth: 280,
  height: "calc(100vh - 56px)",
  backgroundColor: "#f0f0f0",
  boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
  transition: "transform 0.3s ease",
  zIndex: 999,
  display: "flex",
  flexDirection: "column",
};
const menuScrollStyle: CSSProperties = { padding: "1rem", paddingBottom: 80, overflowY: "auto", flexGrow: 1 };
const logoutButtonStyle: CSSProperties = {
  margin: "1rem",
  padding: "0.75rem 1rem",
  backgroundColor: "#e53935",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  zIndex: 1000,
};
const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 56,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.3)",
  transition: "opacity 0.3s ease",
  zIndex: 998,
};
const navLinkStyle: CSSProperties = {
  display: "block",
  padding: "0.75rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  textDecoration: "none",
  marginBottom: "0.5rem",
  fontSize: "1rem",
};

const mainStyle: CSSProperties = {
  padding: "1.5rem 1rem",
  maxWidth: 900,
  margin: "0 auto",
  fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
  paddingTop: 80,
  boxSizing: "border-box",
};
const titleStyle: CSSProperties = { fontSize: "1.8rem", marginBottom: "0.5rem", textAlign: "center", userSelect: "none" };
const subNoteStyle: CSSProperties = {
  textAlign: "center",
  color: "#666",
  marginBottom: 12,
  lineHeight: 1.6,
  fontSize: 14,
};

const searchRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  margin: "8px 0",
};
const searchInputStyle: CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  fontSize: 16,
  border: "1px solid #bbb",
  borderRadius: 6,
};
const clearBtnStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  backgroundColor: "#9e9e9e",
  color: "#fff",
  cursor: "pointer",
};
const countNoteStyle: CSSProperties = { color: "#666", fontSize: 14, marginBottom: 8 };

const emptyStyle: CSSProperties = { padding: "1.5rem", textAlign: "center", color: "#666", fontSize: "1.1rem" };
const groupSectionStyle: CSSProperties = { marginBottom: "2rem" };
const groupHeaderRowStyle: CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
const groupToggleBtnStyle: CSSProperties = {
  cursor: "pointer",
  flex: 1,
  textAlign: "left",
  padding: "1rem 1.25rem",
  fontSize: "1.15rem",
  fontWeight: "bold",
  backgroundColor: "#e3f2fd",
  border: "none",
  borderRadius: 6,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  userSelect: "none",
};
const pdfBtnStyle: CSSProperties = {
  padding: "10px 14px",
  backgroundColor: "#FF9800",
  color: "#fff",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const historyListStyle: CSSProperties = { marginTop: "1rem" };
const cardTitleStyle: CSSProperties = { fontSize: "1.2rem", margin: "0 0 0.5rem", wordBreak: "break-word" };
