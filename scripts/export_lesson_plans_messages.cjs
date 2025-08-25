// scripts/export_lesson_plans_messages.cjs
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const cwd = process.cwd();
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(cwd, "serviceAccountKey.json");
if (!fs.existsSync(credPath)) {
  console.error(`❌ 資格情報が見つかりません: ${credPath}`);
  process.exit(1);
}
if (!admin.apps.length) {
  const sa = JSON.parse(fs.readFileSync(credPath, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

const COLLECTIONS = [
  { label: "読解", name: "lesson_plans_reading" },
  { label: "話し合い", name: "lesson_plans_discussion" },
  { label: "作文", name: "lesson_plans_writing" },
  { label: "言語活動", name: "lesson_plans_language_activity" },
];

// 既存保存の ParsedResult から assistant を復元（保険）
function toAssistantFromResult(r = {}) {
  const getA = (v) => (Array.isArray(v) ? v : v ? [String(v)] : []);
  const goal = (r["単元の目標"] ?? "").toString().trim();
  const evalObj = r["評価の観点"] ?? {};
  const know = getA(evalObj["知識・技能"]);
  const think = getA(evalObj["思考・判断・表現"]);
  const att  = getA(evalObj["主体的に学習に取り組む態度"]);
  const flow = r["授業の流れ"] ?? {};
  const flowLines = Object.keys(flow).sort((a,b)=>{
    const na=parseInt(a,10), nb=parseInt(b,10);
    if(!isNaN(na)&&!isNaN(nb)) return na-nb; return a.localeCompare(b,"ja");
  }).map(k=>`- ${k}：\n${String(flow[k]??"").trim()}`).join("\n");
  const lang = (r["言語活動の工夫"] ?? "").toString().trim();

  const parts = ["## 授業案"];
  if (goal) parts.push(`### ねらい\n${goal}`);
  if (know.length || think.length || att.length) {
    parts.push("### 評価");
    if (know.length) parts.push(`- 知識・技能\n${know.map(x=>`  - ${x}`).join("\n")}`);
    if (think.length) parts.push(`- 思考・判断・表現\n${think.map(x=>`  - ${x}`).join("\n")}`);
    if (att.length) parts.push(`- 主体的に学習に取り組む態度\n${att.map(x=>`  - ${x}`).join("\n")}`);
  }
  if (lang) parts.push(`### 言語活動の工夫\n${lang}`);
  if (flowLines) parts.push(`### 流れ\n${flowLines}`);
  return parts.join("\n\n").trim();
}

function buildUserPrompt(docData) {
  const r = docData.result || {};
  const lines = [
    "あなたは国語授業プランナーのアシスタントです。",
    `モデル:${docData.usedStyleName || ""}`,
    `教科書名:${r["教科書名"] ?? docData.subject ?? ""}`,
    `学年:${r["学年"] ?? docData.grade ?? ""}`,
    `ジャンル:${r["ジャンル"] ?? docData.genre ?? ""}`,
    `単元名:${r["単元名"] ?? docData.unit ?? ""}`,
    r["単元の目標"] ? `---\n単元の目標:\n${r["単元の目標"]}` : "",
    r["評価の観点"] ? `---\n評価の観点:\n${JSON.stringify(r["評価の観点"], null, 2)}` : "",
    r["言語活動の工夫"] ? `---\n言語活動の工夫:\n${r["言語活動の工夫"]}` : "",
    "上の情報を踏まえ、具体的な授業案（ねらい・流れ・板書・評価・時間配分・支援）を生成してください。"
  ].filter(Boolean);
  return lines.join("\n");
}

(async () => {
  const outDir = path.join(cwd, "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "lesson_plans_messages.jsonl");

  const stream = fs.createWriteStream(outPath, { encoding: "utf8" });
  const seen = new Set();
  let wrote = 0, skipped = 0;

  for (const col of COLLECTIONS) {
    const snap = await db.collection(col.name).get();
    snap.forEach((doc) => {
      const d = doc.data() || {};
      // 優先：保存済みの完成テキスト
      let assistant = (d.assistantPlanMarkdown || "").toString().trim();
      if (!assistant) assistant = toAssistantFromResult(d.result);
      if (!assistant) { skipped++; return; }

      // user 側は保存済みのプロンプトがあればそれを優先
      const user = (d.userPromptText || "").toString().trim() || buildUserPrompt(d);

      const messages = [
        { role: "system", content: "あなたは丁寧で具体的な国語授業プランナーのアシスタントです。" },
        { role: "user", content: user },
        { role: "assistant", content: assistant },
      ];
      const key = JSON.stringify(messages);
      if (seen.has(key)) { skipped++; return; }
      seen.add(key);

      stream.write(JSON.stringify({ messages }) + "\n");
      wrote++;
    });
  }
  stream.end();
  console.log("✅ 出力:", outPath);
  console.log("   追加:", wrote, "件 / スキップ:", skipped);
})().catch((e) => { console.error("❌ エラー:", e); process.exit(1); });
