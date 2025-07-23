"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

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
    creatorName: userName, // 初期値はログインユーザー名
  });
  const [sortOrder, setSortOrder] = useState<"newest" | "nameAsc">("newest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [btnPressed, setBtnPressed] = useState(false);

  // userNameが変わったりeditIdがnull（新規作成）になったらフォームの作成者名にuserNameをセット
  useEffect(() => {
    if (!editId) {
      setForm((prev) => ({ ...prev, creatorName: userName }));
    }
  }, [userName, editId]);

  // Firestoreから自分の作成モデルだけ取得
  useEffect(() => {
    if (!userId) {
      setModels([]);
      return;
    }
    async function fetchModels() {
      try {
        const colRef = collection(db, "educationModels");
        const q = query(
          colRef,
          where("creatorId", "==", userId),
          orderBy(sortOrder === "newest" ? "updatedAt" : "name", sortOrder === "newest" ? "desc" : "asc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EducationModel, "id">),
        }));
        setModels(data);
        localStorage.setItem("styleModels", JSON.stringify(data));
      } catch (e) {
        console.error("Firestore読み込みエラー:", e);
      }
    }
    fetchModels();
  }, [sortOrder, userId]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

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
      creatorName: userName, // 新規時はユーザー名に戻す
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
        // 更新は作成者本人のみ可能（firestore security rulesでも制御推奨）
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
        // 新規登録
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

      // ローカル保存・状態更新
      const updatedLocalModels = editId
        ? models.map((m) => (m.id === editId ? newModel : m))
        : [newModel, ...models];

      localStorage.setItem("styleModels", JSON.stringify(updatedLocalModels));
      setModels(updatedLocalModels);

      cancelEdit();
      setError("");
      setSuccessMessage("保存しました！");

      setTimeout(() => {
        setSuccessMessage("");
        router.push("/models");
      }, 2000);

      setMenuOpen(false);
      return true;
    } catch (e) {
      console.error("Firestore保存エラー", e);
      setError("保存に失敗しました。");
      setSuccessMessage("");
      return false;
    }
  };

  // 削除は作成者本人のみ許可（firestore security rulesでも必須）
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
      localStorage.setItem("styleModels", JSON.stringify(filtered));
      if (editId === id) cancelEdit();
      setMenuOpen(false);
    } catch (e) {
      alert("削除に失敗しました。");
      console.error(e);
    }
  };

  // Styles定義（省略せず全部記載）
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
  const mainContainerStyle: React.CSSProperties = {
    padding: "72px 24px 24px",
    maxWidth: 900,
    margin: "auto",
    fontFamily: "sans-serif",
    backgroundColor: "#fff",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  };
  const titleStyle: React.CSSProperties = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: "1.5rem",
    textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
    textAlign: "center",
  };
  const guideTextStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    color: "#666",
    marginTop: 4,
    marginBottom: 6,
  };
  const buttonPrimary: React.CSSProperties = {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.3s ease",
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
      <div
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

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
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/");
            }}
          >
            🏠 ホーム
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/plan");
            }}
          >
            📋 授業作成
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/plan/history");
            }}
          >
            📖 計画履歴
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/practice/history");
            }}
          >
            📷 実践履歴
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/practice/share");
            }}
          >
            🌐 共有版実践記録
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/models/create");
            }}
          >
            ✏️ 教育観作成
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/models");
            }}
          >
            📚 教育観一覧
          </button>
          <button
            style={navBtnStyle}
            onClick={() => {
              setMenuOpen(false);
              router.push("/models/history");
            }}
          >
            🕒 教育観履歴
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main style={mainContainerStyle}>
        <h1 style={titleStyle}>
          {editId ? "✏️ 教育観モデルを編集" : "✏️ 新しい教育観モデルを作成"}
        </h1>

        {error && (
          <p
            style={{
              color: "#d32f2f",
              marginBottom: 24,
              fontWeight: "700",
              fontSize: "1.1rem",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        {successMessage && (
          <p
            style={{
              color: "green",
              marginBottom: 24,
              fontWeight: "700",
              fontSize: "1.1rem",
              textAlign: "center",
            }}
          >
            {successMessage}
          </p>
        )}

        <section
          style={{
            padding: 28,
            borderRadius: 8,
            backgroundColor: "#f9fafb",
            border: "1px solid #ddd",
            marginBottom: 28,
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: 18,
              fontWeight: 600,
              color: "#444",
              fontSize: "1.15rem",
            }}
          >
            作成者名（必須）：
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              例）〇〇 〇〇
            </div>
            <input
              type="text"
              value={form.creatorName}
              onChange={(e) => handleChange("creatorName", e.target.value)}
              placeholder=""
              style={{
                width: "100%",
                padding: 16,
                fontSize: "1.2rem",
                borderRadius: 6,
                border: "1.2px solid #bbb",
                marginTop: 6,
                boxSizing: "border-box",
                fontFamily: "inherit",
                backgroundColor: "#fff",
                color: "#222",
                transition: "border-color 0.25s ease",
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 18,
              fontWeight: 600,
              color: "#444",
              fontSize: "1.15rem",
            }}
          >
            モデル名（必須）：
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              例）面白い授業、対話型授業、音読重視など
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder=""
              style={{
                width: "100%",
                padding: 16,
                fontSize: "1.2rem",
                borderRadius: 6,
                border: "1.2px solid #bbb",
                marginTop: 6,
                boxSizing: "border-box",
                fontFamily: "inherit",
                backgroundColor: "#fff",
                color: "#222",
                transition: "border-color 0.25s ease",
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 18,
              fontWeight: 600,
              color: "#444",
              fontSize: "1.15rem",
            }}
          >
            教育観（必須）：
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              例）子ども一人ひとりの思いや考えを尊重し、対話を通して、自分の思いや考えを広げさせたり、深めさせたりする。
            </div>
            <textarea
              rows={3}
              value={form.philosophy}
              onChange={(e) => handleChange("philosophy", e.target.value)}
              placeholder=""
              style={{
                width: "100%",
                padding: 16,
                fontSize: "1.2rem",
                borderRadius: 6,
                border: "1.2px solid #bbb",
                marginTop: 6,
                boxSizing: "border-box",
                fontFamily: "inherit",
                backgroundColor: "#fff",
                color: "#222",
                transition: "border-color 0.25s ease",
                resize: "vertical",
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 18,
              fontWeight: 600,
              color: "#444",
              fontSize: "1.15rem",
            }}
          >
            評価観点の重視点（必須）：
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              例）思考力・判断力を育てる評価を重視し、子ども同士の対話や個人の振り返りから評価する。
            </div>
            <textarea
              rows={3}
              value={form.evaluationFocus}
              onChange={(e) => handleChange("evaluationFocus", e.target.value)}
              placeholder=""
              style={{
                width: "100%",
                padding: 16,
                fontSize: "1.2rem",
                borderRadius: 6,
                border: "1.2px solid #bbb",
                marginTop: 6,
                boxSizing: "border-box",
                fontFamily: "inherit",
                backgroundColor: "#fff",
                color: "#222",
                transition: "border-color 0.25s ease",
                resize: "vertical",
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 18,
              fontWeight: 600,
              color: "#444",
              fontSize: "1.15rem",
            }}
          >
            言語活動の重視点（必須）：
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              例）対話や発表の機会を多く設け、自分の言葉で考えを伝える力を育成する。
            </div>
            <textarea
              rows={3}
              value={form.languageFocus}
              onChange={(e) => handleChange("languageFocus", e.target.value)}
              placeholder=""
              style={{
                width: "100%",
                padding: 16,
                fontSize: "1.2rem",
                borderRadius: 6,
                border: "1.2px solid #bbb",
                marginTop: 6,
                boxSizing: "border-box",
                fontFamily: "inherit",
                backgroundColor: "#fff",
                color: "#222",
                transition: "border-color 0.25s ease",
                resize: "vertical",
              }}
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 18,
              fontWeight: 600,
              color: "#444",
              fontSize: "1.15rem",
            }}
          >
            育てたい子どもの姿（必須）：
            <div
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              例）自分で進んで思いや考えを表現できる子ども、友だちの意見を大切にする子ども。
            </div>
            <textarea
              rows={3}
              value={form.childFocus}
              onChange={(e) => handleChange("childFocus", e.target.value)}
              placeholder=""
              style={{
                width: "100%",
                padding: 16,
                fontSize: "1.2rem",
                borderRadius: 6,
                border: "1.2px solid #bbb",
                marginTop: 6,
                boxSizing: "border-box",
                fontFamily: "inherit",
                backgroundColor: "#fff",
                color: "#222",
                transition: "border-color 0.25s ease",
                resize: "vertical",
              }}
            />
          </label>

          <button
            onClick={async () => {
              setBtnPressed(true);
              const success = await saveModel();
              setBtnPressed(false);
              if (success) setError("");
            }}
            style={{
              ...buttonPrimary,
              ...(btnPressed ? { backgroundColor: "#388e3c" } : {}),
              padding: "1.1rem 3.2rem",
              fontSize: "1.35rem",
              borderRadius: 10,
              display: "block",
              margin: "0 auto",
              boxShadow: "0 5px 14px #4caf50bb",
              transition: "background-color 0.35s ease",
            }}
            disabled={btnPressed}
          >
            {editId ? "更新して保存" : "作成して保存"}
          </button>
        </section>

        {/* モデル一覧 */}
        {models.length === 0 ? (
          <p>まだモデルがありません。</p>
        ) : (
          models.map((m) => (
            <div
              key={m.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                backgroundColor: "white",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{m.name}</h3>
              <p>
                <strong>作成者：</strong> {m.creatorName || "なし"}
              </p>
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
              <p style={{ fontSize: "0.8rem", color: "#666" }}>
                更新日時: {new Date(m.updatedAt).toLocaleString()}
              </p>
              {/* 編集・削除ボタンは作成者本人のみ表示 */}
              {m.creatorId === userId && (
                <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                  <button
                    onClick={() => startEdit(m)}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{
                      backgroundColor: "#e53935",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </>
  );
}
