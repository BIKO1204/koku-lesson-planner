"use client";

import { useState, useEffect, CSSProperties } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSession } from "next-auth/react";

type BoardImage = { name: string; src: string };
type PracticeRecord = {
  lessonId: string;
  lessonTitle: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  likes: number;
  comments: { userId: string; comment: string; createdAt: string }[];
};

export default function PracticeSharePage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "guest";

  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [newComments, setNewComments] = useState<Record<string, string>>({}); // それぞれの記録ごとのコメント入力欄用

  useEffect(() => {
    const q = query(collection(db, "practiceRecords"), orderBy("practiceDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: PracticeRecord[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as PracticeRecord),
        lessonId: doc.id,
      }));
      setRecords(recs);
    });
    return () => unsubscribe();
  }, []);

  // いいね押下
  const handleLike = async (lessonId: string) => {
    if (!userId) return alert("ログインしてください");
    try {
      const docRef = doc(db, "practiceRecords", lessonId);
      await updateDoc(docRef, { likes: increment(1) });
    } catch (e) {
      console.error("いいね失敗", e);
      alert("いいねに失敗しました");
    }
  };

  // コメント投稿
  const handleAddComment = async (lessonId: string) => {
    if (!userId) return alert("ログインしてください");
    const comment = newComments[lessonId]?.trim();
    if (!comment) return alert("コメントを入力してください");
    try {
      const docRef = doc(db, "practiceRecords", lessonId);
      await updateDoc(docRef, {
        comments: arrayUnion({
          userId,
          comment,
          createdAt: new Date().toISOString(),
        }),
      });
      setNewComments((prev) => ({ ...prev, [lessonId]: "" }));
    } catch (e) {
      console.error("コメント追加失敗", e);
      alert("コメントの投稿に失敗しました");
    }
  };

  // コメント入力変更
  const handleCommentChange = (lessonId: string, value: string) => {
    setNewComments((prev) => ({ ...prev, [lessonId]: value }));
  };

  // スタイル（簡易）
  const containerStyle: CSSProperties = { maxWidth: 800, margin: "auto", padding: 24, fontFamily: "sans-serif" };
  const cardStyle: CSSProperties = { border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 24, backgroundColor: "#fafafa" };
  const imgStyle: CSSProperties = { maxWidth: "100%", height: "auto", borderRadius: 6, marginTop: 8 };
  const likeBtnStyle: CSSProperties = { marginRight: 12, cursor: "pointer", color: "#1976d2" };
  const commentListStyle: CSSProperties = { maxHeight: 150, overflowY: "auto", marginTop: 8, border: "1px solid #ddd", padding: 8, borderRadius: 6, backgroundColor: "#fff" };
  const commentInputStyle: CSSProperties = { width: "100%", padding: 8, marginTop: 8, borderRadius: 4, border: "1px solid #ccc" };
  const commentBtnStyle: CSSProperties = { marginTop: 8, padding: "6px 12px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: 4, cursor: "pointer" };

  return (
    <main style={containerStyle}>
      <h1>実践記録 共有ページ</h1>
      {records.length === 0 && <p>まだ実践記録がありません。</p>}
      {records.map((r) => (
        <article key={r.lessonId} style={cardStyle}>
          <h2>{r.lessonTitle}</h2>
          <p><strong>実施日:</strong> {r.practiceDate}</p>
          <p>{r.reflection}</p>
          {r.boardImages.map((img, i) => (
            <img key={i} src={img.src} alt={`板書写真${i + 1}`} style={imgStyle} />
          ))}

          <div style={{ marginTop: 12 }}>
            <button style={likeBtnStyle} onClick={() => handleLike(r.lessonId)}>👍 いいね {r.likes || 0}</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>コメント</strong>
            <div style={commentListStyle}>
              {(r.comments || []).map((c, i) => (
                <div key={i}>
                  <b>{c.userId}</b> <small>({new Date(c.createdAt).toLocaleString()})</small><br />
                  {c.comment}
                  <hr />
                </div>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="コメントを入力"
              value={newComments[r.lessonId] || ""}
              onChange={(e) => handleCommentChange(r.lessonId, e.target.value)}
              style={commentInputStyle}
            />
            <button style={commentBtnStyle} onClick={() => handleAddComment(r.lessonId)}>コメント投稿</button>
          </div>
        </article>
      ))}
    </main>
  );
}
