// app/api/generate/route.ts
import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const JSON_SCHEMA: Record<string, any> = {
  type: "object",
  additionalProperties: false,
  required: [
    "教科書名",
    "学年",
    "ジャンル",
    "教材名",
    "授業時間数",
    "単元の目標",
    "評価の観点",
    "育てたい子どもの姿",
    "授業の流れ",
    "言語活動の工夫",
    "結果",
  ],
  properties: {
    "教科書名": { type: "string" },
    "学年": { type: "string" },
    "ジャンル": { type: "string" },

    "教材名": { type: "string" },
    "単元名": { type: "string" }, // 後方互換（任意）

    "授業時間数": { type: "integer", minimum: 1 },
    "単元の目標": { type: "string" },
    "評価の観点": {
      type: "object",
      additionalProperties: false,
      required: ["知識・技能", "思考・判断・表現", "主体的に学習に取り組む態度"],
      properties: {
        "知識・技能": { type: "array", items: { type: "string" } },
        "思考・判断・表現": { type: "array", items: { type: "string" } },
        "主体的に学習に取り組む態度": { type: "array", items: { type: "string" } },
      },
    },
    "育てたい子どもの姿": { type: "string" },
    "授業の流れ": {
      type: "object",
      patternProperties: { "^\\d+時間目$": { type: "string" } },
      additionalProperties: false,
    },
    "言語活動の工夫": { type: "string" },
    "結果": { type: "string" },
  },
};

function pickModel(): string {
  const m =
    (process.env.OPENAI_MODEL || "").trim() ||
    (process.env.OPENAI_BASE_MODEL || "").trim() ||
    "gpt-4o-2024-08-06";
  return m;
}

function normalizeKeys(obj: any) {
  if (!obj || typeof obj !== "object") return obj;

  if (!obj["教材名"] && obj["単元名"]) obj["教材名"] = obj["単元名"];
  if (!obj["単元名"] && obj["教材名"]) obj["単元名"] = obj["教材名"];

  return obj;
}

function extractHoursFromPrompt(prompt: string): number {
  const m = prompt.match(/【授業時間数】\s*([0-9０-９]+)/);
  if (!m) return 0;
  const n = Number(String(m[1]).replace(/[０-９]/g, (d) => String("０１２３４５６７８９".indexOf(d))));
  return Number.isFinite(n) ? n : 0;
}

function ensureFlowKeys(obj: any, hours: number) {
  if (!obj || typeof obj !== "object") return obj;
  const h = Math.max(1, Math.floor(hours || 0));
  if (!obj["授業の流れ"] || typeof obj["授業の流れ"] !== "object") obj["授業の流れ"] = {};
  const flow = obj["授業の流れ"] as Record<string, any>;

  for (let i = 1; i <= h; i++) {
    const k = `${i}時間目`;
    if (typeof flow[k] !== "string") flow[k] = String(flow[k] ?? "").trim();
    if (!flow[k]) flow[k] = ""; // 欠けは空で一旦埋める（後で補完に回す）
  }

  // 余計なキーは削る（"12時間目"など）
  Object.keys(flow).forEach((k) => {
    const m = k.match(/^(\d+)時間目$/);
    if (!m) {
      delete flow[k];
      return;
    }
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 1 || n > h) delete flow[k];
  });

  return obj;
}

