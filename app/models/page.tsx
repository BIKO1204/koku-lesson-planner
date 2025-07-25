"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import html2pdf from "html2pdf.js";

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

  const [models, setModels] = useState<EducationModel[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    philosophy: "",
    evaluationFocus: "",
    languageFocus: "",
    childFocus: "",
    creatorName: "",
  });
  const [sortOrder, setSortOrder] = useState<"newest" | "nameAsc">("newest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  // スマホ判定用state
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1000
  );

  // PDF用 refs をモデルごとに保持するため、Mapで管理
  const pdfRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // ウィンドウリサイズ監視
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function fetchModels() {
      try {
        const colRef = collection(db, "educationModels");
        const q = query(
          colRef,
          orderBy(
            sortOrder === "newest" ? "updatedAt" : "name",
            sortOrder === "newest" ? "desc" : "asc"
          )
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EducationModel, "id">),
        }));
        setModels(data);
      } catch (e) {
        console.error("Firestoreからの読み込みエラー:", e);
      }
    }
    fetchModels();
  }, [sortOrder]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startEdit = (m: EducationModel) => {
    if (m.creatorId !== userId) {
      alert("編集は作成者本人のみ可能です");
      return;
    }
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
      creatorName: "",
    });
    setError("");
  };

  const saveModel = async () => {
    if (
      !form.name.trim() ||
      !form.philosophy.trim() ||
      !form.evaluationFocus.trim() ||
      !form.languageFocus.trim() ||
      !form.childFocus.trim() ||
      !form.creatorName.trim()
    ) {
      setError("必須項目をすべて入力してください。");
      return false;
    }
    if (!userId) {
      setError("ログイン状態が不明です。再ログインしてください。");
      return false;
    }

    const now = new Date().toISOString();

    try {
      let newModel: EducationModel;

      if (editId) {
        const original = models.find((m) => m.id === editId);
        if (!original || original.creatorId !== userId) {
          alert("編集は作成者本人のみ可能です");
          return false;
        }
        const docRef = doc(db, "educationModels", editId);
        await updateDoc(docRef, {
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          updatedAt: now,
          creatorId: userId,
        });

        await addDoc(collection(db, "educationModelsHistory"), {
          modelId: editId,
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          updatedAt: now,
          creatorId: userId,
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
          updatedAt: now,
          creatorId: userId,
        };
      } else {
        const colRef = collection(db, "educationModels");
        const docRef = await addDoc(colRef, {
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          updatedAt: now,
          creatorId: userId,
        });

        await addDoc(collection(db, "educationModelsHistory"), {
          modelId: docRef.id,
          name: form.name.trim(),
          philosophy: form.philosophy.trim(),
          evaluationFocus: form.evaluationFocus.trim(),
          languageFocus: form.languageFocus.trim(),
          childFocus: form.childFocus.trim(),
          creatorName: form.creatorName.trim(),
          updatedAt: now,
          creatorId: userId,
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
          updatedAt: now,
          creatorId: userId,
        };
      }

      const updatedLocalModels = editId
        ? models.map((m) => (m.id === editId ? newModel : m))
        : [newModel, ...models];
      setModels(updatedLocalModels);

      cancelEdit();
      setError("");
      setMenuOpen(false);

      if (editId) {
        router.push("/models/history");
      }

      return true;
    } catch (e) {
      console.error("Firestore保存エラー", e);
      setError("保存に失敗しました。");
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    const model = models.find((m) => m.id === id);
    if (!model) return;
    if (model.creatorId !== userId) {
      alert("削除は作成者本人のみ可能です");
      return;
    }
    if (!confirm("このモデルを削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "educationModels", id));
      const filtered = models.filter((m) => m.id !== id);
      setModels(filtered);
      if (editId === id) cancelEdit();
      setMenuOpen(false);
    } catch (e) {
      alert("削除に失敗しました。");
      console.error(e);
    }
  };

  const handlePdfSave = async (id: string) => {
    const element = pdfRefs.current.get(id);
    if (!element) {
      alert("PDF生成対象が見つかりません。");
      return;
    }
    const model = models.find((m) => m.id === id);
    if (!model) {
      alert("モデル情報が見つかりません。");
      return;
    }

    const originalStyle = element.style.cssText;

    element.style.position = "static";
    element.style.left = "auto";
    element.style.width = "210mm";
    element.style.maxWidth = "100%";
    element.style.padding = "20mm 15mm";
    element.style.backgroundColor = "white";
    element.style.color = "#222";
    element.style.fontFamily =
      "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif";
    element.style.fontSize = "14px";
    element.style.lineHeight = "1.7";
    element.style.boxSizing = "border-box";
    element.style.wordBreak = "break-word";
    element.style.whiteSpace = "pre-wrap";

    const sanitizeFileName = (name: string) =>
      name.replace(/[\\/:"*?<>|]+/g, "_");

    const filename = `教育観モデル_${sanitizeFileName(
      model.name
    )}_${sanitizeFileName(model.creatorName)}.pdf`;

    try {
      await html2pdf()
        .from(element)
        .set({
          margin: 15,
          filename,
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .save();
    } catch (e) {
      alert("PDFの生成に失敗しました。");
      console.error(e);
    } finally {
      element.style.cssText = originalStyle;
    }
  };

  // --- Styles ---

  // スマホかどうか判定（480px未満をスマホとする）
  const isMobile = windowWidth < 480;

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

  // メニューのボタンはスマホで少し大きく間隔を広げる
  const menuLinksWrapperStyle: React.CSSProperties = {
    overflowY: "auto",
    flexGrow: 1,
    paddingTop: "1rem",
    paddingBottom: "20px",
  };
  const navBtnStyle: React.CSSProperties = {
    marginBottom: isMobile ? 14 : 8,
    padding: isMobile ? "1rem 1rem" : "0.5rem 1rem",
    backgroundColor: "#1976d2",
    color: "white",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    display: "block",
    width: "100%",
    textAlign: "left",
    fontSize: isMobile ? "1.1rem" : "1rem",
  };
  const logoutButtonStyle: React.CSSProperties = {
    padding: isMobile ? "1rem" : "0.75rem 1rem",
    backgroundColor: "#e53935",
    color: "white",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    margin: "1rem",
    fontSize: isMobile ? "1.1rem" : "1rem",
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
    padding: isMobile ? "72px 12px 12px" : "72px 24px 24px",
    maxWidth: isMobile ? "100%" : 900,
    margin: "auto",
    fontFamily: "sans-serif",
    backgroundColor: "#fff",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    boxSizing: "border-box",
    fontSize: isMobile ? "1rem" : "1.1rem",
    lineHeight: 1.5,
  };
  const cardStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    position: "relative",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: isMobile ? 10 : 8,
    marginBottom: 12,
    fontSize: isMobile ? "1.1rem" : "1rem",
    borderRadius: 6,
    border: "1px solid #ccc",
    boxSizing: "border-box",
  };
  const buttonPrimary: React.CSSProperties = {
    backgroundColor: "#4caf50",
    color: "white",
    padding: isMobile ? "10px 20px" : "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: isMobile ? "1.1rem" : "1rem",
  };

  const editSectionTitleStyle: React.CSSProperties = {
    fontWeight: "bold",
    fontSize: isMobile ? "1.1rem" : "1.1rem",
    marginBottom: 6,
    marginTop: 12,
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
        <h1
          style={{
            color: "white",
            marginLeft: "1rem",
            fontSize: isMobile ? "1.1rem" : "1.25rem",
          }}
        >
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
        <h1 style={{ fontSize: isMobile ? 22 : 24, marginBottom: 16 }}>
          教育観モデル一覧・編集
        </h1>

        {/* 並び替え */}
        <label style={{ display: "block", marginBottom: 16, fontSize: isMobile ? 14 : 16 }}>
          並び替え：
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            style={{ marginLeft: 8, padding: 6, fontSize: isMobile ? 14 : 16 }}
          >
            <option value="newest">新着順</option>
            <option value="nameAsc">名前順</option>
          </select>
        </label>

        {/* エラー表示 */}
        {error && (
          <p
            style={{
              color: "red",
              marginBottom: 16,
              fontWeight: "bold",
              fontSize: isMobile ? 14 : 16,
            }}
          >
            {error}
          </p>
        )}

        {/* モデル一覧 */}
        {models.length === 0 ? (
          <p style={{ fontSize: isMobile ? 14 : 16 }}>まだモデルがありません。</p>
        ) : (
          models.map((m) => (
            <div key={m.id} style={cardStyle}>
              <h3 style={{ marginTop: 0, fontSize: isMobile ? 18 : 20 }}>{m.name}</h3>
              <p style={{ fontSize: isMobile ? 14 : 16 }}>
                <strong>作成者：</strong> {m.creatorName}
              </p>
              <p style={{ fontSize: isMobile ? 14 : 16 }}>
                <strong>教育観：</strong> {m.philosophy}
              </p>
              <p style={{ fontSize: isMobile ? 14 : 16 }}>
                <strong>評価観点：</strong> {m.evaluationFocus}
              </p>
              <p style={{ fontSize: isMobile ? 14 : 16 }}>
                <strong>言語活動：</strong> {m.languageFocus}
              </p>
              <p style={{ fontSize: isMobile ? 14 : 16 }}>
                <strong>育てたい子どもの姿：</strong> {m.childFocus}
              </p>
              <p
                style={{
                  fontSize: isMobile ? 12 : 14,
                  color: "#666",
                }}
              >
                更新日時: {new Date(m.updatedAt).toLocaleString()}
              </p>

              {/* PDF保存用非表示DOM */}
              <div
                ref={(el) => {
                  if (el) {
                    pdfRefs.current.set(m.id, el);
                  } else {
                    pdfRefs.current.delete(m.id);
                  }
                }}
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "210mm",
                  maxWidth: "100%",
                  padding: "20mm 15mm",
                  backgroundColor: "white",
                  color: "#222",
                  fontFamily:
                    "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
                  fontSize: 14,
                  lineHeight: 1.7,
                  boxSizing: "border-box",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    marginBottom: 24,
                    borderBottom: "2px solid #1976d2",
                    paddingBottom: 8,
                    color: "#1976d2",
                  }}
                >
                  {m.name}
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 12,
                    color: "#555",
                  }}
                >
                  作成者：{m.creatorName}
                </p>

                <section style={{ marginBottom: 24 }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 12,
                      borderBottom: "1px solid #ccc",
                      paddingBottom: 6,
                      color: "#1565c0",
                    }}
                  >
                    教育観
                  </h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.philosophy}</p>
                </section>

                <section style={{ marginBottom: 24 }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 12,
                      borderBottom: "1px solid #ccc",
                      paddingBottom: 6,
                      color: "#1565c0",
                    }}
                  >
                    評価観点の重視点
                  </h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.evaluationFocus}</p>
                </section>

                <section style={{ marginBottom: 24 }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 12,
                      borderBottom: "1px solid #ccc",
                      paddingBottom: 6,
                      color: "#1565c0",
                    }}
                  >
                    言語活動の重視点
                  </h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.languageFocus}</p>
                </section>

                <section style={{ marginBottom: 24 }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 12,
                      borderBottom: "1px solid #ccc",
                      paddingBottom: 6,
                      color: "#1565c0",
                    }}
                  >
                    育てたい子どもの姿
                  </h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.childFocus}</p>
                </section>
              </div>

              {/* ボタン群 */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                {m.creatorId === userId && (
                  <>
                    <button onClick={() => startEdit(m)} style={buttonPrimary}>
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      style={{ ...buttonPrimary, backgroundColor: "#e53935" }}
                    >
                      削除
                    </button>
                  </>
                )}
                <button
                  onClick={() => handlePdfSave(m.id)}
                  style={{ ...buttonPrimary, backgroundColor: "#ff9800" }}
                >
                  PDF保存
                </button>
                <button
                  onClick={() => router.push(`/plan?styleId=${m.id}`)}
                  style={{ ...buttonPrimary, backgroundColor: "#2196f3" }}
                >
                  このモデルで授業案を作成
                </button>
              </div>

              {/* 編集フォーム */}
              {editId === m.id && (
                <section
                  style={{
                    ...cardStyle,
                    marginTop: 12,
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <h4 style={{ fontSize: isMobile ? 18 : 20 }}>編集モード</h4>

                  <label style={editSectionTitleStyle}>作成者名（必須）</label>
                  <input
                    placeholder="作成者名"
                    value={form.creatorName}
                    onChange={(e) => handleChange("creatorName", e.target.value)}
                    style={inputStyle}
                  />

                  <label style={editSectionTitleStyle}>モデル名（必須）</label>
                  <input
                    placeholder="モデル名"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    style={inputStyle}
                  />

                  <label style={editSectionTitleStyle}>教育観（必須）</label>
                  <textarea
                    placeholder="教育観"
                    rows={2}
                    value={form.philosophy}
                    onChange={(e) => handleChange("philosophy", e.target.value)}
                    style={inputStyle}
                  />

                  <label style={editSectionTitleStyle}>評価観点の重視点（必須）</label>
                  <textarea
                    placeholder="評価観点の重視点"
                    rows={2}
                    value={form.evaluationFocus}
                    onChange={(e) =>
                      handleChange("evaluationFocus", e.target.value)
                    }
                    style={inputStyle}
                  />

                  <label style={editSectionTitleStyle}>言語活動の重視点（必須）</label>
                  <textarea
                    placeholder="言語活動の重視点"
                    rows={2}
                    value={form.languageFocus}
                    onChange={(e) => handleChange("languageFocus", e.target.value)}
                    style={inputStyle}
                  />

                  <label style={editSectionTitleStyle}>育てたい子どもの姿（必須）</label>
                  <textarea
                    placeholder="育てたい子どもの姿"
                    rows={2}
                    value={form.childFocus}
                    onChange={(e) => handleChange("childFocus", e.target.value)}
                    style={inputStyle}
                  />

                  <div style={{ marginTop: 16 }}>
                    <button
                      onClick={async () => {
                        const success = await saveModel();
                        if (success) setError("");
                      }}
                      style={buttonPrimary}
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        ...buttonPrimary,
                        backgroundColor: "#757575",
                        marginLeft: 8,
                      }}
                    >
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
