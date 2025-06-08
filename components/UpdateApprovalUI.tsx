"use client";

import React, { useState } from "react";

type UpdateApprovalUIProps = {
  currentModel: {
    philosophy: string;
    evaluationFocus: string;
    languageFocus: string;
    childFocus: string;
  };
  onUpdate: (newVersion: any) => void;
  onCancel: () => void;
  fetchUpdateProposal: (feedbackText: string, currentModel: any) => Promise<any>;
};

export default function UpdateApprovalUI({
  currentModel,
  onUpdate,
  onCancel,
  fetchUpdateProposal,
}: UpdateApprovalUIProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<any | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await fetchUpdateProposal(feedbackText, currentModel);
      setProposal(result);
    } catch (e) {
      alert("AI解析に失敗しました。");
    }
    setLoading(false);
  };

  const handleApprove = () => {
    if (proposal) {
      onUpdate(proposal);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: 8, backgroundColor: "#f9f9f9" }}>
      <p>振り返り内容をAIで解析し、教育観モデルへの反映を承認しますか？</p>

      <textarea
        rows={4}
        placeholder="ここに振り返りやコメントを入力してください"
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem", fontSize: "1rem" }}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || feedbackText.trim() === ""}
        style={{ marginBottom: "1rem", padding: "0.5rem 1rem", cursor: loading ? "wait" : "pointer" }}
      >
        {loading ? "解析中…" : "AIで解析して更新案を作成"}
      </button>

      {proposal && (
        <div style={{ marginBottom: "1rem", backgroundColor: "#e3f2fd", padding: "1rem", borderRadius: 8 }}>
          <h4>AIによる更新案</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            教育観：{proposal.philosophy}
            <br />
            評価観点の重視：{proposal.evaluationFocus}
            <br />
            言語活動の重視：{proposal.languageFocus}
            <br />
            育てたい子どもの姿：{proposal.childFocus}
          </pre>
        </div>
      )}

      <div>
        <button
          onClick={handleApprove}
          disabled={!proposal}
          style={{ marginRight: "1rem", padding: "0.5rem 1rem", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: 6, cursor: proposal ? "pointer" : "not-allowed" }}
        >
          承認して更新
        </button>
        <button
          onClick={onCancel}
          style={{ padding: "0.5rem 1rem", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: 6 }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