function stripHourPrefixFromFlow(obj: any) {
  const flow = obj?.["授業の流れ"];
  if (!flow || typeof flow !== "object") return obj;

  for (const k of Object.keys(flow)) {
    const v = String(flow[k] ?? "");
    flow[k] = v
      .replace(/^\s*(第?\s*[0-9０-９]+\s*(時間目|時))\s*(は|:|：|-|—|ー)?\s*/u, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return obj;
}

function missingFlowKeys(obj: any, hours: number): string[] {
  const h = Math.max(1, Math.floor(hours || 0));
  const flow = obj?.["授業の流れ"];
  if (!flow || typeof flow !== "object") {
    return Array.from({ length: h }, (_, i) => `${i + 1}時間目`);
  }
  const miss: string[] = [];
  for (let i = 1; i <= h; i++) {
    const k = `${i}時間目`;
    if (!flow[k] || !String(flow[k]).trim()) miss.push(k);
  }
  return miss;
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  if (!prompt) return NextResponse.json({ error: "prompt が必要です" }, { status: 400 });

  const model = pickModel();

  const temperature = Number(process.env.GENERATE_TEMPERATURE ?? 0.4);
  const maxTokens = Number(process.env.GENERATE_MAX_TOKENS ?? 2600);

  const hoursFromBody = Number(body?.hours ?? 0);
  const hoursFromPrompt = extractHoursFromPrompt(prompt);
  const expectedHours = Math.max(1, Math.floor(hoursFromBody || hoursFromPrompt || 1));

  const system = `
あなたは小学校国語の授業設計の専門家です。
必ずスキーマ準拠のJSONのみを返してください（説明文は禁止）。

【品質要件】
- 「単元の目標」は学習者の到達像が分かる1〜3文で具体化する。
- 「評価の観点」は各観点2〜5項目の配列で、観察可能な行動で書く。
- 「言語活動の工夫」は“何を／どの形式で／どう交流するか”が分かる具体で書く。
- 入力が空欄の時間目は、前後の流れに整合するよう補完する。
- 「教材名」を正式キーとして必ず含める（互換のため必要なら「単元名」も同値で含めてよい）。

【授業の流れ（表示要件）】
- 各「n時間目」の値は、箇条書きや見出し（例：教師の手立て：／評価：など）に分けず、
  連続した文章（1〜2段落）として書く。
- 文章の中に自然に「教師の手立て」「子どもの活動」「評価の見取り」が読み取れるように含める。
- 各時間目の文章の冒頭に「〇時間目は」「第〇時は」などのラベルを付けない（文章から開始）。
`.trim();

  const callOnce = async (userContent: string) => {
    const resp = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: { name: "LessonPlan", strict: true, schema: JSON_SCHEMA },
      },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    });

    const text = resp.choices?.[0]?.message?.content ?? "{}";
    return text;
  };

  try {
    // 1st
    const text1 = await callOnce(prompt);
    let obj = normalizeKeys(JSON.parse(text1));

    // 期待時間数でキーを揃える
    obj = ensureFlowKeys(obj, expectedHours);

    // もし欠けがあるなら、補完だけする 2nd（内容は極力維持）
    const miss = missingFlowKeys(obj, expectedHours);
    if (miss.length > 0) {
      const repairPrompt = `
以下は授業案JSONの途中結果です。欠けている時間目だけを、条件を満たす文章で補完してください。
既存の時間目の文章は変更せず、欠けているキー（空文字を含む）だけを埋めてください。
必ず「授業の流れ」に 1時間目〜${expectedHours}時間目 の全キーを含めてください。
各時間の文章は120〜200字程度。冒頭に「〇時間目は」を付けない。箇条書き禁止。

【元の依頼プロンプト】
${prompt}

【途中結果JSON】
${JSON.stringify(obj, null, 2)}

【欠けているキー】
${miss.join("、")}
      `.trim();

      const text2 = await callOnce(repairPrompt);
      obj = normalizeKeys(JSON.parse(text2));
      obj = ensureFlowKeys(obj, expectedHours);
    }

    // 表現の後処理（冒頭ラベル除去など）
    obj = stripHourPrefixFromFlow(obj);

    const res = NextResponse.json(obj);
    res.headers.set("X-OpenAI-Model-Used", model);
    return res;
  } catch (e: any) {
    // フォールバック：json_object（スキーマが厳しすぎる時用）
    try {
      const fb = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      });

      const text = fb.choices?.[0]?.message?.content ?? "{}";
      let obj = normalizeKeys(JSON.parse(text));

      obj = ensureFlowKeys(obj, expectedHours);
      obj = stripHourPrefixFromFlow(obj);

      const res = NextResponse.json(obj);
      res.headers.set("X-OpenAI-Model-Used", model);
      return res;
    } catch (e2: any) {
      return NextResponse.json(
        { error: e2?.message || "Internal Error", modelUsed: model },
        { status: 500 }
      );
    }
  }
}
