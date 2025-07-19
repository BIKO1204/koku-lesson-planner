"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { openDB } from "idb";
import { useSession, signOut } from "next-auth/react";
import { db } from "@/firebaseConfig"; // Firestore初期化ファイル
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";

// --- 型定義 ---
type BoardImage = { name: string; src: string };

type PracticeRecord = {
  lessonId: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  lessonTitle: string;
  likes?: number;
  comments?: { userId: string; comment: string; createdAt: string }[];
};

type LessonPlan = {
  id: string;
  result?: string | object;
};

// --- IndexedDB設定 ---
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

// Base64変換（ファイル → Base64）
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

// JSONオブジェクトや文字列を安全に表示用に整形
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
  const { data: session } = useSession();
  const userId = session?.user?.email || "guest";

  const [practiceDate, setPracticeDate] = useState("");
  const [reflection, setReflection] = useState("");
  // ローカル保存用フルサイズBase64画像
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  // Firestore保存用圧縮版Base64画像
  const [compressedImages, setCompressedImages] = useState<BoardImage[]>([]);

  const [lessonTitle, setLessonTitle] = useState("");
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<
    { userId: string; comment: string; createdAt: string }[]
  >([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // Firestoreからコメント・いいね取得
  async function fetchCommentsAndLikes() {
    if (!id) return;
    try {
      const docRef = doc(db, "practiceRecords", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as PracticeRecord;
        setComments(data.comments || []);
        setLikes(data.likes || 0);
        // ログインユーザーがいいね済かは別途管理可能（省略）
      }
    } catch (e) {
      console.error("Firestoreコメント・いいね取得エラー", e);
    }
  }

  useEffect(() => {
    // ローカルの計画を読み込み
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
        const unitName = (plan.result as any)["単元名"];
        setLessonTitle(typeof unitName === "string" ? unitName : "");
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
      }
    });

    fetchCommentsAndLikes();
  }, [id]);

  // ファイル選択時：フルサイズBase64＆圧縮Base64を同時生成
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

  // プレビュー作成
  const handlePreview = (e: FormEvent) => {
    e.preventDefault();
    setRecord({
      lessonId: id,
      practiceDate,
      reflection,
      boardImages,
      lessonTitle,
    });
  };

  // Firestoreに保存（圧縮版画像で容量対策）
  async function saveRecordToFirestore(record: PracticeRecord) {
    if (!userId) throw new Error("ユーザー未ログイン");

    const docRef = doc(db, "practiceRecords", record.lessonId);
    await setDoc(docRef, {
      practiceDate: record.practiceDate,
      reflection: record.reflection,
      boardImages: compressedImages,
      lessonTitle: record.lessonTitle,
      createdBy: userId,
      createdAt: new Date(),
      likes: 0,
      comments: [],
    });
  }

  // ローカルIndexedDBに保存（フルサイズ画像でたっぷり保存）
  async function saveRecordToIndexedDB(record: PracticeRecord) {
    const dbLocal = await getDB();
    await dbLocal.put(STORE_NAME, record);
  }

  // 両方保存処理
  const handleSaveBoth = async () => {
    if (!record) {
      alert("プレビューを作成してください");
      return;
    }
    setUploading(true);
    try {
      await saveRecordToIndexedDB(record);
      await saveRecordToFirestore(record);
      alert("ローカルとFirebaseに保存しました");
      router.push("/practice/history");
    } catch (e) {
      alert("保存に失敗しました");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  // いいね処理（シンプルにFirestoreカウントアップ）
  const handleLike = async () => {
    if (!id || !userId) return;
    if (liked) return; // 二重いいね防止（簡易）
    try {
      const docRef = doc(db, "practiceRecords", id);
      await updateDoc(docRef, { likes: increment(1) });
      setLikes((prev) => prev + 1);
      setLiked(true);
    } catch (e) {
      console.error("いいね失敗", e);
    }
  };

  // コメント投稿処理
  const handleAddComment = async () => {
    if (!id || !userId) return;
    if (!newComment.trim()) return;
    const commentObj = {
      userId,
      comment: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    try {
      const docRef = doc(db, "practiceRecords", id);
      await updateDoc(docRef, {
        comments: arrayUnion(commentObj),
      });
      setComments((prev) => [...prev, commentObj]);
      setNewComment("");
    } catch (e) {
      console.error("コメント追加失敗", e);
    }
  };

  // --- スタイル等は省略。元コードと同じものを利用可 ---

  return (
    <>
      {/* ナビバーとメニューは省略（元コードと同様） */}

      <main style={{ padding: 24, maxWidth: 800, margin: "auto", paddingTop: 72, fontFamily: "sans-serif" }}>
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
            <h2>{lessonTitle}</h2>

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
                <div style={{ marginTop: 8 }}>
                  <strong>板書写真：</strong>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
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

        {/* 保存ボタン */}
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
          💾 ローカル＋Firebaseに保存
        </button>

        {/* いいね・コメント */}
        <section style={{ marginTop: 40 }}>
          <h3>いいね {likes}</h3>
          <button
            onClick={handleLike}
            disabled={liked}
            style={{
              padding: "8px 16px",
              backgroundColor: liked ? "#ccc" : "#2196f3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: liked ? "not-allowed" : "pointer",
            }}
          >
            {liked ? "いいね済" : "いいねする"}
          </button>

          <h3 style={{ marginTop: 24 }}>コメント</h3>
          <ul style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #ccc", padding: 8, borderRadius: 6 }}>
            {comments.map((c, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>{c.userId}</strong> <small>{new Date(c.createdAt).toLocaleString()}</small>
                <p>{c.comment}</p>
              </li>
            ))}
          </ul>
          <textarea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 6 }}
            placeholder="コメントを入力"
          />
          <button
            onClick={handleAddComment}
            style={{ marginTop: 8, padding: "8px 16px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            コメント投稿
          </button>
        </section>
      </main>
    </>
  );
}
