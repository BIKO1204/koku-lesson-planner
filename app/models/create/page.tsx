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

  return (
    <>
      <style>{`
        main {
          padding: 2rem 4rem;
          max-width: 900px;
          margin: 0 auto;
          font-family: sans-serif;
        }
        nav {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          justify-content: center;
        }
        nav a {
          padding: 8px 12px;
          background-color: #1976d2;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
        }
        nav a.active {
          background-color: #4caf50;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        p.error {
          color: red;
          margin-bottom: 1rem;
          text-align: center;
        }
        label {
          display: block;
          margin-bottom: 12px;
        }
        section.form-section {
          background-color: #ffffff;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        input, textarea {
          width: 95%;
          padding: 0.8rem;
          font-size: 1.1rem;
          border-radius: 6px;
          border: 1px solid #ddd;
          margin-top: 4px;
          box-sizing: border-box;
          font-family: inherit;
          background-color: #fff;
          color: #111;
        }
        label > div.hint {
          font-size: 0.85rem;
          color: #555;
          margin-top: 6px;
          margin-bottom: 16px;
          font-style: italic;
          user-select: none;
        }
        button.save-button {
          padding: 0.8rem 2rem;
          font-size: 1.1rem;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: inline-block;
          width: auto;
        }
        /* スマホ向け */
        @media (max-width: 600px) {
          main {
            padding: 1rem 1.5rem;
          }
          input, textarea {
            width: 100%;
            font-size: 1rem;
          }
          label > div.hint {
            margin-bottom: 12px;
            font-size: 0.8rem;
          }
          button.save-button {
            width: 100%;
            padding: 1rem;
            font-size: 1.2rem;
          }
          nav {
            justify-content: flex-start;
          }
        }
      `}</style>

      <main>
        {/* ナビゲーション */}
        <nav>
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
              className={href === "/models/create" ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>

        <h1>{editId ? "✏️ 教育観モデルを編集" : "✏️ 新しい教育観モデルを作成"}</h1>

        {error && <p className="error">{error}</p>}

        <section className="form-section">
          <label>
            モデル名（必須）：
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <div className="hint">例）面白い授業、対話型授業、音読重視など</div>
          </label>

          <label>
            教育観（必須）：
            <textarea
              rows={2}
              value={form.philosophy}
              onChange={(e) => handleChange("philosophy", e.target.value)}
            />
            <div className="hint">
              例）子ども一人ひとりの思いや考えを尊重し、対話を通して、自分の思いや考えを広げさせたり、深めさせたりする。
            </div>
          </label>

          <label>
            評価観点の重視点（必須）：
            <textarea
              rows={2}
              value={form.evaluationFocus}
              onChange={(e) => handleChange("evaluationFocus", e.target.value)}
            />
            <div className="hint">
              例）思考力・判断力を育てる評価を重視し、子ども同士の対話や個人の振り返りから評価する。
            </div>
          </label>

          <label>
            言語活動の重視点（必須）：
            <textarea
              rows={2}
              value={form.languageFocus}
              onChange={(e) => handleChange("languageFocus", e.target.value)}
            />
            <div className="hint">
              例）対話や発表の機会を多く設け、自分の言葉で考えを伝える力を育成する。
            </div>
          </label>

          <label>
            育てたい子どもの姿（必須）：
            <textarea
              rows={2}
              value={form.childFocus}
              onChange={(e) => handleChange("childFocus", e.target.value)}
            />
            <div className="hint">
              例）自分で進んで思いや考えを表現できる子ども、友だちの意見を大切にする子ども。
            </div>
          </label>

          <label>
            更新メモ（任意）：
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              style={{ fontStyle: "italic" }}
            />
            <div className="hint">例）今年度の授業で重視したい点や変更点などを書いてください。</div>
          </label>

          <div style={{ textAlign: "center" }}>
            <button className="save-button" onClick={handleSave}>
              {editId ? "更新して保存" : "作成して保存"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
