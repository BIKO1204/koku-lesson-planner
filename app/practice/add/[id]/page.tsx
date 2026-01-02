"use client";

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { openDB } from "idb";
import { signOut, useSession } from "next-auth/react";
import { onAuthStateChanged } from "firebase/auth";
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
  unitName?: string; // 表示名は「教材名」
  authorName?: string;
  modelType: string; // lesson_plans_*
  // ▼ 確認メタデータ（ローカル保持用）
  confirmedNoPersonalInfo?: boolean;
  imagesSignature?: string;
};

/** ローカル下書き：圧縮画像(base64)を持ってOK */
type PracticeDraftLocal = {
  lessonId: string;
  practiceDate: string;
  reflection: string;
  compressedImages: BoardImage[]; // base64 OK
  lessonTitle: string;
  grade: string;
  genre: string;
  unitName: string; // 表示名は「教材名」
  authorName: string;
  modelType: string; // lesson_plans_*
  confirmedNoPersonalInfo: boolean;
  imagesSignature?: string;
  timestamp: string;
  isDraft: true;
  draftMode: "local";
};

/** クラウド下書き：画像はURLだけ（Firestore容量対策） */
type PracticeDraftCloud = {
  lessonId: string;
  practiceDate: string;
  reflection: string;
  draftImages: BoardImage[]; // ★URLのみ
  lessonTitle: string;
  grade: string;
  genre: string;
  unitName: string;
  authorName: string;
  modelType: string;
  confirmedNoPersonalInfo: boolean;
  imagesSignature?: string;
  timestamp: string;
  isDraft: true;
  draftMode: "cloud";
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
  "教材名"?: string; // 新キー想定
  "単元名"?: string; // 旧キー互換
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

// 授業案の値で欠けを自動補完（教材名→単元名の順で後方互換）
function pickMetaWithFallback(
  gradeState: string,
  genreState: string,
  unitNameState: string,
  lessonPlan: LessonPlan | null
) {
  const r = (lessonPlan?.result as ParsedResult) || undefined;
  const planGrade = typeof r?.["学年"] === "string" ? r["学年"] : "";
  const planGenre = typeof r?.["ジャンル"] === "string" ? r["ジャンル"] : "";
  const planUnit =
    typeof r?.["教材名"] === "string"
      ? r["教材名"]
      : typeof r?.["単元名"] === "string"
      ? r["単元名"]
      : "";

  return {
    grade: gradeState || planGrade || "",
    genre: genreState || planGenre || "",
    unitName: unitNameState || planUnit || "",
  };
}

/* ======================= モデルタイプ自動判定関連 ======================= */
const LESSON_PLAN_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_writing",
  "lesson_plans_discussion",
  "lesson_plans_language_activity",
];

const MODEL_LABELS: Record<string, string> = {
  lesson_plans_reading: "読解モデル",
  lesson_plans_discussion: "話し合いモデル",
  lesson_plans_writing: "作文モデル",
  lesson_plans_language_activity: "言語活動モデル",
};

/* ======================= 確認メタ：シグネチャ ======================= */
// 依存ライブラリなしの軽量ハッシュ（djb2）
function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}
function calcImagesSignature(imgs: BoardImage[]): string {
  const combined = imgs
    .map((i) => `${i.name || ""}|${(i.src || "").slice(0, 256)}`)
    .join("||");
  return hashString(combined);
}

