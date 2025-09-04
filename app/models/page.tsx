"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import html2pdf from "html2pdf.js";

/* =========================
 * 型
 * ======================= */
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
  // 共有フラグ（未設定は共有中とみなす）
  isShared?: boolean;
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

  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1000
  );

  // PDF用 refs
  const pdfRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // リサイズ監視
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* =========================
   * 新着検知/通知関連（OFFトグル廃止）
   * ======================= */
  const LAST_SEEN_KEY = "eduModels:lastSeen";

  const [lastSeen, setLastSeen] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const v = localStorage.getItem(LAST_SEEN_KEY);
    return v ? parseInt(v, 10) : 0;
  });
  const [newCount, setNewCount] = useState(0);
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);

  const isNewItem = (m: EducationModel) => {
    const t = Date.parse(m.updatedAt || "");
    return !Number.isNaN(t) && t > lastSeen;
  };

  const markAllRead = () => {
    const now = Date.now();
    setLastSeen(now);
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_SEEN_KEY, String(now));
    }
    setNewCount(0);
    setShowNewBanner(false);
  };

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("このブラウザは通知に対応していません。");
      return;
    }
    if (Notification.permission === "granted") {
      alert("すでに通知が許可されています。");
      return;
    }
    const p = await Notification.requestPermission();
    if (p === "granted") {
      try {
        new Notification("通知を許可しました", { body: "新着があればお知らせします。" });
      } catch {}
    }
  };

  // 一覧取得（共有=true か、自分のモデルは常に表示）＋ 新着カウント／通知
  useEffect(() => {
    const colRef = collection(db, "educationModels");
    const qy = query(
      colRef,
      orderBy(sortOrder === "newest" ? "updatedAt" : "name", sortOrder === "newest" ? "desc" : "asc")
    );

    const unsub = onSnapshot(qy, (snapshot) => {
      const raw = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EducationModel, "id">),
      })) as EducationModel[];

      // 未設定(isShared===undefined)は共有中として扱う
      const list = raw.filter((m) => m.isShared !== false || m.creatorId === userId);
      setModels(list);

      // 新着件数（最終既読以降）
      const newly = list.filter(isNewItem);
      setNewCount(newly.length);
      setShowNewBanner(newly.length > 0);

      // 通知（許可済みなら常に送る）
      if (
        newly.length > 0 &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const title = `教育観モデルに新着 ${newly.length}件`;
          const body = newly[0]?.name ? `${newly[0].name} ほか` : "";
          new Notification(title, { body });
        } catch {}
      }
    });

    return () => unsub();
  }, [sortOrder, userId, lastSeen]);

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
        const target = models.find((m) => m.id === editId);
        if (!target || target.creatorId !== userId) {
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
          creatorId: userId,
          updatedAt: now,
        });

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
          isShared: target.isShared,
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
          creatorId: userId,
          updatedAt: now,
          isShared: true,
        });

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
          isShared: true,
        };
      }

      const updated = editId
        ? models.map((m) => (m.id === editId ? newModel : m))
        : [newModel, ...models];

      setModels(updated);
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

  // 共有ON/OFF切り替え（削除の代わり）
  const toggleShare = async (m: EducationModel) => {
    if (m.creatorId !== userId) {
      alert("変更は作成者本人のみ可能です");
      return;
    }
    const now = new Date().toISOString();
    const currentShared = m.isShared !== false; // undefined は共有中扱い
    const next = !currentShared;

    try {
      await updateDoc(doc(db, "educationModels", m.id), {
        isShared: next,
        updatedAt: now,
      });

      setModels((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isShared: next, updatedAt: now } : x))
      );
    } catch (e) {
      console.error(e);
      alert("共有設定の更新に失敗しました。");
    }
  };

  const handlePdfSave = async (id: string) => {
    const element = pdfRefs.current.get(id);
    if (!element) return alert("PDF生成対象が見つかりません。");
    const model = models.find((m) => m.id === id);
    if (!model) return alert("モデル情報が見つかりません。");

    const original = element.style.cssText;

    element.style.position = "static";
    element.style.left = "auto";
    element.style.width = "210mm";
    element.style.maxWidth = "100%";
    element.style.padding = "20mm 15mm";
    element.style.backgroundColor = "white";
    element.style.color = "#222";
    element.style.fontFamily = "'Yu Gothic','游ゴシック','Noto Sans JP',sans-serif";
    element.style.fontSize = "14px";
    element.style.lineHeight = "1.7";
    element.style.boxSizing = "border-box";
    element.style.wordBreak = "break-word";
    element.style.whiteSpace = "pre-wrap";

    const sanitize = (s: string) => s.replace(/[\\/:"*?<>|]+/g, "_");
    const filename = `教育観モデル_${sanitize(model.name)}_${sanitize(model.creatorName)}.pdf`;

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
      console.error(e);
      alert("PDFの生成に失敗しました。");
    } finally {
      element.style.cssText = original;
    }
  };

  /* =========================
   * スタイル
   * ======================= */
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

  const mainStyle: React.CSSProperties = {
    padding: isMobile ? "72px 12px 12px" : "72px 24px 24px",
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "'Yu Gothic','游ゴシック','Noto Sans JP',sans-serif",
    boxSizing: "border-box",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? "1.6rem" : "1.8rem",
    marginBottom: 10,
    textAlign: "center",
    userSelect: "none",
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

  const controlRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  };

  const selectStyle: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #c5d2f0",
    outline: "none",
    background: "white",
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid #e0e7ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "white",
    boxShadow: "0 2px 6px rgba(25,118,210,0.08)",
    position: "relative",
  };

  const buttonBase: React.CSSProperties = {
    backgroundColor: "#1976d2",
    color: "white",
    padding: isMobile ? "10px 16px" : "8px 14px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: isMobile ? "1.05rem" : "0.95rem",
  };

  const statusChip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #b6ccff",
    background: "#e8f0ff",
    color: "#2a4aa0",
    fontSize: 12,
    marginLeft: 8,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: isMobile ? 10 : 8,
    marginBottom: 12,
    fontSize: isMobile ? "1.05rem" : "1rem",
    borderRadius: 6,
    border: "1px solid #c5d2f0",
    boxSizing: "border-box",
  };

  const notifyBtnStyle: React.CSSProperties = {
    border: "1px solid #ffc107",
    background: "#fff8e1",
    color: "#8d6e63",
    borderRadius: 999,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  };

  /* =========================
   * UI
   * ======================= */
  const displayModels = onlyNew ? models.filter(isNewItem) : models;

  const notificationsSupported =
    typeof window !== "undefined" && "Notification" in window;
  const notificationsGranted =
    notificationsSupported && Notification.permission === "granted";

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

      {/* オーバーレイ */}
      <div
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* メニュー */}
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

        <div style={{ overflowY: "auto", flexGrow: 1, paddingTop: "1rem", paddingBottom: 20 }}>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/"); }}>
            🏠 ホーム
          </button>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/plan"); }}>
            📋 授業作成
          </button>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/plan/history"); }}>
            📖 計画履歴
          </button>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/practice/history"); }}>
            📷 実践履歴
          </button>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/practice/share"); }}>
            🌐 共有版実践記録
          </button>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/models/create"); }}>
            ✏️ 教育観作成
          </button>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/models"); }}>
            📚 教育観一覧
          </button>
          <button style={navBtnStyle} onClick={() => { setMenuOpen(false); router.push("/models/history"); }}>
            🕒 教育観履歴
          </button>
        </div>
      </div>

      {/* メイン */}
      <main style={mainStyle}>
        <h1 style={titleStyle}>📚 教育観一覧（参照ページ）</h1>

        {/* ページの意義（注釈） */}
        <section style={valueNoteStyle}>
          <p style={{ margin: 0 }}>
            ここは<strong>教育観モデルを参照</strong>するページです。授業案作成では、ここで選んだ
            <strong>ベースとなる教育観</strong>からスタートできます。
          </p>
          <ul style={{ margin: "8px 0 0 1.2em" }}>
            <li style={{ margin: "4px 0" }}>
              できれば<strong>他の方と同じモデル名</strong>で、あなたの思いや考えを共有してください。
              同名のデータが集まるほど、比較・分析や将来の検索・生成（RAG など）に活かせます。
            </li>
            <li style={{ margin: "4px 0" }}>
              個人情報や<strong>特定の児童名</strong>は記載しないでください。
            </li>
            <li style={{ margin: "4px 0" }}>
              「共有から外す」は<strong>削除ではありません</strong>（データは残り、作成者は引き続き利用できます）。
              後で「共有にする」を押せば再公開できます。
            </li>
          </ul>
        </section>

        {/* 並び替え */}
        <div style={controlRowStyle}>
          <label>
            並び替え：
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              style={{ ...selectStyle, marginLeft: 8 }}
            >
              <option value="newest">新着順</option>
              <option value="nameAsc">名前順</option>
            </select>
          </label>
        </div>

        {/* 新着＆通知操作（通知OFFトグル削除） */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          {showNewBanner && (
            <div style={newBannerStyle}>
              <span>🆕 新着 {newCount} 件</span>
              <button onClick={markAllRead} style={bannerBtnStyle}>すべて既読にする</button>
            </div>
          )}

          <label style={chipToggleStyle}>
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(e) => setOnlyNew(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            新着のみ
          </label>

          {notificationsSupported && !notificationsGranted && (
            <button onClick={requestNotificationPermission} style={notifyBtnStyle}>
              🔔 通知を許可
            </button>
          )}
        </div>

        {/* エラー */}
        {error && (
          <p style={{ color: "#d32f2f", marginBottom: 12, fontWeight: 700 }}>{error}</p>
        )}

        {/* 一覧 */}
        {displayModels.length === 0 ? (
          <p style={{ color: "#666" }}>{onlyNew ? "新着はありません。" : "表示できるモデルがありません。"}</p>
        ) : (
          displayModels.map((m) => {
            const shared = m.isShared !== false; // 未設定は共有中
            return (
              <div key={m.id} style={cardStyle}>
                <h3 style={{ marginTop: 0, fontSize: isMobile ? 18 : 20 }}>
                  {m.name}
                  <span style={statusChip} title={shared ? "共有中" : "非公開"}>
                    {shared ? "公開中" : "非公開"}
                  </span>
                  {isNewItem(m) && <span style={newChip}>NEW</span>}
                </h3>

                <p><strong>作成者：</strong> {m.creatorName}</p>
                <p><strong>教育観：</strong> {m.philosophy}</p>
                <p><strong>評価観点：</strong> {m.evaluationFocus}</p>
                <p><strong>言語活動：</strong> {m.languageFocus}</p>
                <p><strong>育てたい子どもの姿：</strong> {m.childFocus}</p>
                <p style={{ fontSize: 12, color: "#666" }}>
                  更新日時：{new Date(m.updatedAt).toLocaleString()}
                </p>

                {/* PDF保存用（非表示DOM） */}
                <div
                  ref={(el) => {
                    if (el) pdfRefs.current.set(m.id, el);
                    else pdfRefs.current.delete(m.id);
                  }}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "210mm",
                    maxWidth: "100%",
                    padding: "20mm 15mm",
                    backgroundColor: "white",
                    color: "#222",
                    fontFamily: "'Yu Gothic','游ゴシック','Noto Sans JP',sans-serif",
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
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#555" }}>
                    作成者：{m.creatorName}
                  </p>
                  <section style={{ marginBottom: 24 }}>
                    <h2 style={pdfH2}>教育観</h2>
                    <p style={{ whiteSpace: "pre-wrap" }}>{m.philosophy}</p>
                  </section>
                  <section style={{ marginBottom: 24 }}>
                    <h2 style={pdfH2}>評価観点の重視点</h2>
                    <p style={{ whiteSpace: "pre-wrap" }}>{m.evaluationFocus}</p>
                  </section>
                  <section style={{ marginBottom: 24 }}>
                    <h2 style={pdfH2}>言語活動の重視点</h2>
                    <p style={{ whiteSpace: "pre-wrap" }}>{m.languageFocus}</p>
                  </section>
                  <section style={{ marginBottom: 24 }}>
                    <h2 style={pdfH2}>育てたい子どもの姿</h2>
                    <p style={{ whiteSpace: "pre-wrap" }}>{m.childFocus}</p>
                  </section>
                </div>

                {/* ボタン群 */}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {m.creatorId === userId && (
                    <>
                      <button onClick={() => startEdit(m)} style={buttonBase}>
                        ✏️ 編集
                      </button>
                      <button
                        onClick={() => toggleShare(m)}
                        style={{
                          ...buttonBase,
                          backgroundColor: shared ? "#757575" : "#43a047",
                        }}
                        title={shared ? "共有をオフにします" : "共有をオンにします"}
                      >
                        {shared ? "共有から外す" : "共有にする"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handlePdfSave(m.id)}
                    style={{ ...buttonBase, backgroundColor: "#ff9800" }}
                  >
                    📄 PDF保存
                  </button>
                  <button
                    onClick={() => router.push(`/plan?styleId=${m.id}`)}
                    style={{ ...buttonBase, backgroundColor: "#2196f3" }}
                  >
                    🧩 このモデルで授業案を作成
                  </button>
                </div>

                {/* 編集フォーム */}
                {editId === m.id && (
                  <section
                    style={{
                      border: "1px solid #bcd4ff",
                      borderRadius: 10,
                      padding: 12,
                      marginTop: 12,
                      background: "#f9fbff",
                    }}
                  >
                    <h4 style={{ marginTop: 0 }}>編集モード</h4>

                    <label style={labelEdit}>作成者名（必須）</label>
                    <input
                      placeholder="作成者名"
                      value={form.creatorName}
                      onChange={(e) => handleChange("creatorName", e.target.value)}
                      style={inputStyle}
                    />

                    <label style={labelEdit}>モデル名（必須）</label>
                    <input
                      placeholder="モデル名"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      style={inputStyle}
                    />

                    <label style={labelEdit}>教育観（必須）</label>
                    <textarea
                      placeholder="教育観"
                      rows={3}
                      value={form.philosophy}
                      onChange={(e) => handleChange("philosophy", e.target.value)}
                      style={inputStyle}
                    />

                    <label style={labelEdit}>評価観点の重視点（必須）</label>
                    <textarea
                      placeholder="評価観点の重視点"
                      rows={3}
                      value={form.evaluationFocus}
                      onChange={(e) => handleChange("evaluationFocus", e.target.value)}
                      style={inputStyle}
                    />

                    <label style={labelEdit}>言語活動の重視点（必須）</label>
                    <textarea
                      placeholder="言語活動の重視点"
                      rows={3}
                      value={form.languageFocus}
                      onChange={(e) => handleChange("languageFocus", e.target.value)}
                      style={inputStyle}
                    />

                    <label style={labelEdit}>育てたい子どもの姿（必須）</label>
                    <textarea
                      placeholder="育てたい子どもの姿"
                      rows={3}
                      value={form.childFocus}
                      onChange={(e) => handleChange("childFocus", e.target.value)}
                      style={inputStyle}
                    />

                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <button
                        onClick={async () => {
                          const ok = await saveModel();
                          if (ok) setError("");
                        }}
                        style={{ ...buttonBase, backgroundColor: "#4caf50" }}
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{ ...buttonBase, backgroundColor: "#757575" }}
                      >
                        キャンセル
                      </button>
                    </div>
                  </section>
                )}
              </div>
            );
          })
        )}
      </main>
    </>
  );
}

/* ===== PDF見出しスタイルだけ共通化 ===== */
const pdfH2: React.CSSProperties = {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: 12,
  borderBottom: "1px solid #ccc",
  paddingBottom: 6,
  color: "#1565c0",
};

const labelEdit: React.CSSProperties = {
  display: "block",
  margin: "8px 0 4px",
  fontWeight: 600,
  color: "#455a64",
};

/* ===== 新着UIスタイル ===== */
const newBannerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "6px 10px",
  borderRadius: 999,
  background: "#E8F5E9",
  border: "1px solid #A5D6A7",
  color: "#1B5E20",
  fontWeight: 700,
};
const bannerBtnStyle: React.CSSProperties = {
  background: "#43A047",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 700,
};
const chipToggleStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid #c5d2f0",
  background: "#f5f8ff",
  color: "#2a4aa0",
  fontSize: 12,
};
const newChip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  marginLeft: 8,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#ffebee",
  border: "1px solid #ffcdd2",
  color: "#c62828",
  fontSize: 11,
  fontWeight: 800,
};
