import fs from "fs";
import path from "path";
import admin from "firebase-admin";

// サービスアカウントJSONのパス（プロジェクトルート直下に置くことを推奨）
const serviceAccountPath = path.resolve(process.cwd(), "serviceAccountKey.json");

// Firebase Admin SDK 初期化
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createPracticeJsonl() {
  // 四つのモデル（Firestoreコレクション名とラベル）
  const models = [
    { label: "読解モデル", collection: "practiceRecords_reading" },
    { label: "話し合いモデル", collection: "practiceRecords_discussion" },
    { label: "作文モデル", collection: "practiceRecords_writing" },
    { label: "言語活動モデル", collection: "practiceRecords_language_activity" },
  ];

  const lines = [];

  for (const model of models) {
    const snapshot = await db.collection(model.collection).get();

    snapshot.forEach((doc) => {
      const data = doc.data();

      // promptにモデル名や授業の基本情報をまとめる
      const promptLines = [
        `モデル:${model.label}`,
        `単元名:${data.unitName || ""}`,
        `学年:${data.grade || ""}`,
        `ジャンル:${data.genre || ""}`,
        `レッスンタイトル:${data.lessonTitle || ""}`,
        "---",
        "以下は実践記録の振り返りです。内容を読んで授業案を作成してください。",
      ];

      const prompt = promptLines.join("\n");
      const completion = data.reflection ? data.reflection.trim() : "";

      // JSONLの一行として書き出す
      lines.push(JSON.stringify({ prompt, completion: ` ${completion}\n` }));
    });
  }

  const outPath = path.resolve(process.cwd(), "practice_fine_tuning_data.jsonl");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

  console.log(`ファインチューニング用JSONLファイルを作成しました: ${outPath}`);
}

createPracticeJsonl().catch(console.error);
