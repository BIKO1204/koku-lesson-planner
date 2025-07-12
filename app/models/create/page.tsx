"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        /* 共通のボディ・メイン */
        body {
          background-color: #f7f8fa;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }
        main {
          max-width: 960px;
          margin: 3rem auto 4rem auto;
          padding: 2rem 1.5rem;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
        }

        /* ナビゲーション */
        nav {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          justify-content: center;
          margin-bottom: 2rem;
        }
        nav a {
          padding: 8px 14px;
          background-color: #1976d2;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          white-space: nowrap;
          font-weight: 600;
          font-size: 1rem;
          flex-shrink: 0;
          transition: background-color 0.3s ease;
        }
        nav a:hover,
        nav a.active {
          background-color: #4caf50;
        }

        /* タイトル */
        h1 {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          text-align: center;
          color: #222;
          letter-spacing: 0.02em;
        }

        /* エラーメッセージ */
        p.error {
          color: #d32f2f;
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        /* フォームラベル */
        label {
          display: block;
          margin-bottom: 18px;
          font-weight: 600;
          color: #444;
          font-size: 1.15rem;
        }

        /* フォームセクション */
        section.form-section {
          background-color: #f9fafb;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 28px 36px;
          margin-bottom: 2rem;
        }

        /* 入力フォーム */
        input, textarea {
          width: 100%;
          padding: 16px 18px;
          font-size: 1.2rem;
          border-radius: 6px;
          border: 1.2px solid #bbb;
          margin-top: 6px;
          box-sizing: border-box;
          font-family: inherit;
          background-color: #fff;
          color: #222;
          transition: border-color 0.25s ease;
          resize: vertical;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 8px #1976d2cc;
          background-color: #fff;
        }

        /* フォーム内のヒント文 */
        label > div.hint {
          font-size: 0.9rem;
          color: #666;
          margin-top: 6px;
          margin-bottom: 16px;
          font-style: italic;
          user-select: none;
        }

        /* 保存ボタン */
        button.save-button {
          background-color: #4caf50;
          color: white;
          font-weight: 700;
          font-size: 1.35rem;
          padding: 1.1rem 3.2rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: block;
          margin: 0 auto;
          box-shadow: 0 5px 14px #4caf50bb;
          transition: background-color 0.35s ease;
        }
        button.save-button:hover {
          background-color: #43a047;
        }

        /* スマホ対応 */
        @media (max-width: 600px) {
          main {
            padding: 1.5rem 0.5rem !important;
            max-width: 100%;
            border-radius: 0;
            box-shadow: none;
            margin: 1rem auto 2rem auto;
          }
          label {
            font-size: 1rem;
            margin-bottom: 14px;
          }
          input, textarea {
            font-size: 1.1rem;
            padding: 12px 8px !important;
          }
          button.save-button {
            width: 100%;
            padding: 1.4rem;
            font-size: 1.3rem;
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
