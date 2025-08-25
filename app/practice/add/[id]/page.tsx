"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { openDB } from "idb";
import { signOut, useSession } from "next-auth/react";
import {
  doc,
  setDoc,
  serverTimestamp,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { db, auth, storage } from "../../../firebaseConfig";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

/* =========================
   型
========================= */
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
  modelType: string; // lesson_plans_xxx
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
  "授業の流れ"?: Record<string, string>;
  "評価の観点"?: {
    "知識・技能"?: string[];
    "思考・判断・表現"?: string[];
    "主体的に学習に取り組む態度"?: string[];
    "態度"?: string[];
  };
};

/* =========================
   IndexedDB
========================= */
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

/* =========================
   画像処理
========================= */
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

async function uploadImageToStorage(
  base64: string,
  fileName: string,
  uid: string
): Promise<string> {
  const storageRef = ref(storage, `practiceImages/${uid}/${fileName}`);
  await uploadString(storageRef, base64, "data_url");
  return getDownloadURL(storageRef);
}

/* =========================
   モデル・コレクション変換
========================= */
const modelTypes = [
  { label: "読解モデル", value: "lesson_plans_reading" },
  { label: "話し合いモデル", value: "lesson_plans_discussion" },
  { label: "作文モデル", value: "lesson_plans_writing" },
  { label: "言語活動モデル", value: "lesson_plans_language_activity" },
];

function modelTypeToSlug(modelType: string) {
  return modelType.replace(/^lesson_plans_/, "");
}
function slugToPractice(slug: string) {
  return `practiceRecords_${slug}`;
}

/* =========================
   Firestore 読み出し（既存レコード確認）
========================= */
const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_discussion",
  "practiceRecords_writing",
  "practiceRecords_language_activity",
];

async function findRemotePracticeDocument(lessonId: string) {
  for (const coll of PRACTICE_COLLECTIONS) {
    const ref = doc(db, coll, lessonId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { data: snap.data(), collectionName: coll };
    }
  }
  return null;
}

