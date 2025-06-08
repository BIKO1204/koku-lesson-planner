"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

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

export default function CreateModelPage() {
  const router = useRouter();

  const [models, setModels] = useState<EducationModel[]>([]);
  const [form, setForm] = useState({
    name: "",
    philosophy: "",
    evaluationFocus: "",
    languageFocus: "",
    childFocus: "",
    note: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("styleModels");
    if (stored) setModels(JSON.parse(stored));
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setError("");
    if (
      !form.name.trim() ||
      !form.philosophy.trim() ||
      !form.evaluationFocus.trim() ||
      !form.languageFocus.trim() ||
      !form.childFocus.trim()
    ) {
      setError("すべての必須項目を入力してください。");
      return;
    }

    const now = new Date().toISOString();
    let updatedModels: EducationModel[];

    if (editId) {
      updatedModels = models.map((m) =>
        m.id === editId
          ? { ...m, ...form, updatedAt: now }
          : m
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

    const newHistoryEntry: EducationHistory = {
      id: editId || updatedModels[0].id,
      name: form.name.trim(),
      philosophy: form.philosophy.trim(),
      evaluationFocus: form.evaluationFocus.trim(),
      languageFocus: form.languageFocus.trim(),
      childFocus: form.childFocus.trim(),
      updatedAt: now,
      note: form.note.trim() || "（更新時にメモなし）",
    };
    const prevHistory = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]") as EducationHistory[];
    const updatedHistory = [newHistoryEntry, ...prevHistory];
    localStorage.setItem("educationStylesHistory", JSON.stringify(updatedHistory));

    alert("✅ ローカル保存が完了しました！");
    router.push("/models/history");
  };

  // ヒントテキスト用スタイル（上下の余白増やした）
  const hintStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    color: "#666",
    marginTop: "6px",     // ←ここを増やして枠線との重なり防止
    marginBottom: "16px", // ←上下にゆとりを持たせて読みやすく
    fontStyle: "italic",
    userSelect: "none",
  };

  // 入力欄の共通スタイル（幅を少し狭め）
  const inputBaseStyle: React.CSSProperties = {
    width: "95%",           // 100% → 95%にして少し幅狭く
    padding: "0.8rem",
    fontSize: "1.1rem",
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 4,
  };

  return (
    <main
      style={{
        padding: "2rem 4rem",
        width: "100%",
        maxWidth: 900,  // 1200 → 900に縮小してページの幅感を整えました
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      {/* ナビゲーション */}
      <nav
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          overflowX: "auto",
        }}
      >
        {[
          ["/", "🏠 ホーム"],
          ["/plan", "📋 授業作成"],
          ["/plan/history", "📖 計画履歴"],
          ["/practice/history", "📷 実践履歴"],
          ["/models/create", "✏️ 教育観作成"],
          ["/models", "📚 教育観一覧"],
          ["/models/history", "🕒 教育観履歴"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            style={{
              padding: "8px 12px",
              backgroundColor: href === "/models/create" ? "#4CAF50" : "#1976d2",
              color: "white",
              borderRadius: 6,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      <h1
        style={{
          fontSize: "2rem",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        {editId ? "✏️ 教育観モデルを編集" : "✏️ 新しい教育観モデルを作成"}
      </h1>

      {error && (
        <p
          style={{
            color: "red",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}

      <section
        style={{
          backgroundColor: "#f9f9f9",
          padding: 24,
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <label style={{ display: "block", marginBottom: 12 }}>
          モデル名（必須）：
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            style={inputBaseStyle}
          />
          <div style={hintStyle}>例）面白い授業、対話型授業、音読重視など</div>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          教育観（必須）：
          <textarea
            rows={2}
            value={form.philosophy}
            onChange={(e) => handleChange("philosophy", e.target.value)}
            style={inputBaseStyle}
          />
          <div style={hintStyle}>例）子ども一人ひとりの思いや考えを尊重し、対話を通して、自分の思いや考えを広げさせたり、深めさせたりする。</div>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          評価観点の重視点（必須）：
          <textarea
            rows={2}
            value={form.evaluationFocus}
            onChange={(e) => handleChange("evaluationFocus", e.target.value)}
            style={inputBaseStyle}
          />
          <div style={hintStyle}>例）思考力・判断力を育てる評価を重視し、子ども同士の対話や個人の振り返りから評価する。</div>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          言語活動の重視点（必須）：
          <textarea
            rows={2}
            value={form.languageFocus}
            onChange={(e) => handleChange("languageFocus", e.target.value)}
            style={inputBaseStyle}
          />
          <div style={hintStyle}>例）対話や発表の機会を多く設け、自分の言葉で考えを伝える力を育成する。</div>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          育てたい子どもの姿（必須）：
          <textarea
            rows={2}
            value={form.childFocus}
            onChange={(e) => handleChange("childFocus", e.target.value)}
            style={inputBaseStyle}
          />
          <div style={hintStyle}>例）自分で進んで思いや考えを表現できる子ども、友だちの意見を大切にする子ども。</div>
        </label>

        <label style={{ display: "block", marginBottom: 24 }}>
          更新メモ（任意）：
          <textarea
            rows={2}
            value={form.note}
            onChange={(e) => handleChange("note", e.target.value)}
            style={{
              ...inputBaseStyle,
              fontStyle: "italic",
            }}
          />
          <div style={hintStyle}>例）今年度の授業で重視したい点や変更点などを書いてください。</div>
        </label>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "0.8rem 2rem",
              fontSize: "1.1rem",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {editId ? "更新して保存" : "作成して保存"}
          </button>
        </div>
      </section>
    </main>
  );
}
