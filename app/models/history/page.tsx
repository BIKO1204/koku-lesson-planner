"use client";

import React, { useEffect, useMemo, useState, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* =========================
 * 型
 * ======================= */
type EducationHistory = {
  id: string;
  modelId: string;
  updatedAt: any; // Firestore Timestamp | string | Date
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  note?: string;
  creatorId: string;

  // ▼ ポートフォリオ拡張（タグは廃止）
  triggerType?: string;
  triggerText?: string;
  reason?: string;
  reflection?: string;
  portfolioUpdatedAt?: any;
};

type GroupedHistory = {
  modelId: string;
  modelName: string;
  histories: EducationHistory[];
};

/* =========================
 * 小コンポーネント
 * ======================= */
function FieldWithDiff({
  current,
  previous,
  label,
}: {
  current: string;
  previous?: string;
  label: string;
}) {
  const isChanged = previous === undefined || current.trim() !== (previous ?? "").trim();
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
      title={isChanged && previous ? `${label}（前回）: ${previous}` : undefined}
    >
      <strong>{label}：</strong> {current || "—"}
    </p>
  );
}

function TimelineItem({ date, children }: { date: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 12,
        alignItems: "start",
        marginBottom: 16,
      }}
    >
      <time
        style={{
          color: "#555",
          whiteSpace: "nowrap",
          fontSize: 13,
          fontFamily: "sans-serif",
        }}
      >
        {date}
      </time>

      {/* 実践記録ページの「box」のトーンに寄せる */}
      <div
        className="pdf-avoid-break"
        style={{
          border: "2px solid #1976d2",
          borderRadius: 6,
          padding: 12,
          backgroundColor: "#fff",
          boxShadow: "0 2px 6px rgba(25,118,210,0.08)",
          minWidth: 0,
          wordBreak: "break-word",
          fontFamily: "sans-serif",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* =========================
 * ユーティリティ
 * ======================= */
function formatDateTime(anyDate: any): string {
  const d: Date =
    typeof anyDate?.toDate === "function"
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

const TRIGGER_OPTIONS = [
  "授業での気づき",
  "児童の反応",
  "同僚・管理職からの助言",
  "研修・書籍・研究",
  "評価の結果から",
  "失敗からの学び",
  "その他",
] as const;

const sanitizeFilename = (name: string) =>
  (name || "教育観ポートフォリオ").trim().replace(/[\\\/:*?"<>|]+/g, "_").slice(0, 120);

/* =========================
 * ポートフォリオ編集（タグUIは削除）
 * ======================= */
function PortfolioEditor({
  data,
  onCancel,
  onSaved,
}: {
  data: EducationHistory;
  onCancel: () => void;
  onSaved: (updated: Partial<EducationHistory>) => void;
}) {
  const [triggerType, setTriggerType] = useState<string>(data.triggerType ?? "");
  const [triggerText, setTriggerText] = useState<string>(data.triggerText ?? "");
  const [reason, setReason] = useState<string>(data.reason ?? "");
  const [reflection, setReflection] = useState<string>(data.reflection ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<EducationHistory> = {
        triggerType: triggerType || undefined,
        triggerText: triggerText || undefined,
        reason: reason || undefined,
        reflection: reflection || undefined,
        portfolioUpdatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "educationModelsHistory", data.id), payload as any);
      onSaved(payload);
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={boxStyle}>
      <strong style={{ display: "block", marginBottom: 8 }}>ポートフォリオ追記</strong>

      <div style={{ display: "grid", gap: 10 }}>
        <label style={labelStyle}>
          きっかけ（分類）
          <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} style={inputStyle}>
            <option value="">（未選択）</option>
            {TRIGGER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          きっかけ（具体）
          <input
            type="text"
            value={triggerText}
            onChange={(e) => setTriggerText(e.target.value)}
            placeholder="例）第2時のディスカッションで『根拠』が弱かった"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          理由・背景
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="なぜその変更をしたのか、意図や根拠・背景を記録"
            style={textareaStyle}
          />
        </label>

        <label style={labelStyle}>
          振り返りメモ
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="次回に活かす視点や児童の変化、自分の学び"
            style={textareaStyle}
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...primaryBtnStyle,
            backgroundColor: "#4caf50",
            marginTop: 0,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          onClick={onCancel}
          style={{ ...secondaryBtnStyle, backgroundColor: "#9e9e9e", color: "#fff" }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

/* =========================
 * メイン
 * ======================= */
export default function GroupedHistoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.email || "";

  const [groupedHistories, setGroupedHistories] = useState<GroupedHistory[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // フィルタ／検索
  const [qText, setQText] = useState("");
  const [filterTrigger, setFilterTrigger] = useState<string>("");

  // 展開状態を永続化
  useEffect(() => {
    const saved = localStorage.getItem("expandedIds");
    if (saved) {
      try {
        setExpandedIds(new Set(JSON.parse(saved)));
      } catch {}
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

        // モデルIDでグループ
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
      next.has(modelId) ? next.delete(modelId) : next.add(modelId);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(groupedHistories.map((g) => g.modelId)));
  const collapseAll = () => setExpandedIds(new Set());

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

  // 全きっかけ（分類）候補を算出
  const allTriggers = useMemo(() => {
    const set = new Set<string>();
    groupedHistories.forEach((g) => g.histories.forEach((h) => h.triggerType && set.add(h.triggerType)));
    return Array.from(set);
  }, [groupedHistories]);

  // フィルタリング＆検索
  function matchFilters(h: EducationHistory) {
    if (filterTrigger && h.triggerType !== filterTrigger) return false;
    if (qText.trim()) {
      const hay = [
        h.name,
        h.philosophy,
        h.evaluationFocus,
        h.languageFocus,
        h.childFocus,
        h.note ?? "",
        h.reason ?? "",
        h.reflection ?? "",
        h.triggerText ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(qText.trim().toLowerCase())) return false;
    }
    return true;
  }

  // モデルごとのサマリー
  function renderModelSummary(historiesDesc: EducationHistory[]) {
    if (historiesDesc.length === 0) return null;
    const latest = historiesDesc[0];
    const oldest = historiesDesc[historiesDesc.length - 1];

    const changedFields: string[] = [];
    if (latest.philosophy !== oldest.philosophy) changedFields.push("教育観");
    if (latest.evaluationFocus !== oldest.evaluationFocus) changedFields.push("評価観点");
    if (latest.languageFocus !== oldest.languageFocus) changedFields.push("言語活動");
    if (latest.childFocus !== oldest.childFocus) changedFields.push("育てたい子どもの姿");

    return (
      <div style={summaryBoxStyle}>
        <strong style={{ display: "block", marginBottom: 6 }}>サマリー（このモデル内の変化の要約）</strong>
        <p style={{ margin: 0, fontSize: 14 }}>
          変化した領域：{changedFields.length ? changedFields.join("・") : "（大きな変化なし）"}
        </p>
      </div>
    );
  }

  // ===== PDF 書き出し（実践記録ページと同じUI感でボタンを置く前提） =====
  const exportPdf = async (rootId: string, filenameBase: string) => {
    const el = document.getElementById(rootId);
    if (!el) {
      alert("PDF対象の要素が見つかりません。");
      return;
    }

    // メニューが開いていると被るので閉じる
    setMenuOpen(false);

    // クライアント側のみで読み込み
    const html2pdfModule: any = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default ?? html2pdfModule;

    const filename = `${sanitizeFilename(filenameBase)}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".pdf-avoid-break", "h1", "h2", "time"],
      },
    };

    try {
      // PDFに不要なボタン類を一時的に非表示（編集/削除/展開など）
      const buttons = el.querySelectorAll("button");
      const prevDisplays: string[] = [];
      buttons.forEach((b, i) => {
        prevDisplays[i] = (b as HTMLElement).style.display;
        (b as HTMLElement).style.display = "none";
      });

      await html2pdf().set(opt).from(el).save();

      // 元に戻す
      buttons.forEach((b, i) => ((b as HTMLElement).style.display = prevDisplays[i] ?? ""));
    } catch (e) {
      console.error(e);
      alert("PDF書き出しに失敗しました。");
    }
  };

  // 「全体PDF」や「モデルPDF」のとき、必要な範囲は自動で展開して出す
  const exportAllPdf = async () => {
    const prev = new Set(expandedIds);
    expandAll();
    // 展開描画待ち
    setTimeout(async () => {
      await exportPdf("portfolio-root", "教育観ポートフォリオ_全体");
      setExpandedIds(prev);
    }, 250);
  };

  const exportModelPdf = async (modelId: string, modelName: string) => {
    const prev = new Set(expandedIds);
    setExpandedIds(new Set([...Array.from(prev), modelId]));
    const sectionId = `model-${modelId}`;

    setTimeout(async () => {
      await exportPdf(sectionId, `教育観_${modelName}`);
      setExpandedIds(prev);
    }, 250);
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <>
      {/* ===== 実践記録ページと同じナビバー ===== */}
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
        <h1 style={{ color: "white", marginLeft: "1rem", fontSize: "1.25rem", userSelect: "none" }}>
          国語授業プランナー
        </h1>
      </nav>

      {/* ===== 実践記録ページと同じオーバーレイ・メニュー ===== */}
      <div style={overlayStyle(menuOpen)} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />
      <div style={menuWrapperStyle(menuOpen)} aria-hidden={!menuOpen}>
        <button
          onClick={() => {
            signOut();
            setMenuOpen(false);
          }}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

        <div style={menuLinksWrapperStyle}>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/");
            }}
          >
            🏠 ホーム
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/plan");
            }}
          >
            📋 授業作成
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/plan/history");
            }}
          >
            📖 計画履歴
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/practice/history");
            }}
          >
            📷 実践履歴
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/practice/share");
            }}
          >
            🌐 共有版実践記録
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/models/create");
            }}
          >
            ✏️ 教育観作成
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/models");
            }}
          >
            📚 教育観一覧
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/models/history");
            }}
          >
            🕒 教育観履歴
          </button>
        </div>
      </div>

      {/* ===== メイン（実践記録ページの containerStyle と合わせる） ===== */}
      <main style={containerStyle} id="portfolio-root">
        <h2 style={{ marginTop: 0 }}>教育観履歴（教育観ポートフォリオ）</h2>

        {/* 価値説明：実践記録の noticeBox トーン */}
        <div style={noticeBoxStyle}>
          <strong>ここでできること：</strong>
          <ul style={{ margin: "8px 0 0 18px" }}>
            <li>
              教育観の変化を<strong>モデルごと</strong>に時系列で整理
            </li>
            <li>
              変更の<strong>きっかけ・理由・振り返り</strong>まで記録して、校内研修・評価資料づくりにも使える
            </li>
            <li>PDF出力でそのまま共有しやすい</li>
          </ul>
        </div>

        {/* フィルタ＆操作：実践記録の boxStyle に寄せる */}
        <div style={boxStyle}>
          <strong style={{ display: "block", marginBottom: 8 }}>検索・絞り込み</strong>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12 }}>
            <input
              type="text"
              placeholder="キーワード検索（本文・メモなど）"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              style={inputStyle}
            />

            <select value={filterTrigger} onChange={(e) => setFilterTrigger(e.target.value)} style={inputStyle}>
              <option value="">きっかけ（すべて）</option>
              {allTriggers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            <button onClick={expandAll} style={{ ...secondaryBtnStyle, backgroundColor: "#607d8b", color: "#fff" }}>
              すべて展開
            </button>
            <button onClick={collapseAll} style={{ ...secondaryBtnStyle, backgroundColor: "#90a4ae", color: "#fff" }}>
              すべて折りたたみ
            </button>
            <button
              onClick={exportAllPdf}
              style={{ ...secondaryBtnStyle, backgroundColor: "#ff9800", color: "#fff" }}
              title="このページ全体をPDF保存"
            >
              📄 全体PDF
            </button>
          </div>
        </div>

        {groupedHistories.length === 0 ? (
          <p style={emptyStyle}>まだ履歴がありません。</p>
        ) : (
          groupedHistories.map(({ modelId, modelName, histories }) => {
            const historiesAsc = [...histories].reverse();
            const filteredAsc = historiesAsc.filter((h) => matchFilters(h));
            if (filteredAsc.length === 0) return null;

            const desc = [...histories];
            const sectionId = `model-${modelId}`;

            return (
              <section key={modelId} id={sectionId} style={{ marginBottom: 24 }}>
                {/* 見出し：実践記録の boxStyle */}
                <div style={boxStyle}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, alignItems: "center" }}>
                    <button
                      onClick={() => toggleExpand(modelId)}
                      style={{
                        ...secondaryBtnStyle,
                        backgroundColor: "#1976d2",
                        color: "#fff",
                        textAlign: "left",
                        marginTop: 0,
                      }}
                      aria-expanded={expandedIds.has(modelId)}
                      aria-controls={`section-${modelId}`}
                    >
                      {expandedIds.has(modelId) ? "▼" : "▶"} {modelName}（履歴 {histories.length} 件）
                    </button>

                    <button
                      onClick={() => exportModelPdf(modelId, modelName)}
                      style={{ ...secondaryBtnStyle, backgroundColor: "#ff9800", color: "#fff" }}
                      title="このモデルだけPDF保存"
                    >
                      📄 モデルPDF
                    </button>
                  </div>

                  <div style={{ marginTop: 10 }}>{renderModelSummary(desc)}</div>
                </div>

                {expandedIds.has(modelId) && (
                  <div id={`section-${modelId}`} style={{ marginTop: 12 }}>
                    {filteredAsc.map((h, i) => {
                      const prev = i > 0 ? filteredAsc[i - 1] : undefined;
                      const isEditing = editingId === h.id;

                      return (
                        <TimelineItem key={h.id} date={formatDateTime(h.updatedAt)}>
                          <h3 style={{ margin: "0 0 10px" }}>{h.name}</h3>

                          <FieldWithDiff current={h.philosophy} previous={prev?.philosophy} label="教育観" />
                          <FieldWithDiff current={h.evaluationFocus} previous={prev?.evaluationFocus} label="評価観点" />
                          <FieldWithDiff current={h.languageFocus} previous={prev?.languageFocus} label="言語活動" />
                          <FieldWithDiff current={h.childFocus} previous={prev?.childFocus} label="育てたい子どもの姿" />

                          {/* ポートフォリオ領域 */}
                          {!isEditing ? (
                            <div style={{ ...boxStyle, marginTop: 10, borderColor: "#9e9e9e" }}>
                              <p style={rowP}>
                                <strong>きっかけ：</strong>
                                {h.triggerType || "—"}
                                {h.triggerText ? `｜${h.triggerText}` : ""}
                              </p>
                              <p style={rowP}>
                                <strong>理由・背景：</strong>
                                <span style={{ whiteSpace: "pre-wrap" }}>{h.reason || "—"}</span>
                              </p>
                              <p style={rowP}>
                                <strong>振り返りメモ：</strong>
                                <span style={{ whiteSpace: "pre-wrap" }}>{h.reflection || "—"}</span>
                              </p>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                                <button
                                  onClick={() => setEditingId(h.id)}
                                  style={{ ...secondaryBtnStyle, backgroundColor: "#1976d2", color: "#fff" }}
                                >
                                  ✏️ 追記・編集
                                </button>
                                <button
                                  onClick={() => deleteHistory(h.id)}
                                  style={{ ...secondaryBtnStyle, backgroundColor: "#e53935", color: "#fff" }}
                                >
                                  🗑 削除
                                </button>
                              </div>
                            </div>
                          ) : (
                            <PortfolioEditor
                              data={h}
                              onCancel={() => setEditingId(null)}
                              onSaved={(updated) => {
                                setGroupedHistories((prevState) =>
                                  prevState.map((g) =>
                                    g.modelId !== h.modelId
                                      ? g
                                      : {
                                          ...g,
                                          histories: g.histories.map((x) => (x.id === h.id ? { ...x, ...updated } : x)),
                                        }
                                  )
                                );
                                setEditingId(null);
                              }}
                            />
                          )}
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

/* =========================
 * Styles（実践記録ページに寄せて統一）
 * ======================= */

const navBarStyle: React.CSSProperties = {
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

const hamburgerStyle: React.CSSProperties = {
  cursor: "pointer",
  width: 30,
  height: 22,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const barStyle: React.CSSProperties = {
  height: 4,
  backgroundColor: "white",
  borderRadius: 2,
};

const menuWrapperStyle = (menuOpen: boolean): React.CSSProperties => ({
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
});

const logoutButtonStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  backgroundColor: "#e53935",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
  margin: "1rem",
};

const menuLinksWrapperStyle: React.CSSProperties = {
  overflowY: "auto",
  flexGrow: 1,
  padding: "1rem",
};

const navBtnStyle: React.CSSProperties = {
  marginBottom: 8,
  padding: "0.5rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  display: "block",
  width: "100%",
  textAlign: "left",
};

const overlayStyle = (menuOpen: boolean): React.CSSProperties => ({
  position: "fixed",
  top: 56,
  left: 0,
  width: "100vw",
  height: "calc(100vh - 56px)",
  backgroundColor: "rgba(0,0,0,0.3)",
  opacity: menuOpen ? 1 : 0,
  visibility: menuOpen ? "visible" : "hidden",
  transition: "opacity 0.3s ease",
  zIndex: 998,
});

const containerStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 800,
  margin: "auto",
  fontFamily: "sans-serif",
  paddingTop: 72,
  boxSizing: "border-box",
};

const noticeBoxStyle: React.CSSProperties = {
  border: "2px solid #ff7043",
  backgroundColor: "#fff3e0",
  color: "#5d4037",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
};

const boxStyle: React.CSSProperties = {
  border: "2px solid #1976d2",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
  backgroundColor: "#fff",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
} as CSSProperties;

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
  resize: "vertical",
} as CSSProperties;

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  color: "#333",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: 12,
  backgroundColor: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  width: "100%",
  cursor: "pointer",
  marginTop: 16,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: 10,
  border: "none",
  borderRadius: 6,
  width: "100%",
  cursor: "pointer",
  marginTop: 0,
};

const emptyStyle: React.CSSProperties = {
  padding: "1.5rem",
  textAlign: "center",
  color: "#666",
  fontSize: "1.05rem",
};

const rowP: React.CSSProperties = {
  margin: "6px 0",
};

const summaryBoxStyle: React.CSSProperties = {
  border: "1px solid #2196f3",
  backgroundColor: "#e3f2fd",
  borderRadius: 6,
  padding: 10,
};
