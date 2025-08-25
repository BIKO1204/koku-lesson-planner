const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  const args = process.argv.slice(2);
  const trainPath = args[0];
  if (!trainPath) {
    console.error("使い方: node scripts/ft_create_job.cjs <train.jsonl> [--valid <valid.jsonl>] [--n-epochs <N|auto>]");
    process.exit(1);
  }

  // オプション解析
  let validPath = null;
  let nEpochs = "auto";
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--valid") { validPath = args[++i]; }
    else if (args[i] === "--n-epochs") { nEpochs = args[++i]; }
  }

  // 1) ファイルをアップロード（purpose: fine-tune）
  const train = await client.files.create({
    file: fs.createReadStream(path.resolve(trainPath)),
    purpose: "fine-tune",
  });

  let validId = null;
  if (validPath) {
    const valid = await client.files.create({
      file: fs.createReadStream(path.resolve(validPath)),
      purpose: "fine-tune",
    });
    validId = valid.id;
  }

  // 2) Fine-tuning ジョブ作成（n_epochsを固定 or auto）
  const hp = { n_epochs: /^\d+$/.test(String(nEpochs)) ? Number(nEpochs) : "auto" };

  const job = await client.fineTuning.jobs.create({
    model: "gpt-4o-mini-2024-07-18",
    training_file: train.id,
    ...(validId ? { validation_file: validId } : {}),
    hyperparameters: hp,
  });

  console.log("✅ 作成:", job.id);
  console.log("   training_file:", train.id);
  if (validId) console.log("   validation_file:", validId);
  console.log("進捗を見る: node scripts/ft_watch.cjs " + job.id);
}

main().catch(e => {
  console.error("❌ 失敗:", e?.response?.data || e);
  process.exit(1);
});
