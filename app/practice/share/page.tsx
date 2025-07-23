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
  deleteDoc,
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

type BoardImage = { name: string; src: string };
type Comment = {
  userId: string;
  displayName: string;
  comment: string;
  createdAt: string;
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
  unitName?: string;
  author?: string;
  authorName?: string;  // 追加
  pdfUrl?: string;
  pdfName?: string;
  createdAt?: string;
};
type LessonPlan = {
  id: string;
  result: any;
};

export default function PracticeSharePage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "";
  const router = useRouter();

  // フィルター入力状態
  const [inputGrade, setInputGrade] = useState<string>("");
  const [inputGenre, setInputGenre] = useState<string>("");
  const [inputUnitName, setInputUnitName] = useState<string>("");
  const [inputAuthor, setInputAuthor] = useState<string>("");

  // フィルター適用用
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [unitNameFilter, setUnitNameFilter] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);

  // 実践記録・授業案データ
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);

  // コメント入力管理（UI用）
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [newCommentAuthors, setNewCommentAuthors] = useState<Record<string, string>>({});

  // コメント編集管理
  const [editingCommentId, setEditingCommentId] = useState<{ recordId: string; index: number } | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>("");

  // PDFアップロード中の管理（lessonIdの配列）
  const [uploadingPdfIds, setUploadingPdfIds] = useState<string[]>([]);

  // メニュー表示と画面幅判定
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // PDF生成中フラグ（重複クリック防止用）
  const [pdfGeneratingId, setPdfGeneratingId] = useState<string | null>(null);

  // Firebase Storage
  const storage = getStorage();

  useEffect(() => {
    // 実践記録取得（Firestore）
    const q = query(collection(db, "practiceRecords"), orderBy("practiceDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: PracticeRecord[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as PracticeRecord),
        lessonId: doc.id,
        likedUsers: (doc.data() as any).likedUsers || [],
        author: (doc.data() as any).author || "",
        authorName: (doc.data() as any).authorName || "",
        pdfUrl: (doc.data() as any).pdfUrl || "",
        pdfName: (doc.data() as any).pdfName || "",
        createdAt: (doc.data() as any).createdAt || "",
      }));
      setRecords(recs);
    });

    // 授業案もFirestoreから取得
    const lessonPlansCollection = collection(db, "lesson_plans");
    const unsubscribePlans = onSnapshot(lessonPlansCollection, (snapshot) => {
      const plansData: LessonPlan[] = snapshot.docs.map(doc => ({
        id: doc.id,
        result: doc.data().result,
      }));
      setLessonPlans(plansData);
    });

    // 画面幅判定
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      unsubscribe();
      unsubscribePlans();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // フィルター検索ボタン押下時にフィルター反映
  const handleSearch = () => {
    setGradeFilter(inputGrade || null);
    setGenreFilter(inputGenre || null);
    setUnitNameFilter(inputUnitName.trim() || null);
    setAuthorFilter(inputAuthor.trim() || null);
  };

  // フィルター適用済みデータ
  const filteredRecords = records.filter((r) => {
    if (gradeFilter && r.grade !== gradeFilter) return false;
    if (genreFilter && r.genre !== genreFilter) return false;
    if (unitNameFilter && !r.unitName?.includes(unitNameFilter)) return false;
    if (authorFilter && !r.authorName?.includes(authorFilter)) return false;
    return true;
  });

  // メニュー開閉
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // いいね判定
  const isLikedByUser = (record: PracticeRecord) => {
    if (!userId) return false;
    return record.likedUsers?.includes(userId) ?? false;
  };

  // いいね処理
  const handleLike = async (lessonId: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    if (!userId) {
      alert("ユーザー情報が取得できません");
      return;
    }
    const docRef = doc(db, "practiceRecords", lessonId);
    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("該当データがありません");
        const data = docSnap.data();
        const likedUsers: string[] = data.likedUsers || [];
        if (likedUsers.includes(userId)) throw new Error("すでにいいね済みです");
        transaction.update(docRef, {
          likes: increment(1),
          likedUsers: arrayUnion(userId),
        });
      });
    } catch (error: any) {
      if (error.message === "すでにいいね済みです") {
        alert(error.message);
      } else {
        console.error("いいね処理中にエラー", error);
        alert("いいねに失敗しました");
      }
    }
  };

  // コメント入力変更
  const handleCommentChange = (lessonId: string, value: string) => {
    setNewComments((prev) => ({ ...prev, [lessonId]: value }));
  };
  const handleCommentAuthorChange = (lessonId: string, value: string) => {
    setNewCommentAuthors((prev) => ({ ...prev, [lessonId]: value }));
  };

  // コメント追加
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
      alert("コメント投稿者名を入力してください");
      return;
    }
    try {
      const docRef = doc(db, "practiceRecords", lessonId);
      await updateDoc(docRef, {
        comments: arrayUnion({
          userId: userId,
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

  // コメント編集開始
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

  // コメント編集保存
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
    if (!record || !record.comments || !record.comments[index]) {
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
    try {
      const docRef = doc(db, "practiceRecords", recordId);
      await updateDoc(docRef, { comments: updatedComments });
      cancelEditComment();
    } catch (e) {
      console.error("コメント更新失敗", e);
      alert("コメントの更新に失敗しました");
    }
  };

  // コメント削除
  const handleDeleteComment = async (recordId: string, index: number) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const record = records.find((r) => r.lessonId === recordId);
    if (!record || !record.comments || !record.comments[index]) {
      alert("対象のコメントが見つかりません");
      return;
    }
    if (record.comments[index].userId !== userId) {
      alert("自分のコメントのみ削除できます");
      return;
    }
    const updatedComments = [...record.comments];
    updatedComments.splice(index, 1);
    try {
      const docRef = doc(db, "practiceRecords", recordId);
      await updateDoc(docRef, { comments: updatedComments });
    } catch (e) {
      console.error("コメント削除失敗", e);
      alert("コメントの削除に失敗しました");
    }
  };

  // PDFアップロード処理（投稿者のみ許可）
  const handlePdfUpload = async (lessonId: string, file: File) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const record = records.find((r) => r.lessonId === lessonId);
    if (!record) {
      alert("対象の実践案が見つかりません");
      return;
    }
    if (record.author !== userId) {
      alert("PDFのアップロードは投稿者のみ可能です");
      return;
    }
    setUploadingPdfIds((prev) => [...prev, lessonId]);
    try {
      const pdfRef = storageRef(storage, `practiceRecords/${lessonId}/${file.name}`);
      await uploadBytes(pdfRef, file);
      const url = await getDownloadURL(pdfRef);

      const docRef = doc(db, "practiceRecords", lessonId);
      await updateDoc(docRef, {
        pdfUrl: url,
        pdfName: file.name,
      });

      alert("PDFをアップロードしました");
    } catch (error) {
      console.error("PDFアップロード失敗", error);
      alert("PDFアップロードに失敗しました");
    } finally {
      setUploadingPdfIds((prev) => prev.filter((id) => id !== lessonId));
    }
  };

  // PDF削除処理（投稿者のみ許可）
  const handleDeletePdf = async (lessonId: string, pdfName?: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const record = records.find((r) => r.lessonId === lessonId);
    if (!record) {
      alert("対象の実践案が見つかりません");
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

      const docRef = doc(db, "practiceRecords", lessonId);
      await updateDoc(docRef, {
        pdfUrl: "",
        pdfName: "",
      });

      alert("PDFを削除しました");
    } catch (error) {
      console.error("PDF削除失敗", error);
      alert("PDF削除に失敗しました");
    } finally {
      setUploadingPdfIds((prev) => prev.filter((id) => id !== lessonId));
    }
  };

  // 実践案削除時にPDFも削除（投稿者のみ許可）
  const handleDeleteRecord = async (lessonId: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const record = records.find((r) => r.lessonId === lessonId);
    if (!record) {
      alert("対象の実践案が見つかりません");
      return;
    }
    if (record.author !== userId) {
      alert("自分の実践案のみ削除できます");
      return;
    }
    if (!confirm("本当にこの実践案を削除しますか？")) return;

    setUploadingPdfIds((prev) => [...prev, lessonId]);
    try {
      if (record.pdfName) {
        const pdfRef = storageRef(storage, `practiceRecords/${lessonId}/${record.pdfName}`);
        await deleteObject(pdfRef);
      }
      const docRef = doc(db, "practiceRecords", lessonId);
      await deleteDoc(docRef);

      alert("実践案を削除しました");
    } catch (error) {
      console.error("実践案削除失敗", error);
      alert("実践案の削除に失敗しました");
    } finally {
      setUploadingPdfIds((prev) => prev.filter((id) => id !== lessonId));
    }
  };

  // 編集ページ遷移
  const handleEdit = (lessonId: string) => {
    router.push(`/practice/add/${lessonId}`);
  };

  // 画像URLをbase64に変換（タイムアウト付き）
  const toBase64ImageWithTimeout = (url: string, timeout = 5000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      let didTimeout = false;
      const timer = setTimeout(() => {
        didTimeout = true;
        img.src = "";
        reject(new Error("画像変換タイムアウト"));
      }, timeout);

      img.onload = () => {
        if (didTimeout) return;
        clearTimeout(timer);
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvasコンテキスト取得失敗");
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
        if (didTimeout) return;
        clearTimeout(timer);
        reject(new Error("画像読み込み失敗"));
      };

      img.src = url;
    });
  };

  // 画像を逐次base64変換する関数（非同期で分割処理）
  const convertImagesToBase64 = async (images: BoardImage[], maxCount = 5): Promise<string[]> => {
    const result: string[] = [];
    const limitedImages = images.slice(0, maxCount);

    for (let i = 0; i < limitedImages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));

      try {
        const base64 = await toBase64ImageWithTimeout(limitedImages[i].src, 5000);
        result.push(base64);
      } catch {
        result.push("");
      }
    }

    return result;
  };

  // PDF生成関数（ファイル名は単元名_実践記録_作成者名.pdf）
  const generatePdfFromRecord = async (record: PracticeRecord) => {
    if (!record) return;

    if (pdfGeneratingId) {
      alert("PDF生成処理が既に進行中です。しばらくお待ちください。");
      return;
    }

    try {
      setPdfGeneratingId(record.lessonId);

      const html2pdf = (await import("html2pdf.js")).default;
      const tempDiv = document.createElement("div");
      tempDiv.style.padding = "20px";
      tempDiv.style.fontFamily = "'Yu Gothic', 'YuGothic', 'Meiryo', 'sans-serif'";
      tempDiv.style.backgroundColor = "#fff";
      tempDiv.style.color = "#000";
      tempDiv.style.lineHeight = "1.6";

      // ファイル名用単元名・作成者名を安全化してファイル名生成
      const safeUnitName = record.unitName ? record.unitName.replace(/[\\\/:*?"<>|]/g, "_") : "無題単元";
      const safeAuthor = record.authorName ? record.authorName.replace(/[\\\/:*?"<>|]/g, "_") : "無名作成者";
      const filename = `${safeUnitName}_実践記録_${safeAuthor}.pdf`;

      // 該当授業案取得
      const plan = lessonPlans.find(p => p.id === record.lessonId);

      // 授業案HTML組み立て
      let lessonPlanHtml = "";
      if (plan && typeof plan.result === "object") {
        lessonPlanHtml += `<h2 style="color:#4CAF50; margin-top: 24px;">授業案</h2>`;
        lessonPlanHtml += `<p><strong>教科書名：</strong> ${plan.result["教科書名"] || "－"}</p>`;
        lessonPlanHtml += `<p><strong>単元名：</strong> ${plan.result["単元名"] || "－"}</p>`;
        lessonPlanHtml += `<p><strong>授業時間数：</strong> ${plan.result["授業時間数"] || "－"}時間</p>`;
        lessonPlanHtml += `<p><strong>単元の目標：</strong> ${plan.result["単元の目標"] || "－"}</p>`;

        if (plan.result["評価の観点"]) {
          lessonPlanHtml += `<strong>評価の観点：</strong>`;

          // 知識・技能
          const knowledge = Array.isArray(plan.result["評価の観点"]?.["知識・技能"])
            ? plan.result["評価の観点"]["知識・技能"]
            : plan.result["評価の観点"]?.["知識・技能"]
            ? [plan.result["評価の観点"]["知識・技能"]]
            : [];
          lessonPlanHtml += `<p><strong>知識・技能</strong></p><ul>`;
          knowledge.forEach((v: string) => {
            lessonPlanHtml += `<li>${v}</li>`;
          });
          lessonPlanHtml += `</ul>`;

          // 思考・判断・表現
          const thinking = Array.isArray(plan.result["評価の観点"]?.["思考・判断・表現"])
            ? plan.result["評価の観点"]["思考・判断・表現"]
            : plan.result["評価の観点"]?.["思考・判断・表現"]
            ? [plan.result["評価の観点"]["思考・判断・表現"]]
            : [];
          lessonPlanHtml += `<p><strong>思考・判断・表現</strong></p><ul>`;
          thinking.forEach((v: string) => {
            lessonPlanHtml += `<li>${v}</li>`;
          });
          lessonPlanHtml += `</ul>`;

          // 主体的に学習に取り組む態度
          const attitude = Array.isArray(plan.result["評価の観点"]?.["主体的に学習に取り組む態度"])
            ? plan.result["評価の観点"]["主体的に学習に取り組む態度"]
            : plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
            ? [plan.result["評価の観点"]["主体的に学習に取り組む態度"]]
            : plan.result["評価の観点"]?.["態度"]
            ? [plan.result["評価の観点"]["態度"]]
            : [];
          lessonPlanHtml += `<p><strong>主体的に学習に取り組む態度</strong></p><ul>`;
          attitude.forEach((v: string) => {
            lessonPlanHtml += `<li>${v}</li>`;
          });
          lessonPlanHtml += `</ul>`;
        }

        lessonPlanHtml += `<p><strong>育てたい子どもの姿：</strong> ${plan.result["育てたい子どもの姿"] || "－"}</p>`;
        lessonPlanHtml += `<p><strong>言語活動の工夫：</strong> ${plan.result["言語活動の工夫"] || "－"}</p>`;

        if (plan.result["授業の流れ"]) {
          lessonPlanHtml += `<p><strong>授業の流れ：</strong></p><ul>`;
          Object.entries(plan.result["授業の流れ"])
            .sort((a, b) => {
              const numA = parseInt(a[0].match(/\d+/)?.[0] ?? "0", 10);
              const numB = parseInt(b[0].match(/\d+/)?.[0] ?? "0", 10);
              return numA - numB;
            })
            .forEach(([key, val]) => {
              const content = typeof val === "string" ? val : JSON.stringify(val);
              lessonPlanHtml += `<li><strong>${key}:</strong> ${content}</li>`;
            });
          lessonPlanHtml += `</ul>`;
        }
      }

      // 板書画像はbase64変換し取得
      let boardImagesHtml = "";
      if (record.boardImages.length > 0) {
        boardImagesHtml += `<h2 style="color:#4CAF50; margin-top: 24px;">板書画像</h2>`;

        // 画像をbase64に変換（最大5枚まで）
        const base64Images = await convertImagesToBase64(record.boardImages, 5);

        base64Images.forEach((base64, idx) => {
          if (base64) {
            boardImagesHtml += `
              <div style="page-break-inside: avoid; margin-bottom: 16px;">
                <p><strong>板書${idx + 1}</strong></p>
                <img src="${base64}" style="width: 100%; max-width: 600px; height: auto; border: 1px solid #ccc; border-radius: 8px;" />
              </div>
            `;
          }
        });
      }

      tempDiv.innerHTML = `
        <h1 style="border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">${record.lessonTitle || safeUnitName}</h1>
        <p><strong>実施日：</strong> ${record.practiceDate || "－"}</p>
        <p><strong>作成者：</strong> ${record.authorName || "－"}</p>

        ${lessonPlanHtml}

        <h2 style="color:#4CAF50; margin-top: 24px;">振り返り</h2>
        <p style="white-space: pre-wrap;">${record.reflection || "－"}</p>

        ${boardImagesHtml}
      `;

      document.body.appendChild(tempDiv);

      await html2pdf()
        .from(tempDiv)
        .set({
          margin: 10,
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          html2canvas: { scale: 1 },
          pagebreak: { mode: ["avoid-all"] },
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

  // --- Styles ---
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
  const menuWrapperStyle: CSSProperties = {
    position: "fixed",
    top: 56,
    left: 0,
    width: 250,
    height: "100vh",
    backgroundColor: "#f0f0f0",
    boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
    transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.3s ease",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
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
  const overlayStyle: CSSProperties = {
    position: "fixed",
    top: 56,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.3)",
    opacity: menuOpen ? 1 : 0,
    visibility: menuOpen ? "visible" : "hidden",
    transition: "opacity 0.3s ease",
    zIndex: 998,
  };
  const wrapperResponsiveStyle: CSSProperties = {
    display: "flex",
    maxWidth: 1200,
    margin: "auto",
    paddingTop: isMobile ? 16 : 72,
    gap: isMobile ? 8 : 24,
    flexDirection: isMobile ? "column" : "row",
  };
  const sidebarResponsiveStyle: CSSProperties = {
    width: isMobile ? "100%" : 280,
    maxWidth: "100%",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    boxShadow: "0 0 6px rgba(0,0,0,0.1)",
    height: isMobile ? "auto" : "calc(100vh - 72px)",
    overflowY: "auto",
    position: isMobile ? "relative" : "sticky",
    top: isMobile ? "auto" : 72,
    marginBottom: isMobile ? 12 : 0,
    boxSizing: "border-box",
  };
  const mainContentResponsiveStyle: CSSProperties = {
    flex: 1,
    fontFamily: "sans-serif",
    width: isMobile ? "100%" : "auto",
    padding: isMobile ? "8px 12px" : "0",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    maxWidth: isMobile ? "100%" : undefined,
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
    cursor: "default",
    opacity: 0.6,
  };
  const commentListStyle: CSSProperties = {
    maxHeight: 150,
    overflowY: "auto",
    marginTop: 8,
    border: "1px solid #ddd",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fff",
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
    padding: "6px 12px",
    backgroundColor: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  };
  const commentAuthorInputStyle: CSSProperties = {
    width: "100%",
    padding: 6,
    marginTop: 8,
    borderRadius: 4,
    border: "1px solid #aaa",
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
  const filterSectionTitleStyle: CSSProperties = {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    fontSize: "1.1rem",
  };
  const lessonPlanSectionStyle: CSSProperties = {
    backgroundColor: "#fafafa",
    padding: isMobile ? 8 : 12,
    borderRadius: 6,
    marginBottom: isMobile ? 12 : 16,
    wordBreak: "break-word",
    fontSize: isMobile ? "0.85rem" : "1rem",
    lineHeight: isMobile ? 1.2 : 1.5,
  };
  const practiceDateStyle: CSSProperties = {
    fontSize: isMobile ? "0.8rem" : "0.9rem",
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 8,
  };
  const authorNameStyle: CSSProperties = {
    fontSize: isMobile ? "0.85rem" : "0.95rem",
    color: "#444",
    fontWeight: "bold",
    marginBottom: 12,
  };

  // PDFファイル選択UI
  const PdfFileInput = ({
    lessonId,
    uploading,
    onUpload,
  }: {
    lessonId: string;
    uploading: boolean;
    onUpload: (lessonId: string, file: File) => void;
  }) => {
    return (
      <label
        htmlFor={`pdf-upload-${lessonId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: uploading ? "not-allowed" : "pointer",
          color: "#1976d2",
          fontWeight: "bold",
          border: "1px solid #1976d2",
          padding: "6px 12px",
          borderRadius: 6,
          userSelect: "none",
        }}
      >
        📄 PDFファイル（指導案などを追加）を選択
        <input
          id={`pdf-upload-${lessonId}`}
          type="file"
          accept="application/pdf"
          disabled={uploading}
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUpload(lessonId, e.target.files[0]);
              e.target.value = "";
            }
          }}
        />
      </label>
    );
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

      {/* レスポンシブ横並び */}
      <div style={wrapperResponsiveStyle}>
        {/* サイドバー */}
        <aside style={sidebarResponsiveStyle}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 16 }}>絞り込み</h2>

          {/* 学年 */}
          <div>
            <div style={filterSectionTitleStyle}>学年</div>
            <select
              value={inputGrade}
              onChange={(e) => setInputGrade(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
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

          {/* ジャンル */}
          <div>
            <div style={filterSectionTitleStyle}>ジャンル</div>
            <select
              value={inputGenre}
              onChange={(e) => setInputGenre(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            >
              <option value="">すべて</option>
              <option value="物語文">物語文</option>
              <option value="説明文">説明文</option>
              <option value="詩">詩</option>
            </select>
          </div>

          {/* 単元名 */}
          <div>
            <div style={filterSectionTitleStyle}>単元名</div>
            <input
              type="text"
              placeholder="単元名を入力"
              value={inputUnitName}
              onChange={(e) => setInputUnitName(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* 作成者名 */}
          <div>
            <div style={filterSectionTitleStyle}>作成者名</div>
            <input
              type="text"
              placeholder="作成者名で検索"
              value={inputAuthor}
              onChange={(e) => setInputAuthor(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={handleSearch}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "8px 0",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            表示
          </button>
        </aside>

        {/* メインコンテンツ */}
        <main style={mainContentResponsiveStyle}>
          {filteredRecords.length === 0 ? (
            <p>条件に合う実践記録がありません。</p>
          ) : (
            filteredRecords.map((r) => {
              const plan = lessonPlans.find((p) => p.id === r.lessonId);
              const isAuthor = r.author === userId;

              return (
                <article key={r.lessonId} style={cardStyle}>
                  <h2 style={{ marginBottom: 8 }}>{r.lessonTitle}</h2>

                  {/* 実施日と作成者名 */}
                  <p style={practiceDateStyle}>
                    実施日: {r.practiceDate ? r.practiceDate.substring(0, 10) : "－"}
                  </p>
                  <p style={authorNameStyle}>
                    作成者: {r.authorName || "－"}
                  </p>

                  {/* 編集ボタン */}
                  <button
                    onClick={() => handleEdit(r.lessonId)}
                    style={{
                      backgroundColor: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    編集
                  </button>

                  {/* PDF化ボタン */}
                  <button
                    onClick={() => generatePdfFromRecord(r)}
                    style={{
                      backgroundColor: "#FF9800",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      cursor: pdfGeneratingId === r.lessonId ? "not-allowed" : "pointer",
                      marginBottom: 12,
                      marginLeft: 8,
                      opacity: pdfGeneratingId === r.lessonId ? 0.6 : 1,
                    }}
                    disabled={pdfGeneratingId === r.lessonId}
                  >
                    {pdfGeneratingId === r.lessonId ? "PDF生成中..." : "PDF化"}
                  </button>

                  {/* 授業案詳細 */}
                  {plan && typeof plan.result === "object" && (
                    <section style={lessonPlanSectionStyle}>
                      <strong>授業案</strong>
                      <p>
                        <strong>教科書名：</strong> {plan.result["教科書名"] || "－"}
                      </p>
                      <p>
                        <strong>単元名：</strong> {plan.result["単元名"] || "－"}
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
                            {(Array.isArray(plan.result["評価の観点"]?.["知識・技能"])
                              ? plan.result["評価の観点"]["知識・技能"]
                              : plan.result["評価の観点"]?.["知識・技能"]
                              ? [plan.result["評価の観点"]["知識・技能"]]
                              : []
                            ).map((v: string, i: number) => (
                              <li key={`知識技能-${i}`}>{v}</li>
                            ))}
                          </ul>

                          <strong>思考・判断・表現</strong>
                          <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                            {(Array.isArray(plan.result["評価の観点"]?.["思考・判断・表現"])
                              ? plan.result["評価の観点"]["思考・判断・表現"]
                              : plan.result["評価の観点"]?.["思考・判断・表現"]
                              ? [plan.result["評価の観点"]["思考・判断・表現"]]
                              : []
                            ).map((v: string, i: number) => (
                              <li key={`思考判断-${i}`}>{v}</li>
                            ))}
                          </ul>

                          <strong>主体的に学習に取り組む態度</strong>
                          <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                            {(Array.isArray(
                              plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
                            )
                              ? plan.result["評価の観点"]["主体的に学習に取り組む態度"]
                              : plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
                              ? [plan.result["評価の観点"]["主体的に学習に取り組む態度"]]
                              : plan.result["評価の観点"]?.["態度"]
                              ? [plan.result["評価の観点"]["態度"]]
                              : []
                            ).map((v: string, i: number) => (
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
                        </div>
                      )}
                    </section>
                  )}

                  {/* 振り返り */}
                  <p>
                    <strong>振り返り：</strong>
                    <br />
                    {r.reflection || "－"}
                  </p>

                  {/* 板書画像 */}
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
                        <div key={i} style={boardImageContainerStyle}>
                          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
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
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PDFアップロード・表示・削除（投稿者のみ許可） */}
                  <div style={{ marginTop: 12 }}>
                    {r.pdfUrl ? (
                      <>
                        <a
                          href={r.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1976d2", textDecoration: "underline" }}
                        >
                          📄 {r.pdfName || "PDFを見る"}
                        </a>
                        {isAuthor && (
                          <button
                            onClick={() => handleDeletePdf(r.lessonId, r.pdfName)}
                            disabled={uploadingPdfIds.includes(r.lessonId)}
                            style={{
                              marginLeft: 8,
                              backgroundColor: "#e53935",
                              color: "white",
                              borderRadius: 4,
                              cursor: "pointer",
                              border: "none",
                              padding: "4px 8px",
                            }}
                          >
                            PDF削除
                          </button>
                        )}
                      </>
                    ) : (
                      isAuthor && (
                        <PdfFileInput
                          lessonId={r.lessonId}
                          uploading={uploadingPdfIds.includes(r.lessonId)}
                          onUpload={handlePdfUpload}
                        />
                      )
                    )}
                  </div>

                  {/* 実践案削除ボタン（投稿者のみ表示） */}
                  {isAuthor && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => handleDeleteRecord(r.lessonId)}
                        style={{ ...commentBtnStyle, backgroundColor: "#e53935" }}
                        disabled={uploadingPdfIds.includes(r.lessonId)}
                      >
                        実践案削除
                      </button>
                    </div>
                  )}

                  {/* いいねボタン */}
                  <div style={{ marginTop: 12 }}>
                    <button
                      style={isLikedByUser(r) ? likeBtnDisabledStyle : likeBtnStyle}
                      onClick={() => !isLikedByUser(r) && handleLike(r.lessonId)}
                      disabled={!session || isLikedByUser(r)}
                      title={
                        !session
                          ? "ログインしてください"
                          : isLikedByUser(r)
                          ? "すでにいいね済みです"
                          : undefined
                      }
                    >
                      👍 いいね {r.likes || 0}
                    </button>
                  </div>

                  {/* コメントセクション */}
                  <div style={{ marginTop: 12 }}>
                    <strong>コメント</strong>
                    <div style={commentListStyle}>
                      {(r.comments || []).map((c, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <b>{c.displayName}</b>{" "}
                          <small>{c.createdAt ? `(${new Date(c.createdAt).toLocaleDateString()})` : ""}</small>
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
                                      padding: "4px 8px",
                                      fontSize: 12,
                                    }}
                                    onClick={() => startEditComment(r.lessonId, i, c.comment)}
                                  >
                                    編集
                                  </button>
                                  <button
                                    style={{
                                      ...commentBtnStyle,
                                      backgroundColor: "#e53935",
                                      padding: "4px 8px",
                                      fontSize: 12,
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

                    {/* コメント者名入力欄 */}
                    <input
                      type="text"
                      placeholder="コメント者名（必須）"
                      value={newCommentAuthors[r.lessonId] || ""}
                      onChange={(e) => handleCommentAuthorChange(r.lessonId, e.target.value)}
                      style={commentAuthorInputStyle}
                      disabled={!session}
                      title={session ? undefined : "ログインしてください"}
                    />

                    {/* コメント入力欄 */}
                    <textarea
                      rows={3}
                      placeholder="コメントを入力"
                      value={newComments[r.lessonId] || ""}
                      onChange={(e) => handleCommentChange(r.lessonId, e.target.value)}
                      style={commentInputStyle}
                      disabled={!session}
                      title={session ? undefined : "ログインしてください"}
                    />
                    <button
                      style={commentBtnStyle}
                      onClick={() => handleAddComment(r.lessonId)}
                      disabled={!session}
                      title={session ? undefined : "ログインしてください"}
                    >
                      コメント投稿
                    </button>
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
