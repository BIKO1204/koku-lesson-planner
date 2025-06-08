"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FirestoreSaveButtonProps = {
  data: any;
  className?: string;
};

export default function FirestoreSaveButton({ data, className = "" }: FirestoreSaveButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleFirestoreSave = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, "lesson_plans"), {
        ...data,
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
