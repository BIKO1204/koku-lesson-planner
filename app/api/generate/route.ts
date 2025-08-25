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
    "教科書名","学年","ジャンル","単元名","授業時間数","単元の目標",
    "評価の観点","育てたい子どもの姿","授業の流れ","言語活動の工夫","結果"
  ],
  properties: {
    "教科書名": { type: "string" },
    "学年": { type: "string" },
    "ジャンル": { type: "string" },
    "単元名": { type: "string" },
    "授業時間数": { type: "integer", minimum: 1 },
    "単元の目標": { type: "string" },
    "評価の観点": {
      type: "object",
      additionalProperties: false,
      required: ["知識・技能","思考・判断・表現","主体的に学習に取り組む態度"],
      properties: {
        "知識・技能": { type: "array", items: { type: "string" } },
        "思考・判断・表現": { type: "array", items: { type: "string" } },
        "主体的に学習に取り組む態度": { type: "array", items: { type: "string" } },
      }
    },
    "育てたい子どもの姿": { type: "string" },
    "授業の流れ": {
      type: "object",
      patternProperties: { "^\\d+時間目$": { type: "string" } },
      additionalProperties: false
    },
    "言語活動の工夫": { type: "string" },
    "結果": { type: "string" },
  }
};

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  // 1) リクエストのパース
  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  if (!prompt) return NextResponse.json({ error: "prompt が必要です" }, { status: 400 });

  const model = process.env.OPENAI_MODEL || "gpt-4o-2024-08-06";
  const temperature = Number(process.env.GENERATE_TEMPERATURE ?? 0.2);
  const maxTokens = Number(process.env.GENERATE_MAX_TOKENS ?? 1200);

  // 2) Chat Completions + Structured Outputs
  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: { name: "LessonPlan", strict: true, schema: JSON_SCHEMA },
      },
      messages: [
        {
          role: "system",
          content:
            "あなたは小学校の国語の授業プランナーです。必ずスキーマ準拠のJSONのみを返してください。説明文は不要です。",
        },
        { role: "user", content: prompt },
      ],
    });

    const text = resp.choices?.[0]?.message?.content ?? "{}";
    return NextResponse.json(JSON.parse(text));
  } catch (e: any) {
    // 3) json_schema が使えない環境/モデルだった場合は JSONモードでフォールバック
    try {
      const fb = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }, // ← 常に有効なJSONを返す
        messages: [
          { role: "system", content: "必ず有効なJSONのみを返してください。説明文は不要です。" },
          { role: "user", content: prompt },
        ],
      });
      const text = fb.choices?.[0]?.message?.content ?? "{}";
      return NextResponse.json(JSON.parse(text));
    } catch (e2: any) {
      return NextResponse.json({ error: e2?.message || "Internal Error" }, { status: 500 });
    }
  }
}
