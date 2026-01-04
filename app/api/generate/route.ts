// app/api/generate/route.ts
import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// OpenAIに渡すJSON Schema（厳格）
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

    // 各時間目は「文字列」なので、ここを“やわらかい連続文章”にさせる
    "授業の流れ": {
      type: "object",
      patternProperties: { "^\\d+時間目$": { type: "string" } },
      additionalProperties: false,
    },

    "言語活動の工夫": { type: "string" },
    "結果": { type: "string" },
  },
};

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  if (!prompt) return NextResponse.json({ error: "prompt が必要です" }, { status: 400 });

  // モデルは env 優先、未設定なら現状維持
  const model = process.env.OPENAI_MODEL || "gpt-4o-2024-08-06";

  // ★「やわらかめ」寄り：少しだけ温度を上げる（硬さが抜けやすい）
  const temperature = Number(process.env.GENERATE_TEMPERATURE ?? 0.7);
  const maxTokens = Number(process.env.GENERATE_MAX_TOKENS ?? 2200);

  // ★ここが本体：文体・出力のしかたを「やわらかめ」「連続文章」に固定
  const system = `
あなたは小学校国語の授業づくりのアシスタントです。
必ずスキーマ準拠のJSONのみを返してください（説明文や前置きは禁止）。

【文体（重要）】
- 授業案として「やわらかめ」で書く。堅い指導案の文体（〜させる／〜を図る）を多用しない。
- できるだけ自然な日本語で、「〜していく」「〜してみる」「〜を確かめる」などの実践メモに近い書きぶりにする。
- ただし内容は具体性を落とさない。

【品質要件】
- 「単元の目標」は学習者の到達像が分かる1〜3文で具体化する。
- 「評価の観点」は各観点2〜5項目の配列で、観察可能な行動で書く。
- 「言語活動の工夫」は“何を／どの形式で／どう交流するか”が分かる具体で書く。

【授業の流れ（最重要）】
- 各時間目の値は、箇条書きや見出し（例：教師の手立て：／子どもの活動：／評価：）を使わず、
  1〜3段落程度の「連続した文章」で書く。
- 文章の中に自然に「教師の関わり」「子どもの活動」「見取り（評価）」が入るようにする（項目名で分けない）。
- 入力が空欄の時間目は、前後の流れに整合するよう補完する。

【キーの扱い】
- 「教材名」を正式キーとして必ず含める（互換のため必要なら「単元名」も同値で含めてよい）。
`.trim();

  try {
    // Structured Outputs
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
        { role: "user", content: prompt },
      ],
    });

    const text = resp.choices?.[0]?.message?.content ?? "{}";
    const obj = JSON.parse(text);

    // 互換補完
    if (!obj["教材名"] && obj["単元名"]) obj["教材名"] = obj["単元名"];
    if (!obj["単元名"] && obj["教材名"]) obj["単元名"] = obj["教材名"];

    return NextResponse.json(obj);
  } catch (e: any) {
    // フォールバック（JSONモード）
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
      const obj = JSON.parse(text);

      if (!obj["教材名"] && obj["単元名"]) obj["教材名"] = obj["単元名"];
      if (!obj["単元名"] && obj["教材名"]) obj["単元名"] = obj["教材名"];

      return NextResponse.json(obj);
    } catch (e2: any) {
      return NextResponse.json({ error: e2?.message || "Internal Error" }, { status: 500 });
    }
  }
}
