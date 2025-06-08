"use client";

import { useState } from "react";

export type DriveSaveButtonProps = {
  unit: string;
  className?: string;
};

export default function DriveSaveButton({ unit, className = "" }: DriveSaveButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDriveSave = async () => {
    setLoading(true);
    try {
      const el = document.getElementById("result-content");
      if (!el) throw new Error("出力結果が見つかりません");

      // 動的インポート
      const { default: html2pdf } = await import("html2pdf.js");
      const pdfBlob = await html2pdf()
        .from(el)
        .set({
          margin:      10,
          filename:    `${unit}_授業案.pdf`,
          html2canvas: { scale: 2 },
          jsPDF:       { unit: "pt", format: "a4", orientation: "portrait" },
        })
        .outputPdf("blob");

      const formData = new FormData();
      formData.append("file", pdfBlob, `${unit}_授業案.pdf`);

      // PDF用エンドポイントへPOST
      const res = await fetch("/api/saveLessonPdf", {
        method: "POST",
        body:   formData,
      });
      if (!res.ok) throw new Error(await res.text());

      const { driveLink } = await res.json();
      alert(`✅ Drive に保存しました\n${driveLink}`);
    } catch (err: any) {
      console.error(err);
      alert("❌ Drive 保存に失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDriveSave}
      disabled={loading}
      className={`w-full px-4 py-2 rounded text-white disabled:opacity-50 bg-blue-500 hover:bg-blue-600 ${className}`}
    >
      {loading ? "保存中…" : "📤 Drive に保存"}
    </button>
  );
}
