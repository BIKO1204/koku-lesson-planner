import fs from "fs";
import path from "path";
import admin from "firebase-admin";

const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createIntegratedJsonl() {
  const planCollections = [
    { label: "読解", name: "lesson_plans_reading" },
    { label: "話し合い", name: "lesson_plans_discussion" },
    { label: "作文", name: "lesson_plans_writing" },
    { label: "言語活動", name: "lesson_plans_language_activity" },
  ];
  const practiceCollections = [
    { label: "読解", name: "practiceRecords_reading" },
    { label: "話し合い", name: "practiceRecords_discussion" },
    { label: "作文", name: "practiceRecords_writing" },
    { label: "言語活動", name: "practiceRecords_language_activity" },
  ];

  const lines = [];

  for (let i = 0; i < planCollections.length; i++) {
    const planCol = planCollections[i];
    const practiceCol = practiceCollections[i];

    // 授業案一覧取得
    const planSnapshot = await db.collection(planCol.name).get();
    // 実践案一覧取得
    const practiceSnapshot = await db.collection(practiceCol.name).get();

    // practiceMap：単元名で紐づけ（複数あったら最初の1件だけ取得）
    const practiceMap = new Map();
    practiceSnapshot.forEach((doc) => {
      const data = doc.data();
      const unitName = data.unitName || data.unit || "";
      if (unitName) {
        if (!practiceMap.has(unitName)) {
          practiceMap.set(unitName, data);
        }
      }
    });

    for (const doc of planSnapshot.docs) {
      const planData = doc.data();
      const unitName = planData.unit || "";
      const practiceData = practiceMap.get(unitName);

      // messages配列を作成
      const systemMessage = {
        role: "system",
        content: "あなたは小学校の国語の授業プランナーです。以下の情報に基づき授業案を作成してください。"
      };

      const userContentLines = [
        `モデル:${planCol.label}`,
        `単元名:${unitName}`,
        `単元の目標:${planData.unitGoal || ""}`,
        `学年:${planData.grade || ""}`,
        `ジャンル:${planData.genre || ""}`,
        `授業時間数:${planData.hours || ""}`,
        `育てたい子どもの姿:${planData.childVision || ""}`,
        `言語活動の工夫:${planData.languageActivities || ""}`,
        "評価の観点:",
        `・知識・技能: ${Array.isArray(planData.evaluationPoints?.knowledge) ? planData.evaluationPoints.knowledge.join("、") : ""}`,
        `・思考・判断・表現: ${Array.isArray(planData.evaluationPoints?.thinking) ? planData.evaluationPoints.thinking.join("、") : ""}`,
        `・主体的に学習に取り組む態度: ${Array.isArray(planData.evaluationPoints?.attitude) ? planData.evaluationPoints.attitude.join("、") : ""}`,
        "---",
        "この情報をもとに、授業案を作成してください。",
      ];
      const userMessage = {
        role: "user",
        content: userContentLines.join("\n")
      };

      // assistantメッセージ（completion部分）
      let assistantContent = "";

      if (planData.result && planData.result["授業の流れ"]) {
        const flowKeys = Object.keys(planData.result["授業の流れ"]).sort((a, b) => parseInt(a) - parseInt(b));
        flowKeys.forEach((key) => {
          assistantContent += `${key}時間目: ${planData.result["授業の流れ"][key]}\n`;
        });
      } else if (Array.isArray(planData.lessonPlanList)) {
        planData.lessonPlanList.forEach((step, idx) => {
          assistantContent += `${idx + 1}時間目: ${step}\n`;
        });
      }

      if (practiceData && practiceData.reflection && practiceData.reflection.trim() !== "") {
        assistantContent += `\n【実践記録の振り返り】\n${practiceData.reflection.trim()}\n`;
      }

      const assistantMessage = {
        role: "assistant",
        content: assistantContent.trim()
      };

      lines.push(JSON.stringify({ messages: [systemMessage, userMessage, assistantMessage] }));
    }
  }

  const outPath = path.resolve(process.cwd(), "integrated_fine_tuning_data.jsonl");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`統合ファインチューニング用JSONLファイルを作成しました: ${outPath}`);
}

createIntegratedJsonl().catch(console.error);