/* ======================= IndexedDB（確定保存） ======================= */
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
type EnhanceOpts = {
  enhance?: boolean;
  contrast?: number;
  brightness?: number;
  saturate?: number;
};

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
  quality = 0.9,
  opts: EnhanceOpts = {}
): Promise<string> {
  const { enhance = false, contrast = 1.12, brightness = 1.03, saturate = 1.05 } = opts;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;

      // アスペクト比維持で縮小
      const wScale = maxWidth / width;
      const hScale = maxHeight / height;
      const scale = Math.min(1, wScale, hScale);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not supported"));
        return;
      }
      // 高品質リサンプリング
      ctx.imageSmoothingEnabled = true;
      (ctx as any).imageSmoothingQuality = "high";

      // 見やすさ補正（任意）
      if (enhance) {
        ctx.filter = `contrast(${contrast}) brightness(${brightness}) saturate(${saturate})`;
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
  typeof s === "string" && /^data:image\/(png|jpe?g|gif|webp);base64,/.test(s);
const isBlobUrl = (s: string) => typeof s === "string" && s.startsWith("blob:");
const isHttpUrl = (s: string) => typeof s === "string" && /^https?:\/\//.test(s);
const isFirebaseStorageUrl = (s: string) =>
  isHttpUrl(s) && /firebasestorage\.googleapis\.com/.test(s);

/* ---- 任意形式のsrcをStorageへ（確定保存用） ---- */
async function uploadImageToStorageFromAny(
  src: string,
  fileName: string,
  uid: string
): Promise<string> {
  const path = `practiceImages/${uid}/${fileName}`;
  const imgRef = ref(storage, path);

  if (isFirebaseStorageUrl(src)) return src;

  if (isDataUrl(src)) {
    await uploadString(imgRef, src, "data_url");
    return getDownloadURL(imgRef);
  }

  if (isBlobUrl(src) || isHttpUrl(src)) {
    const res = await fetch(src);
    const blob = await res.blob();
    await uploadBytes(imgRef, blob);
    return getDownloadURL(imgRef);
  }

  const maybeDataUrl = `data:image/jpeg;base64,${src}`;
  await uploadString(imgRef, maybeDataUrl, "data_url");
  return getDownloadURL(imgRef);
}

/* ---- 任意形式のsrcをStorageへ（下書き用：URLだけをFirestoreに保存） ---- */
async function uploadDraftImageToStorageFromAny(
  src: string,
  fileName: string,
  uid: string,
  lessonId: string
): Promise<string> {
  const path = `practiceDraftImages/${uid}/${lessonId}/${fileName}`;
  const imgRef = ref(storage, path);

  if (isFirebaseStorageUrl(src)) return src;

  if (isDataUrl(src)) {
    await uploadString(imgRef, src, "data_url");
    return getDownloadURL(imgRef);
  }

  if (isBlobUrl(src) || isHttpUrl(src)) {
    const res = await fetch(src);
    const blob = await res.blob();
    await uploadBytes(imgRef, blob);
    return getDownloadURL(imgRef);
  }

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

function normalizeToPracticeCollection(param?: string | null): string | undefined {
  if (!param) return undefined;
  if (param.startsWith("practiceRecords_")) return param;
  if (param.startsWith("lesson_plans_")) return param.replace("lesson_plans_", "practiceRecords_");
  const short = param.replace(/^(\?|#).*/, "");
  if (["reading", "writing", "discussion", "language_activity"].includes(short)) {
    return `practiceRecords_${short}`;
  }
  return undefined;
}

/* ======================= 下書き（ローカル＋クラウド） ======================= */
const DRAFT_COLLECTION = "practice_record_drafts";
const DRAFT_KEY_BASE = "editPracticeRecord";
const draftKey = (lessonId: string) => `${DRAFT_KEY_BASE}:${lessonId}`;

/** timestampの新しいほうを採用（ローカル/クラウドどちらも対応） */
function pickLatestDraft(
  a: PracticeDraftLocal | PracticeDraftCloud | null,
  b: PracticeDraftLocal | PracticeDraftCloud | null
) {
  const ta = a?.timestamp ? Date.parse(a.timestamp) : -1;
  const tb = b?.timestamp ? Date.parse(b.timestamp) : -1;
  if (ta < 0 && tb < 0) return null;
  if (tb > ta) return b;
  return a ?? b ?? null;
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

  // 認証UID（クラウド下書き保存用）
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  // 復元→自動保存の競合抑止
  const restoringRef = useRef(true);
  // ★ クリア直後の1回だけ自動保存を抑止
  const skipAutoSaveOnceRef = useRef(false);

  // 状態
  const [practiceDate, setPracticeDate] = useState("");
  const [reflection, setReflection] = useState("");
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [compressedImages, setCompressedImages] = useState<BoardImage[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [grade, setGrade] = useState("");
  const [genre, setGenre] = useState("");
  const [unitName, setUnitName] = useState(""); // 表示は「教材名」
  const [modelType, setModelType] = useState("lesson_plans_reading");

  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // モデルタイプ固定フラグ
  const [modelLocked, setModelLocked] = useState<boolean>(false);

  // 学年・ジャンル・教材名：固定 or 手動
  const [lockMeta, setLockMeta] = useState<boolean>(true);

  // 確認関連
  const [confirmNoPersonalInfo, setConfirmNoPersonalInfo] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string>("");
  const [previousSignature, setPreviousSignature] = useState<string>("");
  const [needsReconfirm, setNeedsReconfirm] = useState<boolean>(true);
  const POLICY_VERSION = "2025-09-02"; // 任意の版番号/日付

  // ▼ NEW: 見やすさ設定
  const [enhancePreview, setEnhancePreview] = useState<boolean>(true); // プレビューにフィルタ
  const [enhanceUpload, setEnhanceUpload] = useState<boolean>(true); // 圧縮時に焼き込む
  const [compressLongEdge, setCompressLongEdge] = useState<number>(1400); // 長辺ピクセル

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  /* ---- 授業案（ローカル）＆ローカル下書き（起動時） ---- */
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
        const firstLine = plan.result
          .split("\n")[0]
          .replace(/^【教材名】\s*/, "")
          .replace(/^【単元名】\s*/, "");
        setLessonTitle(firstLine);
      } else if (typeof plan.result === "object") {
        const r = plan.result as ParsedResult;
        const unit =
          (typeof r["教材名"] === "string" && r["教材名"]) ||
          (typeof r["単元名"] === "string" && r["単元名"]) ||
          "";
        setLessonTitle(unit);
      }
    } else {
      setLessonTitle("");
    }
  }, [id]);

  /* ---- 実践記録（Firestore）読み込み（別端末同期） ---- */
  useEffect(() => {
    async function loadFromFirestore() {
      const preferred = normalizeToPracticeCollection(modelTypeParam);
      const target = preferred ? [preferred] : PRACTICE_COLLECTIONS;

      for (const coll of target) {
        const snap = await getDoc(doc(db, coll, id));
        if (!snap.exists()) continue;

        const data = snap.data() as any;
        const lessonType = data.modelType ? String(data.modelType) : toLessonFromPractice(coll);

        setModelType(lessonType);
        setModelLocked(true);

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
          confirmedNoPersonalInfo: data.confirmedNoPersonalInfo ?? undefined,
          imagesSignature: data.imagesSignature ?? undefined,
        });

        if (data.imagesSignature) setPreviousSignature(String(data.imagesSignature));
        break;
      }
    }
    loadFromFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, modelTypeParam]);

  /* ---- モデルタイプを自動特定（授業案コレクション横断 or クエリ） ---- */
  useEffect(() => {
    if (modelLocked) return;

    (async () => {
      if (modelTypeParam && modelTypeParam.startsWith("lesson_plans_")) {
        setModelType(modelTypeParam);
        setModelLocked(true);
        return;
      }
      for (const coll of LESSON_PLAN_COLLECTIONS) {
        const snap = await getDoc(doc(db, coll, id));
        if (snap.exists()) {
          setModelType(coll);
          setModelLocked(true);
          const data = snap.data() as any;
          const result = data?.result;
          setLessonPlan({ id, result });
          if (result && typeof result === "object") {
            const r = result as ParsedResult;
            const unit = (r["教材名"] as string) ?? (r["単元名"] as string) ?? "";
            if (unit) setLessonTitle(unit);
          }
          return;
        }
      }
    })();
  }, [id, modelLocked, modelTypeParam]);

  /* ---- 学年・ジャンル・教材名：固定 or 手動 ---- */
  useEffect(() => {
    const hasExisting = Boolean(grade || genre || unitName);
    if (hasExisting) {
      setLockMeta(true);
      return;
    }
    const r = (lessonPlan?.result as ParsedResult) || undefined;
    const planGrade = typeof r?.["学年"] === "string" ? r["学年"] : "";
    const planGenre = typeof r?.["ジャンル"] === "string" ? r["ジャンル"] : "";
    const planUnit =
      typeof r?.["教材名"] === "string"
        ? r["教材名"]
        : typeof r?.["単元名"] === "string"
        ? r["単元名"]
        : "";

    if (planGrade || planGenre || planUnit) {
      if (!grade) setGrade(planGrade);
      if (!genre) setGenre(planGenre);
      if (!unitName) setUnitName(planUnit);
      setLockMeta(true);
    } else {
      setLockMeta(false);
    }
  }, [lessonPlan, grade, genre, unitName]);

  /* ===================== 下書き：復元（ローカル＋クラウドの新しい方） ===================== */
  useEffect(() => {
    (async () => {
      let localDraft: PracticeDraftLocal | null = null;
      try {
        const raw = localStorage.getItem(draftKey(id));
        if (raw) {
          const parsed = JSON.parse(raw) as any;
          if (parsed?.isDraft && parsed?.draftMode === "local") {
            localDraft = parsed as PracticeDraftLocal;
          }
        }
      } catch {}

      let cloudDraft: PracticeDraftCloud | null = null;
      const u = uid || auth.currentUser?.uid || null;
      if (u) {
        try {
          const snap = await getDoc(doc(db, DRAFT_COLLECTION, `${u}_${id}`));
          if (snap.exists()) {
            const payload = (snap.data() as any)?.payload;
            if (payload?.isDraft && payload?.draftMode === "cloud") {
              cloudDraft = payload as PracticeDraftCloud;
            }
          }
        } catch {}
      }

      const chosen = pickLatestDraft(localDraft, cloudDraft);
      if (chosen) {
        const imgs =
          (chosen as any).compressedImages?.length
            ? (chosen as PracticeDraftLocal).compressedImages
            : (chosen as PracticeDraftCloud).draftImages || [];

        setCompressedImages(imgs);
        setBoardImages(imgs);
        setPracticeDate(chosen.practiceDate || "");
        setReflection(chosen.reflection || "");
        setLessonTitle(chosen.lessonTitle || "");
        setAuthorName(chosen.authorName || "");
        setGrade(chosen.grade || "");
        setGenre(chosen.genre || "");
        setUnitName(chosen.unitName || "");
        setModelType(chosen.modelType || "lesson_plans_reading");
        setConfirmNoPersonalInfo(!!chosen.confirmedNoPersonalInfo);
        if (chosen.imagesSignature) setPreviousSignature(chosen.imagesSignature);
      }

      restoringRef.current = false; // 復元完了→以降オート保存
    })();
  }, [id, uid]);

  /* ===================== 下書き：ビルド＆保存ヘルパ ===================== */
  const buildLocalDraft = (): PracticeDraftLocal => {
    const meta = pickMetaWithFallback(grade, genre, unitName, lessonPlan);
    return {
      lessonId: id,
      practiceDate,
      reflection,
      compressedImages, // base64 OK（ローカル用）
      lessonTitle,
      authorName,
      grade: meta.grade,
      genre: meta.genre,
      unitName: meta.unitName,
      modelType,
      confirmedNoPersonalInfo: confirmNoPersonalInfo,
      imagesSignature: currentSignature,
      timestamp: new Date().toISOString(),
      isDraft: true,
      draftMode: "local",
    };
  };

  const buildCloudDraft = (draftImages: BoardImage[]): PracticeDraftCloud => {
    const meta = pickMetaWithFallback(grade, genre, unitName, lessonPlan);
    return {
      lessonId: id,
      practiceDate,
      reflection,
      draftImages, // ★URLのみ
      lessonTitle,
      authorName,
      grade: meta.grade,
      genre: meta.genre,
      unitName: meta.unitName,
      modelType,
      confirmedNoPersonalInfo: confirmNoPersonalInfo,
      imagesSignature: currentSignature,
      timestamp: new Date().toISOString(),
      isDraft: true,
      draftMode: "cloud",
    };
  };

  const saveDraftLocal = (draft: PracticeDraftLocal) => {
    try {
      localStorage.setItem(draftKey(id), JSON.stringify(draft));
    } catch (e) {
      console.warn("ローカル下書き保存失敗:", e);
    }
  };

  const saveDraftCloud = async (draft: PracticeDraftCloud) => {
    const u = uid || auth.currentUser?.uid || null;
    if (!u) return;
    try {
      await setDoc(
        doc(db, DRAFT_COLLECTION, `${u}_${id}`),
        { ownerUid: u, lessonId: id, payload: draft, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.warn("クラウド下書き保存失敗:", e);
    }
  };

  /** ★下書き画像をStorageへ → URL配列を返す */
  const uploadDraftImagesAndGetUrls = async (): Promise<BoardImage[]> => {
    const u = uid || auth.currentUser?.uid || null;
    if (!u) throw new Error("Not logged in");

    const srcImages = (compressedImages?.length ? compressedImages : boardImages) || [];
    if (!srcImages.length) return [];

    const uploadedUrls: BoardImage[] = await Promise.all(
      srcImages.map(async (img, idx) => {
        if (img?.src && isFirebaseStorageUrl(img.src)) {
          return { name: img.name, src: img.src };
        }
        const safeName = `${id}_${idx}_${(img.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const url = await uploadDraftImageToStorageFromAny(img.src, safeName, u, id);
        return { name: img.name, src: url };
      })
    );

    return uploadedUrls;
  };

  /* ===== 画面入力をすべてリセット ===== */
  const resetAllInputs = () => {
    // テキスト系
    setPracticeDate("");
    setAuthorName("");
    setReflection("");

    // 画像系
    setBoardImages([]);
    setCompressedImages([]);

    // 確認メタ
    setConfirmNoPersonalInfo(false);
    setCurrentSignature("");
    setPreviousSignature("");
    setNeedsReconfirm(true);

    // プレビューも消す
    setRecord(null);

    // 授業案があればメタは授業案由来に戻す（なければ空）
    const r = (lessonPlan?.result as ParsedResult) || {};
    const planGrade = typeof r?.["学年"] === "string" ? r["学年"] : "";
    const planGenre = typeof r?.["ジャンル"] === "string" ? r["ジャンル"] : "";
    const planUnit =
      typeof r?.["教材名"] === "string"
        ? r["教材名"]
        : typeof r?.["単元名"] === "string"
        ? r["単元名"]
        : "";
    setGrade(planGrade);
    setGenre(planGenre);
    setUnitName(planUnit);
    setLessonTitle(planUnit || "");
  };

  /* ===================== 下書き：自動保存（デバウンス）
   * ★おすすめ：自動保存はローカルのみ（クラウドは手動ボタンで）
   * ======================================================= */
  useEffect(() => {
    if (restoringRef.current) return;
    if (skipAutoSaveOnceRef.current) {
      skipAutoSaveOnceRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      const draft = buildLocalDraft();
      saveDraftLocal(draft);
      // ★クラウド自動保存はしない（Firestore負荷/詰まり防止）
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uid,
    practiceDate,
    reflection,
    lessonTitle,
    authorName,
    grade,
    genre,
    unitName,
    modelType,
    confirmNoPersonalInfo,
    currentSignature,
    compressedImages,
  ]);

  /* ===================== 画像の追加・削除・並び替え ===================== */
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newFullImages: BoardImage[] = [];
    const newCompressedImages: BoardImage[] = [];

    for (const file of files) {
      try {
        const fullBase64 = await fileToBase64(file);
        const compressedBase64 = await resizeAndCompressFile(
          file,
          compressLongEdge,
          compressLongEdge,
          0.9,
          { enhance: enhanceUpload, contrast: 1.12, brightness: 1.03, saturate: 1.05 }
        );
        newFullImages.push({ name: file.name, src: fullBase64 });
        newCompressedImages.push({ name: file.name, src: compressedBase64 });
      } catch (error) {
        console.error("画像処理失敗", error);
      }
    }

    setBoardImages((prev) => [...prev, ...newFullImages]);
    setCompressedImages((prev) => [...prev, ...newCompressedImages]);

    setConfirmNoPersonalInfo(false);
    setNeedsReconfirm(true);

    e.target.value = "";
  };

  const handleRemoveImage = (i: number) => {
    setBoardImages((prev) => prev.filter((_, idx) => idx !== i));
    setCompressedImages((prev) => prev.filter((_, idx) => idx !== i));

    setConfirmNoPersonalInfo(false);
    setNeedsReconfirm(true);
  };

  const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
    const copy = arr.slice();
    const item = copy.splice(from, 1)[0];
    copy.splice(to, 0, item);
    return copy;
  };

  const handleMoveImage = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= boardImages.length) return;
    setBoardImages((prev) => moveItem(prev, i, to));
    setCompressedImages((prev) => moveItem(prev, i, to));
    setConfirmNoPersonalInfo(false);
    setNeedsReconfirm(true);
  };

  /* ---- プレビュー生成 ---- */
  const handlePreview = (e: FormEvent) => {
    e.preventDefault();

    const meta = pickMetaWithFallback(grade, genre, unitName, lessonPlan);
    if (meta.grade !== grade) setGrade(meta.grade);
    if (meta.genre !== genre) setGenre(meta.genre);
    if (meta.unitName !== unitName) setUnitName(meta.unitName);

    setRecord({
      lessonId: id,
      practiceDate,
      reflection,
      boardImages,
      compressedImages,
      lessonTitle,
      authorName,
      grade: meta.grade,
      genre: meta.genre,
      unitName: meta.unitName,
      modelType,
      confirmedNoPersonalInfo: confirmNoPersonalInfo,
      imagesSignature: currentSignature,
    });
  };

  /* ---- 現在の画像シグネチャを算出 ---- */
  useEffect(() => {
    const imgs = (compressedImages?.length ? compressedImages : boardImages) || [];
    const sig = calcImagesSignature(imgs);
    setCurrentSignature(sig);
    if (previousSignature && sig === previousSignature) {
      setNeedsReconfirm(false);
    } else {
      setNeedsReconfirm(true);
    }
  }, [boardImages, compressedImages, previousSignature]);

  /* ---- Firestore保存（確定） ---- */
  async function saveRecordToFirestore(rec: PracticeRecord & { compressedImages: BoardImage[] }) {
    const u = auth.currentUser?.uid;
    const userEmail = session?.user?.email;
    if (!u || !userEmail) {
      alert("ログインが必要です。");
      throw new Error("Not logged in");
    }

    if (!modelLocked) {
      alert("授業案からモデルタイプが自動設定されていません。");
      throw new Error("Model type not locked");
    }

    const sourceImages = (rec.compressedImages?.length ? rec.compressedImages : rec.boardImages) || [];

    const uploadedUrls: BoardImage[] = await Promise.all(
      sourceImages.map(async (img, idx) => {
        if (img?.src && isFirebaseStorageUrl(img.src)) {
          return { name: img.name, src: img.src };
        }
        const safeName = `${rec.lessonId}_${idx}_${(img.name || "image").replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        )}`;
        const url = await uploadImageToStorageFromAny(img.src, safeName, u);
        return { name: img.name, src: url };
      })
    );

    const practiceRecordCollection = toPracticeFromLesson(rec.modelType); // practiceRecords_*
    const docRef = doc(db, practiceRecordCollection, rec.lessonId);

    const finalSignature = rec.imagesSignature || calcImagesSignature(sourceImages);

    await setDoc(
      docRef,
      {
        ownerUid: u,
        practiceDate: rec.practiceDate,
        reflection: rec.reflection,
        boardImages: uploadedUrls,
        lessonTitle: rec.lessonTitle,
        author: userEmail,
        authorName: rec.authorName,
        grade: rec.grade || "",
        genre: rec.genre || "",
        unitName: rec.unitName || "", // 表示は教材名
        modelType: rec.modelType,
        createdAt: serverTimestamp(),

        // 確認メタ
        confirmedNoPersonalInfo: true,
        confirmedAt: serverTimestamp(),
        confirmedByUid: u,
        confirmedByEmail: userEmail,
        policyVersion: POLICY_VERSION,
        imagesSignature: finalSignature,
      },
      { merge: true }
    );
  }

  /* ---- 確定保存（ローカル + Firestore） ---- */
  const handleSaveBoth = async () => {
    if (!record) {
      alert("プレビューを作成してください");
      return;
    }

    const meta = pickMetaWithFallback(grade, genre, unitName, lessonPlan);

    if (!confirmNoPersonalInfo) {
      alert("保存前に「児童の顔・氏名など個人情報が写っていない」ことを確認してください。");
      return;
    }
    if (!modelLocked) {
      alert("授業案からモデルタイプが自動設定されていません。");
      return;
    }
    if (!meta.grade || !meta.genre || !meta.unitName) {
      alert("学年・ジャンル・教材名が未入力です（授業案が無い場合は手動入力が必要です）。");
      return;
    }

    setUploading(true);
    try {
      const toSaveLocal: PracticeRecord = {
        ...record,
        grade: meta.grade,
        genre: meta.genre,
        unitName: meta.unitName,
        confirmedNoPersonalInfo: true,
        imagesSignature: currentSignature,
      };
      await saveRecordToIndexedDB(toSaveLocal);

      await saveRecordToFirestore({
        ...toSaveLocal,
        compressedImages,
      });

      // 確定保存後は下書きをクリア（UIの入力値はそのまま）
      try {
        localStorage.removeItem(draftKey(id));
      } catch {}
      if (uid) {
        try {
          await setDoc(
            doc(db, DRAFT_COLLECTION, `${uid}_${id}`),
            { ownerUid: uid, lessonId: id, payload: null, updatedAt: serverTimestamp() },
            { merge: true }
          );
        } catch {}
      }

      alert("保存しました（ローカル＋Firebase）");
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
  const metaForCanSave = pickMetaWithFallback(grade, genre, unitName, lessonPlan);
  const canSave =
    !!record &&
    !!confirmNoPersonalInfo &&
    !!modelLocked &&
    !!metaForCanSave.grade &&
    !!metaForCanSave.genre &&
    !!metaForCanSave.unitName;

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

        {/* 注意書き */}
        <div style={noticeBoxStyle}>
          <strong>アップロード前に必ずご確認ください：</strong>
          <ul style={{ margin: "8px 0 0 18px" }}>
            <li>
              <strong>
                板書の写真を<strong>追加・削除・並び替え</strong>した場合は、必ず
                「プレビューを生成」ボタンを押してください（保存内容を正しく反映するため）。
              </strong>
            </li>
            <li>
              児童の<strong>顔</strong>や<strong>氏名</strong>、名札、出席番号、個人が特定できる要素（タブレット名、
              アカウント名、手書きの名前等）が写っていないこと。
            </li>
            <li>掲示物・配布資料などに<strong>個人情報</strong>が含まれていないこと。</li>
            <li>
              写り込みがある場合は、アップロード前に<strong>必ず加工（モザイク等）</strong>してください。
            </li>
          </ul>

          <p style={{ marginTop: 8 }}>
            <strong>
              ※下書き保存：
            </strong>{" "}
            自動保存はローカルのみ。<strong>別端末でも画像付きで下書きを復元したい場合は「📝 下書きを保存」</strong>
            を押してください（画像はStorageに保存され、FirestoreにはURLだけ保存されます）。
          </p>
        </div>

        {/* ▼ NEW: 板書画像の見やすさ設定 */}
        <div style={boxStyle}>
          <strong>板書画像の見やすさ設定</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={enhancePreview}
                onChange={(e) => setEnhancePreview(e.target.checked)}
              />
              プレビューに見やすさ補正を適用（コントラスト等）
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={enhanceUpload}
                onChange={(e) => setEnhanceUpload(e.target.checked)}
              />
              アップロード用の圧縮画像にも補正を焼き込む
            </label>
          </div>
          <div style={{ marginTop: 8 }}>
            圧縮サイズ（長辺ピクセル）：
            <select
              value={compressLongEdge}
              onChange={(e) => setCompressLongEdge(parseInt(e.target.value, 10))}
              style={{ marginLeft: 8, padding: 4 }}
            >
              <option value={1000}>1000（軽量）</option>
              <option value={1400}>1400（標準）</option>
              <option value={1800}>1800（高画質）</option>
            </select>
          </div>
        </div>

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
              作成者名(ニックネーム)：
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                style={{ marginLeft: 8, padding: 4, width: "calc(100% - 16px)" }}
              />
            </label>
          </div>

          {/* 学年 */}
          <div style={boxStyle}>
            <label>
              学年：
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                disabled={lockMeta}
                style={{
                  marginLeft: 8,
                  padding: 4,
                  background: lockMeta ? "#f5f5f5" : undefined,
                }}
              >
                <option value="">{lockMeta ? (grade || "（未設定）") : "選択してください"}</option>
                <option value="1年">1年</option>
                <option value="2年">2年</option>
                <option value="3年">3年</option>
                <option value="4年">4年</option>
                <option value="5年">5年</option>
                <option value="6年">6年</option>
              </select>
            </label>
            {!lockMeta && (
              <small style={{ color: "#666", display: "block", marginTop: 6 }}>
                授業案／既存記録が見つからなかったため手動入力が必要です。
              </small>
            )}
          </div>

          {/* ジャンル */}
          <div style={boxStyle}>
            <label>
              ジャンル：
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required
                disabled={lockMeta}
                style={{
                  marginLeft: 8,
                  padding: 4,
                  background: lockMeta ? "#f5f5f5" : undefined,
                }}
              >
                <option value="">{lockMeta ? (genre || "（未設定）") : "選択してください"}</option>
                <option value="物語文">物語文</option>
                <option value="説明文">説明文</option>
                <option value="詩">詩</option>
                <option value="その他">その他</option>
              </select>
            </label>
          </div>

          {/* 教材名（旧：単元名） */}
          <div style={boxStyle}>
            <label>
              教材名：
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
                readOnly={lockMeta}
                style={{
                  marginLeft: 8,
                  padding: 4,
                  width: "calc(100% - 16px)",
                  background: lockMeta ? "#f5f5f5" : undefined,
                }}
              />
            </label>
            {!lockMeta && <small style={{ color: "#666" }}>授業案が無い場合は手動で入力してください。</small>}
          </div>

          {/* モデルタイプ（自動） */}
          <div style={boxStyle}>
            <label>
              モデルタイプ：
              <span
                title="授業案に基づき自動設定されます"
                style={{
                  marginLeft: 8,
                  padding: "4px 8px",
                  background: "#eee",
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                {MODEL_LABELS[modelType] || modelType}
              </span>
            </label>
            {!modelLocked && (
              <p style={{ marginTop: 8, color: "#e65100" }}>
                ※授業案が見つかると自動設定されます。授業案から本ページに遷移するか、共有一覧の「編集」から開いてください。
              </p>
            )}
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
              disabled={uploading || draftSaving}
            />
          </label>

          <div style={{ marginTop: 12 }}>
            {boardImages.map((img, i) => (
              <div key={img.name + i} style={{ width: "100%", marginBottom: 12, position: "relative" }}>
                <div style={{ marginBottom: 6, fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>板書{i + 1}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(i, -1)}
                      disabled={i === 0}
                      aria-label="画像を上に移動"
                      style={reorderBtnStyle}
                      title="上へ"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveImage(i, +1)}
                      disabled={i === boardImages.length - 1}
                      aria-label="画像を下に移動"
                      style={reorderBtnStyle}
                      title="下へ"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label="画像を削除"
                      onClick={() => handleRemoveImage(i)}
                      style={removeImgBtnStyle}
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
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
                    filter: enhancePreview ? "contrast(1.12) brightness(1.03) saturate(1.05)" : "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* 確認チェック */}
          <div style={confirmBoxStyle}>
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <input
                type="checkbox"
                checked={confirmNoPersonalInfo}
                onChange={(e) => setConfirmNoPersonalInfo(e.target.checked)}
                aria-describedby="confirm-help"
              />
              <span>
                児童の<strong>顔・氏名・その他個人を特定できる情報</strong>が写っていないことを確認しました。
                {needsReconfirm && (
                  <em style={{ color: "#e53935", marginLeft: 8 }}>（画像を変更したため、再確認が必要です）</em>
                )}
              </span>
            </label>
            <div id="confirm-help" style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              ポリシー版：{POLICY_VERSION}／シグネチャ：{currentSignature || "-"}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <button
              type="button"
              disabled={draftSaving || uploading}
              onClick={async () => {
                const localDraft = buildLocalDraft();
                saveDraftLocal(localDraft);

                const u = uid || auth.currentUser?.uid || null;
                if (!u) {
                  alert("ログインが必要です。");
                  return;
                }

                setDraftSaving(true);
                try {
                  // ★画像はStorageへ、FirestoreにはURLだけ
                  const urls = await uploadDraftImagesAndGetUrls();
                  const cloudDraft = buildCloudDraft(urls);
                  await saveDraftCloud(cloudDraft);
                  alert("下書きを保存しました（ローカル＋クラウド：画像はURL保存）");
                } catch (e) {
                  console.error(e);
                  alert("下書き保存に失敗しました");
                } finally {
                  setDraftSaving(false);
                }
              }}
              style={{ ...secondaryBtnStyle, backgroundColor: "#13f46d3f", color: "#0a6a33" }}
            >
              {draftSaving ? "📝 下書き保存中..." : "📝 下書きを保存"}
            </button>

            <button
              type="button"
              disabled={draftSaving || uploading}
              onClick={async () => {
                // ストレージの下書きを削除（Firestoreのpayloadをnullにする）
                try {
                  localStorage.removeItem(draftKey(id));
                } catch {}
                if (uid) {
                  try {
                    await setDoc(
                      doc(db, DRAFT_COLLECTION, `${uid}_${id}`),
                      { ownerUid: uid, lessonId: id, payload: null, updatedAt: serverTimestamp() },
                      { merge: true }
                    );
                  } catch {}
                }

                // ★ 直後の自動保存を一度だけ無効化し、入力もリセット
                skipAutoSaveOnceRef.current = true;
                resetAllInputs();

                alert("下書きと画面入力をクリアしました（ローカル＋クラウド）");
              }}
              style={{ ...secondaryBtnStyle, backgroundColor: "#bc181885", color: "#fff" }}
            >
              🧹 下書きと入力をクリア
            </button>
          </div>

          <button type="submit" style={primaryBtnStyle} disabled={uploading || draftSaving}>
            {uploading ? "アップロード中..." : "プレビューを生成"}
          </button>
        </form>

        {record && (
          <section id="practice-preview" style={previewBoxStyle}>
            <h2>{lessonTitle}</h2>

            {lessonPlan?.result && typeof lessonPlan.result === "object" && (
              <section style={planPreviewStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 8, color: "#1976d2" }}>授業案詳細（プレビュー）</h3>

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
                  <strong>教材名：</strong>
                  {(lessonPlan.result as ParsedResult)["教材名"] ??
                    (lessonPlan.result as ParsedResult)["単元名"] ??
                    ""}
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
                      {toStrArray((lessonPlan.result as ParsedResult)["評価の観点"]?.["知識・技能"]).map((v, i) => (
                        <li key={`knowledge-${i}`}>{v}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>思考・判断・表現</strong>
                    <ul>
                      {toStrArray((lessonPlan.result as ParsedResult)["評価の観点"]?.["思考・判断・表現"]).map((v, i) => (
                        <li key={`thinking-${i}`}>{v}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong>主体的に学習に取り組む態度</strong>
                    <ul>
                      {toStrArray(
                        (lessonPlan.result as ParsedResult)["評価の観点"]?.["主体的に学習に取り組む態度"] ??
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

                {/* 授業の流れ */}
                <div style={{ marginTop: 8 }}>
                  <strong>授業の流れ：</strong>
                  {(() => {
                    const flow = (lessonPlan.result as ParsedResult)["授業の流れ"];
                    if (Array.isArray(flow)) {
                      return (
                        <ul>
                          {flow.map((v, i) => (
                            <li key={`flowarr-${i}`}>{typeof v === "string" ? v : JSON.stringify(v)}</li>
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

              {/* 学年・ジャンル・教材名（補完後） */}
              <p>
                <strong>学年：</strong> {record.grade || grade || "—"}
              </p>
              <p>
                <strong>ジャンル：</strong> {record.genre || genre || "—"}
              </p>
              <p>
                <strong>教材名：</strong> {record.unitName || unitName || "—"}
              </p>

              <p>
                <strong>振り返り：</strong>
              </p>
              <p>{record.reflection}</p>

              {record.boardImages.length > 0 && (
                <div style={{ marginTop: 12 }}>
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
                            filter: enhancePreview ? "contrast(1.12) brightness(1.03) saturate(1.05)" : "none",
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
            ...primaryBtnStyle,
            backgroundColor: canSave ? "#4caf50" : "#9e9e9e",
            cursor: canSave ? "pointer" : "not-allowed",
          }}
          disabled={uploading || draftSaving || !canSave}
          title={
            canSave
              ? undefined
              : !confirmNoPersonalInfo
              ? "保存するには「個人情報が写っていない」チェックが必要です"
              : !modelLocked
              ? "授業案からの自動設定が必要です"
              : "学年・ジャンル・教材名の入力が必要です"
          }
        >
          {uploading ? "保存中..." : "💾 実践記録を保存・共有する"}
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
const noticeBoxStyle: React.CSSProperties = {
  border: "2px solid #ff7043",
  backgroundColor: "#fff3e0",
  color: "#5d4037",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
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
  width: 28,
  height: 28,
  cursor: "pointer",
  fontWeight: "bold",
};
const reorderBtnStyle: React.CSSProperties = {
  backgroundColor: "#eeeeee",
  border: "1px solid #ccc",
  borderRadius: 4,
  color: "#333",
  width: 28,
  height: 28,
  cursor: "pointer",
  fontWeight: "bold",
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
const secondaryBtnStyle: React.CSSProperties = {
  padding: 10,
  border: "none",
  borderRadius: 6,
  width: "100%",
  cursor: "pointer",
};
const boxStyle: React.CSSProperties = {
  border: "2px solid #1976d2",
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
};
const confirmBoxStyle: React.CSSProperties = {
  border: "1px solid #9e9e9e",
  borderRadius: 6,
  padding: 12,
  marginTop: 12,
  background: "#fafafa",
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
