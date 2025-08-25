"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { openDB } from "idb";
import { signOut, useSession } from "next-auth/react";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth, storage } from "../../../firebaseConfig";
import { ref, uploadString, uploadBytes, getDownloadURL } from "firebase/storage";

/* =========================================================
 * 型
 * ======================================================= */
type BoardImage = { name: string; src: string };

type PracticeRecord = {
  lessonId: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  compressedImages?: BoardImage[];
  lessonTitle: string;
  grade?: string;
  genre?: string;
  unitName?: string;
  authorName?: string;
  modelType: string; // lesson_plans_*
};

type LessonPlan = {
  id: string;
  result?: string | object;
};

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
  "授業の流れ"?: Record<string, any> | string | any[];
  "評価の観点"?: {
    "知識・技能"?: string[] | string;
    "思考・判断・表現"?: string[] | string;
    "主体的に学習に取り組む態度"?: string[] | string;
    "態度"?: string[] | string;
  };
};

/* =========================================================
 * ヘルパー
 * ======================================================= */
const toStrArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return [v];
  return [];
};

/* ======================= IndexedDB ======================= */
const DB_NAME = "PracticeDB";
const STORE_NAME = "practiceRecords";
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(idb) {
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME, { keyPath: "lessonId" });
      }
    },
  });
}
async function getRecord(lessonId: string): Promise<PracticeRecord | undefined> {
  const idb = await getDB();
  return idb.get(STORE_NAME, lessonId);
}
async function saveRecordToIndexedDB(rec: PracticeRecord) {
  const idb = await getDB();
  await idb.put(STORE_NAME, rec);
}

/* ======================= 画像ユーティリティ ======================= */
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

/* ---- 画像srcの形式判定 ---- */
const isDataUrl = (s: string) =>
  typeof s === "string" &&
  /^data:image\/(png|jpe?g|gif|webp);base64,/.test(s);
const isBlobUrl = (s: string) => typeof s === "string" && s.startsWith("blob:");
const isHttpUrl = (s: string) => typeof s === "string" && /^https?:\/\//.test(s);
const isFirebaseStorageUrl = (s: string) =>
  isHttpUrl(s) && /firebasestorage\.googleapis\.com/.test(s);

/* ---- 任意形式のsrcをStorageへ ---- */
async function uploadImageToStorageFromAny(
  src: string,
  fileName: string,
  uid: string
): Promise<string> {
  const path = `practiceImages/${uid}/${fileName}`;
  const imgRef = ref(storage, path);

  // すでに Firebase Storage のURLなら再アップロード不要
  if (isFirebaseStorageUrl(src)) return src;

  // data: URL
  if (isDataUrl(src)) {
    await uploadString(imgRef, src, "data_url");
    return getDownloadURL(imgRef);
  }

  // blob: or http(s):
  if (isBlobUrl(src) || isHttpUrl(src)) {
    const res = await fetch(src);
    const blob = await res.blob();
    await uploadBytes(imgRef, blob);
    return getDownloadURL(imgRef);
  }

  // 素のbase64（保険）
  const maybeDataUrl = `data:image/jpeg;base64,${src}`;
  await uploadString(imgRef, maybeDataUrl, "data_url");
  return getDownloadURL(imgRef);
}

/* ======================= コレクション補助 ======================= */
const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_writing",
  "practiceRecords_discussion",
  "practiceRecords_language_activity",
];
const toPracticeFromLesson = (lessonModelType: string) =>
  lessonModelType.replace("lesson_plans_", "practiceRecords_");
const toLessonFromPractice = (practiceCollection: string) =>
  practiceCollection.replace("practiceRecords_", "lesson_plans_");

