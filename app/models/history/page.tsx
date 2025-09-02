"use client";

import React, { useEffect, useMemo, useState, CSSProperties } from "react";
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

  // ▼ ポートフォリオ拡張（マイルストーンはUIから除去）
  triggerType?: string;
  triggerText?: string;
  reason?: string;
  reflection?: string;
  tags?: string[];
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

function parseTags(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
const toTagString = (tags?: string[]) => (tags ?? []).join(", ");
const sanitizeFilename = (name: string) =>
  (name || "教育観ポートフォリオ").trim().replace(/[\\\/:*?"<>|]+/g, "_").slice(0, 120);

/* =========================
 * ポートフォリオ編集（マイルストーン欄は削除）
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
  const [tagsInput, setTagsInput] = useState<string>(toTagString(data.tags));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<EducationHistory> = {
        triggerType: triggerType || undefined,
        triggerText: triggerText || undefined,
        reason: reason || undefined,
        reflection: reflection || undefined,
        tags: parseTags(tagsInput),
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
    <div style={editorWrapStyle}>
      <div style={editorRowStyle}>
        <label style={labelStyle}>きっかけ（分類）</label>
        <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} style={inputStyle}>
          <option value="">（未選択）</option>
          {TRIGGER_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div style={editorRowStyle}>
        <label style={labelStyle}>きっかけ（具体）</label>
        <input
          type="text"
          value={triggerText}
          onChange={(e) => setTriggerText(e.target.value)}
          placeholder="例）第2時のディスカッションで『根拠』が弱かった"
          style={inputStyle}
        />
      </div>

      <div style={editorRowStyle}>
        <label style={labelStyle}>理由・背景</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="なぜその変更をしたのか、意図や根拠・背景を記録"
          style={textareaStyle}
        />
      </div>

      <div style={editorRowStyle}>
        <label style={labelStyle}>振り返りメモ</label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={4}
          placeholder="次回に活かす視点や児童の変化、自分の学び"
          style={textareaStyle}
        />
      </div>

      <div style={editorRowStyle}>
        <label style={labelStyle}>タグ</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="例）評価, 特別活動, 対話, 失敗から学ぶ"
          style={inputStyle}
        />
        <small style={{ color: "#666" }}>※カンマまたは空白で区切り</small>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={handleSave} style={{ ...buttonBaseStyle, backgroundColor: "#4caf50" }}>
          保存
        </button>
        <button onClick={onCancel} style={{ ...buttonBaseStyle, backgroundColor: "#9e9e9e" }}>
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
  const { data: session } = useSession();
  const userId = session?.user?.email || "";
  const [groupedHistories, setGroupedHistories] = useState<GroupedHistory[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // フィルタ／検索（マイルストーン関連は削除）
  const [qText, setQText] = useState("");
  const [filterTrigger, setFilterTrigger] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");

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

  // タグの×削除
  const removeTag = async (h: EducationHistory, tag: string) => {
    const current = h.tags ?? [];
    const next = current.filter((t) => t !== tag);
    try {
      await updateDoc(doc(db, "educationModelsHistory", h.id), { tags: next });
      setGroupedHistories((prev) =>
        prev.map((g) =>
          g.modelId !== h.modelId
            ? g
            : { ...g, histories: g.histories.map((x) => (x.id === h.id ? { ...x, tags: next } : x)) }
        )
      );
    } catch (e) {
      console.error(e);
      alert("タグの削除に失敗しました");
    }
  };

  // PDF出力
  const exportPdf = async (elementId: string, filename: string) => {
    const el = document.getElementById(elementId);
    if (!el) return alert("PDF化対象の要素が見つかりませんでした。");
    const { default: html2pdf } = await import("html2pdf.js");
    const scale = window.innerWidth <= 820 ? 2.0 : 2.6;
    await (html2pdf() as any)
      .from(el)
      .set({
        margin: [6, 6, 6, 6],
        filename: `${sanitizeFilename(filename)}.pdf`,
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        html2canvas: { useCORS: true, scale },
        pagebreak: { mode: ["css", "legacy", "avoid-all"] },
      })
      .save();
  };

  // 全タグ／全きっかけ候補を算出（フィルタUI用）
  const allTags = useMemo(() => {
    const set = new Set<string>();
    groupedHistories.forEach((g) => g.histories.forEach((h) => (h.tags ?? []).forEach((t) => set.add(t))));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
  }, [groupedHistories]);

  const allTriggers = useMemo(() => {
    const set = new Set<string>();
    groupedHistories.forEach((g) => g.histories.forEach((h) => h.triggerType && set.add(h.triggerType)));
    return Array.from(set);
  }, [groupedHistories]);

  // フィルタリング＆検索
  function matchFilters(h: EducationHistory) {
    if (filterTrigger && h.triggerType !== filterTrigger) return false;
    if (filterTag && !(h.tags ?? []).includes(filterTag)) return false;
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
        (h.tags ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(qText.trim().toLowerCase())) return false;
    }
    return true;
  }

  // モデルごとのサマリー（注釈つき）
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
      <div style={summaryCardStyle}>
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>サマリー（このモデル内の変化の要約）</div>
        <p style={{ margin: 0, fontSize: 14 }}>
          変化した領域：{changedFields.length ? changedFields.join("・") : "（大きな変化なし）"}
        </p>
      </div>
    );
  }

  return (
    <>
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

      {/* メイン */}
      <main style={mainStyle} id="portfolio-root">
        <h1 style={titleStyle}>📁 教育観モデル（教育観ポートフォリオ）</h1>

        {/* ページの価値（説明） */}
        <section style={valueNoteStyle}>
          <p style={{ margin: 0 }}>
            ここでは、あなたの<strong>教育観の変化</strong>をモデルごとに時系列で見渡し、変更の
            <strong>きっかけ・理由・振り返り</strong>まで一緒に残せます。
            <br />
            授業改善の根拠が整理され、同僚への共有や校内研修、評価資料づくりにもそのまま使える「成長の記録」です。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            サマリー（このモデル内の変化の要約）は、<strong>どの領域が変わってきたか</strong>をひと目で確認するための短いまとめです。
          </p>
        </section>

        {/* フィルタ＆操作バー（マイルストーンのチェックは削除） */}
        <section style={filterBarStyle}>
          <input
            type="text"
            placeholder="キーワード検索（本文・メモ・タグなど）"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            style={filterInputStyle}
          />

          <select value={filterTrigger} onChange={(e) => setFilterTrigger(e.target.value)} style={filterSelectStyle}>
            <option value="">きっかけ（すべて）</option>
            {allTriggers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={filterSelectStyle}>
            <option value="">タグ（すべて）</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button onClick={expandAll} style={{ ...buttonBaseStyle, backgroundColor: "#607d8b" }} title="すべて展開">
              すべて展開
            </button>
            <button
              onClick={collapseAll}
              style={{ ...buttonBaseStyle, backgroundColor: "#90a4ae" }}
              title="すべて折りたたみ"
            >
              すべて折りたたみ
            </button>
            <button
              onClick={() => exportPdf("portfolio-root", "教育観ポートフォリオ_全体")}
              style={{ ...buttonBaseStyle, backgroundColor: "#FF9800" }}
              title="このページ全体をPDF保存"
            >
              📄 全体PDF
            </button>
          </div>
        </section>

        {groupedHistories.length === 0 ? (
          <p style={emptyStyle}>まだ履歴がありません。</p>
        ) : (
          groupedHistories.map(({ modelId, modelName, histories }) => {
            // Firestoreからは新→旧なので、表示は「古い→新しい」の時系列に
            const historiesAsc = [...histories].reverse();

            // フィルタ適用（モデルごと）
            const filteredAsc = historiesAsc.filter((h) => matchFilters(h));
            if (filteredAsc.length === 0) return null;

            // サマリー用：新→旧の並び
            const desc = [...histories];

            const sectionId = `model-${modelId}`;

            return (
              <section key={modelId} style={groupSectionStyle} id={sectionId}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => toggleExpand(modelId)}
                    style={groupToggleBtnStyle}
                    aria-expanded={expandedIds.has(modelId)}
                    aria-controls={`section-${modelId}`}
                  >
                    {expandedIds.has(modelId) ? "▼" : "▶"} {modelName}（履歴 {histories.length} 件）
                  </button>

                  <button
                    onClick={() => exportPdf(sectionId, `教育観_${modelName}`)}
                    style={{ ...buttonBaseStyle, backgroundColor: "#FF9800" }}
                    title="このモデルだけPDF保存"
                  >
                    📄 モデルPDF
                  </button>
                </div>

                {/* モデルサマリー（常時表示・注釈つき） */}
                <div style={{ marginTop: 8 }}>{renderModelSummary(desc)}</div>

                {expandedIds.has(modelId) && (
                  <div id={`section-${modelId}`} style={historyListStyle}>
                    {filteredAsc.map((h, i) => {
                      const prev = i > 0 ? filteredAsc[i - 1] : undefined;
                      const isEditing = editingId === h.id;

                      return (
                        <TimelineItem key={h.id} date={formatDateTime(h.updatedAt)}>
                          <h2 style={cardTitleStyle}>{h.name}</h2>

                          {/* 変化点（差分ハイライト） */}
                          <FieldWithDiff current={h.philosophy} previous={prev?.philosophy} label="教育観" />
                          <FieldWithDiff current={h.evaluationFocus} previous={prev?.evaluationFocus} label="評価観点" />
                          <FieldWithDiff current={h.languageFocus} previous={prev?.languageFocus} label="言語活動" />
                          <FieldWithDiff current={h.childFocus} previous={prev?.childFocus} label="育てたい子どもの姿" />

                          {/* ポートフォリオ領域 */}
                          {!isEditing ? (
                            <div style={portfolioViewStyle}>
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
                              <p style={{ ...rowP, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <strong>タグ：</strong>
                                {(h.tags ?? []).length ? (
                                  (h.tags ?? []).map((t) => (
                                    <span key={t} style={tagChipStyle} title="クリックで削除">
                                      #{t}
                                      <button aria-label={`${t} を削除`} onClick={() => removeTag(h, t)} style={chipCloseBtnStyle}>
                                        ×
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span>—</span>
                                )}
                              </p>

                              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                                <button
                                  onClick={() => setEditingId(h.id)}
                                  style={{ ...buttonBaseStyle, backgroundColor: "#1976d2" }}
                                >
                                  ✏️ 追記・編集
                                </button>
                                <button
                                  onClick={() => deleteHistory(h.id)}
                                  style={{ ...buttonBaseStyle, backgroundColor: "#e53935" }}
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
                                setGroupedHistories((prev) =>
                                  prev.map((g) =>
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
 * スタイル
 * ======================= */

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

const navTitleStyle: CSSProperties = {
  color: "white",
  marginLeft: 16,
  fontSize: "1.25rem",
  userSelect: "none",
};

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

const menuScrollStyle: CSSProperties = {
  padding: "1rem",
  paddingBottom: 80,
  overflowY: "auto",
  flexGrow: 1,
};

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

const titleStyle: CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "0.75rem",
  textAlign: "center",
  userSelect: "none",
};

const valueNoteStyle: CSSProperties = {
  background: "#fffef7",
  border: "1px solid #ffecb3",
  borderRadius: 8,
  padding: 10,
  color: "#604a00",
  marginBottom: 12,
  lineHeight: 1.6,
  fontSize: 14,
};

const emptyStyle: CSSProperties = {
  padding: "1.5rem",
  textAlign: "center",
  color: "#666",
  fontSize: "1.1rem",
};

const filterBarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  margin: "0 0 16px",
  background: "#f6f9ff",
  border: "1px solid #d6e3ff",
  borderRadius: 8,
  padding: 8,
};

const filterInputStyle: CSSProperties = {
  flex: "1 1 240px",
  minWidth: 220,
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #c5d2f0",
  outline: "none",
};

const filterSelectStyle: CSSProperties = {
  flex: "0 0 auto",
  minWidth: 160,
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #c5d2f0",
  outline: "none",
  background: "white",
};

const groupSectionStyle: CSSProperties = {
  marginBottom: "2rem",
};

const groupToggleBtnStyle: CSSProperties = {
  cursor: "pointer",
  textAlign: "left",
  padding: "0.75rem 1rem",
  fontSize: "1.05rem",
  fontWeight: "bold",
  backgroundColor: "#e3f2fd",
  border: "none",
  borderRadius: 6,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  userSelect: "none",
};

const historyListStyle: CSSProperties = {
  marginTop: "1rem",
};

const cardTitleStyle: CSSProperties = {
  fontSize: "1.2rem",
  margin: "0 0 0.5rem",
  wordBreak: "break-word",
};

const portfolioViewStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e0e7ff",
  borderRadius: 8,
  padding: 10,
  marginTop: 6,
};

const rowP: CSSProperties = {
  margin: "4px 0",
};

const tagChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#e8f0ff",
  border: "1px solid #b6ccff",
  color: "#2a4aa0",
  borderRadius: 999,
  padding: "0 6px 0 8px",
  fontSize: 12,
};

const chipCloseBtnStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#2a4aa0",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
  lineHeight: 1,
  padding: "2px 2px 3px",
};

const editorWrapStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #bcd4ff",
  borderRadius: 8,
  padding: 12,
  marginTop: 8,
};

const editorRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 8,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "#455a64",
};

const inputStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #c5d2f0",
  outline: "none",
} as CSSProperties;

const textareaStyle: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #c5d2f0",
  outline: "none",
  resize: "vertical",
} as CSSProperties;

const buttonBaseStyle: CSSProperties = {
  padding: "8px 12px",
  fontSize: "0.9rem",
  borderRadius: 6,
  cursor: "pointer",
  border: "none",
  color: "white",
};

const summaryCardStyle: CSSProperties = {
  background: "#F5FAFF",
  border: "1px solid #cfe3ff",
  borderRadius: 8,
  padding: 10,
  fontSize: 14,
};
