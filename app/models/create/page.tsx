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

  const cleanText = (text: string) => {
    return text.trim().replace(/。(、)+/g, "。");
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
          ? {
              ...m,
              name: form.name.trim(),
              philosophy: cleanText(form.philosophy),
              evaluationFocus: cleanText(form.evaluationFocus),
              languageFocus: cleanText(form.languageFocus),
              childFocus: cleanText(form.childFocus),
              updatedAt: now,
            }
          : m
      );
    } else {
      updatedModels = [
        {
          id: uuidv4(),
          name: form.name.trim(),
          philosophy: cleanText(form.philosophy),
          evaluationFocus: cleanText(form.evaluationFocus),
          languageFocus: cleanText(form.languageFocus),
          childFocus: cleanText(form.childFocus),
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
      philosophy: cleanText(form.philosophy),
      evaluationFocus: cleanText(form.evaluationFocus),
      languageFocus: cleanText(form.languageFocus),
      childFocus: cleanText(form.childFocus),
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
        body {
          background-color: #f5f5f7;
          margin: 0;
          padding: 0;
        }
        main {
          padding: 2rem 3rem;
          max-width: 1100px;
          margin: 2rem auto;
          font-family: sans-serif;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
          transition: background-color 0.3s ease;
        }
        nav a.active, nav a:hover {
          background-color: #4caf50;
        }
        h1 {
          font-size: 2.4rem;
          margin-bottom: 2rem;
          text-align: center;
          color: #333;
          letter-spacing: 0.03em;
        }
        p.error {
          color: #d32f2f;
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 600;
          font-size: 1rem;
        }
        label {
          display: block;
          margin-bottom: 20px;
          font-weight: 600;
          color: #444;
          font-size: 1.1rem;
        }
        section.form-section {
          padding: 30px 40px;
          border-radius: 10px;
          background-color: #fafafa;
          box-shadow: inset 0 0 8px #e0e0e0;
          margin-bottom: 28px;
        }
        input, textarea {
          width: 100%;
          padding: 14px 16px;
          font-size: 1.15rem;
          border-radius: 8px;
          border: 1.5px solid #bbb;
          margin-top: 8px;
          box-sizing: border-box;
          font-family: inherit;
          background-color: #fff;
          color: #222;
          transition: border-color 0.2s ease;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 6px #1976d2aa;
          background-color: #fff;
        }
        label > div.hint {
          font-size: 0.9rem;
          color: #666;
          margin-top: 6px;
          margin-bottom: 18px;
          font-style: italic;
          user-select: none;
        }
        button.save-button {
          padding: 1rem 3rem;
          font-size: 1.3rem;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          display: block;
          margin: 0 auto;
          box-shadow: 0 4px 10px #4caf50aa;
          transition: background-color 0.3s ease;
        }
        button.save-button:hover {
          background-color: #43a047;
        }
        /* スマホ向け */
        @media (max-width: 600px) {
          main {
            padding: 1rem 1.5rem;
            max-width: 100%;
            border-radius: 0;
            box-shadow: none;
            margin: 0.5rem auto;
          }
          label {
            font-size: 1rem;
            margin-bottom: 16px;
          }
          input, textarea {
            font-size: 1rem;
            padding: 12px 14px;
          }
          button.save-button {
            width: 100%;
            padding: 1.2rem;
            font-size: 1.2rem;
          }
          nav {
            justify-content: flex-start;
          }
        }
      `}</style>

      <main>
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
              placeholder="例）面白い授業、対話型授業、音読重視など"
            />
          </label>

          <label>
            教育観（必須）：
            <textarea
              rows={3}
              value={form.philosophy}
              onChange={(e) => handleChange("philosophy", e.target.value)}
              placeholder="例）子ども一人ひとりの思いや考えを尊重し、対話を通して、自分の思いや考えを広げさせたり、深めさせたりする。"
            />
          </label>

          <label>
            評価観点の重視点（必須）：
            <textarea
              rows={3}
              value={form.evaluationFocus}
              onChange={(e) => handleChange("evaluationFocus", e.target.value)}
              placeholder="例）思考力・判断力を育てる評価を重視し、子ども同士の対話や個人の振り返りから評価する。"
            />
          </label>

          <label>
            言語活動の重視点（必須）：
            <textarea
              rows={3}
              value={form.languageFocus}
              onChange={(e) => handleChange("languageFocus", e.target.value)}
              placeholder="例）対話や発表の機会を多く設け、自分の言葉で考えを伝える力を育成する。"
            />
          </label>

          <label>
            育てたい子どもの姿（必須）：
            <textarea
              rows={3}
              value={form.childFocus}
              onChange={(e) => handleChange("childFocus", e.target.value)}
              placeholder="例）自分で進んで思いや考えを表現できる子ども、友だちの意見を大切にする子ども。"
            />
          </label>

          <label>
            更新メモ（任意）：
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              style={{ fontStyle: "italic" }}
              placeholder="例）今年度の授業で重視したい点や変更点などを書いてください。"
            />
          </label>

          <button className="save-button" onClick={handleSave}>
            {editId ? "更新して保存" : "作成して保存"}
          </button>
        </section>
      </main>
    </>
  );
}
