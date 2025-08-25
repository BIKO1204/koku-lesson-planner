// scripts/createPracticeJsonl_messages.cjs
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// ── 資格情報の取得（環境変数 > serviceAccountKey.json） ──
const cwd = process.cwd();
const credPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(cwd, "serviceAccountKey.json");

if (!fs.existsSync(credPath)) {
  console.error(
    `❌ 資格情報が見つかりません: ${credPath}
- プロジェクト直下に serviceAccountKey.json を置く か
- 環境変数 GOOGLE_APPLICATION_CREDENTIALS にJSONのパスを設定してください。`
  );
  process.exit(1);
}

if (!admin.apps.length) {
  const sa = JSON.parse(fs.readFileSync(credPath, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

// 収集するコレクションと表示ラベル
const COLLECTIONS = [
  { label: "読解モデル", name: "practiceRecords_reading" },
  { label: "話し合いモデル", name: "practiceRecords_discussion" },
  { label: "作文モデル", name: "practiceRecords_writing" },
  { label: "言語活動モデル", name: "practiceRecords_language_activity" },
];

// 安全策：反省文の最大長（長すぎると学習で落ちることがある）
const MAX_REFLECTION_CHARS = 4000;

// 文字整形
function norm(v) {
  return (v ?? "").toString().replace(/\r\n/g, "\n").trim();
}

// Firestore 1件→ messages配列を構築
function buildMessages(label, d) {
  const reflection = norm(d.reflection);
  const unitName = norm(d.unitName);
  const grade = norm(d.grade);
  const genre = norm(d.genre);
  const lessonTitle = norm(d.lessonTitle);

  const refShort =
    reflection.length > MAX_REFLECTION_CHARS
      ? reflection.slice(0, MAX_REFLECTION_CHARS) + "\n…(cut)"
      : reflection;

  const userPrompt = [
    "あなたは国語授業プランナーのアシスタントです。",
    "次の情報を踏まえて、具体的で実用的な授業案を提案してください。",
    `モデル:${label}`,
    unitName && `単元名:${unitName}`,
    grade && `学年:${grade}`,
    genre && `ジャンル:${genre}`,
    lessonTitle && `レッスンタイトル:${lessonTitle}`,
    "---",
    "以下は実践記録の振り返りです：",
    refShort || "(振り返りが空です)"
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    {
      role: "system",
      content: "あなたは丁寧で具体的な国語授業プランナーのアシスタントです。",
    },
    { role: "user", content: userPrompt },
  ];

  // もし理想回答を別フィールド（idealPlan等）で持っていれば教師ありにできる
  if (d.idealPlan && norm(d.idealPlan)) {
    messages.push({ role: "assistant", content: norm(d.idealPlan) });
  }

  return messages;
}

(async () => {
  const outDir = path.join(cwd, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "practice_fine_tuning_messages.jsonl");

  const seen = new Set(); // 重複除去（messages内容で一意化）
  let wrote = 0,
    skipped = 0;

  const stream = fs.createWriteStream(outPath, { encoding: "utf8" });

  for (const col of COLLECTIONS) {
    const snap = await db.collection(col.name).get();
    snap.forEach((doc) => {
      const d = doc.data() || {};
      const reflection = norm(d.reflection);
      if (!reflection) {
        skipped++;
        return; // 振り返りが空はスキップ
      }
      const messages = buildMessages(col.label, d);
      const key = JSON.stringify(messages);
      if (seen.has(key)) {
        skipped++;
        return;
      }
      seen.add(key);
      stream.write(JSON.stringify({ messages }) + "\n");
      wrote++;
    });
  }

  stream.end();
  console.log("✅ 出力:", outPath);
  console.log("   追加:", wrote, "件 / スキップ:", skipped);
})().catch((e) => {
  console.error("❌ エラー:", e);
  process.exit(1);
});
