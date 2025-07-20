"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { openDB } from "idb";
import { signOut } from "next-auth/react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

type BoardImage = { name: string; src: string };

type PracticeRecord = {
  lessonId: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[]; // フルサイズ画像（ローカル保存用Base64）
  lessonTitle: string;
  grade?: string;
  genre?: string;
  unitName?: string;
  author?: string;
};

type LessonPlan = {
  id: string;
  result?: string | object;
};

// ParsedResultの具体的型定義
type ParsedResult = {
  [key: string]: any;
  "教科書名"?: string;
  "学年"?: string;
  "ジャンル"?: string;
  "単元名"?: string;
  "授業時間数"?: number;
  "単元の目標"?: string;
  "育てたい子どもの姿"?: string;
  "言語活動の工夫"?: string;
  "授業の流れ"?: Record<string, string>;
  "評価の観点"?: {
    "知識・技能"?: string[];
    "思考・判断・表現"?: string[];
    "主体的に学習に取り組む態度"?: string[];
    "態度"?: string[];
  };
};

const DB_NAME = "PracticeDB";
const STORE_NAME = "practiceRecords";
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "lessonId" });
      }
    },
  });
}

async function getRecord(lessonId: string): Promise<PracticeRecord | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, lessonId);
}

async function saveRecord(record: PracticeRecord) {
  const db = await getDB();
  await db.put(STORE_NAME, record);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

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
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };

    reader.readAsDataURL(file);
  });
}

const storage = getStorage();

async function uploadImageToStorage(base64: string, fileName: string): Promise<string> {
  const storageRef = ref(storage, `practiceImages/${fileName}`);
  await uploadString(storageRef, base64, "data_url");
  return getDownloadURL(storageRef);
}

