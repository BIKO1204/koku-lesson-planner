// Firestore の lesson_plans_* を Chat Fine-tuning 用の JSONL（messages形式）に書き出す
// 出力: data/lesson_plans_fine_tuning_messages.jsonl
// 1行 = { "messages": [ {role, content}, ... ] }

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const OUT_DIR = path.resolve(process.cwd(), "data");
const OUT_PATH = path.join(OUT_DIR, "lesson_plans_fine_tuning_messages.jsonl");

// 何割以上の時間が埋まっていれば採用するか（例: 0.5 = 50%以上）
const MIN_FILLED_RATIO = Number(process.env.MIN_FILLED_RATIO || "0.5");

// 対象コレクション
const COLLECTIONS = [
  { label: "読解", name: "lesson_plans_reading" },
  { label: "話し合い", name: "lesson_plans_discussion" },
  { label: "作文", name: "lesson_plans_writing" },
  { label: "言語活動", name: "lesson_plans_language_activity" },
];

// 任意: 自分のUIDだけに絞る（空なら全件）
const EXPORT_OWNER_UID = process.env.EXPORT_OWNER_UID || "";

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function arr(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

function buildFlowFromList(list = [], hours = 0) {
  const n = Math.max(Number(hours) || 0, list.length || 0);
  const obj = {};
  for (let i = 0; i < n; i++) obj[`${i + 1}時間目`] = String(list[i] || "").trim();
  return obj;
}

function countFilled(flow) {
  const vals = Object.values(flow || {}).map(v => String(v || "").trim());
  const total = vals.length;
  const filled = vals.filter(v => v.length > 0).length;
  return { filled, total };
}

function isGoodPlan(plan) {
  const goal = String(plan["単元の目標"] || "").trim();
  const flow = plan["授業の流れ"] || {};
  const { filled, total } = countFilled(flow);
  if (total === 0) return false;
  const ratio = filled / total;
  // ねらいが空 & 流れがほぼ空 → 学習価値が低いので除外
  if (!goal && ratio < MIN_FILLED_RATIO) return false;
  // 全部空は除外
  if (ratio === 0) return false;
  return true;
}

function buildUserPrompt(meta, plan, modelLabel) {
  // ユーザー入力として渡す内容（あなたが今のUIで送っている情報に近い形）
  const ep = plan["評価の観点"] || {};
  const joiner = arr => arr.filter(Boolean).join("、");

  const lines = [
    `モデル:${meta.usedStyleName || modelLabel || ""}`,
    `【教科書名】${plan["教科書名"] || ""}`,
    `【学年】${plan["学年"] || ""}`,
    `【ジャンル】${plan["ジャンル"] || ""}`,
    `【単元名】${plan["単元名"] || ""}`,
    `【授業時間数】${plan["授業時間数"] || 0}`,
    ``,
    `■ 単元の目標:`,
    `${plan["単元の目標"] || ""}`,
    ``,
    `■ 評価の観点 (JSON 配列形式):`,
    `知識・技能=${joiner(arr(ep["知識・技能"]))};`,
    `思考・判断・表現=${joiner(arr(ep["思考・判断・表現"]))};`,
    `主体的に学習に取り組む態度=${joiner(arr(ep["主体的に学習に取り組む態度"]))}`,
    ``,
    `■ 育てたい子どもの姿:`,
    `${plan["育てたい子どもの姿"] || ""}`,
    ``,
    `■ 授業の流れ:`,
  ];

  // もともとの UI と同様、「空欄はAIが補完」式のプロンプトにして学習させる
  const flow = plan["授業の流れ"] || {};
  const keys = Object.keys(flow).sort((a,b) => parseInt(a) - parseInt(b));
  for (const k of keys) {
    const v = String(flow[k] || "");
    lines.push(`${k}: ${v}`);
  }

  lines.push(``, `■ 言語活動の工夫:`, `${plan["言語活動の工夫"] || ""}`);
  lines.push(``, `※空欄の時間はAIが補完してください。`, ``);

  return lines.join("\n");
}

if (!admin.apps.length) {
  const credPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(process.cwd(), "serviceAccountKey.json");
  const sa = JSON.parse(fs.readFileSync(credPath, "utf-8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

(async () => {
  ensureDir(OUT_DIR);
  const out = fs.createWriteStream(OUT_PATH, { encoding: "utf8" });

  let added = 0, skipped = 0;

  for (const col of COLLECTIONS) {
    let ref = db.collection(col.name);
    if (EXPORT_OWNER_UID) ref = ref.where("ownerUid", "==", EXPORT_OWNER_UID);
    const snap = await ref.get();

    for (const doc of snap.docs) {
      const d = doc.data();
      const res = d.result || {};

      const evalPts = d.evaluationPoints || {};
      const plan = {
        "教科書名": d.subject || res["教科書名"] || "",
        "学年": d.grade || res["学年"] || "",
        "ジャンル": d.genre || res["ジャンル"] || "",
        "単元名": d.unit || res["単元名"] || "",
        "授業時間数": Number(d.hours || res["授業時間数"] || 0),
        "単元の目標": d.unitGoal || res["単元の目標"] || "",
        "評価の観点": {
          "知識・技能": arr(evalPts.knowledge || (res["評価の観点"] || {})["知識・技能"]),
          "思考・判断・表現": arr(evalPts.thinking || (res["評価の観点"] || {})["思考・判断・表現"]),
          "主体的に学習に取り組む態度": arr(evalPts.attitude || (res["評価の観点"] || {})["主体的に学習に取り組む態度"]),
        },
        "育てたい子どもの姿": d.childVision || res["育てたい子どもの姿"] || "",
        "授業の流れ": (() => {
          // result 側が優先。なければ lessonPlanList + hours から組み立て
          const flow = res["授業の流れ"];
          if (flow && typeof flow === "object") return flow;
          return buildFlowFromList(d.lessonPlanList || [], d.hours || 0);
        })(),
        "言語活動の工夫": d.languageActivities || res["言語活動の工夫"] || "",
        "結果": res["結果"] || "",
      };

      if (!isGoodPlan(plan)) { skipped++; continue; }

      const userPrompt = buildUserPrompt(d, plan, col.label);
      const assistantJson = JSON.stringify(plan);

      const messages = [
        {
          role: "system",
          content:
            "あなたは小学校の国語の授業プランナーです。" +
            "与えられた入力から、定義されたキーのみを持つ授業案JSONを出力してください。" +
            "説明文や前置きは出力しないでください。",
        },
        { role: "user", content: userPrompt },
        { role: "assistant", content: assistantJson },
      ];

      out.write(JSON.stringify({ messages }) + "\n");
      added++;
    }
  }

  out.end();
  console.log(`✅ 出力: ${OUT_PATH}`);
  console.log(`   追加: ${added} 件 / スキップ: ${skipped} 件`);
})().catch(e => {
  console.error("❌ エクスポート失敗:", e);
  process.exit(1);
});
