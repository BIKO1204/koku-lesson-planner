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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      localStorage.setItem("educationStylesHistory", JSON.stringify(updatedLocalModels));
      setModels(updatedLocalModels);

      setError("");
      setSuccessMessage(editId ? "更新しました！" : "作成しました！");

      setTimeout(() => {
        setSuccessMessage("");
        router.push("/models");
      }, 2000);

      setMenuOpen(false);
      setBtnPressed(false);
      if (editId) setEditId(null);
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

  return (
    <>
      {/* ナビバー（実践記録ページと統一） */}
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
        <h1 style={{ color: "white", marginLeft: "1rem", fontSize: "1.25rem" }}>国語授業プランナー</h1>
      </nav>

      <div style={overlayStyle(menuOpen)} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />

      <div style={menuWrapperStyle(menuOpen)} aria-hidden={!menuOpen}>
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
      <main style={containerStyle}>
        <h2 style={{ marginTop: 0 }}>{editId ? "教育観モデルを編集" : "新しい教育観モデルを作成"}</h2>

        {/* 注意書き（実践記録ページと統一の枠） */}
        <div style={noticeBoxStyle}>
          <strong>このページの使い方：</strong>
          <ul style={{ margin: "8px 0 0 18px" }}>
            <li>授業の考え方を「モデル」として残し、比較・共有・振り返りに活かせます。</li>
            <li>
              モデル名は、既にある公開名に合わせても、新しく作ってもOKです（同名が増えるほど比較しやすくなります）。
            </li>
            <li>
              将来の検索・生成の質向上のために活用する場合があります。個人情報や<strong>特定の児童名</strong>は書かないでください。
            </li>
          </ul>
        </div>

        {/* ソート＋編集解除 */}
        <div style={boxStyle}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <label>
              並び替え：
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "nameAsc")}
                style={{ marginLeft: 8, padding: 6 }}
              >
                <option value="newest">新着順</option>
                <option value="nameAsc">名前順（A→Z）</option>
              </select>
            </label>

            {editId && (
              <button type="button" onClick={cancelEdit} style={ghostBtnStyle}>
                編集をやめる
              </button>
            )}
          </div>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        {/* 入力フォーム（青枠ブロック） */}
        <div style={boxStyle}>
          <label style={fieldLabelStyle}>
            作成者名（ニックネーム）（必須）
            <input
              type="text"
              value={form.creatorName}
              onChange={(e) => handleChange("creatorName", e.target.value)}
              style={inputStyle}
              placeholder="例）〇〇先生"
            />
          </label>

          <label style={fieldLabelStyle}>
            モデル名（必須）
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={inputStyle}
              placeholder="例）対話型授業、音読重視 など"
            />
          </label>

          <label style={fieldLabelStyle}>
            教育観（必須）
            <textarea
              rows={3}
              value={form.philosophy}
              onChange={(e) => handleChange("philosophy", e.target.value)}
              style={textareaStyle}
              placeholder="例）子ども一人ひとりの思いや考えを尊重し…"
            />
          </label>

          <label style={fieldLabelStyle}>
            評価観点の重視点（必須）
            <textarea
              rows={3}
              value={form.evaluationFocus}
              onChange={(e) => handleChange("evaluationFocus", e.target.value)}
              style={textareaStyle}
              placeholder="例）対話や振り返りから評価する…"
            />
          </label>

          <label style={fieldLabelStyle}>
            言語活動の重視点（必須）
            <textarea
              rows={3}
              value={form.languageFocus}
              onChange={(e) => handleChange("languageFocus", e.target.value)}
              style={textareaStyle}
              placeholder="例）発表や対話の機会を多く設け…"
            />
          </label>

          <label style={fieldLabelStyle}>
            育てたい子どもの姿（必須）
            <textarea
              rows={3}
              value={form.childFocus}
              onChange={(e) => handleChange("childFocus", e.target.value)}
              style={textareaStyle}
              placeholder="例）自分の考えを表現でき、友だちの意見を大切にする…"
            />
          </label>

          {/* 保存ボタン */}
          <div style={{ display: "grid", gridTemplateColumns: editId ? "1fr 1fr" : "1fr", gap: 12 }}>
            <button
              type="button"
              onClick={async () => {
                setBtnPressed(true);
                const ok = await saveModel();
                if (!ok) setBtnPressed(false);
              }}
              style={{
                ...primaryBtnStyle,
                backgroundColor: "#4caf50",
                opacity: btnPressed ? 0.9 : 1,
                cursor: btnPressed ? "not-allowed" : "pointer",
              }}
              disabled={btnPressed}
            >
              {editId ? "更新して保存" : "作成して保存"}
            </button>

            {editId && (
              <button type="button" onClick={cancelEdit} style={ghostBtnStyle}>
                キャンセル
              </button>
            )}
          </div>
        </div>

        {/* 一覧 */}
        {models.length > 0 && (
          <div style={boxStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong>あなたの教育観モデル</strong>
              <span style={{ fontSize: 12, color: "#1976d2" }}>{models.length}件</span>
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {models.map((m) => (
                <div key={m.id} style={listItemStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, wordBreak: "break-word" }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "#1976d2", marginTop: 4 }}>更新：{m.updatedAt}</div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>作成者：{m.creatorName}</div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {/* ★編集・削除：同じサイズ */}
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        style={{ ...smallActionBtnStyle, backgroundColor: "#1976d2" }}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        style={{ ...smallActionBtnStyle, backgroundColor: "#e53935" }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 成功トースト（2秒表示） */}
      {successMessage && <div style={successToastStyle}>{successMessage}</div>}
    </>
  );
}

/* =========================================================
 * Styles（実践記録ページと揃えたトーン）
 * ======================================================= */
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
  height: "calc(100vh - 56px)",
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
  padding: "1rem",
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

const containerStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 800,
  margin: "auto",
  fontFamily: "sans-serif",
  paddingTop: 72,
};

const noticeBoxStyle: React.CSSProperties = {
  border: "2px solid #ff7043",
  backgroundColor: "#fff3e0",
  color: "#5d4037",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
};

const boxStyle: React.CSSProperties = {
  border: "2px solid #1976d2",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
  backgroundColor: "#fff",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 6,
  border: "1px solid #cfd8dc",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: 12,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  width: "100%",
  cursor: "pointer",
};

const ghostBtnStyle: React.CSSProperties = {
  padding: 12,
  backgroundColor: "#90a4ae",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  width: "100%",
  cursor: "pointer",
};

/** ★一覧の「編集/削除」用：同じ大きさに揃える共通ボタン */
const smallActionBtnStyle: React.CSSProperties = {
  padding: "12px 12px", // ← 両方同一
  minWidth: 72,         // ← 横幅も揃う（好みで 64〜80 で調整OK）
  textAlign: "center",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
  lineHeight: 1,
};

const listItemStyle: React.CSSProperties = {
  border: "1px solid #e0e0e0",
  borderRadius: 6,
  padding: 12,
  backgroundColor: "#fff",
};

const errorStyle: React.CSSProperties = {
  color: "#d32f2f",
  fontWeight: 800,
  margin: "0 0 12px",
};

const successToastStyle: React.CSSProperties = {
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
};
