"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ComparePage() {
  const params = useParams();
  // paramsがnullやunitが配列の可能性を考慮
  const unit = Array.isArray(params?.unit) ? params.unit[0] : params?.unit ?? "";

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!unit) return;
    const allPlans = JSON.parse(localStorage.getItem("lessonPlans") || "[]");
    const filtered = allPlans.filter((p: any) => p.unit === unit);
    setPlans(filtered);
  }, [unit]);

  return (
    <main style={{ padding: "2rem", maxWidth: "90vw", margin: "0 auto", fontFamily: "sans-serif" }}>
      <nav style={{ marginBottom: "2rem" }}>
        <Link href="/plan/history">← 授業履歴へ戻る</Link>
      </nav>

      <h2 style={{ fontSize: "1.6rem", marginBottom: "1.5rem" }}>「{unit}」のスタイル別比較</h2>

      {plans.length === 0 ? (
        <p>この単元に関する授業案が見つかりません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "1rem",
              backgroundColor: "#f9f9f9",
              boxShadow: "1px 1px 5px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                スタイル：{plan.usedStyleName || "（未設定）"}
              </h3>
              <p><strong>学年・ジャンル：</strong>{plan.grade}・{plan.genre}</p>
              <p><strong>授業時間：</strong>{plan.hours} 時間</p>

              <div style={{ marginTop: "1rem" }}>
                <p><strong>■ 授業の展開：</strong><br />
                  {plan.lessonPlanList?.length > 0
                    ? plan.lessonPlanList.map((text: string, i: number) => (
                        <div key={i}>・{i + 1}時間目：{text}</div>
                      ))
                    : "（未記入）"}
                </p>

                <p style={{ marginTop: "1rem" }}><strong>■ 言語活動の工夫：</strong><br />{plan.languageActivities || "（未記入）"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
