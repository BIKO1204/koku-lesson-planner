"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PlanHistoryPage() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("lessonPlans");
    if (saved) {
      setPlans(JSON.parse(saved));
    }
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("この授業案を削除してもよいですか？")) return;
    const updated = plans.filter((p) => p.id !== id);
    localStorage.setItem("lessonPlans", JSON.stringify(updated));
    setPlans(updated);
  };

  return (
    <main style={{ padding: "1rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2>保存された授業案一覧</h2>
      {plans.length === 0 ? (
        <p>まだ授業案が保存されていません。</p>
      ) : (
        <ul>
          {plans.map((plan) => (
            <li key={plan.id} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <strong>{plan.unit}</strong>（{plan.grade}・{plan.genre}・{plan.subject}）<br />
              <span>使用スタイル：{plan.usedStyleName || "（なし）"}</span><br />
              <Link href={`/compare/${plan.unit}`} style={{ color: "blue" }}>🔍 この単元の授業案を比較する</Link><br />
              <button onClick={() => handleDelete(plan.id)} style={{ marginTop: "0.5rem", backgroundColor: "#f44336", color: "white", padding: "0.4rem 0.8rem", border: "none", borderRadius: "6px" }}>削除</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
