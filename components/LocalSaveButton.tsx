"use client";

import { useState } from "react";

export type LocalSaveButtonProps = {
  data: any;
  className?: string;
};

export default function LocalSaveButton({ data, className = "" }: LocalSaveButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLocalSave = () => {
    setLoading(true);
    try {
      const existing = JSON.parse(localStorage.getItem("lessonPlans") || "[]");
      const entry = { timestamp: new Date().toISOString(), ...data };
      localStorage.setItem("lessonPlans", JSON.stringify([entry, ...existing]));
      alert("✅ ローカルに保存しました");
    } catch (e: any) {
      console.error(e);
      alert("❌ ローカル保存に失敗: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLocalSave}
      disabled={loading}
      className={`w-full px-4 py-2 rounded text-white disabled:opacity-50 bg-yellow-500 hover:bg-yellow-600 ${className}`}
    >
      {loading ? "保存中…" : "ローカルに保存"}
    </button>
  );
}
