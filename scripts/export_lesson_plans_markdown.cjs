// scripts/export_lesson_plans_markdown.cjs
// Firestoreの授業案（lesson_plans_*）をMarkdownに一覧出力
// 出力: exports/lesson_plans_index.md と exports/plans/<collection>_<id>.md

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const EXPORT_DIR = path.resolve(process.cwd(), "exports");
const PLAN_DIR = path.join(EXPORT_DIR, "plans");

// 任意: ここに自分の UID を入れると自分の分だけに絞れる（未設定なら全件）
const EXPORT_OWNER_UID = process.env.EXPORT_OWNER_UID || ""; // 例: "107175145055651337656"

if (!admin.apps.length) {
  const credPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(process.cwd(), "serviceAccountKey.json");
  const sa = JSON.parse(fs.readFileSync(credPath, "utf-8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

const collections = [
  { label: "読解",  name: "lesson_plans_reading" },
  { label: "話し合い", name: "lesson_plans_discussion" },
  { label: "作文",  name: "lesson_plans_writing" },
  { label: "言語活動", name: "lesson_plans_language_activity" },
];

function ensureDirs() {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  fs.mkdirSync(PLAN_DIR, { recursive: true });
}

function fmtDate(ts) {
  try {
    if (!ts) return "";
    if (typeof ts?.toDate === "function") return ts.toDate().toISOString().slice(0, 19).replace("T"," ");
    return new Date(ts).toISOString().slice(0, 19).replace("T"," ");
  } catch { return ""; }
}

function sanitize(s) {
  return String(s || "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "untitled";
}

function toAssistantMarkdown(result) {
  // result から最低限の授業案Markdownを生成（assistantPlanMarkdownが無い場合の代替）
  const goal = (result?.["単元の目標"] || "").trim();
  const evals = result?.["評価の観点"] || {};
  const know = [].concat(evals["知識・技能"] || []);
  const think = [].concat(evals["思考・判断・表現"] || []);
  const att  = [].concat(evals["主体的に学習に取り組む態度"] || []);
  const flow = result?.["授業の流れ"] || {};

  const flowLines = Object.keys(flow).sort((a,b)=>{
    const na = parseInt(a); const nb = parseInt(b);
    if (!isNaN(na) && !isNaN(nb)) return na-nb;
    return a.localeCompare(b,"ja");
  }).map(k=>`- ${k}：${String(flow[k]||"").trim()}`).join("\n");

  return [
    "## 授業案",
    goal ? `### ねらい\n${goal}` : "",
    (know.length || think.length || att.length) ? "### 評価" : "",
    know.length ? `- 知識・技能\n${know.map(x=>"  - "+x).join("\n")}` : "",
    think.length ? `- 思考・判断・表現\n${think.map(x=>"  - "+x).join("\n")}` : "",
    att.length ? `- 主体的に学習に取り組む態度\n${att.map(x=>"  - "+x).join("\n")}` : "",
    "### 流れ",
    flowLines || "- （未入力）",
  ].filter(Boolean).join("\n\n");
}

function hasEmptyFlow(result) {
  const flow = result?.["授業の流れ"] || {};
  const vals = Object.values(flow).map(v => String(v||"").trim());
  if (vals.length === 0) return true;
  return vals.some(v => v.length === 0);
}

(async () => {
  ensureDirs();

  const rows = [];
  for (const col of collections) {
    let ref = db.collection(col.name);
    if (EXPORT_OWNER_UID) {
      ref = ref.where("ownerUid", "==", EXPORT_OWNER_UID);
    }
    const snap = await ref.get();

    for (const doc of snap.docs) {
      const d = doc.data();
      const res = d.result || {};
      const id = doc.id;

      const subject = d.subject || res["教科書名"] || "";
      const grade = d.grade || res["学年"] || "";
      const genre = d.genre || res["ジャンル"] || "";
      const unit = d.unit || res["単元名"] || "";
      const hours = Number(d.hours || res["授業時間数"] || 0);
      const style = d.usedStyleName || "";
      const ts = d.timestamp; // serverTimestamp(): Firestore Timestamp

      const md = d.assistantPlanMarkdown && d.assistantPlanMarkdown.trim().length > 0
        ? d.assistantPlanMarkdown
        : toAssistantMarkdown(res);

      // 個別MD出力
      const fname = `${sanitize(col.name)}_${sanitize(id)}.md`;
      fs.writeFileSync(
        path.join(PLAN_DIR, fname),
        [
          `# ${unit || "(無題)"}`,
          ``,
          `- コレクション: ${col.name}（${col.label}）`,
          `- 学年: ${grade} / ジャンル: ${genre} / 教科書: ${subject}`,
          `- 時数: ${hours} / モデル: ${style}`,
          `- 保存: ${fmtDate(ts)}`,
          ``,
          md
        ].join("\n"),
        "utf-8"
      );

      rows.push({
        date: fmtDate(ts),
        model: col.label,
        grade, genre, unit, hours,
        path: `plans/${fname}`,
        emptyFlow: hasEmptyFlow(res) ? "要補完" : "OK",
      });
    }
  }

  // インデックスMarkdown
  rows.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const lines = [
    "# 授業案一覧（エクスポート）",
    "",
    `合計: ${rows.length}件`,
    "",
    "| 日時 | モデル | 学年 | ジャンル | 単元 | 時数 | 流れ | 詳細 |",
    "|---|---|---|---|---|---:|:---:|---|",
    ...rows.map(r => `| ${r.date} | ${r.model} | ${r.grade} | ${r.genre} | ${r.unit} | ${r.hours} | ${r.emptyFlow} | [開く](${r.path}) |`)
  ];
  fs.writeFileSync(path.join(EXPORT_DIR, "lesson_plans_index.md"), lines.join("\n"), "utf-8");

  console.log(`✅ 出力: ${path.join(EXPORT_DIR, "lesson_plans_index.md")}`);
  console.log(`   明細: ${PLAN_DIR}`);
})().catch(e => {
  console.error("❌ エクスポート失敗:", e);
  process.exit(1);
});
