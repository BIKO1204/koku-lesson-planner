"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { openDB } from "idb";
import { signOut } from "next-auth/react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type BoardImage = { name: string; src: string };

type PracticeRecord = {
  lessonId: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[]; // フルサイズ画像（ローカル保存用）
  lessonTitle: string;
  grade?: string;      // 学年
  genre?: string;      // ジャンル
  unitName?: string;   // 単元名
};

type LessonPlan = {
  id: string;
  result?: string | object;
};

const DB_NAME = "PracticeDB";
const STORE_NAME = "practiceRecords";
const DB_VERSION = 1;

// IndexedDB初期化・取得
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "lessonId" });
      }
    },
  });
}

// IndexedDBからレコード取得
async function getRecord(lessonId: string): Promise<PracticeRecord | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, lessonId);
}

// IndexedDBにレコード保存
async function saveRecord(record: PracticeRecord) {
  const db = await getDB();
  await db.put(STORE_NAME, record);
}

// ファイルをBase64に変換（フルサイズ用）
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// 画像圧縮・リサイズ（Firestore用圧縮版Base64生成）
function resizeAndCompressFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };

    reader.readAsDataURL(file);
  });
}

// 表示用に安全に変換
function safeRender(value: any): string {
  if (typeof value === "string") {
    return value.replace(/(、\s*)+(?=（[1-5]）)/g, "");
  }
  if (typeof value === "number") return value.toString();
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value.map(safeRender).join("、");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function PracticeAddPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  // 状態管理
  const [practiceDate, setPracticeDate] = useState("");
  const [reflection, setReflection] = useState("");
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [compressedImages, setCompressedImages] = useState<BoardImage[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [grade, setGrade] = useState("");
  const [genre, setGenre] = useState("");
  const [unitName, setUnitName] = useState("");

  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // --- ハンバーガーメニュー用スタイル ---
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
    textAlign: "center",
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
  const containerStyle: React.CSSProperties = {
    padding: 24,
    maxWidth: 800,
    margin: "auto",
    fontFamily: "sans-serif",
    paddingTop: 72,
  };

  // ローカルストレージから授業計画を取得＆IndexedDBから実践記録を取得
  useEffect(() => {
    const plansJson = localStorage.getItem("lessonPlans") || "[]";
    let plans: LessonPlan[];
    try {
      plans = JSON.parse(plansJson) as LessonPlan[];
    } catch {
      plans = [];
    }
    const plan = plans.find((p) => p.id === id) || null;
    setLessonPlan(plan);

    if (plan && plan.result) {
      if (typeof plan.result === "string") {
        const firstLine = plan.result.split("\n")[0].replace(/^【単元名】\s*/, "");
        setLessonTitle(firstLine);
      } else if (typeof plan.result === "object") {
        const unitNameFromPlan = (plan.result as any)["単元名"];
        setLessonTitle(typeof unitNameFromPlan === "string" ? unitNameFromPlan : "");
      } else {
        setLessonTitle("");
      }
    } else {
      setLessonTitle("");
    }

    getRecord(id).then((existing) => {
      if (existing) {
        setPracticeDate(existing.practiceDate);
        setReflection(existing.reflection);
        setBoardImages(existing.boardImages);
        setRecord({ ...existing, lessonTitle: existing.lessonTitle || "" });
        setGrade(existing.grade || "");
        setGenre(existing.genre || "");
        setUnitName(existing.unitName || "");
      }
    });
  }, [id]);

  // 画像アップロード時の処理
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newFullImages: BoardImage[] = [];
    const newCompressedImages: BoardImage[] = [];

    for (const file of files) {
      try {
        const fullBase64 = await fileToBase64(file);
        const compressedBase64 = await resizeAndCompressFile(file, 800, 600, 0.7);
        newFullImages.push({ name: file.name, src: fullBase64 });
        newCompressedImages.push({ name: file.name, src: compressedBase64 });
      } catch (error) {
        console.error("画像処理失敗", error);
      }
    }

    setBoardImages((prev) => [...prev, ...newFullImages]);
    setCompressedImages((prev) => [...prev, ...newCompressedImages]);

    e.target.value = "";
  };

  // 画像削除
  const handleRemoveImage = (i: number) => {
    setBoardImages((prev) => prev.filter((_, idx) => idx !== i));
    setCompressedImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  // プレビュー作成
  const handlePreview = (e: FormEvent) => {
    e.preventDefault();
    setRecord({
      lessonId: id,
      practiceDate,
      reflection,
      boardImages,
      lessonTitle,
      grade,
      genre,
      unitName,
    });
  };

  // IndexedDBに保存
  async function saveRecordToIndexedDB(record: PracticeRecord) {
    const dbLocal = await getDB();
    await dbLocal.put(STORE_NAME, record);
  }

  // Firestoreに保存
  async function saveRecordToFirestore(record: PracticeRecord & { compressedImages: BoardImage[] }) {
    const docRef = doc(db, "practiceRecords", record.lessonId);
    await setDoc(docRef, {
      practiceDate: record.practiceDate,
      reflection: record.reflection,
      boardImages: record.compressedImages,
      lessonTitle: record.lessonTitle,
      grade: record.grade || "",
      genre: record.genre || "",
      unitName: record.unitName || "",
      createdAt: new Date(),
    });
  }

  // 一括保存
  const handleSaveBoth = async () => {
    if (!record) {
      alert("プレビューを作成してください");
      return;
    }
    setUploading(true);
    try {
      await saveRecordToIndexedDB(record);
      await saveRecordToFirestore({ ...record, compressedImages });
      alert("ローカルとFirebaseに保存しました");
      router.push("/practice/history");
    } catch (e) {
      alert("保存に失敗しました");
      console.error(e);
    } finally {
      setUploading(false);
    }
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
          <span style={barStyle}></span>
          <span style={barStyle}></span>
          <span style={barStyle}></span>
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
        {/* ログアウトボタン */}
        <button
          onClick={() => {
            signOut();
            setMenuOpen(false);
          }}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

        {/* メニューリンク */}
        <div style={menuLinksWrapperStyle}>
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

      {/* メインコンテンツ */}
      <main style={containerStyle}>
        <h2>実践記録作成・編集</h2>

        <form onSubmit={handlePreview}>
          {/* 実施日 */}
          <div style={{ border: "2px solid #1976d2", borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <label>
              実施日：<br />
              <input
                type="date"
                value={practiceDate}
                required
                onChange={(e) => setPracticeDate(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              />
            </label>
          </div>

          {/* 学年 */}
          <div style={{ border: "2px solid #1976d2", borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <label>
              学年：
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4 }}
              >
                <option value="">選択してください</option>
                <option value="1年">1年</option>
                <option value="2年">2年</option>
                <option value="3年">3年</option>
                <option value="4年">4年</option>
                <option value="5年">5年</option>
                <option value="6年">6年</option>
              </select>
            </label>
          </div>

          {/* ジャンル */}
          <div style={{ border: "2px solid #1976d2", borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <label>
              ジャンル：
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4 }}
              >
                <option value="">選択してください</option>
                <option value="物語文">物語文</option>
                <option value="説明文">説明文</option>
                <option value="詩">詩</option>
              </select>
            </label>
          </div>

          {/* 単元名 */}
          <div style={{ border: "2px solid #1976d2", borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <label>
              単元名：
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4, width: "calc(100% - 16px)" }}
              />
            </label>
          </div>

          {/* 振り返り */}
          <div style={{ border: "2px solid #1976d2", borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <label>
              振り返り：<br />
              <textarea
                value={record?.reflection ?? reflection}
                required
                onChange={(e) => setReflection(e.target.value)}
                rows={6}
                style={{ width: "100%", padding: 8 }}
              />
            </label>
          </div>

          {/* 板書写真アップロード */}
          <label
            style={{
              display: "block",
              marginBottom: 8,
              cursor: "pointer",
              padding: "8px 12px",
              backgroundColor: "#1976d2",
              color: "#fff",
              borderRadius: 6,
              textAlign: "center",
            }}
          >
            📷 板書写真をアップロード
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>

          {/* 画像プレビュー */}
          <div style={{ marginTop: 12 }}>
            {boardImages.map((img, i) => (
              <div key={img.name + i} style={{ width: "100%", marginBottom: 12 }}>
                <div style={{ marginBottom: 6, fontWeight: "bold" }}>板書{i + 1}</div>
                <img
                  src={img.src}
                  alt={img.name}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    display: "block",
                    maxWidth: "100%",
                  }}
                />
                <button
                  type="button"
                  aria-label="画像を削除"
                  onClick={() => handleRemoveImage(i)}
                  style={{
                    backgroundColor: "rgba(229, 57, 53, 0.85)",
                    border: "none",
                    borderRadius: 4,
                    color: "white",
                    width: 24,
                    height: 24,
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginTop: 4,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* プレビュー生成ボタン */}
          <button
            type="submit"
            style={{
              padding: 12,
              backgroundColor: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              width: "100%",
              cursor: "pointer",
              marginTop: 16,
            }}
            disabled={uploading}
          >
            {uploading ? "アップロード中..." : "プレビューを生成"}
          </button>
        </form>

        {/* プレビュー表示 */}
        {record && (
          <section
            id="practice-preview"
            style={{
              marginTop: 24,
              padding: 24,
              border: "1px solid #ccc",
              borderRadius: 6,
              backgroundColor: "#fff",
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
            }}
          >
            <h2>
              {lessonPlan?.result && typeof lessonPlan.result === "object"
                ? safeRender((lessonPlan.result as any)["単元名"])
                : lessonTitle}
            </h2>

            {lessonPlan?.result && typeof lessonPlan.result === "object" && (
              <>
                <section style={{ marginBottom: 16 }}>
                  <h3>授業の概要</h3>
                  <p>
                    <strong>教科書名：</strong>
                    {safeRender((lessonPlan.result as any)["教科書名"])}
                  </p>
                  <p>
                    <strong>学年：</strong>
                    {safeRender((lessonPlan.result as any)["学年"])}
                  </p>
                  <p>
                    <strong>ジャンル：</strong>
                    {safeRender((lessonPlan.result as any)["ジャンル"])}
                  </p>
                  <p>
                    <strong>授業時間数：</strong>
                    {safeRender((lessonPlan.result as any)["授業時間数"])}時間
                  </p>
                  <p>
                    <strong>育てたい子どもの姿：</strong>
                    {safeRender((lessonPlan.result as any)["育てたい子どもの姿"])}
                  </p>
                </section>

                <section style={{ marginBottom: 16 }}>
                  <h3>単元の目標</h3>
                  <p>{safeRender((lessonPlan.result as any)["単元の目標"])}</p>
                </section>

                {(lessonPlan.result as any)["評価の観点"] && (
                  <section style={{ marginBottom: 16 }}>
                    <h3>評価の観点</h3>
                    {Object.entries((lessonPlan.result as any)["評価の観点"]).map(
                      ([category, items]) => {
                        const numberedItems = Array.isArray(items)
                          ? items.map((item, i) => `（${i + 1}）${item}`)
                          : [String(items)];

                        return (
                          <div key={category} style={{ marginBottom: 8 }}>
                            <strong>{category}</strong>
                            <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                              {numberedItems.map((text, index) => (
                                <li key={index}>{safeRender(text)}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                    )}
                  </section>
                )}

                {(lessonPlan.result as any)["言語活動の工夫"] && (
                  <section style={{ marginBottom: 16 }}>
                    <h3>言語活動の工夫</h3>
                    <p>{safeRender((lessonPlan.result as any)["言語活動の工夫"])}</p>
                  </section>
                )}

                {(lessonPlan.result as any)["授業の流れ"] && (
                  <section style={{ marginBottom: 16 }}>
                    <h3>授業の流れ</h3>
                    <ul>
                      {Object.entries((lessonPlan.result as any)["授業の流れ"]).map(
                        ([key, value]) => (
                          <li key={key}>
                            <strong>{key}：</strong>
                            {typeof value === "string" ? value : safeRender(value)}
                          </li>
                        )
                      )}
                    </ul>
                  </section>
                )}
              </>
            )}

            <section style={{ marginTop: 24 }}>
              <h3>実施記録</h3>
              <p>
                <strong>実施日：</strong> {record.practiceDate}
              </p>
              <p>
                <strong>振り返り：</strong>
              </p>
              <p>{record.reflection}</p>

              {record.boardImages.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <strong>板書写真：</strong>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {record.boardImages.map((img, i) => (
                      <div key={img.name + i} style={{ width: "100%" }}>
                        <div style={{ marginBottom: 6, fontWeight: "bold" }}>
                          板書{i + 1}
                        </div>
                        <img
                          src={img.src}
                          alt={img.name}
                          style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: 8,
                            border: "1px solid #ccc",
                            display: "block",
                            maxWidth: "100%",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </section>
        )}

        {/* 一括保存ボタン */}
        <button
          onClick={handleSaveBoth}
          style={{
            padding: 12,
            backgroundColor: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            width: "100%",
            cursor: "pointer",
            marginTop: 16,
          }}
          disabled={uploading}
        >
          {uploading ? "保存中..." : "ローカル＋Firebaseに保存"}
        </button>
      </main>
    </>
  );
}
