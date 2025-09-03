/* scripts/export-finetune-jsonl.ts
   Firestoreの授業案から userPromptText / assistantPlanMarkdown を抽出し、
   fine-tuning用の chat JSONL を train/valid に分割して出力します。
*/
import * as fs from "fs";
import * as path from "path";
import admin from "firebase-admin";

type LessonPlanDoc = {
  selectedStyleId?: string;
  usedStyleName?: string | null;
  userPromptText?: string;        // ← あなたの /plan 保存コードで既に保存済み
  assistantPlanMarkdown?: string; // ← 同上
  author?: string;
  timestamp?: any;
};

type EducationModelDoc = {
  name?: string;
  // useForTraining が true のモデルのみ学習対象にする想定（未導入なら後述の「補足」を参照）
  useForTraining?: boolean;
};

const SERVICE_KEY_PATH = process.env.SA_KEY_PATH || "serviceAccountKey.json";

// 4つの授業案用コレクション（既存実装と同じ）
const LESSON_PLAN_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_writing",
  "lesson_plans_discussion",
  "lesson_plans_language_activity",
];

// 文字列を安全化
const sanitize = (s: string) => (s || "").replace(/\r\n/g, "\n").trim();

// JSONL 1行のフォーマット（Chat形式）
function toJSONLLine(user: string, assistant: string, systemNote: string) {
  return JSON.stringify({
    messages: [
      { role: "system", content: systemNote },
      { role: "user", content: user },
      { role: "assistant", content: assistant },
    ],
  });
}

(async () => {
  // Firebase Admin 初期化
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_KEY_PATH, "utf8"));
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
  }
  const db = admin.firestore();

  // 1) 学習に使ってよい教育観モデルIDを収集
  const eduSnap = await db.collection("educationModels").get();
  const trainableStyleIds = new Set<string>();
  eduSnap.forEach((d) => {
    const data = d.data() as EducationModelDoc;
    if (data?.useForTraining === true) {
      trainableStyleIds.add(d.id);
    }
  });

  // ※ useForTraining をまだ導入していない場合は、ここで方針を切り替えてもOK：
  // 例）暫定的に “自分のモデルだけ” 許可するとか、isShared===true のみ等

  // 2) 授業案を横断収集
  const pairs: { user: string; assistant: string }[] = [];
  for (const coll of LESSON_PLAN_COLLECTIONS) {
    const snap = await db.collection(coll).get();
    snap.forEach((doc) => {
      const p = doc.data() as LessonPlanDoc;
      // 教育観モデルの同意(useForTraining)があるものだけ採用
      if (p.selectedStyleId && trainableStyleIds.has(p.selectedStyleId)) {
        const user = sanitize(p.userPromptText || "");
        const assistant = sanitize(p.assistantPlanMarkdown || "");
        if (user && assistant) {
          pairs.push({ user, assistant });
        }
      }
    });
  }

  if (pairs.length === 0) {
    console.log("学習に使用できるペアが見つかりません。useForTrainingの設定や保存データを確認してください。");
    process.exit(0);
  }

  // 3) systemメッセージ（出力規約）
  const systemNote =
    "あなたは小学校国語の授業プランナーAIです。語彙は“児童”で統一し、" +
    "出力は見出しと箇条書きを中心に、各時間の活動を具体化してください。";

  // 4) シャッフルして 90%:10% に分割
  const shuffled = pairs.sort(() => Math.random() - 0.5);
  const cut = Math.max(1, Math.floor(shuffled.length * 0.9));
  const train = shuffled.slice(0, cut);
  const valid = shuffled.slice(cut);

  // 5) 出力先
  const outDir = path.join(process.cwd(), "finetune_out");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const trainPath = path.join(outDir, "train.jsonl");
  const validPath = path.join(outDir, "valid.jsonl");

  fs.writeFileSync(
    trainPath,
    train.map((p) => toJSONLLine(p.user, p.assistant, systemNote)).join("\n") + "\n",
    "utf8"
  );
  fs.writeFileSync(
    validPath,
    valid.map((p) => toJSONLLine(p.user, p.assistant, systemNote)).join("\n") + "\n",
    "utf8"
  );

  console.log(`✅ Exported: ${train.length} train / ${valid.length} valid`);
  console.log(`📄 ${trainPath}`);
  console.log(`📄 ${validPath}`);
  process.exit(0);
})();
