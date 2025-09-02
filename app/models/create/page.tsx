"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type EducationModel = {
  id: string;
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  updatedAt: string;
  creatorId: string;
  creatorName: string;
};

export default function EducationModelsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const userId = session?.user?.email || "";
  const userName = session?.user?.name || "名無し";

  const [models, setModels] = useState<EducationModel[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    philosophy: "",
    evaluationFocus: "",
    languageFocus: "",
    childFocus: "",
    creatorName: userName,
  });
  const [sortOrder, setSortOrder] = useState<"newest" | "nameAsc">("newest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [btnPressed, setBtnPressed] = useState(false);

  // フォームの作成者名をセッションに追随
  useEffect(() => {
    if (!editId) setForm((prev) => ({ ...prev, creatorName: userName }));
  }, [userName, editId]);

  // 一覧の取得（既存ロジックのまま）
  useEffect(() => {
    if (!userId) {
      setModels([]);
      return;
    }
    async function fetchModels() {
      try {
        const colRef = collection(db, "educationModels");
        const qy = query(
          colRef,
          where("creatorId", "==", userId),
          orderBy(
            sortOrder === "newest" ? "updatedAt" : "name",
            sortOrder === "newest" ? "desc" : "asc"
          )
        );
        const snapshot = await getDocs(qy);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EducationModel, "id">),
        }));
        setModels(data);
        localStorage.setItem("educationStylesHistory", JSON.stringify(data));
      } catch (e) {
        console.error("Firestore読み込みエラー:", e);
      }
    }
    fetchModels();
  }, [sortOrder, userId]);

  const toggleMenu = () => setMenuOpen((v) => !v);

  const handleChange = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const startEdit = (m: EducationModel) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      philosophy: m.philosophy,
      evaluationFocus: m.evaluationFocus,
      languageFocus: m.languageFocus,
      childFocus: m.childFocus,
      creatorName: m.creatorName,
    });
    setError("");
    setSuccessMessage("");
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
      creatorName: userName,
    });
    setError("");
    setSuccessMessage("");
  };

  const saveModel = async (): Promise<boolean> => {
    if (
      !form.name.trim() ||
      !form.philosophy.trim() ||
      !form.evaluationFocus.trim() ||
      !form.languageFocus.trim() ||
      !form.childFocus.trim() ||
      !form.creatorName.trim()
    ) {
      setError("必須項目をすべて入力してください。");
      setSuccessMessage("");
      return false;
    }
    if (!userId) {
      setError("ログイン状態が不明です。再ログインしてください。");
      setSuccessMessage("");
      return false;
    }

    const now = new Date().toISOString();

    try {
      let newModel: EducationModel;

      if (editId) {
        // 既存モデルの更新
        const docRef = doc(db, "educationModels", editId);
        await updateDoc(docRef, {
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          creatorId: userId,
          updatedAt: now,
        });

        // 履歴コレクションに編集履歴を追加
        await addDoc(collection(db, "educationModelsHistory"), {
          modelId: editId,
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          creatorId: userId,
          updatedAt: now,
          note: "編集",
        });

        newModel = {
          id: editId,
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          creatorId: userId,
          updatedAt: now,
        };
      } else {
        // 新規モデル作成
        const colRef = collection(db, "educationModels");
        const docRef = await addDoc(colRef, {
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          creatorId: userId,
          updatedAt: now,
        });

        // 履歴コレクションに新規作成履歴を追加
        await addDoc(collection(db, "educationModelsHistory"), {
          modelId: docRef.id,
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          creatorId: userId,
          updatedAt: now,
          note: "新規作成",
        });

        newModel = {
          id: docRef.id,
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          creatorId: userId,
          updatedAt: now,
        };
      }

      const updatedLocalModels = editId
        ? models.map((m) => (m.id === editId ? newModel : m))
        : [newModel, ...models];

      localStorage.setItem(
        "educationStylesHistory",
        JSON.stringify(updatedLocalModels)
      );
      setModels(updatedLocalModels);

      setError("");
      setSuccessMessage(editId ? "更新しました！" : "作成しました！");

      // ✅ 2秒だけ成功メッセージを表示 → 一覧へ
      setTimeout(() => {
        setSuccessMessage("");
        router.push("/models");
      }, 2000);

      setMenuOpen(false);
      setBtnPressed(false);
      if (editId) setEditId(null); // 編集終了
      return true;
    } catch (e) {
      console.error("Firestore保存エラー", e);
      setError("保存に失敗しました。");
      setSuccessMessage("");
      setBtnPressed(false);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    const model = models.find((m) => m.id === id);
    if (!model) return;
    if (model.creatorId !== userId) {
      alert("削除は作成者本人のみ可能です。");
      return;
    }
    if (!confirm("このモデルを削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "educationModels", id));
      const filtered = models.filter((m) => m.id !== id);
      setModels(filtered);
      localStorage.setItem("educationStylesHistory", JSON.stringify(filtered));
      if (editId === id) cancelEdit();
      setMenuOpen(false);
    } catch (e) {
      alert("削除に失敗しました。");
      console.error(e);
    }
  };

  // ===== Styles（他ページと統一トーン） =====
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
  const barStyle: React.CSSProperties = { height: 4, backgroundColor: "white", borderRadius: 2 };
  const overlayStyle: React.CSSProperties = {
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
  };
  const menuWrapperStyle: React.CSSProperties = {
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
  };
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
    paddingTop: "1rem",
    paddingBottom: "20px",
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
  const mainContainerStyle: React.CSSProperties = {
    padding: "72px 24px 24px",
    maxWidth: 900,
    margin: "auto",
    fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
  };
  const pageTitleStyle: React.CSSProperties = {
    fontSize: "1.8rem",
    marginBottom: "0.75rem",
    textAlign: "center",
    userSelect: "none",
  };
  const toolbarStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
    background: "#f6f9ff",
    border: "1px solid #d6e3ff",
    borderRadius: 8,
    padding: 8,
  };
  const selectStyle: React.CSSProperties = {
    minWidth: 160,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #c5d2f0",
    outline: "none",
    background: "white",
  };
  const formCardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    border: "1px solid #e0e7ff",
  };
  const valueNoteStyle: React.CSSProperties = {
    background: "#fffef7",
    border: "1px solid #ffecb3",
    borderRadius: 8,
    padding: 10,
    color: "#604a00",
    marginBottom: 12,
    lineHeight: 1.6,
    fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 12,
    fontWeight: 600,
    color: "#444",
    fontSize: "1.05rem",
  };
  const helperStyle: React.CSSProperties = { fontSize: "0.9rem", color: "#666", margin: "4px 0 6px" };
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
  const previewCardStyle: React.CSSProperties = {
    marginTop: 16,
    padding: 16,
    border: "1px solid #dfe6ff",
    borderRadius: 8,
    backgroundColor: "#fafbff",
    lineHeight: 1.6,
    color: "#333",
  };
  const buttonPrimary: React.CSSProperties = {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  };
  const buttonGhost: React.CSSProperties = {
    backgroundColor: "#90a4ae",
    color: "white",
    padding: "10px 16px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  };
  const errorStyle: React.CSSProperties = {
    color: "#d32f2f",
    marginBottom: 16,
    fontWeight: 700,
    textAlign: "center",
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
        <h1 style={{ color: "white", marginLeft: "1rem", fontSize: "1.25rem" }}>
          国語授業プランナー
        </h1>
      </nav>

      {/* メニューオーバーレイ */}
      <div style={overlayStyle} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />

      {/* メニュー全体 */}
      <div style={menuWrapperStyle} aria-hidden={!menuOpen}>
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
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/"))}>
            🏠 ホーム
          </button>
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/plan"))}>
            📋 授業作成
          </button>
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/plan/history"))}>
            📖 計画履歴
          </button>
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/practice/history"))}>
            📷 実践履歴
          </button>
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/practice/share"))}>
            🌐 共有版実践記録
          </button>
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/models/create"))}>
            ✏️ 教育観作成
          </button>
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/models"))}>
            📚 教育観一覧
          </button>
          <button style={navBtnStyle} onClick={() => (setMenuOpen(false), router.push("/models/history"))}>
            🕒 教育観履歴
          </button>
        </div>
      </div>

      {/* メイン */}
      <main style={mainContainerStyle}>
        <h1 style={pageTitleStyle}>{editId ? "✏️ 教育観モデルを編集" : "✏️ 新しい教育観モデルを作成"}</h1>

        {/* ページの意義（注釈・“既存”表現ナシ、児童で統一） */}
        <section style={valueNoteStyle}>
          <p style={{ margin: 0 }}>
            ここは<strong>教育観モデルを作成・編集</strong>するページです。授業の考え方を「モデル」として残し、
            比較・共有・振り返りに活かせます。
          </p>
          <ul style={{ margin: "8px 0 0 1.2em" }}>
            <li style={{ margin: "4px 0" }}>
              モデル名は<strong>2通りの付け方</strong>どちらでもOKです：
              <ul style={{ margin: "6px 0 0 1.2em" }}>
                <li style={{ margin: "2px 0" }}>
                  <strong>📚 教育観一覧</strong>に出ている<strong>公開モデル名に合わせる</strong>
                  …同じ名前に記録が集まり、横断で見比べやすくなります
                </li>
                <li style={{ margin: "2px 0" }}>
                  <strong>新しいモデル名で作る</strong>
                  …新しい視点として共有できます。あとから同名で投稿する人が増えるほどデータが育ちます
                </li>
              </ul>
            </li>
            <li style={{ margin: "4px 0" }}>
              できれば<strong>「他の方と同じモデル名」</strong>でご自身の思いや考えを共有してください（比較や集約がしやすくなります）。
              もちろん<strong>新しい名前</strong>でも大歓迎です。
            </li>
            <li style={{ margin: "4px 0" }}>
              将来の検索・生成の質向上のために活用する場合があります。個人情報や<strong>特定の児童名</strong>は書かないでください。
            </li>
          </ul>
        </section>

        {/* ソート（一覧取得はそのまま使う） */}
        <section style={toolbarStyle} aria-label="一覧表示設定">
          <label style={{ fontSize: 14, color: "#455a64" }}>
            並び替え：
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "nameAsc")}
              style={{ ...selectStyle, marginLeft: 8 }}
            >
              <option value="newest">新着順</option>
              <option value="nameAsc">名前順（A→Z）</option>
            </select>
          </label>
          {editId && (
            <button onClick={cancelEdit} style={{ ...buttonGhost, marginLeft: "auto" }}>
              編集をやめる
            </button>
          )}
        </section>

        {error && <p style={errorStyle}>{error}</p>}

        <section style={formCardStyle}>
          {/* 作成者名 */}
          <label style={labelStyle}>
            作成者名（必須）
            <div style={helperStyle}>例）〇〇 〇〇</div>
            <input
              type="text"
              value={form.creatorName}
              onChange={(e) => handleChange("creatorName", e.target.value)}
              style={inputStyle}
            />
          </label>

          {/* モデル名 */}
          <label style={labelStyle}>
            モデル名（必須）
            <div style={helperStyle}>
              例）面白い授業、対話型授業、音読重視 など。　
              <strong>📚 教育観一覧の公開モデル名に合わせても、新しい名前でもOK</strong>です。
              同じ名前が増えるほどデータが集まり、分析・比較がしやすくなります。
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={inputStyle}
            />
          </label>

          {/* 教育観 */}
          <label style={labelStyle}>
            教育観（必須）
            <div style={helperStyle}>
              例）子ども一人ひとりの思いや考えを尊重し、対話を通して、自分の思いや考えを広げさせたり、深めさせたりする。
            </div>
            <textarea
              rows={3}
              value={form.philosophy}
              onChange={(e) => handleChange("philosophy", e.target.value)}
              style={textareaStyle}
            />
          </label>

          {/* 評価観点 */}
          <label style={labelStyle}>
            評価観点の重視点（必須）
            <div style={helperStyle}>
              例）思考力・判断力を育てる評価を重視し、子ども同士の対話や個人の振り返りから評価する。
            </div>
            <textarea
              rows={3}
              value={form.evaluationFocus}
              onChange={(e) => handleChange("evaluationFocus", e.target.value)}
              style={textareaStyle}
            />
          </label>

          {/* 言語活動 */}
          <label style={labelStyle}>
            言語活動の重視点（必須）
            <div style={helperStyle}>
              例）対話や発表の機会を多く設け、自分の言葉で考えを伝える力を育成する。
            </div>
            <textarea
              rows={3}
              value={form.languageFocus}
              onChange={(e) => handleChange("languageFocus", e.target.value)}
              style={textareaStyle}
            />
          </label>

          {/* 育てたい子どもの姿 */}
          <label style={labelStyle}>
            育てたい子どもの姿（必須）
            <div style={helperStyle}>
              例）自分で進んで思いや考えを表現できる子ども、友だちの意見を大切にする子ども。
            </div>
            <textarea
              rows={3}
              value={form.childFocus}
              onChange={(e) => handleChange("childFocus", e.target.value)}
              style={textareaStyle}
            />
          </label>

          {/* プレビュー */}
          <section aria-label="入力内容プレビュー" style={previewCardStyle}>
            <h2 style={{ fontSize: "1.2rem", margin: "0 0 8px" }}>入力内容プレビュー</h2>
            <p>
              <strong>作成者名：</strong> {form.creatorName || "(未入力)"}
            </p>
            <p>
              <strong>モデル名：</strong> {form.name || "(未入力)"}
            </p>
            <p>
              <strong>教育観：</strong>
              <br />
              {form.philosophy
                ? form.philosophy.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))
                : "(未入力)"}
            </p>
            <p>
              <strong>評価観点の重視点：</strong>
              <br />
              {form.evaluationFocus
                ? form.evaluationFocus.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))
                : "(未入力)"}
            </p>
            <p>
              <strong>言語活動の重視点：</strong>
              <br />
              {form.languageFocus
                ? form.languageFocus.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))
                : "(未入力)"}
            </p>
            <p>
              <strong>育てたい子どもの姿：</strong>
              <br />
              {form.childFocus
                ? form.childFocus.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))
                : "(未入力)"}
            </p>
          </section>

          {/* 保存/取消 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button
              onClick={async () => {
                setBtnPressed(true);
                const ok = await saveModel();
                if (!ok) setBtnPressed(false);
              }}
              style={{
                ...buttonPrimary,
                ...(btnPressed ? { backgroundColor: "#388e3c" } : {}),
                boxShadow: "0 5px 14px rgba(76,175,80,.5)",
              }}
              disabled={btnPressed}
            >
              {editId ? "更新して保存" : "作成して保存"}
            </button>
            {editId && (
              <button onClick={cancelEdit} style={buttonGhost}>
                キャンセル
              </button>
            )}
          </div>
        </section>

        {/* 一覧（簡易） */}
        {models.length > 0 && (
          <section style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 8 }}>あなたの教育観モデル</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {models.map((m) => (
                <li
                  key={m.id}
                  style={{
                    border: "1px solid #e0e7ff",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>更新：{m.updatedAt}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(m)} style={buttonGhost}>
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        style={{ ...buttonGhost, background: "#e53935" }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* 成功トースト（2秒表示） */}
      {successMessage && <div style={successBannerStyle}>{successMessage}</div>}
    </>
  );
}