function normalizeToPracticeCollection(
  param?: string | null
): string | undefined {
  if (!param) return undefined;
  if (param.startsWith("practiceRecords_")) return param;
  if (param.startsWith("lesson_plans_"))
    return param.replace("lesson_plans_", "practiceRecords_");
  const short = param.replace(/^(\?|#).*/, "");
  if (["reading", "writing", "discussion", "language_activity"].includes(short)) {
    return `practiceRecords_${short}`;
  }
  return undefined;
}

/* =========================================================
 * コンポーネント
 * ======================================================= */
export default function PracticeAddPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const modelTypeParam = searchParams?.get("modelType") || "";
  const { data: session } = useSession();

  const [practiceDate, setPracticeDate] = useState("");
  const [reflection, setReflection] = useState("");
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [compressedImages, setCompressedImages] = useState<BoardImage[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [grade, setGrade] = useState("");
  const [genre, setGenre] = useState("");
  const [unitName, setUnitName] = useState("");
  const [modelType, setModelType] = useState("lesson_plans_reading");

  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  /* ---- 授業案（ローカル）＆ローカル下書き ---- */
  useEffect(() => {
    const plansJson = localStorage.getItem("lessonPlans") || "[]";
    let plans: LessonPlan[] = [];
    try {
      plans = JSON.parse(plansJson) as LessonPlan[];
    } catch {
      plans = [];
    }
    const plan = plans.find((p) => p.id === id) || null;
    setLessonPlan(plan);

    if (plan?.result) {
      if (typeof plan.result === "string") {
        const firstLine = plan.result.split("\n")[0].replace(/^【単元名】\s*/, "");
        setLessonTitle(firstLine);
      } else if (typeof plan.result === "object") {
        const unit = (plan.result as ParsedResult)["単元名"];
        setLessonTitle(typeof unit === "string" ? unit : "");
      }
    } else {
      setLessonTitle("");
    }

    getRecord(id).then((existing) => {
      if (!existing) return;
      setPracticeDate(existing.practiceDate);
      setReflection(existing.reflection);

      if (existing.compressedImages && existing.compressedImages.length > 0) {
        setBoardImages(existing.compressedImages);
        setCompressedImages(existing.compressedImages);
      } else {
        setBoardImages(existing.boardImages || []);
        setCompressedImages(existing.boardImages || []);
      }

      setRecord({ ...existing, lessonTitle: existing.lessonTitle || "" });
      setAuthorName(existing.authorName || "");
      setGrade(existing.grade || "");
      setGenre(existing.genre || "");
      setUnitName(existing.unitName || "");
      setModelType(existing.modelType || "lesson_plans_reading");
    });
  }, [id]);

  /* ---- Firestoreからもロード（別端末同期） ---- */
  useEffect(() => {
    async function loadFromFirestore() {
      const preferred = normalizeToPracticeCollection(modelTypeParam);
      const targetCollections = preferred ? [preferred] : PRACTICE_COLLECTIONS;

      for (const coll of targetCollections) {
        const snap = await getDoc(doc(db, coll, id));
        if (!snap.exists()) continue;

        const data = snap.data() as any;
        const lessonType = data.modelType
          ? String(data.modelType) // lesson_plans_*
          : toLessonFromPractice(coll);

        setModelType(lessonType);
        setPracticeDate(data.practiceDate || "");
        setReflection(data.reflection || "");
        setLessonTitle(data.lessonTitle || "");
        setAuthorName(data.authorName || "");
        setGrade(data.grade || "");
        setGenre(data.genre || "");
        setUnitName(data.unitName || "");

        const imgs: BoardImage[] = Array.isArray(data.boardImages) ? data.boardImages : [];
        setBoardImages(imgs);
        setCompressedImages(imgs);

        setRecord({
          lessonId: id,
          practiceDate: data.practiceDate || "",
          reflection: data.reflection || "",
          boardImages: imgs,
          compressedImages: imgs,
          lessonTitle: data.lessonTitle || "",
          authorName: data.authorName || "",
          grade: data.grade || "",
          genre: data.genre || "",
          unitName: data.unitName || "",
          modelType: lessonType,
        });
        break; // 見つかったら終わり
      }
    }
    loadFromFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, modelTypeParam]);

  /* ---- 画像選択 ---- */
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

  /* ---- プレビュー生成 ---- */
  const handlePreview = (e: FormEvent) => {
    e.preventDefault();
    setRecord({
      lessonId: id,
      practiceDate,
      reflection,
      boardImages,
      compressedImages,
      lessonTitle,
      authorName,
      grade,
      genre,
      unitName,
      modelType,
    });
  };

  /* ---- Firestore保存 ---- */
  async function saveRecordToFirestore(rec: PracticeRecord & { compressedImages: BoardImage[] }) {
    const uid = auth.currentUser?.uid;
    const userEmail = session?.user?.email;
    if (!uid || !userEmail) {
      alert("ログインが必要です。");
      throw new Error("Not logged in");
    }

    // 画像ソース：compressed があればそちら、なければ board
    const sourceImages =
      (rec.compressedImages?.length ? rec.compressedImages : rec.boardImages) || [];

    const uploadedUrls: BoardImage[] = await Promise.all(
      sourceImages.map(async (img, idx) => {
        if (img?.src && isFirebaseStorageUrl(img.src)) {
          // すでに Storage URL
          return { name: img.name, src: img.src };
        }
        const safeName = `${rec.lessonId}_${idx}_${(img.name || "image").replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        )}`;
        const url = await uploadImageToStorageFromAny(img.src, safeName, uid);
        return { name: img.name, src: url };
      })
    );

    const practiceRecordCollection = toPracticeFromLesson(rec.modelType); // practiceRecords_*
    const docRef = doc(db, practiceRecordCollection, rec.lessonId);

    await setDoc(
      docRef,
      {
        ownerUid: uid,
        practiceDate: rec.practiceDate,
        reflection: rec.reflection,
        boardImages: uploadedUrls,
        lessonTitle: rec.lessonTitle,
        author: userEmail,
        authorName: rec.authorName,
        grade: rec.grade || "",
        genre: rec.genre || "",
        unitName: rec.unitName || "",
        modelType: rec.modelType, // lesson_plans_*
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /* ---- ローカル + Firestore 保存 ---- */
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
      console.error(e);
      alert("保存に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
   * UI
   * ======================================================= */
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
        style={overlayStyle(menuOpen)}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
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

      <main style={containerStyle}>
        <h2>実践記録作成・編集</h2>

        <p style={{ color: "#e53935", fontSize: 14, marginBottom: 16 }}>
          ※板書の写真を追加・削除した場合は、必ず「プレビューを生成」ボタンを押してください
        </p>

        <form onSubmit={handlePreview}>
          <div style={boxStyle}>
            <label>
              実践開始日：<br />
              <input
                type="date"
                value={practiceDate}
                required
                onChange={(e) => setPracticeDate(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              />
            </label>
          </div>

          <div style={boxStyle}>
            <label>
              作成者名：
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4, width: "calc(100% - 16px)" }}
              />
            </label>
          </div>

          <div style={boxStyle}>
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

          <div style={boxStyle}>
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

          <div style={boxStyle}>
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

          <div style={boxStyle}>
            <label>
              モデルタイプ：
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4 }}
              >
                <option value="lesson_plans_reading">読解モデル</option>
                <option value="lesson_plans_discussion">話し合いモデル</option>
                <option value="lesson_plans_writing">作文モデル</option>
                <option value="lesson_plans_language_activity">言語活動モデル</option>
              </select>
            </label>
          </div>

          <div style={boxStyle}>
            <label>
              振り返り：
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                required
                rows={5}
                style={{ width: "100%", marginTop: 8, padding: 8 }}
              />
            </label>
          </div>

          <label style={uploadLabelStyle}>
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
                  style={removeImgBtnStyle}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button type="submit" style={primaryBtnStyle} disabled={uploading}>
            {uploading ? "アップロード中..." : "プレビューを生成"}
          </button>
        </form>

        {record && (
          <section
            id="practice-preview"
            style={previewBoxStyle}
          >
            <h2>{lessonTitle}</h2>

            {lessonPlan?.result && typeof lessonPlan.result === "object" && (
              <section style={planPreviewStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 8, color: "#1976d2" }}>
                  授業案詳細（プレビュー）
                </h3>

                <p>
                  <strong>教科書名：</strong>
                  {(lessonPlan.result as ParsedResult)["教科書名"] || ""}
                </p>
                <p>
                  <strong>学年：</strong>
                  {(lessonPlan.result as ParsedResult)["学年"] || ""}
                </p>
                <p>
                  <strong>ジャンル：</strong>
                  {(lessonPlan.result as ParsedResult)["ジャンル"] || ""}
                </p>
                <p>
                  <strong>単元名：</strong>
                  {(lessonPlan.result as ParsedResult)["単元名"] || ""}
                </p>
                <p>
                  <strong>授業時間数：</strong>
                  {(lessonPlan.result as ParsedResult)["授業時間数"] ?? ""}時間
                </p>

                {/* 評価の観点 */}
                <div style={{ marginTop: 8 }}>
                  <strong>評価の観点：</strong>

                  <div>
                    <strong>知識・技能</strong>
                    <ul>
                      {toStrArray(
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.["知識・技能"]
                      ).map((v, i) => (
                        <li key={`knowledge-${i}`}>{v}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>思考・判断・表現</strong>
                    <ul>
                      {toStrArray(
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.["思考・判断・表現"]
                      ).map((v, i) => (
                        <li key={`thinking-${i}`}>{v}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>主体的に学習に取り組む態度</strong>
                    <ul>
                      {toStrArray(
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.[
                          "主体的に学習に取り組む態度"
                        ] ??
                          (lessonPlan.result as ParsedResult)["評価の観点"]?.["態度"]
                      ).map((v, i) => (
                        <li key={`attitude-${i}`}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p style={{ marginTop: 12 }}>
                  <strong>育てたい子どもの姿：</strong>
                  {(lessonPlan.result as ParsedResult)["育てたい子どもの姿"] || ""}
                </p>

                <div style={{ marginTop: 8 }}>
                  <strong>言語活動の工夫：</strong>
                  <p>{(lessonPlan.result as ParsedResult)["言語活動の工夫"] || ""}</p>
                </div>

                <div style={{ marginTop: 8 }}>
                  <strong>単元の目標：</strong>
                  <p>{(lessonPlan.result as ParsedResult)["単元の目標"] || ""}</p>
                </div>

                {/* 授業の流れ（string / array / object 全対応） */}
                <div style={{ marginTop: 8 }}>
                  <strong>授業の流れ：</strong>
                  {(() => {
                    const flow = (lessonPlan.result as ParsedResult)["授業の流れ"];
                    if (Array.isArray(flow)) {
                      return (
                        <ul>
                          {flow.map((v, i) => (
                            <li key={`flowarr-${i}`}>
                              {typeof v === "string" ? v : JSON.stringify(v)}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (flow && typeof flow === "object") {
                      return (
                        <ul>
                          {Object.entries(flow as Record<string, any>)
                            .sort((a, b) => {
                              const na = parseInt(a[0].match(/\d+/)?.[0] ?? "0", 10);
                              const nb = parseInt(b[0].match(/\d+/)?.[0] ?? "0", 10);
                              return na - nb;
                            })
                            .map(([key, val], i) => (
                              <li key={`flowobj-${i}`}>
                                <strong>{key}：</strong>
                                {typeof val === "string" ? val : JSON.stringify(val)}
                              </li>
                            ))}
                        </ul>
                      );
                    }
                    if (typeof flow === "string") {
                      return <p style={{ whiteSpace: "pre-wrap" }}>{flow}</p>;
                    }
                    return null;
                  })()}
                </div>
              </section>
            )}

            {/* 実践記録 */}
            <section style={{ marginTop: 24 }}>
              <h3>実践記録</h3>
              <p>
                <strong>実践開始日：</strong> {record.practiceDate}
              </p>
              <p>
                <strong>作成者：</strong> {record.authorName || "不明"}
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

        <button
          onClick={handleSaveBoth}
          style={primaryBtnStyle}
          disabled={uploading}
        >
          {uploading ? "保存中..." : "ローカル＋Firebaseに保存"}
        </button>
      </main>
    </>
  );
}

/* =========================================================
 * Styles
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
const containerStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 800,
  margin: "auto",
  fontFamily: "sans-serif",
  paddingTop: 72,
};
const uploadLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  cursor: "pointer",
  padding: "8px 12px",
  backgroundColor: "#1976d2",
  color: "#fff",
  borderRadius: 6,
  textAlign: "center",
};
const removeImgBtnStyle: React.CSSProperties = {
  backgroundColor: "rgba(229, 57, 53, 0.85)",
  border: "none",
  borderRadius: 4,
  color: "white",
  width: 24,
  height: 24,
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: 4,
};
const primaryBtnStyle: React.CSSProperties = {
  padding: 12,
  backgroundColor: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  width: "100%",
  cursor: "pointer",
  marginTop: 16,
};
const boxStyle: React.CSSProperties = {
  border: "2px solid #1976d2",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
};
const previewBoxStyle: React.CSSProperties = {
  marginTop: 24,
  padding: 24,
  border: "1px solid #ccc",
  borderRadius: 6,
  backgroundColor: "#fff",
  fontSize: 14,
  lineHeight: 1.6,
  fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
};
const planPreviewStyle: React.CSSProperties = {
  border: "2px solid #2196F3",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
  backgroundColor: "#e3f2fd",
};
