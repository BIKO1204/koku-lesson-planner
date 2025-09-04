// app/practice/share/page.tsx
"use client";

import React, { useState, useEffect, CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSession, signOut } from "next-auth/react";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/* =========================
 * 型
 * ======================= */
type BoardImage = { name: string; src: string };
type Comment = {
  userId: string;
  displayName: string;
  comment: string;
  createdAt: string;
};
type PdfFile = {
  url: string;
  name: string;
};
type PracticeRecord = {
  lessonId: string;
  lessonTitle: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  likes?: number;
  likedUsers?: string[];
  comments?: Comment[];
  grade?: string;
  genre?: string;
  unitName?: string; // 表示は教材名
  author?: string; // 投稿者のID（メール）
  authorName?: string; // 投稿者の表示名（任意）
  pdfFiles?: PdfFile[];
  createdAt?: any;
  modelType?: string; // reading / writing / discussion / language_activity
  isShared?: boolean; // 共有ページに出すかどうか（未定義 or true=共有中、false=非共有）
};
type LessonPlan = {
  id: string;
  result: any;
  modelType?: string; // reading / writing / discussion / language_activity
};

/* =========================
 * 新着ユーティリティ
 * ======================= */
const LAST_VISIT_KEY = "share:lastVisit";
const tsToMillis = (v: any): number => {
  if (!v) return 0;
  if (typeof v === "object" && v.seconds != null) {
    return v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
  }
  if (typeof v?.toDate === "function") {
    try {
      return v.toDate().getTime();
    } catch {}
  }
  if (typeof v === "string") {
    const t = Date.parse(v);
    return isNaN(t) ? 0 : t;
  }
  if (typeof v === "number") return v;
  return 0;
};

// スマホ判定用フック
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

// 安全に配列化
const asArray = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) return [v];
  return [];
};

// HTMLエスケープ
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 表示・フィルタ用フォールバック
const norm = (v: any) => (v == null ? "" : String(v).trim());
const pickGrade = (r: PracticeRecord, plan?: LessonPlan) =>
  norm(r.grade ?? plan?.result?.["学年"]);
const pickGenre = (r: PracticeRecord, plan?: LessonPlan) =>
  norm(r.genre ?? plan?.result?.["ジャンル"]);
// ★ 教材名（unitName）の安全な取得：実践記録 → 授業案(教材名) → 授業案(単元名)
const pickUnitName = (r: PracticeRecord, plan?: LessonPlan) =>
  norm(r.unitName ?? plan?.result?.["教材名"] ?? plan?.result?.["単元名"]);

const CORE_GENRES = ["物語文", "説明文", "詩"] as const;

