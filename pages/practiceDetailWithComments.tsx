"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";

export default function PracticeDetailWithComments() {
  // コメント状態管理
  const [comments, setComments] = useState<{ text: string; userId?: string }[]>([]);
  const [newComment, setNewComment] = useState("");

  // コメント取得（例：lessonIdは固定例）
  const lessonId = "exampleLessonId"; // 実際はpropsやURLから取得してください

  useEffect(() => {
    const commentsRef = collection(db, "practiceRecords", lessonId, "comments");
    const q = query(commentsRef, orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => doc.data() as { text: string; userId?: string }));
    });
    return () => unsubscribe();
  }, [lessonId]);

  // コメント投稿関数
  const postComment = async () => {
    if (!newComment.trim()) return;
    try {
      const commentsRef = collection(db, "practiceRecords", lessonId, "comments");
      await addDoc(commentsRef, {
        text: newComment.trim(),
        createdAt: new Date(),
        userId: "currentUserId", // 実際はログインユーザーIDをセットしてください
      });
      setNewComment("");
    } catch (e) {
      alert("コメントの投稿に失敗しました。");
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 16 }}>
      <h1>実践案の詳細（コメント付き）</h1>

      {/* コメント一覧 */}
      <section style={{ marginTop: 24 }}>
        <h2>コメント一覧</h2>
        {comments.length === 0 ? (
          <p>まだコメントはありません。</p>
        ) : (
          comments.map((c, i) => (
            <p key={i} style={{ padding: "8px 0", borderBottom: "1px solid #ddd" }}>
              {c.text} {c.userId && <small>({c.userId})</small>}
            </p>
          ))
        )}
      </section>

      {/* コメント入力フォーム */}
      <section style={{ marginTop: 24 }}>
        <textarea
          rows={4}
          style={{ width: "100%", padding: 8, fontSize: 16 }}
          placeholder="コメントを入力してください"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          onClick={postComment}
          style={{
            marginTop: 8,
            padding: "8px 16px",
            fontSize: 16,
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          コメントを投稿
        </button>
      </section>
    </div>
  );
}
