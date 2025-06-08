"use client";

import { useState } from "react";

export type SaveButtonsProps = {
  data: any;
  className?: string;
};

export default function SaveButtons({ data, className = "" }: SaveButtonsProps) {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saveLesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unknown error");
      alert(`✅ Firebase: ${json.firebasePath}\n✅ Drive: ${json.driveLink}`);
    } catch (err: any) {
      console.error(err);
      alert("❌ 保存に失敗しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className={`w-full px-4 py-2 rounded text-white disabled:opacity-50 ${className}`}
    >
      {loading ? "保存中…" : "Firebase＋Drive に保存"}
    </button>
  );
}