export default function PracticeAddPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [practiceDate, setPracticeDate] = useState("");
  const [reflection, setReflection] = useState("");
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [compressedImages, setCompressedImages] = useState<BoardImage[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [grade, setGrade] = useState("");
  const [genre, setGenre] = useState("");
  const [unitName, setUnitName] = useState("");

  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // スタイル定義
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
        const unitNameFromPlan = (plan.result as ParsedResult)["単元名"];
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
        setAuthor(existing.author || "");
        setGrade(existing.grade || "");
        setGenre(existing.genre || "");
        setUnitName(existing.unitName || "");
      }
    });
  }, [id]);

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

  const handleRemoveImage = (i: number) => {
    setBoardImages((prev) => prev.filter((_, idx) => idx !== i));
    setCompressedImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handlePreview = (e: FormEvent) => {
    e.preventDefault();
    setRecord({
      lessonId: id,
      practiceDate,
      reflection,
      boardImages,
      lessonTitle,
      author,
      grade,
      genre,
      unitName,
    });
  };

  async function saveRecordToIndexedDB(record: PracticeRecord) {
    const dbLocal = await getDB();
    await dbLocal.put(STORE_NAME, record);
  }

  async function saveRecordToFirestore(record: PracticeRecord & { compressedImages: BoardImage[] }) {
    const uploadedUrls: BoardImage[] = await Promise.all(
      record.compressedImages.map(async (img) => {
        const url = await uploadImageToStorage(img.src, `${record.lessonId}_${img.name}`);
        return { name: img.name, src: url };
      })
    );

    const docRef = doc(db, "practiceRecords", record.lessonId);
    await setDoc(docRef, {
      practiceDate: record.practiceDate,
      reflection: record.reflection,
      boardImages: uploadedUrls,
      lessonTitle: record.lessonTitle,
      author: record.author || "",
      grade: record.grade || "",
      genre: record.genre || "",
      unitName: record.unitName || "",
      createdAt: new Date(),
    });
  }

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

      <div
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

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

      <main style={containerStyle}>
        <h2>実践記録作成・編集</h2>

        <form onSubmit={handlePreview}>
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

          <div style={{ border: "2px solid #1976d2", borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <label>
              作成者名：
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4, width: "calc(100% - 16px)" }}
                placeholder="例:作成者名"
              />
            </label>
          </div>

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

          {/* ここに授業案（授業計画）の詳細表示を追加 */}
          {lessonPlan?.result && typeof lessonPlan.result === "object" && (
            <section
              style={{
                border: "2px solid #2196F3",
                borderRadius: 6,
                padding: 12,
                marginBottom: 16,
                backgroundColor: "#e3f2fd",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 8, color: "#1976d2" }}>実践記録：授業案詳細</h3>

              <p><strong>教科書名：</strong>{(lessonPlan.result as ParsedResult)["教科書名"] || ""}</p>
              <p><strong>学年：</strong>{(lessonPlan.result as ParsedResult)["学年"] || ""}</p>
              <p><strong>ジャンル：</strong>{(lessonPlan.result as ParsedResult)["ジャンル"] || ""}</p>
              <p><strong>単元名：</strong>{(lessonPlan.result as ParsedResult)["単元名"] || ""}</p>
              <p><strong>授業時間数：</strong>{(lessonPlan.result as ParsedResult)["授業時間数"] ?? ""}時間</p>

              <div style={{ marginTop: 8 }}>
                <strong>単元の目標：</strong>
                <p>{(lessonPlan.result as ParsedResult)["単元の目標"] || ""}</p>
              </div>

              <div style={{ marginTop: 8 }}>
                <strong>評価の観点：</strong>
                <div>
                  <strong>知識・技能</strong>
                  <ul>
                    {Array.isArray((lessonPlan.result as ParsedResult)["評価の観点"]?.["知識・技能"]) ?
                      (lessonPlan.result as ParsedResult)["評価の観点"]?.["知識・技能"]!.map((v, i) => (
                        <li key={`knowledge-${i}`}>{v}</li>
                      ))
                      : null
                    }
                  </ul>
                </div>
                <div>
                  <strong>思考・判断・表現</strong>
                  <ul>
                    {Array.isArray((lessonPlan.result as ParsedResult)["評価の観点"]?.["思考・判断・表現"]) ?
                      (lessonPlan.result as ParsedResult)["評価の観点"]?.["思考・判断・表現"]!.map((v, i) => (
                        <li key={`thinking-${i}`}>{v}</li>
                      ))
                      : null
                    }
                  </ul>
                </div>
                <div>
                  <strong>主体的に学習に取り組む態度</strong>
                  <ul>
                    {Array.isArray((lessonPlan.result as ParsedResult)["評価の観点"]?.["主体的に学習に取り組む態度"]) ?
                      (lessonPlan.result as ParsedResult)["評価の観点"]?.["主体的に学習に取り組む態度"]!.map((v, i) => (
                        <li key={`attitude-${i}`}>{v}</li>
                      ))
                      : Array.isArray((lessonPlan.result as ParsedResult)["評価の観点"]?.["態度"]) ?
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.["態度"]!.map((v, i) => (
                          <li key={`attitude-alt-${i}`}>{v}</li>
                        )) : null
                    }
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <strong>言語活動の工夫：</strong>
                <p>{(lessonPlan.result as ParsedResult)["言語活動の工夫"] || ""}</p>
              </div>

              <div style={{ marginTop: 8 }}>
                <strong>授業の流れ：</strong>
                <ul>
                  {typeof (lessonPlan.result as ParsedResult)["授業の流れ"] === "object" ?
                    Object.entries((lessonPlan.result as ParsedResult)["授業の流れ"]!).map(([key, val], i) => (
                      <li key={`flow-${i}`}><strong>{key}：</strong>{val}</li>
                    ))
                    : null
                  }
                </ul>
              </div>
            </section>
          )}

          <div style={{ border: "2px solid #1976d2", borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <label>
              振り返り：<br />
              <textarea
                value={reflection}
                required
                onChange={(e) => setReflection(e.target.value)}
                rows={6}
                style={{ width: "100%", padding: 8 }}
              />
            </label>
          </div>

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
            <h2>{lessonTitle}</h2>

            <section style={{ marginTop: 24 }}>
              <h3>実施記録</h3>
              <p><strong>実施日：</strong> {record.practiceDate}</p>
              <p><strong>作成者：</strong> {record.author || "不明"}</p>

              {/* 授業案の詳細はここに表示済み */}

              <p><strong>振り返り：</strong></p>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </section>
        )}

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
