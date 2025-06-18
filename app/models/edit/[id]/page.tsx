"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";

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

  useEffect(() => {
    if (!id) return;

    // モデル読み込み
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

    // 関連授業案読み込み
    const plans = JSON.parse(localStorage.getItem("lessonPlans") || "[]");
    const matchedPlans = plans.filter((p: any) => p.usedStyleName === foundStyle?.name);
    setRelatedPlans(matchedPlans);

    // 履歴読み込み
    const hist = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]") as EducationHistory[];
    const filteredHist = hist.filter(h => h.id === id);
    setHistory(filteredHist);
  }, [id]);

  const handleChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // 必須項目チェック
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

    // 更新モデル作成
    const updatedModel: EducationModel = {
      id,
      name: editForm.name.trim(),
      philosophy: editForm.philosophy.trim(),
      evaluationFocus: editForm.evaluationFocus.trim(),
      languageFocus: editForm.languageFocus.trim(),
      childFocus: editForm.childFocus.trim(),
      updatedAt: now,
    };

    // styleModels更新
    const styleModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
    const updatedModels = styleModels.map((s: EducationModel) =>
      s.id === id ? updatedModel : s
    );
    localStorage.setItem("styleModels", JSON.stringify(updatedModels));
    setStyle(updatedModel);

    // 履歴追加
    const newHistoryEntry: EducationHistory = {
      ...updatedModel,
      note: note.trim() || "（更新時にメモなし）",
    };
    const prevHistory = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]") as EducationHistory[];
    const updatedHistory = [newHistoryEntry, ...prevHistory];
    localStorage.setItem("educationStylesHistory", JSON.stringify(updatedHistory));
    setHistory([newHistoryEntry, ...history]);
    setNote("");

    alert("✅ 教育観モデルを更新しました！");
  };

  if (!style) return <p style={{ padding: "2rem" }}>スタイルを読み込んでいます...</p>;

  return (
    <main style={{ padding: "2rem", maxWidth: "90vw", margin: "0 auto", fontFamily: "sans-serif" }}>
      {/* ナビゲーション */}
      <nav
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "2rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          WebkitOverflowScrolling: "touch",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        {[
          { href: "/", label: "🏠 ホーム" },
          { href: "/plan", label: "📋 授業作成" },
          { href: "/plan/history", label: "📖 計画履歴" },
          { href: "/practice/history", label: "📷 実践履歴" },
          { href: "/models/create", label: "✏️ 教育観作成" },
          { href: "/models", label: "📚 教育観一覧" },
          { href: "/models/history", label: "🕒 教育観履歴" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              flexShrink: 0,
              padding: "0.5rem 1rem",
              backgroundColor: "#1976d2",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      <nav style={{ marginBottom: "2rem" }}>
        <Link href="/models">← スタイル一覧へ</Link>
      </nav>

      <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>{style.name}</h2>

      <section
        style={{
          marginBottom: "2rem",
          background: "#f9f9f9",
          padding: "1rem",
          borderRadius: "10px",
          whiteSpace: "pre-wrap",
        }}
      >
        <p><strong>教育観：</strong><br />{style.philosophy}</p>
        <p><strong>評価観点の重視：</strong><br />{style.evaluationFocus}</p>
        <p><strong>言語活動の重視：</strong><br />{style.languageFocus}</p>
        <p><strong>育てたい子どもの姿：</strong><br />{style.childFocus}</p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>教育観モデルを編集</h3>

        {error && (
          <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
        )}

        <form onSubmit={handleSave}>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            モデル名（必須）：
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginTop: "4px",
                boxSizing: "border-box",
              }}
              required
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            教育観（必須）：
            <textarea
              value={editForm.philosophy}
              onChange={(e) => handleChange("philosophy", e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginTop: "4px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              required
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            評価観点の重視（必須）：
            <textarea
              value={editForm.evaluationFocus}
              onChange={(e) => handleChange("evaluationFocus", e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginTop: "4px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              required
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            言語活動の重視（必須）：
            <textarea
              value={editForm.languageFocus}
              onChange={(e) => handleChange("languageFocus", e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginTop: "4px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              required
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            育てたい子どもの姿（必須）：
            <textarea
              value={editForm.childFocus}
              onChange={(e) => handleChange("childFocus", e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginTop: "4px",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              required
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            更新メモ（任意）：
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="変更理由や補足メモを入力してください"
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                marginTop: "4px",
                boxSizing: "border-box",
                resize: "vertical",
                fontStyle: "italic",
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "0.8rem 1.2rem",
              fontSize: "1.1rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginTop: "1rem",
            }}
          >
            保存する
          </button>
        </form>
      </section>

      {/* 編集履歴 */}
      <section style={{ marginTop: "3rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>編集履歴</h3>
        {history.length === 0 && <p>編集履歴はありません。</p>}
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {history.map((h, i) => (
            <li
              key={i}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "#f9f9f9",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "0.9rem",
              }}
            >
              <div>
                <strong>更新日時：</strong>{new Date(h.updatedAt).toLocaleString()}
              </div>
              <div>
                <strong>メモ：</strong> {h.note}
              </div>
              <div>
                <strong>モデル名：</strong> {h.name}
              </div>
              <div>
                <strong>教育観：</strong> {h.philosophy}
              </div>
              <div>
                <strong>評価観点の重視：</strong> {h.evaluationFocus}
              </div>
              <div>
                <strong>言語活動の重視：</strong> {h.languageFocus}
              </div>
              <div>
                <strong>育てたい子どもの姿：</strong> {h.childFocus}
              </div>
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
            {relatedPlans.map((plan) => (
              <li
                key={plan.id}
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  backgroundColor: "#fdfdfd",
                }}
              >
                <p>
                  <strong>{plan.unit}</strong>（{plan.grade}・{plan.genre}）
                </p>
                <p>授業時間：{plan.hours}時間</p>
                <Link href="/plan/history">
                  <button
                    style={{
                      marginTop: "0.5rem",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                    }}
                  >
                    📖 履歴ページで確認
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
