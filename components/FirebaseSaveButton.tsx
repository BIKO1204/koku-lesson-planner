"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSession } from "next-auth/react";  // 追加

export type FirestoreSaveButtonProps = {
  data: any;
  className?: string;
};

export default function FirestoreSaveButton({ data, className = "" }: FirestoreSaveButtonProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();  // 追加

  const handleFirestoreSave = async () => {
    if (!session?.user?.email) {
      alert("ログインしてください");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "lesson_plans"), {
        ...data,
        author: session.user.email,   // ← ここで投稿者のメールをセット！
        timestamp: new Date().toISOString(),
      });
      alert("✅ Firestore に保存しました");
    } catch (e: any) {
      console.error(e);
      alert("❌ Firestore 保存に失敗: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFirestoreSave}
      disabled={loading}
      className={`w-full px-4 py-2 rounded text-white disabled:opacity-50 bg-green-500 hover:bg-green-600 ${className}`}
    >
      {loading ? "保存中…" : "Firestore に保存"}
    </button>
  );
}