export default function PracticeSharePage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "";
  const router = useRouter();

  const [inputGrade, setInputGrade] = useState<string>("");
  const [inputGenre, setInputGenre] = useState<string>("");
  const [inputUnitName, setInputUnitName] = useState<string>("");
  const [inputAuthor, setInputAuthor] = useState<string>("");

  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [unitNameFilter, setUnitNameFilter] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);

  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);

  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [newCommentAuthors, setNewCommentAuthors] = useState<Record<string, string>>({});

  const [editingCommentId, setEditingCommentId] =
    useState<{ recordId: string; index: number } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>("");

  const [uploadingPdfIds, setUploadingPdfIds] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfGeneratingId, setPdfGeneratingId] = useState<string | null>(null);

  // ▼ 表示時の板書見やすさ補正ON/OFF
  const [enhanceBoards, setEnhanceBoards] = useState<boolean>(true);

  // ▼ 新着管理
  const [lastVisit, setLastVisit] = useState<number>(0);
  const [newIds, setNewIds] = useState<string[]>([]);
  const [showNewOnly, setShowNewOnly] = useState<boolean>(false);

  // ▼ PDF匿名化チェック状態（レッスンIDごと）
  const [pdfConfirm, setPdfConfirm] = useState<Record<string, boolean>>({});

  const storage = getStorage();
  const isMobile = useIsMobile();

  // メニュー開閉
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  /* =========================
   * データ購読
   * ======================= */
  useEffect(() => {
    const modelCollections = [
      "practiceRecords_reading",
      "practiceRecords_discussion",
      "practiceRecords_writing",
      "practiceRecords_language_activity",
    ];

    const unsubscribers: (() => void)[] = [];
    let allRecords: PracticeRecord[] = [];

    modelCollections.forEach((colName) => {
      const qy = query(collection(db, colName), orderBy("practiceDate", "desc"));
      const unsubscribe = onSnapshot(qy, (snapshot) => {
        const recs: PracticeRecord[] = snapshot.docs
          .map((docSnap) => {
            const d = docSnap.data() as any;
            return {
              ...(d as PracticeRecord),
              lessonId: docSnap.id,
              modelType: colName.replace("practiceRecords_", ""),
              likedUsers: d.likedUsers || [],
              author: d.author || "",
              authorName: d.authorName || "",
              pdfFiles: d.pdfFiles || [],
              createdAt: d.createdAt || "",
              boardImages: Array.isArray(d.boardImages) ? d.boardImages : [],
              isShared: d.isShared,
            };
          })
          .filter((r) => r.isShared !== false);

        const typeKey = colName.replace("practiceRecords_", "");
        allRecords = [...allRecords.filter((r) => r.modelType !== typeKey), ...recs];
        allRecords.sort((a, b) =>
          (b.practiceDate || "").localeCompare(a.practiceDate || "")
        );
        setRecords([...allRecords]);
      });
      unsubscribers.push(unsubscribe);
    });

    const lessonPlanCollections = [
      "lesson_plans_reading",
      "lesson_plans_discussion",
      "lesson_plans_writing",
      "lesson_plans_language_activity",
    ];

    const planUnsubs: (() => void)[] = [];
    let allPlans: LessonPlan[] = [];

    lessonPlanCollections.forEach((colName) => {
      const qy = query(collection(db, colName));
      const unsubscribe = onSnapshot(qy, (snapshot) => {
        const plansData: LessonPlan[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          result: (docSnap.data() as any).result,
          modelType: colName.replace("lesson_plans_", ""),
        }));
        const typeKey = colName.replace("lesson_plans_", "");
        allPlans = [...allPlans.filter((p) => p.modelType !== typeKey), ...plansData];
        setLessonPlans([...allPlans]);
      });
      planUnsubs.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      planUnsubs.forEach((unsub) => unsub());
    };
  }, []);

  // 前回訪問時刻の初期化
  useEffect(() => {
    const v = Number(localStorage.getItem(LAST_VISIT_KEY) || "0");
    setLastVisit(isNaN(v) ? 0 : v);
  }, []);

  // 新着IDを算出
  useEffect(() => {
    const ids = records
      .filter((r) => {
        const created = tsToMillis(r.createdAt) || tsToMillis(r.practiceDate);
        return created > lastVisit;
      })
      .map((r) => r.lessonId);
    setNewIds(ids);
  }, [records, lastVisit]);

  // 既読化
  const markAllAsRead = () => {
    const now = Date.now();
    setLastVisit(now);
    try {
      localStorage.setItem(LAST_VISIT_KEY, String(now));
    } catch {}
  };

  /* =========================
   * フィルタ
   * ======================= */
  const handleSearch = () => {
    setGradeFilter(inputGrade || null);
    setGenreFilter(inputGenre || null);
    setUnitNameFilter(inputUnitName.trim() || null);
    setAuthorFilter(inputAuthor.trim() || null);
  };

  const filteredRecords = records.filter((r) => {
    if (r.isShared === false) return false;
    const plan = lessonPlans.find((p) => p.id === r.lessonId && p.modelType === r.modelType);
    const g = pickGrade(r, plan);
    const ge = pickGenre(r, plan);
    const unit = pickUnitName(r, plan);

    if (gradeFilter && g !== gradeFilter) return false;

    if (genreFilter) {
      if (genreFilter === "その他") {
        if ((CORE_GENRES as readonly string[]).includes(ge)) return false;
      } else {
        if (ge !== genreFilter) return false;
      }
    }

    if (unitNameFilter && !unit.includes(unitNameFilter)) return false;
    if (authorFilter && !r.authorName?.includes(authorFilter)) return false;

    const created = tsToMillis(r.createdAt) || tsToMillis(r.practiceDate);
    if (showNewOnly && !(created > lastVisit)) return false;

    return true;
  });

  /* =========================
   * いいね・コメント
   * ======================= */
  const isLikedByUser = (record: PracticeRecord) => {
    if (!userId) return false;
    return record.likedUsers?.includes(userId) ?? false;
  };

  const handleLike = async (lessonId: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    if (!userId) {
      alert("ユーザー情報が取得できません");
      return;
    }

    const record = records.find((r) => r.lessonId === lessonId);
    if (!record || !record.modelType) {
      alert("モデルタイプが特定できません");
      return;
    }
    const collectionName = `practiceRecords_${record.modelType}`;
    const docRef = doc(db, collectionName, lessonId);

    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) throw new Error("該当データがありません");
        const data = snap.data() as any;
        const likedUsers: string[] = data.likedUsers || [];

        if (likedUsers.includes(userId)) {
          transaction.update(docRef, {
            likes: increment(-1),
            likedUsers: likedUsers.filter((id) => id !== userId),
          });
        } else {
          transaction.update(docRef, {
            likes: increment(1),
            likedUsers: arrayUnion(userId),
          });
        }
      });
    } catch (error) {
      console.error("いいね処理中にエラー", error);
      alert("いいね処理に失敗しました");
    }
  };

  const handleCommentChange = (lessonId: string, value: string) => {
    setNewComments((prev) => ({ ...prev, [lessonId]: value }));
  };
  const handleCommentAuthorChange = (lessonId: string, value: string) => {
    setNewCommentAuthors((prev) => ({ ...prev, [lessonId]: value }));
  };

  const handleAddComment = async (lessonId: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const comment = newComments[lessonId]?.trim();
    const commentAuthor = newCommentAuthors[lessonId]?.trim();
    if (!comment) {
      alert("コメントを入力してください");
      return;
    }
    if (!commentAuthor) {
      alert("コメント者名を入力してください");
      return;
    }

    const record = records.find((r) => r.lessonId === lessonId);
    if (!record || !record.modelType) {
      alert("モデルタイプが特定できません");
      return;
    }
    const collectionName = `practiceRecords_${record.modelType}`;
    const docRef = doc(db, collectionName, lessonId);

    try {
      await updateDoc(docRef, {
        comments: arrayUnion({
          userId,
          displayName: commentAuthor,
          comment,
          createdAt: new Date().toISOString(),
        }),
      });
      setNewComments((prev) => ({ ...prev, [lessonId]: "" }));
      setNewCommentAuthors((prev) => ({ ...prev, [lessonId]: "" }));
    } catch (e) {
      console.error("コメント追加失敗", e);
      alert("コメントの投稿に失敗しました");
    }
  };

  const startEditComment = (recordId: string, index: number, currentText: string) => {
    setEditingCommentId({ recordId, index });
    setEditingCommentText(currentText);
  };
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };
  const onEditCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingCommentText(e.target.value);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId) return;
    const { recordId, index } = editingCommentId;
    if (!session) {
      alert("ログインしてください");
      return;
    }
    if (!editingCommentText.trim()) {
      alert("コメントを入力してください");
      return;
    }

    const record = records.find((r) => r.lessonId === recordId);
    if (!record || !record.comments || !record.comments[index] || !record.modelType) {
      alert("対象のコメントが見つかりません");
      return;
    }
    if (record.comments[index].userId !== userId) {
      alert("自分のコメントのみ編集できます");
      return;
    }
    const updatedComments = [...record.comments];
    updatedComments[index] = {
      ...updatedComments[index],
      comment: editingCommentText,
    };
    const collectionName = `practiceRecords_${record.modelType}`;
    const docRef = doc(db, collectionName, recordId);
    try {
      await updateDoc(docRef, { comments: updatedComments });
      cancelEditComment();
    } catch (e) {
      console.error("コメント更新失敗", e);
      alert("コメントの更新に失敗しました");
    }
  };

  const handleDeleteComment = async (recordId: string, index: number) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const record = records.find((r) => r.lessonId === recordId);
    if (!record || !record.comments || !record.comments[index] || !record.modelType) {
      alert("対象のコメントが見つかりません");
      return;
    }
    if (record.comments[index].userId !== userId) {
      alert("自分のコメントのみ削除できます");
      return;
    }
    const updatedComments = [...record.comments];
    updatedComments.splice(index, 1);
    const collectionName = `practiceRecords_${record.modelType}`;
    const docRef = doc(db, collectionName, recordId);
    try {
      await updateDoc(docRef, { comments: updatedComments });
    } catch (e) {
      console.error("コメント削除失敗", e);
      alert("コメントの削除に失敗しました");
    }
  };

  /* =========================
   * PDF アップロード/削除
   * ======================= */
  const handlePdfUpload = async (lessonId: string, file: File) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const record = records.find((r) => r.lessonId === lessonId);
    if (!record || !record.modelType) {
      alert("対象の実践案またはモデルタイプが見つかりません");
      return;
    }
    if (record.author !== userId) {
      alert("PDFのアップロードは投稿者のみ可能です");
      return;
    }

    // 匿名化チェック（ダブルチェック）
    if (!pdfConfirm[lessonId]) {
      alert("アップロード前に、匿名化チェックに同意してください。");
      return;
    }

    setUploadingPdfIds((prev) => [...prev, lessonId]);
    try {
      const pdfRef = storageRef(storage, `practiceRecords/${lessonId}/${file.name}`);
      await uploadBytes(pdfRef, file);
      const url = await getDownloadURL(pdfRef);
      const collectionName = `practiceRecords_${record.modelType}`;
      const docRef = doc(db, collectionName, lessonId);

      const newPdfFiles = record.pdfFiles ? [...record.pdfFiles] : [];
      newPdfFiles.push({ url, name: file.name });

      await updateDoc(docRef, { pdfFiles: newPdfFiles });
      alert("PDFをアップロードしました");
    } catch (error) {
      console.error("PDFアップロード失敗", error);
      alert("PDFアップロードに失敗しました");
    } finally {
      setUploadingPdfIds((prev) => prev.filter((id) => id !== lessonId));
    }
  };

  const handleDeletePdf = async (lessonId: string, pdfName: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const record = records.find((r) => r.lessonId === lessonId);
    if (!record || !record.modelType) {
      alert("対象の実践案またはモデルタイプが見つかりません");
      return;
    }
    if (record.author !== userId) {
      alert("PDFの削除は投稿者のみ可能です");
      return;
    }
    if (!pdfName) {
      alert("PDFファイル名がありません");
      return;
    }
    if (!confirm("本当にPDFファイルを削除しますか？")) return;

    setUploadingPdfIds((prev) => [...prev, lessonId]);
    try {
      const pdfRef = storageRef(storage, `practiceRecords/${lessonId}/${pdfName}`);
      await deleteObject(pdfRef);

      const collectionName = `practiceRecords_${record.modelType}`;
      const docRef = doc(db, collectionName, lessonId);
      const newPdfFiles = (record.pdfFiles || []).filter((p) => p.name !== pdfName);

      await updateDoc(docRef, { pdfFiles: newPdfFiles });
      alert("PDFを削除しました");
    } catch (error) {
      console.error("PDF削除失敗", error);
      alert("PDF削除に失敗しました");
    } finally {
      setUploadingPdfIds((prev) => prev.filter((id) => id !== lessonId));
    }
  };

  // 投稿者のみ編集可能。modelType をクエリで渡す
  const handleEdit = (lessonId: string) => {
    const record = records.find((r) => r.lessonId === lessonId);
    const isAuthor = !!(record && record.author && userId && record.author === userId);
    if (!isAuthor) {
      alert("この実践記録の編集は投稿者のみ可能です。");
      return;
    }
    const mt = record?.modelType ? `lesson_plans_${record.modelType}` : "";
    router.push(`/practice/add/${lessonId}${mt ? `?modelType=${encodeURIComponent(mt)}` : ""}`);
  };

  /* =========================
   * PDF生成
   * ======================= */
  const loadImage = (url: string, timeout = 12000): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      let tid: any = null;
      img.onload = () => {
        if (tid) clearTimeout(tid);
        resolve(img);
      };
      img.onerror = () => {
        if (tid) clearTimeout(tid);
        reject(new Error("画像読み込み失敗"));
      };
      tid = setTimeout(() => {
        try {
          img.src = "";
        } catch {}
        reject(new Error("画像読み込みタイムアウト"));
      }, timeout);
      img.src = url;
    });

  type EnhanceOpts = {
    maxWidth?: number;
    maxHeight?: number;
    jpegQuality?: number;
    contrast?: number;
    brightness?: number;
    saturate?: number;
  };

  const toBase64Enhanced = async (url: string, opts: EnhanceOpts = {}): Promise<string> => {
    const {
      maxWidth = 1800,
      maxHeight = 1800,
      jpegQuality = 0.93,
      contrast = 1.12,
      brightness = 1.03,
      saturate = 1.05,
    } = opts;

    const img = await loadImage(url);
    let tw = img.naturalWidth;
    let th = img.naturalHeight;
    const wScale = maxWidth ? maxWidth / tw : 1;
    const hScale = maxHeight ? maxHeight / th : 1;
    const scale = Math.min(1, wScale, hScale);
    tw = Math.max(1, Math.round(tw * scale));
    th = Math.max(1, Math.round(th * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvasコンテキスト取得失敗");

    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = "high";
    ctx.filter = `contrast(${contrast}) brightness(${brightness}) saturate(${saturate})`;
    ctx.drawImage(img, 0, 0, tw, th);
    return canvas.toDataURL("image/jpeg", jpegQuality);
  };

  const convertImagesToBase64 = async (
    images: BoardImage[],
    opts?: EnhanceOpts,
    maxCount?: number
  ): Promise<string[]> => {
    const target = typeof maxCount === "number" ? images.slice(0, maxCount) : images;
    const result: string[] = [];
    for (let i = 0; i < target.length; i++) {
      await new Promise((r) => setTimeout(r, 50));
      try {
        const base64 = await toBase64Enhanced(target[i].src, opts);
        result.push(base64);
      } catch {
        result.push("");
      }
    }
    return result;
  };

  const generatePdfFromRecord = async (record: PracticeRecord) => {
    if (!record) return;
    if (pdfGeneratingId) {
      alert("PDF生成処理が既に進行中です。しばらくお待ちください。");
      return;
    }

    const isSmallDevice =
      typeof window !== "undefined" &&
      (window.innerWidth <= 820 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

    try {
      setPdfGeneratingId(record.lessonId);
      const html2pdf = (await import("html2pdf.js")).default;

      const tempDiv = document.createElement("div");
      tempDiv.className = "h2pdf-root";
      tempDiv.style.padding = "12px";
      tempDiv.style.fontFamily = "'Yu Gothic','YuGothic','Meiryo',sans-serif";
      tempDiv.style.backgroundColor = "#fff";
      tempDiv.style.color = "#000";
      tempDiv.style.lineHeight = "1.35";
      tempDiv.style.fontSize = "12px";

      const style = document.createElement("style");
      style.textContent = `
        .h2pdf-avoid{ page-break-inside: avoid; break-inside: avoid; -webkit-page-break-inside: avoid; }
        .h2pdf-img{ display:block; width:100%; max-width:600px; height:auto; border:1px solid #ccc; border-radius:8px; margin:0 auto; }
        .h2pdf-section{ margin-bottom:12px; }
        .h2pdf-title{ border-bottom:2px solid #4CAF50; padding-bottom:8px; margin:0 0 12px; font-size:20px; }
      `;
      tempDiv.appendChild(style);

      const plan = lessonPlans.find(
        (p) => p.id === record.lessonId && p.modelType === record.modelType
      );

      const unitForTitle = pickUnitName(record, plan) || "無題教材";
      const safeUnitName = unitForTitle.replace(/[\\\/:*?"<>|]/g, "_");
      const safeAuthor = (record.authorName || "匿名").replace(/[\\\/:*?"<>|]/g, "_");
      const filename = `${safeUnitName}_実践記録_${safeAuthor}.pdf`;

      let lessonPlanHtml = "";
      if (plan && typeof plan.result === "object") {
        const ar = (v: any) =>
          Array.isArray(v) ? v : typeof v === "string" && v.trim() ? [v] : [];
        lessonPlanHtml += `
          <h2 class="h2pdf-section h2pdf-avoid" style="color:#4CAF50; margin-top:8px; margin-bottom:8px;">授業案</h2>
          <div class="h2pdf-section h2pdf-avoid">
            <p style="margin:4px 0;"><strong>教科書名：</strong> ${escapeHtml(
              plan.result["教科書名"] || "－"
            )}</p>
            <p style="margin:4px 0;"><strong>教材名：</strong> ${escapeHtml(
              plan.result["教材名"] ?? plan.result["単元名"] ?? "－"
            )}</p>
            <p style="margin:4px 0;"><strong>授業時間数：</strong> ${escapeHtml(
              String(plan.result["授業時間数"] || "－")
            )}時間</p>
            <p style="margin:4px 0;"><strong>単元の目標：</strong> ${escapeHtml(
              plan.result["単元の目標"] || "－"
            )}</p>
        `;
        if (plan.result["評価の観点"]) {
          const knowledge = ar(plan.result["評価の観点"]?.["知識・技能"]);
          const thinking = ar(plan.result["評価の観点"]?.["思考・判断・表現"]);
          const attitude = ar(
            plan.result["評価の観点"]?.["主体的に学習に取り組む態度"] ??
              plan.result["評価の観点"]?.["態度"]
          );
          lessonPlanHtml += `
            <div class="h2pdf-avoid" style="margin-top:8px;">
              <strong>評価の観点：</strong>
              <p style="margin:4px 0;"><strong>知識・技能</strong></p>
              <ul style="margin:0 0 4px; padding-left:16px;">
                ${knowledge
                  .map((v: string) => `<li style="margin-bottom:2px;">${escapeHtml(v)}</li>`)
                  .join("")}
              </ul>
              <p style="margin:4px 0;"><strong>思考・判断・表現</strong></p>
              <ul style="margin:0 0 4px; padding-left:16px;">
                ${thinking
                  .map((v: string) => `<li style="margin-bottom:2px;">${escapeHtml(v)}</li>`)
                  .join("")}
              </ul>
              <p style="margin:4px 0;"><strong>主体的に学習に取り組む態度</strong></p>
              <ul style="margin:0 0 4px; padding-left:16px;">
                ${attitude
                  .map((v: string) => `<li style="margin-bottom:2px;">${escapeHtml(v)}</li>`)
                  .join("")}
              </ul>
            </div>
          `;
        }
        lessonPlanHtml += `
            <p style="margin:4px 0;"><strong>育てたい子どもの姿：</strong> ${escapeHtml(
              plan.result["育てたい子どもの姿"] || "－"
            )}</p>
            <p style="margin:4px 0;"><strong>言語活動の工夫：</strong> ${escapeHtml(
              plan.result["言語活動の工夫"] || "－"
            )}</p>
        `;
        if (plan.result["授業の流れ"]) {
          const flow = plan.result["授業の流れ"];
          lessonPlanHtml += `<p style="margin:4px 0;"><strong>授業の流れ：</strong></p>`;
          if (typeof flow === "string") {
            lessonPlanHtml += `<p class="h2pdf-avoid" style="white-space:pre-wrap;">${escapeHtml(
              flow
            )}</p>`;
          } else if (Array.isArray(flow)) {
            lessonPlanHtml += `<ul class="h2pdf-avoid" style="margin:0 0 4px; padding-left:16px;">
              ${flow
                .map((it: any) =>
                  `<li style="margin-bottom:2px;">${
                    typeof it === "string" ? escapeHtml(it) : escapeHtml(JSON.stringify(it))
                  }</li>`
                )
                .join("")}
            </ul>`;
          } else if (typeof flow === "object") {
            const entries = Object.entries(flow).sort((a, b) => {
              const A = parseInt(a[0].match(/\d+/)?.[0] ?? "0", 10);
              const B = parseInt(b[0].match(/\d+/)?.[0] ?? "0", 10);
              return A - B;
            });
            lessonPlanHtml += `<ul class="h2pdf-avoid" style="margin:0 0 4px; padding-left:16px;">
              ${entries
                .map(
                  ([k, v]) =>
                    `<li style="margin-bottom:2px;"><strong>${escapeHtml(k)}:</strong> ${
                      typeof v === "string" ? escapeHtml(v) : escapeHtml(JSON.stringify(v))
                    }</li>`
                )
                .join("")}
            </ul>`;
          }
        }
        lessonPlanHtml += `</div>`;
      }

      const imgOpts = isSmallDevice
        ? {
            maxWidth: 1400,
            maxHeight: 1400,
            jpegQuality: 0.9,
            contrast: 1.11,
            brightness: 1.03,
            saturate: 1.05,
          }
        : {
            maxWidth: 1800,
            maxHeight: 1800,
            jpegQuality: 0.93,
            contrast: 1.12,
            brightness: 1.03,
            saturate: 1.05,
          };

      let boardImagesHtml = "";
      if (record.boardImages.length > 0) {
        const base64Images = await convertImagesToBase64(record.boardImages, imgOpts);
        boardImagesHtml += `<h2 class="h2pdf-section h2pdf-avoid" style="color:#4CAF50; margin-top:16px; margin-bottom:12px;">板書画像</h2>`;
        base64Images.forEach((base64, idx) => {
          const original = record.boardImages[idx];
          const src = base64 || original.src;
          boardImagesHtml += `
            <div class="h2pdf-section h2pdf-avoid" style="margin-bottom:12px;">
              <p style="margin:4px 0 6px; font-weight:bold;">板書${idx + 1}</p>
              <img src="${src}" crossorigin="anonymous" class="h2pdf-img" style="filter: contrast(1.10) brightness(1.03) saturate(1.05);" />
            </div>
          `;
        });
      }

      let commentsHtml = "";
      if (Array.isArray(record.comments) && record.comments.length > 0) {
        commentsHtml += `<h2 class="h2pdf-section h2pdf-avoid" style="color:#4CAF50; margin-top:16px; margin-bottom:8px;">コメント</h2>`;
        commentsHtml += `<ul class="h2pdf-avoid" style="margin:0; padding-left:16px;">`;
        record.comments.forEach((c) => {
          const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleString("ja-JP") : "";
          commentsHtml += `<li style="margin-bottom:6px;"><strong>${escapeHtml(
            c.displayName || "匿名"
          )}</strong> <small style="color:#666;">${escapeHtml(dateStr)}</small><br/>${escapeHtml(
            c.comment || ""
          ).replace(/\n/g, "<br/>")}</li>`;
        });
        commentsHtml += `</ul>`;
      }

      tempDiv.innerHTML = `
        <h1 class="h2pdf-title h2pdf-avoid">
          ${escapeHtml(record.lessonTitle || unitForTitle)}
        </h1>
        <div class="h2pdf-section h2pdf-avoid">
          <p style="margin:4px 0;"><strong>実践開始日：</strong> ${escapeHtml(
            record.practiceDate || "－"
          )}</p>
          <p style="margin:4px 0 12px;"><strong>作成者：</strong> ${escapeHtml(
            record.authorName || "匿名"
          )}</p>
        </div>
        ${lessonPlanHtml}
        <h2 class="h2pdf-section h2pdf-avoid" style="color:#4CAF50; margin-top:16px; margin-bottom:8px;">振り返り</h2>
        <p class="h2pdf-section h2pdf-avoid" style="white-space: pre-wrap; margin:4px 0 12px;">${escapeHtml(
          record.reflection || "－"
        )}</p>
        ${boardImagesHtml}
        ${commentsHtml}
      `;

      document.body.appendChild(tempDiv);

      const scale = isSmallDevice ? 2.0 : 2.6;

      await html2pdf()
        .from(tempDiv)
        .set({
          margin: 10,
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          html2canvas: { scale, useCORS: true },
          pagebreak: { mode: ["css", "legacy"], avoid: [".h2pdf-avoid"] },
        })
        .save(filename);

      document.body.removeChild(tempDiv);
    } catch (e) {
      alert("PDF生成に失敗しました");
      console.error(e);
    } finally {
      setPdfGeneratingId(null);
    }
  };

  /* =========================
   * PDFアップロードUI（匿名化チェックを内包）
   * ======================= */
  const PdfFileInput = ({
    lessonId,
    uploading,
    onUpload,
  }: {
    lessonId: string;
    uploading: boolean;
    onUpload: (lessonId: string, file: File) => void;
  }) => {
    const confirmed = pdfConfirm[lessonId] === true;

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) =>
              setPdfConfirm((p) => ({ ...p, [lessonId]: e.target.checked }))
            }
            disabled={uploading}
          />
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>
            <strong>匿名化の確認：</strong>
            PDF/資料から<strong>校名・個人名・内部情報</strong>を除去し、
            <u>ファイル名／プロパティ／ヘッダー・フッター／画像内文字</u>も匿名化しました。
            児童を特定できる情報は含みません。
          </span>
        </label>

        <label
          htmlFor={`pdf-upload-${lessonId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: uploading || !confirmed ? "not-allowed" : "pointer",
            color: confirmed ? "#1976d2" : "#9e9e9e",
            fontWeight: "bold",
            border: `1px solid ${confirmed ? "#1976d2" : "#ccc"}`,
            padding: "6px 12px",
            borderRadius: 6,
            userSelect: "none",
            opacity: uploading || !confirmed ? 0.6 : 1,
          }}
          aria-disabled={uploading || !confirmed}
          title={
            confirmed
              ? "匿名化に同意済みです。PDFを選択できます。"
              : "匿名化に同意してください。"
          }
        >
          📄 指導案・補足資料を選択（PDF）
          <input
            id={`pdf-upload-${lessonId}`}
            type="file"
            accept="application/pdf"
            disabled={uploading || !confirmed}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0] && confirmed) {
                onUpload(lessonId, e.target.files[0]);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </label>
      </div>
    );
  };

  /* =========================
   * UI
   * ======================= */
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
        style={getOverlayStyle(menuOpen)}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* サイドメニュー */}
      <div style={getMenuWrapperStyle(menuOpen)} aria-hidden={!menuOpen}>
        <button
          onClick={() => {
            signOut();
            setMenuOpen(false);
          }}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

        <div style={menuScrollStyle}>
          <Link href="/" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            🏠 ホーム
          </Link>
          <Link href="/plan" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📋 授業作成
          </Link>
          <Link href="/plan/history" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📖 計画履歴
          </Link>
          <Link href="/practice/history" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📷 実践履歴
          </Link>
          <Link href="/practice/share" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            🌐 共有版実践記録
          </Link>
          <Link href="/models/create" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            ✏️ 教育観作成
          </Link>
          <Link href="/models" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📚 教育観一覧
          </Link>
          <Link href="/models/history" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            🕒 教育観履歴
          </Link>
        </div>
      </div>

      {/* ▼ 研究参加者向けの説明 */}
      <section
        style={{
          margin: "12px auto 16px",
          padding: "12px",
          maxWidth: 1200,
          background: "#f3f7ff",
          border: "1px solid #bcd3ff",
          borderRadius: 8,
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>このページについて</h2>
        <ul style={{ margin: "8px 0 0 1.2em" }}>
          <li>
            <strong>共有範囲はログインユーザーのみ。</strong>一般公開はされません。
          </li>
          <li>
            <strong>共有の教育的意義：</strong>相互に授業案を閲覧・学び合うことで、国語の授業についての新しい気付きが得られます。
          </li>
          <li>
            <strong>共有は任意</strong>です。公開したくない場合は「共有から外す」で当ページから非表示にできます。
          </li>
          <li>
            <strong>ニックネーム運用に統一：</strong>作成者名・コメント者名とも<strong>必ずニックネーム</strong>を入力してください。実名や匿名表記は使用しません。
          </li>
          <li>
            <strong>PDF/補足資料は必ず匿名化</strong>してください（本文・目次・ヘッダー/フッター・
            <u>ファイル名とドキュメントのプロパティ</u>・画像内の校名/個人名を削除/マスキング）。
            児童を特定できる情報や学校の内部資料はアップロード禁止です。
          </li>
          <li>
            保存データは<strong>運営者の管理環境内</strong>で匿名化・統計化のうえ研究・品質改善に利用されます。
            <strong>外部の会社に原データを渡して学習させることはありません。</strong>
          </li>
          <li>
            障害対策の暗号化バックアップを<strong>最大30日</strong>保持（復旧はベストエフォート／完全復旧は保証されません）。
            重要資料はPDF等で<strong>自己バックアップ</strong>してください。
          </li>
        </ul>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          詳細：<a href="/terms">利用規約</a> ／ <a href="/privacy">プライバシーポリシー</a> ／{" "}
          <a href="/faq">FAQ</a>
        </p>
      </section>

      {/* ▼ 新着バナー */}
      {newIds.length > 0 && (
        <div style={newBannerStyle}>
          新着の実践記録が <b>{newIds.length}</b> 件あります
          <div style={{ display: "inline-flex", gap: 8, marginLeft: 12 }}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={bannerBtnStyle}
            >
              先頭へ
            </button>
            <button onClick={markAllAsRead} style={bannerBtnStyle}>
              既読にする
            </button>
          </div>
        </div>
      )}

      {/* レイアウト */}
      <div
        style={{
          ...wrapperResponsiveStyle,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* 左：フィルタ */}
        <aside
          style={{
            ...sidebarResponsiveStyle,
            width: isMobile ? "100%" : 280,
            height: isMobile ? "auto" : "calc(100vh - 72px)",
            marginBottom: isMobile ? 16 : 0,
            position: isMobile ? "relative" : "sticky",
            top: isMobile ? undefined : 72,
          }}
        >
          <h2 style={{ fontSize: "1.3rem", marginBottom: 16 }}>絞り込み</h2>

          <div>
            <div style={filterSectionTitleStyle}>学年</div>
            <select
              value={inputGrade}
              onChange={(e) => setInputGrade(e.target.value)}
              style={selectInputStyle}
            >
              <option value="">すべて</option>
              <option value="1年">1年</option>
              <option value="2年">2年</option>
              <option value="3年">3年</option>
              <option value="4年">4年</option>
              <option value="5年">5年</option>
              <option value="6年">6年</option>
            </select>
          </div>

          <div>
            <div style={filterSectionTitleStyle}>ジャンル</div>
            <select
              value={inputGenre}
              onChange={(e) => setInputGenre(e.target.value)}
              style={selectInputStyle}
            >
              <option value="">すべて</option>
              <option value="物語文">物語文</option>
              <option value="説明文">説明文</option>
              <option value="詩">詩</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div>
            <div style={filterSectionTitleStyle}>教材名</div>
            <input
              type="text"
              placeholder="教材名を入力"
              value={inputUnitName}
              onChange={(e) => setInputUnitName(e.target.value)}
              style={textInputStyle}
            />
          </div>

          <div>
            <div style={filterSectionTitleStyle}>作成者名</div>
            <input
              type="text"
              placeholder="作成者名で検索"
              value={inputAuthor}
              onChange={(e) => setInputAuthor(e.target.value)}
              style={textInputStyle}
            />
          </div>

          {/* 新着のみ表示 */}
          <div style={{ marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={showNewOnly}
                onChange={(e) => setShowNewOnly(e.target.checked)}
              />
              <span>新着のみ表示（前回訪問以降）</span>
            </label>
          </div>

          <button onClick={handleSearch} style={applyBtnStyle}>
            表示
          </button>
        </aside>

        {/* 右：一覧 */}
        <main
          style={{
            ...mainContentResponsiveStyle,
            width: isMobile ? "100%" : "auto",
            marginTop: isMobile ? 0 : undefined,
          }}
        >
          {filteredRecords.length === 0 ? (
            <p>条件に合う実践記録がありません。</p>
          ) : (
            filteredRecords.map((r) => {
              const plan = lessonPlans.find(
                (p) => p.id === r.lessonId && p.modelType === r.modelType
              );
              const isAuthor = !!(r.author && userId && r.author === userId);

              const g = pickGrade(r, plan);
              const ge = pickGenre(r, plan);
              const isNew = newIds.includes(r.lessonId);

              return (
                <article
                  key={r.lessonId}
                  style={{
                    ...cardStyle,
                    border: isNew ? "2px solid #ff7043" : "2px solid #ddd",
                    boxShadow: isNew ? "0 0 0 3px rgba(255,112,67,0.15)" : undefined,
                  }}
                >
                  <h2 style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{r.lessonTitle}</span>
                    <small style={{ fontSize: "0.85rem", color: "#888" }}>
                      [{r.modelType || "不明なモデル"}]
                    </small>
                    {isNew && <span style={newBadgeStyle}>NEW</span>}
                  </h2>

                  <p style={{ fontSize: "0.95rem", color: "#555", margin: "4px 0 8px" }}>
                    学年：{g || "－"}　ジャンル：{ge || "－"}
                  </p>

                  <p style={practiceDateStyle}>
                    実践開始日: {r.practiceDate ? r.practiceDate.substring(0, 10) : "－"}
                  </p>
                  <p style={authorNameStyle}>
                    作成者: {r.authorName?.trim() ? r.authorName : "匿名"}
                  </p>

                  {isAuthor && (
                    <button onClick={() => handleEdit(r.lessonId)} style={editBtnStyle} title="投稿者のみ編集できます">
                      編集
                    </button>
                  )}

                  <button
                    onClick={() => generatePdfFromRecord(r)}
                    style={{
                      ...actionBtnStyle,
                      backgroundColor: "#FF9800",
                      cursor: pdfGeneratingId === r.lessonId ? "not-allowed" : "pointer",
                      marginLeft: isAuthor ? 8 : 0,
                      opacity: pdfGeneratingId === r.lessonId ? 0.6 : 1,
                    }}
                    disabled={pdfGeneratingId === r.lessonId}
                  >
                    {pdfGeneratingId === r.lessonId ? "PDF生成中..." : "PDF保存"}
                  </button>

                  {/* 見やすさ補正ON/OFF */}
                  <button
                    onClick={() => setEnhanceBoards((v) => !v)}
                    style={{
                      ...actionBtnStyle,
                      backgroundColor: enhanceBoards ? "#4caf50" : "#9e9e9e",
                      marginLeft: 8,
                    }}
                    title="板書の表示に軽いコントラスト補正をかけます"
                  >
                    {enhanceBoards ? "見やすさ補正：ON" : "見やすさ補正：OFF"}
                  </button>

                  {plan && typeof plan.result === "object" && (
                    <section style={lessonPlanSectionStyle}>
                      <strong>授業案</strong>
                      <p>
                        <strong>教科書名：</strong> {plan.result["教科書名"] || "－"}
                      </p>
                      <p>
                        <strong>教材名：</strong>{" "}
                        {plan.result["教材名"] ?? plan.result["単元名"] ?? "－"}
                      </p>
                      <p>
                        <strong>授業時間数：</strong> {plan.result["授業時間数"] || "－"}時間
                      </p>
                      <p>
                        <strong>単元の目標：</strong> {plan.result["単元の目標"] || "－"}
                      </p>

                      {plan.result["評価の観点"] && (
                        <div style={{ marginTop: 8 }}>
                          <strong>評価の観点：</strong>

                          <strong>知識・技能</strong>
                          <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                            {asArray(plan.result["評価の観点"]?.["知識・技能"]).map((v, i) => (
                              <li key={`知識技能-${i}`}>{v}</li>
                            ))}
                          </ul>

                          <strong>思考・判断・表現</strong>
                          <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                            {asArray(plan.result["評価の観点"]?.["思考・判断・表現"]).map(
                              (v, i) => (
                                <li key={`思考判断-${i}`}>{v}</li>
                              )
                            )}
                          </ul>

                          <strong>主体的に学習に取り組む態度</strong>
                          <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                            {asArray(
                              plan.result["評価の観点"]?.["主体的に学習に取り組む態度"] ??
                                plan.result["評価の観点"]?.["態度"]
                            ).map((v, i) => (
                              <li key={`主体的-${i}`}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p>
                        <strong>育てたい子どもの姿：</strong>{" "}
                        {plan.result["育てたい子どもの姿"] || "－"}
                      </p>
                      <p>
                        <strong>言語活動の工夫：</strong>{" "}
                        {plan.result["言語活動の工夫"] || "－"}
                      </p>

                      {plan.result["授業の流れ"] && (
                        <div>
                          <strong>授業の流れ：</strong>
                          {typeof plan.result["授業の流れ"] === "string" && (
                            <p style={{ whiteSpace: "pre-wrap" }}>
                              {plan.result["授業の流れ"]}
                            </p>
                          )}

                          {Array.isArray(plan.result["授業の流れ"]) && (
                            <ul>
                              {plan.result["授業の流れ"].map((item: any, i: number) => (
                                <li key={`flow-${r.lessonId}-${i}`}>
                                  {typeof item === "string" ? item : JSON.stringify(item)}
                                </li>
                              ))}
                            </ul>
                          )}

                          {typeof plan.result["授業の流れ"] === "object" &&
                            !Array.isArray(plan.result["授業の流れ"]) && (
                              <ul>
                                {Object.entries(plan.result["授業の流れ"])
                                  .sort((a, b) => {
                                    const numA = parseInt(a[0].match(/\d+/)?.[0] ?? "0", 10);
                                    const numB = parseInt(b[0].match(/\d+/)?.[0] ?? "0", 10);
                                    return numA - numB;
                                  })
                                  .map(([key, val]) => {
                                    const content =
                                      typeof val === "string" ? val : JSON.stringify(val);
                                    return (
                                      <li key={key}>
                                        <strong>{key}:</strong> {content}
                                      </li>
                                    );
                                  })}
                              </ul>
                            )}
                        </div>
                      )}
                    </section>
                  )}

                  <p>
                    <strong>振り返り：</strong>
                    <br />
                    {r.reflection || "－"}
                  </p>

                  {r.boardImages.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        marginTop: 12,
                      }}
                    >
                      {r.boardImages.map((img, i) => (
                        <div key={`${img.name || "img"}-${i}`} style={boardImageContainerStyle}>
                          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                            板書（写真）{i + 1}
                          </div>
                          <img
                            src={img.src}
                            alt={img.name}
                            style={{
                              width: "100%",
                              height: "auto",
                              maxWidth: 900,
                              borderRadius: 8,
                              border: "1px solid #ccc",
                              objectFit: "contain",
                              imageRendering: "auto",
                              display: "block",
                              filter: enhanceBoards
                                ? "contrast(1.12) brightness(1.03) saturate(1.05)"
                                : "none",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PDF リスト & アップロード/削除 */}
                  <div style={{ marginTop: 12 }}>
                    {(r.pdfFiles || []).map((pdf, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1976d2", textDecoration: "underline" }}
                        >
                          📄 {pdf.name}
                        </a>
                        {isAuthor && (
                          <button
                            onClick={() => handleDeletePdf(r.lessonId, pdf.name)}
                            style={{
                              ...commentBtnStyle,
                              backgroundColor: "#e53935",
                              padding: "6px 10px",
                              fontSize: 13,
                            }}
                            disabled={uploadingPdfIds.includes(r.lessonId)}
                            title="このPDFを削除します"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    ))}

                    {isAuthor && (
                      <PdfFileInput
                        lessonId={r.lessonId}
                        uploading={uploadingPdfIds.includes(r.lessonId)}
                        onUpload={handlePdfUpload}
                      />
                    )}
                  </div>

                  {/* 共有から外す */}
                  {isAuthor && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => {
                          if (!session) return alert("ログインしてください");
                          const record = records.find((x) => x.lessonId === r.lessonId);
                          if (!record || !record.modelType)
                            return alert("対象の実践案が見つかりません");
                          if (record.author !== userId)
                            return alert("共有解除は投稿者のみ可能です");
                          if (
                            !confirm(
                              "この実践記録を共有版から外します（個人の実践記録は残ります）。よろしいですか？"
                            )
                          )
                            return;

                          const collectionName = `practiceRecords_${record.modelType}`;
                          const docRef = doc(db, collectionName, r.lessonId);
                          updateDoc(docRef, { isShared: false })
                            .then(() =>
                              alert("共有を解除しました（個人の実践記録は残っています）")
                            )
                            .catch((e) => {
                              console.error("共有解除失敗", e);
                              alert("共有解除に失敗しました");
                            });
                        }}
                        style={{ ...commentBtnStyle, backgroundColor: "#888" }}
                        disabled={uploadingPdfIds.includes(r.lessonId)}
                        title="共有ページからだけ非表示にします（個人の実践記録は残ります）"
                      >
                        共有から外す
                      </button>
                    </div>
                  )}

                  {/* いいね */}
                  <div style={{ marginTop: 12 }}>
                    <button
                      style={isLikedByUser(r) ? likeBtnDisabledStyle : likeBtnStyle}
                      onClick={() => handleLike(r.lessonId)}
                      title={!session ? "ログインしてください" : undefined}
                    >
                      👍 いいね {r.likes || 0}
                    </button>
                  </div>

                  {/* コメント（フォームで必須検証を有効化） */}
                  <div style={{ marginTop: 12 }}>
                    <strong>コメント</strong>
                    <div style={commentListStyle}>
                      {(r.comments || []).map((c, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <b>{c.displayName}</b>{" "}
                          <small>
                            {c.createdAt
                              ? `(${new Date(c.createdAt).toLocaleDateString()})`
                              : ""}
                          </small>
                          <br />
                          {editingCommentId &&
                          editingCommentId.recordId === r.lessonId &&
                          editingCommentId.index === i ? (
                            <>
                              <textarea
                                rows={3}
                                value={editingCommentText}
                                onChange={onEditCommentTextChange}
                                style={commentInputStyle}
                              />
                              <button
                                style={{ ...commentBtnStyle, marginRight: 8 }}
                                onClick={handleUpdateComment}
                              >
                                更新
                              </button>
                              <button
                                style={{ ...commentBtnStyle, backgroundColor: "#e53935" }}
                                onClick={cancelEditComment}
                              >
                                キャンセル
                              </button>
                            </>
                          ) : (
                            <>
                              <p style={{ whiteSpace: "pre-wrap" }}>{c.comment}</p>
                              {session && c.userId === userId && (
                                <>
                                  <button
                                    style={{
                                      ...commentBtnStyle,
                                      marginRight: 8,
                                      padding: "8px 12px",
                                      fontSize: 14,
                                    }}
                                    onClick={() => startEditComment(r.lessonId, i, c.comment)}
                                  >
                                    編集
                                  </button>
                                  <button
                                    style={{
                                      ...commentBtnStyle,
                                      backgroundColor: "#e53935",
                                      padding: "8px 12px",
                                      fontSize: 14,
                                    }}
                                    onClick={() => handleDeleteComment(r.lessonId, i)}
                                  >
                                    削除
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          <hr />
                        </div>
                      ))}
                    </div>

                    {/* ▼ フォームで囲んでブラウザの必須検証を利用 */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddComment(r.lessonId);
                      }}
                    >
                      <input
                        type="text"
                        placeholder="コメント者名（必須）"
                        value={newCommentAuthors[r.lessonId] || ""}
                        onChange={(e) => handleCommentAuthorChange(r.lessonId, e.target.value)}
                        style={commentAuthorInputStyle}
                        disabled={!session}
                        required
                        pattern="\S.+"
                        onInvalid={(e) => {
                          const el = e.currentTarget as HTMLInputElement;
                          const isOk = /\S.+/.test(el.value);
                          el.setCustomValidity(
                            isOk ? "" : "コメント者名は必須です（空白のみは不可）"
                          );
                        }}
                        onInput={(e) => {
                          (e.currentTarget as HTMLInputElement).setCustomValidity("");
                        }}
                        title={session ? undefined : "ログインしてください"}
                      />

                      <textarea
                        rows={3}
                        placeholder="コメントを入力（必須）"
                        value={newComments[r.lessonId] || ""}
                        onChange={(e) => handleCommentChange(r.lessonId, e.target.value)}
                        style={commentInputStyle}
                        disabled={!session}
                        required
                        onInvalid={(e) => {
                          const el = e.currentTarget as HTMLTextAreaElement;
                          const ok = el.value.trim().length > 0;
                          el.setCustomValidity(
                            ok ? "" : "コメントは必須です（空白のみは不可）"
                          );
                        }}
                        onInput={(e) => {
                          (e.currentTarget as HTMLTextAreaElement).setCustomValidity("");
                        }}
                        title={session ? undefined : "ログインしてください"}
                      />

                      <button
                        type="submit"
                        style={commentBtnStyle}
                        disabled={!session}
                        title={session ? undefined : "ログインしてください"}
                      >
                        コメント投稿
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>
    </>
  );
}

/* =========================
 * CSSスタイル群
 * ======================= */
const navBarStyle: CSSProperties = {
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
const hamburgerStyle: CSSProperties = {
  cursor: "pointer",
  width: 30,
  height: 22,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};
const barStyle: CSSProperties = {
  height: 4,
  backgroundColor: "white",
  borderRadius: 2,
};
const menuScrollStyle: CSSProperties = {
  padding: "1rem",
  paddingBottom: 80,
  overflowY: "auto",
  flexGrow: 1,
};
const logoutButtonStyle: CSSProperties = {
  padding: "0.75rem 1rem",
  backgroundColor: "#e53935",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
  margin: "1rem",
  position: "relative",
  zIndex: 1000,
};
const navLinkStyle: CSSProperties = {
  display: "block",
  padding: "0.5rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  textDecoration: "none",
  marginBottom: "0.5rem",
};
const wrapperResponsiveStyle: CSSProperties = {
  display: "flex",
  maxWidth: 1200,
  margin: "auto",
  paddingTop: 72,
  gap: 24,
  flexDirection: "row",
};
const sidebarResponsiveStyle: CSSProperties = {
  width: 280,
  maxWidth: "100%",
  padding: 12,
  backgroundColor: "#f9f9f9",
  borderRadius: 8,
  boxShadow: "0 0 6px rgba(0,0,0,0.1)",
  height: "calc(100vh - 72px)",
  overflowY: "auto",
  position: "sticky",
  top: 72,
  marginBottom: 0,
  boxSizing: "border-box",
};
const mainContentResponsiveStyle: CSSProperties = {
  flex: 1,
  fontFamily: "sans-serif",
  width: "auto",
  padding: "0",
  overflowWrap: "break-word",
  wordBreak: "break-word",
};
const cardStyle: CSSProperties = {
  border: "2px solid #ddd",
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  backgroundColor: "#fdfdfd",
  wordBreak: "break-word",
};
const boardImageContainerStyle: CSSProperties = {
  width: "100%",
  marginBottom: 12,
  pageBreakInside: "avoid",
};
const likeBtnStyle: CSSProperties = {
  marginRight: 12,
  cursor: "pointer",
  color: "#1976d2",
  fontSize: "1rem",
  opacity: 1,
};
const likeBtnDisabledStyle: CSSProperties = {
  ...likeBtnStyle,
  cursor: "pointer",
  opacity: 0.6,
};
const commentListStyle: CSSProperties = {
  marginTop: 8,
  border: "1px solid #ddd",
  padding: 8,
  borderRadius: 6,
  backgroundColor: "white",
};
const commentInputStyle: CSSProperties = {
  width: "100%",
  padding: 8,
  marginTop: 8,
  borderRadius: 4,
  border: "1px solid #ccc",
};
const commentBtnStyle: CSSProperties = {
  marginTop: 8,
  padding: "8px 12px",
  backgroundColor: "#4caf50",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
};
const commentAuthorInputStyle: CSSProperties = {
  width: "100%",
  padding: 6,
  marginTop: 8,
  borderRadius: 4,
  border: "1px solid #aaa",
};
const filterSectionTitleStyle: CSSProperties = {
  fontWeight: "bold",
  marginTop: 12,
  marginBottom: 8,
  fontSize: "1.1rem",
};
const lessonPlanSectionStyle: CSSProperties = {
  backgroundColor: "#fafafa",
  padding: 12,
  borderRadius: 6,
  marginBottom: 16,
  wordBreak: "break-word",
  fontSize: "1rem",
  lineHeight: 1.5,
};
const practiceDateStyle: CSSProperties = {
  fontSize: "0.9rem",
  color: "#666",
  fontStyle: "italic",
  marginTop: 4,
  marginBottom: 8,
};
const authorNameStyle: CSSProperties = {
  fontSize: "0.95rem",
  color: "#444",
  fontWeight: "bold",
  marginBottom: 12,
};
const editBtnStyle: CSSProperties = {
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "10px 14px",
  cursor: "pointer",
  marginBottom: 8,
  fontSize: "0.95rem",
};
const actionBtnStyle: CSSProperties = {
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "10px 14px",
  cursor: "pointer",
  marginBottom: 12,
  fontSize: "0.95rem",
};

/* サイドメニュー */
const getMenuWrapperStyle = (open: boolean): CSSProperties => ({
  position: "fixed",
  top: 56,
  left: 0,
  width: 250,
  height: "100vh",
  backgroundColor: "#f0f0f0",
  boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
  transform: open ? "translateX(0)" : "translateX(-100%)",
  transition: "transform 0.3s ease",
  zIndex: 999,
  display: "flex",
  flexDirection: "column",
});
const getOverlayStyle = (open: boolean): CSSProperties => ({
  position: "fixed",
  top: 56,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.3)",
  opacity: open ? 1 : 0,
  visibility: open ? "visible" : "hidden",
  transition: "opacity 0.3s ease",
  zIndex: 998,
});

/* 新着バッジ/バナー */
const newBadgeStyle: CSSProperties = {
  backgroundColor: "#ff7043",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.75rem",
  padding: "2px 8px",
  borderRadius: 999,
  lineHeight: 1.6,
};
const newBannerStyle: CSSProperties = {
  position: "sticky",
  top: 56,
  zIndex: 900,
  background: "#fff3e0",
  color: "#5d4037",
  border: "1px solid #ffcc80",
  borderLeft: "6px solid #ff7043",
  padding: "8px 12px",
  margin: "0 auto",
  maxWidth: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
const bannerBtnStyle: CSSProperties = {
  backgroundColor: "#ff7043",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 13,
};

/* 入力UI */
const selectInputStyle: CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid #ccc",
  marginBottom: 12,
  boxSizing: "border-box",
};
const textInputStyle: CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid #ccc",
  marginBottom: 12,
  boxSizing: "border-box",
};
const applyBtnStyle: CSSProperties = {
  marginTop: 12,
  width: "100%",
  padding: "8px 0",
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};
