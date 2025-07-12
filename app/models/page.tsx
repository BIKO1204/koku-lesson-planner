"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import html2pdf from "html2pdf.js";

type EducationModel = {
  id: string;
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  updatedAt: string;
};

export default function EducationModelsPage() {
  const router = useRouter();

  const [models, setModels] = useState<EducationModel[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    philosophy: "",
    evaluationFocus: "",
    languageFocus: "",
    childFocus: "",
  });
  const [sortOrder, setSortOrder] = useState<"newest" | "nameAsc">("newest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  // ハンバーガーメニューの開閉トグル
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  useEffect(() => {
    const stored = localStorage.getItem("styleModels");
    if (stored) {
      try {
        setModels(JSON.parse(stored));
      } catch {
        setModels([]);
      }
    }
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startEdit = (m: EducationModel) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      philosophy: m.philosophy,
      evaluationFocus: m.evaluationFocus,
      languageFocus: m.languageFocus,
      childFocus: m.childFocus,
    });
    setError("");
    setMenuOpen(false);
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({
      name: "",
      philosophy: "",
      evaluationFocus: "",
      languageFocus: "",
      childFocus: "",
    });
    setError("");
  };

  const saveModel = () => {
    if (
      !form.name.trim() ||
      !form.philosophy.trim() ||
      !form.evaluationFocus.trim() ||
      !form.languageFocus.trim() ||
      !form.childFocus.trim()
    ) {
      setError("必須項目をすべて入力してください。");
      return false;
    }

    const now = new Date().toISOString();
    let updatedModels: EducationModel[];

    if (editId) {
      updatedModels = models.map((m) =>
        m.id === editId ? { ...m, ...form, updatedAt: now } : m
      );
    } else {
      updatedModels = [
        {
          id: uuidv4(),
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          updatedAt: now,
        },
        ...models,
      ];
    }

    localStorage.setItem("styleModels", JSON.stringify(updatedModels));
    setModels(updatedModels);
    cancelEdit();
    setMenuOpen(false);
    return true;
  };

  async function generatePdfFromModel(m: EducationModel) {
    const tempDiv = document.createElement("div");
    tempDiv.style.padding = "20px";
    tempDiv.style.fontFamily = "'Yu Gothic', 'YuGothic', 'Meiryo', sans-serif";
    tempDiv.style.backgroundColor = "#fff";
    tempDiv.style.color = "#000";
    tempDiv.style.lineHeight = "1.6";
    tempDiv.innerHTML = `
      <h1 style="border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">${m.name}</h1>
      <h2 style="color: #4CAF50; margin-top: 24px;">1. 教育観</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.philosophy.replace(
        /\n/g,
        "<br>"
      )}</p>
      <h2 style="color: #4CAF50; margin-top: 24px;">2. 評価観点の重視点</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.evaluationFocus.replace(
        /\n/g,
        "<br>"
      )}</p>
      <h2 style="color: #4CAF50; margin-top: 24px;">3. 言語活動の重視点</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.languageFocus.replace(
        /\n/g,
        "<br>"
      )}</p>
      <h2 style="color: #4CAF50; margin-top: 24px;">4. 育てたい子どもの姿</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.childFocus.replace(
        /\n/g,
        "<br>"
      )}</p>
      <p style="margin-top: 32px; font-size: 0.9rem; color: #666;">
        更新日時: ${new Date(m.updatedAt).toLocaleString()}
      </p>
    `;

    document.body.appendChild(tempDiv);

    try {
      await html2pdf()
        .from(tempDiv)
        .set({
          margin: 10,
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          html2canvas: { scale: 2 },
          pagebreak: { mode: ["avoid-all"] },
        })
        .save(`${m.name}_${new Date(m.updatedAt).toISOString().replace(/[:.]/g, "-")}.pdf`);
    } catch (e) {
      alert("PDF生成に失敗しました");
      console.error(e);
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  const sortedModels = () => {
    const copy = [...models];
    if (sortOrder === "newest") {
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleDelete = (id: string) => {
    if (!confirm("このモデルを削除しますか？")) return;
    const remaining = models.filter((m) => m.id !== id);
    localStorage.setItem("styleModels", JSON.stringify(remaining));
    setModels(remaining);
    if (editId === id) cancelEdit();
    setMenuOpen(false);
  };

  // Styles
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
  const menuWrapperStyle: React.CSSProperties = {
    position: "fixed",
    top: 56,
    left: 0,
    width: 250,
    height: "auto",
    backgroundColor: "#f0f0f0",
    boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
    transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.3s ease",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
  };
  const menuScrollStyle: React.CSSProperties = {
    padding: "1rem",
    paddingBottom: 20,
    overflowY: "auto",
  };
  const logoutButtonStyle: React.CSSProperties = {
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
  const overlayStyle: React.CSSProperties = {
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
  const navLinkStyle: React.CSSProperties = {
    display: "block",
    padding: "0.5rem 1rem",
    backgroundColor: "#1976d2",
    color: "white",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    marginBottom: 8,
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 8,
    marginBottom: 12,
    fontSize: "1rem",
    borderRadius: 6,
    border: "1px solid #ccc",
    boxSizing: "border-box",
  };

  const buttonPrimary: React.CSSProperties = {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
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

      {/* メニュー本体 */}
      <div style={menuWrapperStyle} aria-hidden={!menuOpen}>
        <div style={menuScrollStyle}>
          <button style={navLinkStyle} onClick={() => { setMenuOpen(false); router.push("/"); }}>
            🏠 ホーム
          </button>
          <button style={navLinkStyle} onClick={() => { setMenuOpen(false); router.push("/plan"); }}>
            📋 授業作成
          </button>
          <button style={navLinkStyle} onClick={() => { setMenuOpen(false); router.push("/plan/history"); }}>
            📖 計画履歴
          </button>
          <button style={navLinkStyle} onClick={() => { setMenuOpen(false); router.push("/practice/history"); }}>
            📷 実践履歴
          </button>
          <button style={navLinkStyle} onClick={() => { setMenuOpen(false); router.push("/models/create"); }}>
            ✏️ 教育観作成
          </button>
          <button style={navLinkStyle} onClick={() => { setMenuOpen(false); router.push("/models"); }}>
            📚 教育観一覧
          </button>
          <button style={navLinkStyle} onClick={() => { setMenuOpen(false); router.push("/models/history"); }}>
            🕒 教育観履歴
          </button>
        </div>

        {/* ログアウトボタン */}
        <button onClick={() => signOut()} style={logoutButtonStyle}>
          🔓 ログアウト
        </button>
      </div>

      {/* メインコンテンツ */}
      <main style={{ padding: 24, maxWidth: 900, margin: "72px auto 48px auto", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>教育観モデル一覧・編集</h1>

        {/* 並び替え */}
        <label style={{ display: "block", marginBottom: 16 }}>
          並び替え：
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            style={{ marginLeft: 8, padding: 4, fontSize: "1rem" }}
          >
            <option value="newest">新着順</option>
            <option value="nameAsc">名前順</option>
          </select>
        </label>

        {/* エラー表示 */}
        {error && (
          <p style={{ color: "red", marginBottom: 16, fontWeight: "bold" }}>
            {error}
          </p>
        )}

        {/* モデル一覧 */}
        {sortedModels().length === 0 ? (
          <p>まだモデルがありません。</p>
        ) : (
          sortedModels().map((m) => (
            <div key={m.id} style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>{m.name}</h3>
              <p>
                <strong>教育観：</strong> {m.philosophy}
              </p>
              <p>
                <strong>評価観点：</strong> {m.evaluationFocus}
              </p>
              <p>
                <strong>言語活動：</strong> {m.languageFocus}
              </p>
              <p>
                <strong>育てたい子ども：</strong> {m.childFocus}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={() => startEdit(m)} style={buttonPrimary}>
                  編集
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  style={{ ...buttonPrimary, backgroundColor: "#f44336" }}
                >
                  削除
                </button>
                <button
                  onClick={() => generatePdfFromModel(m)}
                  style={{ ...buttonPrimary, backgroundColor: "#FF9800" }}
                >
                  PDF化
                </button>
              </div>

              {editId === m.id && (
                <section style={{ ...cardStyle, marginTop: 12 }}>
                  <h4>編集モード</h4>
                  <input
                    placeholder="モデル名"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="教育観"
                    rows={2}
                    value={form.philosophy}
                    onChange={(e) => handleChange("philosophy", e.target.value)}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="評価観点の重視点"
                    rows={2}
                    value={form.evaluationFocus}
                    onChange={(e) => handleChange("evaluationFocus", e.target.value)}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="言語活動の重視点"
                    rows={2}
                    value={form.languageFocus}
                    onChange={(e) => handleChange("languageFocus", e.target.value)}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="育てたい子どもの姿"
                    rows={2}
                    value={form.childFocus}
                    onChange={(e) => handleChange("childFocus", e.target.value)}
                    style={inputStyle}
                  />
                  <div style={{ marginTop: 16 }}>
                    <button onClick={() => { if(saveModel()) setError(""); }} style={buttonPrimary}>
                      保存
                    </button>
                    <button onClick={cancelEdit} style={{ ...buttonPrimary, backgroundColor: "#757575", marginLeft: 8 }}>
                      キャンセル
                    </button>
                  </div>
                </section>
              )}
            </div>
          ))
        )}
      </main>
    </>
  );
}

// Styles
const navLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "0.5rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  borderRadius: 6,
  textDecoration: "none",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  marginBottom: 8,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  backgroundColor: "white",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 8,
  marginBottom: 12,
  fontSize: "1rem",
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const buttonPrimary: React.CSSProperties = {
  backgroundColor: "#4CAF50",
  color: "white",
  padding: "8px 16px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};