/* =========================
   コンポーネント
========================= */
export default function PracticeAddPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();

  // 入力系
  const [practiceDate, setPracticeDate] = useState("");
  const [reflection, setReflection] = useState("");
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [compressedImages, setCompressedImages] = useState<BoardImage[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [grade, setGrade] = useState("");
  const [genre, setGenre] = useState("");
  const [unitName, setUnitName] = useState("");
  const [modelType, setModelType] = useState(modelTypes[0].value);

  // 補助
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 競合対策
  const [lastSeenVersion, setLastSeenVersion] = useState<number>(0);
  const [dirty, setDirty] = useState<boolean>(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // 変更監視（離脱警告）
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // 値の変更で dirty にする
  useEffect(() => {
    setDirty(true);
  }, [practiceDate, reflection, boardImages, compressedImages, lessonTitle, authorName, grade, genre, unitName, modelType]);

  // 初期ロード（授業案・ローカル実践案、そしてリモート確認）
  useEffect(() => {
    // 授業案（ローカル保管分から）
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

    // ローカル実践案
    getRecord(id).then((existing) => {
      if (existing) {
        setPracticeDate(existing.practiceDate);
        setReflection(existing.reflection);
        if (existing.compressedImages && existing.compressedImages.length > 0) {
          setBoardImages(existing.compressedImages);
        } else {
          setBoardImages(existing.boardImages);
        }
        setCompressedImages(existing.compressedImages || []);
        setRecord({ ...existing, lessonTitle: existing.lessonTitle || "" });
        setAuthorName(existing.authorName || "");
        setGrade(existing.grade || "");
        setGenre(existing.genre || "");
        setUnitName(existing.unitName || "");
        setModelType(existing.modelType || modelTypes[0].value);
      }
    });

    // リモートに既存ドキュメントがあるか確認（別端末編集の同期）
    (async () => {
      const remote = await findRemotePracticeDocument(id);
      if (remote?.data) {
        // version 管理
        const ver = typeof remote.data.version === "number" ? remote.data.version : 0;
        setLastSeenVersion(ver);

        // ローカルが空っぽなら、リモート値を反映して編集再開できるようにする
        if (!record) {
          setPracticeDate(remote.data.practiceDate ?? "");
          setReflection(remote.data.reflection ?? "");
          setBoardImages(Array.isArray(remote.data.boardImages) ? remote.data.boardImages : []);
          setCompressedImages(Array.isArray(remote.data.boardImages) ? remote.data.boardImages : []);
          setLessonTitle(remote.data.lessonTitle ?? "");
          setAuthorName(remote.data.authorName ?? "");
          setGrade(remote.data.grade ?? "");
          setGenre(remote.data.genre ?? "");
          setUnitName(remote.data.unitName ?? "");
          // remote.data.modelType は practiceRecords_xxx の場合があるため補正
          const mt =
            typeof remote.data.modelType === "string" &&
            remote.data.modelType.startsWith("lesson_plans_")
              ? remote.data.modelType
              : `lesson_plans_${(remote.data.modelType || "")
                  .toString()
                  .replace(/^practiceRecords_/, "")}`;
          setModelType(mt);
          setRecord({
            lessonId: id,
            practiceDate: remote.data.practiceDate ?? "",
            reflection: remote.data.reflection ?? "",
            boardImages: Array.isArray(remote.data.boardImages) ? remote.data.boardImages : [],
            compressedImages: Array.isArray(remote.data.boardImages) ? remote.data.boardImages : [],
            lessonTitle: remote.data.lessonTitle ?? "",
            authorName: remote.data.authorName ?? "",
            grade: remote.data.grade ?? "",
            genre: remote.data.genre ?? "",
            unitName: remote.data.unitName ?? "",
            modelType: mt,
          });
          setDirty(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* =========================
     ハンドラ
  ========================= */
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
      compressedImages,
      lessonTitle,
      authorName,
      grade,
      genre,
      unitName,
      modelType,
    });
    setDirty(true);
  };

  /* =========================
     Firestore 保存（楽観ロック/バージョン）
  ========================= */
  async function saveRecordToFirestoreWithVersion(
    rec: PracticeRecord & { compressedImages: BoardImage[] }
  ) {
    const uid = auth.currentUser?.uid ?? null;
    const userEmail = session?.user?.email ?? null;

    if (!uid || !userEmail) {
      alert("ログインが必要です。");
      throw new Error("Not logged in");
    }

    // 画像アップロード（圧縮版を使用）
    const uploadedUrls: BoardImage[] = await Promise.all(
      (rec.compressedImages || []).map(async (img) => {
        const url = await uploadImageToStorage(img.src, `${rec.lessonId}_${img.name}`, uid);
        return { name: img.name, src: url };
      })
    );

    const slug = modelTypeToSlug(rec.modelType);
    const collectionName = slugToPractice(slug);
    const ref = doc(db, collectionName, rec.lessonId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const remoteVer = snap.exists() ? (snap.data()?.version ?? 0) : 0;

      // 直近で見た version と違うなら、他端末更新の可能性を警告
      if (remoteVer !== lastSeenVersion) {
        const ok = confirm(
          "他の端末で更新されています。現在の編集内容で上書きしますか？（キャンセルすると保存を中止します）"
        );
        if (!ok) throw new Error("ABORTED_BY_USER");
      }

      const nowData = {
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
        modelType: rec.modelType, // lesson_plans_xxx のまま保存（既存仕様踏襲）
        version: remoteVer + 1,
        updatedAt: serverTimestamp(),
        createdAt: snap.exists()
          ? snap.data()?.createdAt ?? serverTimestamp()
          : serverTimestamp(),
      };

      tx.set(ref, nowData, { merge: true });
      setLastSeenVersion(remoteVer + 1);
    });
  }

  const handleSaveBoth = async () => {
    if (!record) {
      alert("プレビューを作成してください");
      return;
    }
    setUploading(true);
    try {
      // 1) ローカル保存
      await saveRecordToIndexedDB(record);

      // 2) Firestore 保存（バージョン管理）
      await saveRecordToFirestoreWithVersion({ ...record, compressedImages });

      setDirty(false);
      alert("ローカルとFirebaseに保存しました");
      router.push("/practice/history");
    } catch (e: any) {
      if (e?.message === "ABORTED_BY_USER") {
        // ユーザーが上書きを拒否
        alert("保存を中止しました。最新の内容を読み込み直すか、内容を見直してください。");
      } else {
        alert("保存に失敗しました");
        console.error(e);
      }
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <>
      <nav style={navBarStyle}>
        <div
          style={hamburgerStyle}
          onClick={() => setMenuOpen((p) => !p)}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setMenuOpen((p) => !p)}
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
          <div style={fieldGroupStyle}>
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

          <div style={fieldGroupStyle}>
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

          <div style={fieldGroupStyle}>
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

          <div style={fieldGroupStyle}>
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

          <div style={fieldGroupStyle}>
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

          <div style={fieldGroupStyle}>
            <label>
              モデルタイプ：
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4 }}
              >
                {modelTypes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={fieldGroupStyle}>
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
                  style={removeImgBtnStyle}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            style={primaryBtnStyle}
            disabled={uploading}
          >
            {uploading ? "アップロード中..." : "プレビューを生成"}
          </button>
        </form>

        {record && (
          <section
            id="practice-preview"
            style={previewWrapperStyle}
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

                <div style={{ marginTop: 8 }}>
                  <strong>評価の観点：</strong>
                  <div>
                    <strong>知識・技能</strong>
                    <ul>
                      {Array.isArray(
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.["知識・技能"]
                      )
                        ? (lessonPlan.result as ParsedResult)["評価の観点"]?.[
                            "知識・技能"
                          ]!.map((v, i) => <li key={`knowledge-${i}`}>{v}</li>)
                        : null}
                    </ul>
                  </div>
                  <div>
                    <strong>思考・判断・表現</strong>
                    <ul>
                      {Array.isArray(
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.["思考・判断・表現"]
                      )
                        ? (lessonPlan.result as ParsedResult)["評価の観点"]?.[
                            "思考・判断・表現"
                          ]!.map((v, i) => <li key={`thinking-${i}`}>{v}</li>)
                        : null}
                    </ul>
                  </div>
                  <div>
                    <strong>主体的に学習に取り組む態度</strong>
                    <ul>
                      {Array.isArray(
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.[
                          "主体的に学習に取り組む態度"
                        ]
                      )
                        ? (lessonPlan.result as ParsedResult)["評価の観点"]?.[
                            "主体的に学習に取り組む態度"
                          ]!.map((v, i) => <li key={`attitude-${i}`}>{v}</li>)
                        : Array.isArray(
                            (lessonPlan.result as ParsedResult)["評価の観点"]?.["態度"]
                          )
                        ? (lessonPlan.result as ParsedResult)["評価の観点"]?.["態度"]!.map(
                            (v, i) => <li key={`attitude-alt-${i}`}>{v}</li>
                          )
                        : null}
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

                <div style={{ marginTop: 8 }}>
                  <strong>授業の流れ：</strong>
                  <ul>
                    {typeof (lessonPlan.result as ParsedResult)["授業の流れ"] === "object"
                      ? Object.entries(
                          (lessonPlan.result as ParsedResult)["授業の流れ"]!
                        ).map(([key, val], i) => (
                          <li key={`flow-${i}`}>
                            <strong>{key}：</strong>
                            {val as any}
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
              </section>
            )}

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
                    style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}
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
          style={saveBtnStyle}
          disabled={uploading}
        >
          {uploading ? "保存中..." : "ローカル＋Firebaseに保存"}
        </button>
      </main>
    </>
  );
}

/* =========================
   スタイル
========================= */
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
const fieldGroupStyle: React.CSSProperties = {
  border: "2px solid #1976d2",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
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
const previewWrapperStyle: React.CSSProperties = {
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
const saveBtnStyle: React.CSSProperties = {
  padding: 12,
  backgroundColor: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  width: "100%",
  cursor: "pointer",
  marginTop: 16,
};
