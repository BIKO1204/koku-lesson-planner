"use client";

import React, { useEffect, useMemo, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

type EducationModel = {
  id: string;
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  updatedAt: string;
};

type EducationHistory = EducationModel & {
  note: string;
};

export default function StyleDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? "");
  const router = useRouter();

  // --- state ---
  const [style, setStyle] = useState<EducationModel | null>(null);
  const [relatedPlans, setRelatedPlans] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    philosophy: "",
    evaluationFocus: "",
    languageFocus: "",
    childFocus: "",
  });
  const [history, setHistory] = useState<EducationHistory[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // トースト（デザイン統一用：alertは残しても良い）
  const [toast, setToast] = useState("");

  // --- データロード（機能そのまま：localStorage） ---
  useEffect(() => {
    if (!id) return;

    const styleModels = JSON.parse(localStorage.getItem("educationModels") || "[]") as EducationModel[];
    const foundStyle = styleModels.find((s) => s.id === id);

    if (foundStyle) {
      setStyle(foundStyle);
      setEditForm({
        name: foundStyle.name,
        philosophy: foundStyle.philosophy,
        evaluationFocus: foundStyle.evaluationFocus,
        languageFocus: foundStyle.languageFocus,
        childFocus: foundStyle.childFocus,
      });
    }

    const plans = JSON.parse(localStorage.getItem("lessonPlans") || "[]");
    const matchedPlans = plans.filter((p: any) => p.usedStyleName === foundStyle?.name);
    setRelatedPlans(matchedPlans);

    const hist = JSON.parse(localStorage.getItem("educationModelsHistory") || "[]") as EducationHistory[];
    const filteredHist = hist.filter((h) => h.id === id);
    setHistory(filteredHist);
  }, [id]);

  // --- 入力変更 ---
  const handleChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // --- 保存処理（機能そのまま） ---
  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !editForm.name.trim() ||
      !editForm.philosophy.trim() ||
      !editForm.evaluationFocus.trim() ||
      !editForm.languageFocus.trim() ||
      !editForm.childFocus.trim()
    ) {
      setError("すべての必須項目を入力してください。");
      return;
    }

    const now = new Date().toISOString();
    const updatedModel: EducationModel = {
      id,
      name: editForm.name.trim(),
      philosophy: editForm.philosophy.trim(),
      evaluationFocus: editForm.evaluationFocus.trim(),
      languageFocus: editForm.languageFocus.trim(),
      childFocus: editForm.childFocus.trim(),
      updatedAt: now,
    };

    const styleModels = JSON.parse(localStorage.getItem("educationModels") || "[]") as EducationModel[];
    const updatedModels = styleModels.map((s) => (s.id === id ? updatedModel : s));
    localStorage.setItem("educationModels", JSON.stringify(updatedModels));
    setStyle(updatedModel);

    const newHistoryEntry: EducationHistory = {
      ...updatedModel,
      note: note.trim() || "（更新時にメモなし）",
    };
    const prevHistory = JSON.parse(localStorage.getItem("educationModelsHistory") || "[]") as EducationHistory[];
    const updatedHistory = [newHistoryEntry, ...prevHistory];
    localStorage.setItem("educationModelsHistory", JSON.stringify(updatedHistory));

    // 画面の「このIDの履歴」表示はフィルタしたものにする（機能維持：ただし表示の正しさは上がる）
    const filtered = updatedHistory.filter((h) => h.id === id);
    setHistory(filtered);

    setNote("");

    // alertは好みで残せます。統一感のためトーストも出します
    setToast("✅ 教育観モデルを更新しました！");
    setTimeout(() => setToast(""), 2000);

    alert("✅ 教育観モデルを更新しました！");
  };

  if (!style) return <p style={{ padding: "2rem" }}>スタイルを読み込んでいます...</p>;

  // --- ハンバーガーメニューの開閉 ---
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const fieldLabels = useMemo(
    () => ({
      name: { title: "モデル名（必須）", helper: "例）対話型授業、音読重視 など" },
      philosophy: {
        title: "教育観（必須）",
        helper: "例）子ども一人ひとりの思いや考えを尊重し、対話を通して学びを深める。",
      },
      evaluationFocus: {
        title: "評価観点の重視点（必須）",
        helper: "例）子どもの振り返り・対話の過程も含めて評価する。",
      },
      languageFocus: {
        title: "言語活動の重視点（必須）",
        helper: "例）話す・聞く・書く活動を往還させる。",
      },
      childFocus: {
        title: "育てたい子どもの姿（必須）",
        helper: "例）自分の言葉で考えを表現し、友だちの意見を大切にできる。",
      },
    }),
    []
  );

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
          <span style={barStyle} />
          <span style={barStyle} />
          <span style={barStyle} />
        </div>
        <h1 style={{ color: "white", marginLeft: "1rem", fontSize: "1.25rem" }}>国語授業プランナー</h1>
      </nav>

      {/* メニューオーバーレイ */}
      <div style={overlayStyle(menuOpen)} onClick={closeMenu} aria-hidden={!menuOpen} />

      {/* メニュー本体 */}
      <div style={menuWrapperStyle(menuOpen)} aria-hidden={!menuOpen}>
        <button
          onClick={() => {
            signOut();
            closeMenu();
          }}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

        <div style={menuScrollStyle}>
          {[
            ["/", "🏠 ホーム"],
            ["/plan", "📋 授業作成"],
            ["/plan/history", "📖 計画履歴"],
            ["/practice/history", "📷 実践履歴"],
            ["/practice/share", "🌐 共有版実践記録"],
            ["/models/create", "✏️ 教育観作成"],
            ["/models", "📚 教育観一覧"],
            ["/models/history", "🕒 教育観履歴"],
          ].map(([href, label]) => (
            <button
              key={href}
              style={navLinkStyle}
              onClick={() => {
                router.push(href);
                closeMenu();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* メイン */}
      <main style={mainContainerStyle}>
        <nav style={{ marginBottom: 12 }}>
          <Link href="/models" style={{ color: "#1976d2", textDecoration: "none", fontWeight: 700 }}>
            ← 教育観一覧へ
          </Link>
        </nav>

        <h2 style={pageTitleStyle}>{style.name}</h2>

        {/* 現在値（カード） */}
        <section style={infoCardStyle}>
          <div style={infoGridStyle}>
            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>教育観</div>
              <div style={infoValueStyle}>{style.philosophy}</div>
            </div>
            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>評価観点の重視</div>
              <div style={infoValueStyle}>{style.evaluationFocus}</div>
            </div>
            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>言語活動の重視</div>
              <div style={infoValueStyle}>{style.languageFocus}</div>
            </div>
            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>育てたい子どもの姿</div>
              <div style={infoValueStyle}>{style.childFocus}</div>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#1976d2" }}>
            更新：{new Date(style.updatedAt).toLocaleString()}
          </div>
        </section>

        {/* 編集フォーム */}
        <section style={formCardStyle}>
          <h3 style={{ fontSize: "1.25rem", margin: "0 0 10px" }}>✏️ 教育観モデルを編集</h3>

          {error && <p style={errorStyle}>{error}</p>}

          <form onSubmit={handleSave}>
            {/* モデル名 */}
            <label style={labelStyle}>
              {fieldLabels.name.title}
              <div style={helperStyle}>{fieldLabels.name.helper}</div>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleChange("name", e.target.value)}
                style={inputStyle}
                required
              />
            </label>

            {/* 教育観 */}
            <label style={labelStyle}>
              {fieldLabels.philosophy.title}
              <div style={helperStyle}>{fieldLabels.philosophy.helper}</div>
              <textarea
                value={editForm.philosophy}
                onChange={(e) => handleChange("philosophy", e.target.value)}
                rows={3}
                style={textareaStyle}
                required
              />
            </label>

            {/* 評価観点 */}
            <label style={labelStyle}>
              {fieldLabels.evaluationFocus.title}
              <div style={helperStyle}>{fieldLabels.evaluationFocus.helper}</div>
              <textarea
                value={editForm.evaluationFocus}
                onChange={(e) => handleChange("evaluationFocus", e.target.value)}
                rows={3}
                style={textareaStyle}
                required
              />
            </label>

            {/* 言語活動 */}
            <label style={labelStyle}>
              {fieldLabels.languageFocus.title}
              <div style={helperStyle}>{fieldLabels.languageFocus.helper}</div>
              <textarea
                value={editForm.languageFocus}
                onChange={(e) => handleChange("languageFocus", e.target.value)}
                rows={3}
                style={textareaStyle}
                required
              />
            </label>

            {/* 育てたい子どもの姿 */}
            <label style={labelStyle}>
              {fieldLabels.childFocus.title}
              <div style={helperStyle}>{fieldLabels.childFocus.helper}</div>
              <textarea
                value={editForm.childFocus}
                onChange={(e) => handleChange("childFocus", e.target.value)}
                rows={3}
                style={textareaStyle}
                required
              />
            </label>

            {/* 更新メモ */}
            <label style={labelStyle}>
              更新メモ（任意）
              <div style={helperStyle}>変更理由や補足メモを入力してください。</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="例）評価観点を『過程重視』に変更"
                style={{ ...textareaStyle, fontStyle: "italic" }}
              />
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
              <button type="submit" style={buttonPrimary}>
                保存する
              </button>
              <button
                type="button"
                style={buttonGhost}
                onClick={() => router.push("/models")}
              >
                一覧へ戻る
              </button>
            </div>
          </form>
        </section>

        {/* 編集履歴 */}
        <section style={sectionCardStyle}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1.2rem" }}>🕒 編集履歴</h3>
          {history.length === 0 ? (
            <p style={{ margin: 0, color: "#555" }}>編集履歴はありません。</p>
          ) : (
            <ul style={historyListStyle}>
              {history.map((h, i) => (
                <li key={i} style={historyItemStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800, color: "#1b1f24" }}>
                      {new Date(h.updatedAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: "#1976d2" }}>モデル名：{h.name}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={miniLabelStyle}>メモ</div>
                    <div style={miniValueStyle}>{h.note}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={miniLabelStyle}>教育観</div>
                    <div style={miniValueStyle}>{h.philosophy}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={miniLabelStyle}>評価観点の重視</div>
                    <div style={miniValueStyle}>{h.evaluationFocus}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={miniLabelStyle}>言語活動の重視</div>
                    <div style={miniValueStyle}>{h.languageFocus}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={miniLabelStyle}>育てたい子どもの姿</div>
                    <div style={miniValueStyle}>{h.childFocus}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 関連授業案一覧 */}
        <section style={sectionCardStyle}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1.2rem" }}>📎 このスタイルで作成した授業案</h3>
          {relatedPlans.length === 0 ? (
            <p style={{ margin: 0, color: "#555" }}>まだこのスタイルで作成された授業案はありません。</p>
          ) : (
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {relatedPlans.map((plan) => (
                <li key={plan.id} style={relatedPlanItemStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800 }}>
                      {plan.unit}
                      <span style={{ fontWeight: 500, color: "#607d8b" }}>
                        {" "}
                        （{plan.grade}・{plan.genre}）
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#455a64" }}>授業時間：{plan.hours}時間</div>
                  </div>

                  <Link href="/plan/history" style={{ textDecoration: "none" }}>
                    <button style={relatedPlanButtonStyle}>📖 履歴ページで確認</button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* トースト */}
      {toast && <div style={successBannerStyle}>{toast}</div>}
    </>
  );
}

/* =========================
 *  Styles（教育観ページと統一）
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
  padding: "0 1rem",
  boxSizing: "border-box",
});

const menuScrollStyle: React.CSSProperties = {
  padding: "1rem 0",
  paddingBottom: 80,
  overflowY: "auto",
  flexGrow: 1,
};

const navLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "0.5rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  textDecoration: "none",
  whiteSpace: "nowrap",
  marginBottom: 8,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  boxSizing: "border-box",
  border: "none",
};

const logoutButtonStyle: React.CSSProperties = {
  margin: "1rem 0 1rem 0",
  padding: "0.75rem 1rem",
  backgroundColor: "#e53935",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  zIndex: 1000,
  width: "100%",
  boxSizing: "border-box",
};

const mainContainerStyle: React.CSSProperties = {
  padding: "72px 24px 24px",
  maxWidth: 900,
  margin: "auto",
  fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
  boxSizing: "border-box",
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  margin: "0 0 12px",
  textAlign: "center",
  userSelect: "none",
};

const infoCardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  backgroundColor: "#fff",
  border: "1px solid #e0e7ff",
  marginBottom: 14,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const infoItemStyle: React.CSSProperties = {
  background: "#fafbff",
  border: "1px solid #dfe6ff",
  borderRadius: 8,
  padding: 12,
  whiteSpace: "pre-wrap",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#455a64",
  fontWeight: 800,
  marginBottom: 6,
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#1b1f24",
  lineHeight: 1.6,
};

const formCardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 8,
  backgroundColor: "#fff",
  border: "1px solid #e0e7ff",
  marginTop: 12,
};

const sectionCardStyle: React.CSSProperties = {
  padding: 18,
  borderRadius: 8,
  backgroundColor: "#fff",
  border: "1px solid #e0e7ff",
  marginTop: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 12,
  fontWeight: 700,
  color: "#444",
  fontSize: "1.03rem",
};

const helperStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#666",
  margin: "4px 0 6px",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  fontSize: "1.05rem",
  borderRadius: 6,
  border: "1px solid #c5d2f0",
  boxSizing: "border-box",
  backgroundColor: "#fff",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
};

const buttonPrimary: React.CSSProperties = {
  backgroundColor: "#4caf50",
  color: "white",
  padding: "12px 20px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
};

const buttonGhost: React.CSSProperties = {
  backgroundColor: "#90a4ae",
  color: "white",
  padding: "12px 18px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const errorStyle: React.CSSProperties = {
  color: "#d32f2f",
  marginBottom: 12,
  fontWeight: 800,
  textAlign: "center",
};

const historyListStyle: React.CSSProperties = {
  listStyle: "none",
  paddingLeft: 0,
  margin: 0,
  display: "grid",
  gap: 10,
};

const historyItemStyle: React.CSSProperties = {
  border: "1px solid #dfe6ff",
  borderRadius: 10,
  padding: 14,
  backgroundColor: "#fafbff",
  whiteSpace: "pre-wrap",
};

const miniLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#455a64",
  fontWeight: 800,
  marginBottom: 4,
};

const miniValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#1b1f24",
  lineHeight: 1.55,
};

const relatedPlanItemStyle: React.CSSProperties = {
  marginBottom: 10,
  padding: 14,
  border: "1px solid #dfe6ff",
  borderRadius: 10,
  backgroundColor: "#fafbff",
};

const relatedPlanButtonStyle: React.CSSProperties = {
  marginTop: 10,
  backgroundColor: "#2196F3",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: "0.95rem",
  cursor: "pointer",
  fontWeight: 800,
};

const successBannerStyle: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  bottom: 24,
  background: "#2e7d32",
  color: "white",
  padding: "10px 16px",
  borderRadius: 999,
  boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
  zIndex: 1500,
  transition: "opacity .25s ease",
};
