"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
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
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
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

  // --- データロード ---
  useEffect(() => {
    if (!id) return;
    const styleModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
    const foundStyle = styleModels.find((s: EducationModel) => s.id === id);
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

    const hist = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]") as EducationHistory[];
    const filteredHist = hist.filter(h => h.id === id);
    setHistory(filteredHist);
  }, [id]);

  // --- 入力変更 ---
  const handleChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // --- 保存処理 ---
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

    const styleModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
    const updatedModels = styleModels.map((s: EducationModel) => (s.id === id ? updatedModel : s));
    localStorage.setItem("styleModels", JSON.stringify(updatedModels));
    setStyle(updatedModel);

    const newHistoryEntry: EducationHistory = { ...updatedModel, note: note.trim() || "（更新時にメモなし）" };
    const prevHistory = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]") as EducationHistory[];
    const updatedHistory = [newHistoryEntry, ...prevHistory];
    localStorage.setItem("educationStylesHistory", JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
    setNote("");

    alert("✅ 教育観モデルを更新しました！");
  };

  if (!style) return <p style={{ padding: "2rem" }}>スタイルを読み込んでいます...</p>;

  // --- ハンバーガーメニューの開閉 ---
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

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
          onKeyDown={e => e.key === "Enter" && toggleMenu()}
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
        style={overlayStyle(menuOpen)}
        onClick={closeMenu}
        aria-hidden={!menuOpen}
      />

      {/* メニュー本体 */}
      <div style={menuWrapperStyle(menuOpen)} aria-hidden={!menuOpen}>
        <div style={menuScrollStyle}>
          {[
            ["/", "🏠 ホーム"],
            ["/plan", "📋 授業作成"],
            ["/plan/history", "📖 計画履歴"],
            ["/practice/history", "📷 実践履歴"],
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

        {/* ログアウトボタン */}
        <button onClick={() => signOut()} style={logoutButtonStyle}>
          🔓 ログアウト
        </button>
      </div>

      {/* メインコンテンツ */}
      <main style={mainStyle}>
        <nav style={{ marginBottom: "2rem" }}>
          <Link href="/models">← スタイル一覧へ</Link>
        </nav>

        <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>{style.name}</h2>

        <section style={infoSectionStyle}>
          <p><strong>教育観：</strong><br />{style.philosophy}</p>
          <p><strong>評価観点の重視：</strong><br />{style.evaluationFocus}</p>
          <p><strong>言語活動の重視：</strong><br />{style.languageFocus}</p>
          <p><strong>育てたい子どもの姿：</strong><br />{style.childFocus}</p>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>教育観モデルを編集</h3>

          {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

          <form onSubmit={handleSave}>
            {["name", "philosophy", "evaluationFocus", "languageFocus", "childFocus"].map(field => (
              <label key={field} style={labelStyle}>
                {field === "name" ? "モデル名（必須）：" : 
                 field === "philosophy" ? "教育観（必須）：" :
                 field === "evaluationFocus" ? "評価観点の重視（必須）：" :
                 field === "languageFocus" ? "言語活動の重視（必須）：" :
                 "育てたい子どもの姿（必須）："
                }
                {field === "name" ? (
                  <input
                    type="text"
                    value={(editForm as any)[field]}
                    onChange={e => handleChange(field as any, e.target.value)}
                    style={inputStyle}
                    required
                  />
                ) : (
                  <textarea
                    value={(editForm as any)[field]}
                    onChange={e => handleChange(field as any, e.target.value)}
                    rows={3}
                    style={textareaStyle}
                    required
                  />
                )}
              </label>
            ))}

            <label style={labelStyle}>
              更新メモ（任意）：
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="変更理由や補足メモを入力してください"
                style={{ ...textareaStyle, fontStyle: "italic" }}
              />
            </label>

            <button type="submit" style={buttonStyle}>
              保存する
            </button>
          </form>
        </section>

        {/* 編集履歴 */}
        <section style={{ marginTop: "3rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>編集履歴</h3>
          {history.length === 0 && <p>編集履歴はありません。</p>}
          <ul style={historyListStyle}>
            {history.map((h, i) => (
              <li key={i} style={historyItemStyle}>
                <div><strong>更新日時：</strong>{new Date(h.updatedAt).toLocaleString()}</div>
                <div><strong>メモ：</strong> {h.note}</div>
                <div><strong>モデル名：</strong> {h.name}</div>
                <div><strong>教育観：</strong> {h.philosophy}</div>
                <div><strong>評価観点の重視：</strong> {h.evaluationFocus}</div>
                <div><strong>言語活動の重視：</strong> {h.languageFocus}</div>
                <div><strong>育てたい子どもの姿：</strong> {h.childFocus}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* 関連授業案一覧 */}
        <section style={{ marginTop: "3rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>このスタイルで作成した授業案</h3>
          {relatedPlans.length === 0 ? (
            <p>まだこのスタイルで作成された授業案はありません。</p>
          ) : (
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {relatedPlans.map(plan => (
                <li key={plan.id} style={relatedPlanItemStyle}>
                  <p>
                    <strong>{plan.unit}</strong>（{plan.grade}・{plan.genre}）
                  </p>
                  <p>授業時間：{plan.hours}時間</p>
                  <Link href="/plan/history">
                    <button style={relatedPlanButtonStyle}>
                      📖 履歴ページで確認
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

// --- スタイル ---

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
  height: "100vh",
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
});

const menuScrollStyle: React.CSSProperties = {
  padding: "1rem",
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
  textAlign: "center",
};

const logoutButtonStyle: React.CSSProperties = {
  margin: "0 1rem 1rem 1rem",
  padding: "0.75rem 1rem",
  backgroundColor: "#e53935",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  zIndex: 1000,
};

const mainStyle: React.CSSProperties = {
  padding: "2rem",
  maxWidth: "90vw",
  margin: "0 auto",
  fontFamily: "sans-serif",
  paddingTop: 72,
};

const infoSectionStyle: React.CSSProperties = {
  marginBottom: "2rem",
  background: "#f9f9f9",
  padding: "1rem",
  borderRadius: "10px",
  whiteSpace: "pre-wrap",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "1rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  fontSize: "1rem",
  borderRadius: 6,
  border: "1px solid #ccc",
  marginTop: 4,
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 60,
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#4CAF50",
  color: "white",
  padding: "0.8rem 1.2rem",
  fontSize: "1.1rem",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginTop: "1rem",
};

const historyListStyle: React.CSSProperties = {
  listStyle: "none",
  paddingLeft: 0,
};

const historyItemStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: "1rem",
  marginBottom: "1rem",
  backgroundColor: "#f9f9f9",
  whiteSpace: "pre-wrap",
  fontFamily: "monospace",
  fontSize: "0.9rem",
};

const relatedPlanItemStyle: React.CSSProperties = {
  marginBottom: "1rem",
  padding: "1rem",
  border: "1px solid #ccc",
  borderRadius: "10px",
  backgroundColor: "#fdfdfd",
};

const relatedPlanButtonStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  backgroundColor: "#2196F3",
  color: "white",
  border: "none",
  borderRadius: 6,
  padding: "0.5rem 1rem",
  fontSize: "0.95rem",
  cursor: "pointer",
};
