const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error("使い方: node scripts/ft_watch.cjs <job-id>");
    process.exit(1);
  }
  const seen = new Set();
  while (true) {
    const events = await client.fineTuning.jobs.listEvents({ fine_tuning_job_id: jobId });
    for (const e of events.data.reverse()) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      console.log(`[${e.level}] ${new Date(e.created_at * 1000).toISOString()} ${e.message}`);
      if (e?.data?.fine_tuned_model) {
        console.log("🎉 fine-tuned model:", e.data.fine_tuned_model);
        process.exit(0);
      }
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

main().catch((e) => {
  console.error("❌ 失敗:", e?.response?.data || e);
  process.exit(1);
});
