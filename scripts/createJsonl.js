import fs from "fs";
import path from "path";
import admin from "firebase-admin";

// サービスアカウントJSONのパスを指定（プロジェクトルート直下推奨）
const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");

// Firebase Admin SDK初期化
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createJsonl() {
  const collections = [
    { label: "読解", name: "lesson_plans_reading" },
    { label: "話し合い", name: "lesson_plans_discussion" },
    { label: "作文", name: "lesson_plans_writing" },
    { label: "言語活動", name: "lesson_plans_language_activity" },
  ];

  const lines = [];

  for (const col of collections) {
    const snapshot = await db.collection(col.name).get();

    snapshot.forEach((doc) => {
      const data = doc.data();

      // systemメッセージ（固定案内）
      const systemMessage = {
        role: "system",
        content: "あなたは小学校の国語の授業プランナーです。以下の情報に基づき授業案を作成してください。",
      };

      // userメッセージ（単元情報まとめ）
      const userMessageContent = [
        `モデル:${col.label}`,
        `単元名:${data.unit || ""}`,
        `単元の目標:${data.unitGoal || ""}`,
        `学年:${data.grade || ""}`,
        `ジャンル:${data.genre || ""}`,
        `授業時間数:${data.hours || ""}`,
        `育てたい子どもの姿:${data.childVision || ""}`,
        `言語活動の工夫:${data.languageActivities || ""}`,
        "評価の観点:",
        `・知識・技能: ${Array.isArray(data.evaluationPoints?.knowledge) ? data.evaluationPoints.knowledge.join("、") : ""}`,
        `・思考・判断・表現: ${Array.isArray(data.evaluationPoints?.thinking) ? data.evaluationPoints.thinking.join("、") : ""}`,
        `・主体的に学習に取り組む態度: ${Array.isArray(data.evaluationPoints?.attitude) ? data.evaluationPoints.attitude.join("、") : ""}`,
        "---",
        "この情報をもとに、授業案を作成してください。",
      ].join("\n");

      const userMessage = {
        role: "user",
        content: userMessageContent,
      };

      // assistantメッセージ（授業案の流れ）
      let completionContent = "";
      if (data.result && data.result["授業の流れ"]) {
        const flowKeys = Object.keys(data.result["授業の流れ"]).sort((a, b) => parseInt(a) - parseInt(b));
        flowKeys.forEach((key) => {
          completionContent += `${key}時間目: ${data.result["授業の流れ"][key]}\n`;
        });
      } else if (Array.isArray(data.lessonPlanList)) {
        data.lessonPlanList.forEach((step, idx) => {
          completionContent += `${idx + 1}時間目: ${step}\n`;
        });
      }

      const assistantMessage = {
        role: "assistant",
        content: completionContent.trim(),
      };

      // messages配列としてまとめてJSONLの1行にする
      lines.push(JSON.stringify({
        messages: [systemMessage, userMessage, assistantMessage]
      }));
    });
  }

  const outPath = path.resolve(process.cwd(), "fine_tuning_data.jsonl");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`ファインチューニング用JSONLファイルを作成しました: ${outPath}`);
}

createJsonl().catch(console.error);
