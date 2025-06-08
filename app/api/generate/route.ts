// app/api/generate/route.ts

import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";

// OpenAI クライアントの初期化（.env.local に OPENAI_API_KEY=sk-... が設定されていること）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  // 1. リクエスト JSON をパース
  let payload: any;
  try {
    payload = await request.json();
    console.log("▶ api/generate payload:", payload);
  } catch (e: any) {
    console.error("❌ payload parse error:", e);
    return NextResponse.json(
      { error: "Invalid JSON payload", detail: e.message },
      { status: 400 }
    );
  }

  // 2. prompt が文字列として存在するかチェック
  const { prompt } = payload;
  if (typeof prompt !== "string" || prompt.trim() === "") {
    return NextResponse.json(
      { error: "prompt が必要です（文字列を送ってください）" },
      { status: 400 }
    );
  }

  // 3. 環境変数チェック
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set");
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  // 4. OpenAI (GPT-4) 呼び出し
  let completionText: string;
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "あなたは小学校の国語の授業プランナーです。以下のユーザーの指示に従ってください。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    completionText = resp.choices?.[0]?.message?.content ?? "";
    console.log("▶ OpenAI response:", completionText);
  } catch (e: any) {
    console.error("❌ OpenAI API error:", e);
    return NextResponse.json(
      { error: "OpenAI API call failed", detail: e.message },
      { status: 500 }
    );
  }

  // 5. コードフェンス除去 & トリム
  const cleaned = completionText.replace(/```json/g, "").replace(/```/g, "").trim();

  // 6. JSON パースして返却
  try {
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error("❌ JSON parse failed:", e, cleaned);
    return NextResponse.json(
      { error: "Invalid JSON from AI", raw: cleaned },
      { status: 500 }
    );
  }
}
