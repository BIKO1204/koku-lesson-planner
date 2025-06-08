// app/api/generate-gemini/route.js

import { NextResponse } from "next/server";
import { v1beta3 } from "@google-ai/generativelanguage";

// 認証は GOOGLE_APPLICATION_CREDENTIALS 環境変数で自動読み込み
const client = new v1beta3.TextServiceClient();

export async function POST(request) {
  const { prompt } = await request.json();
  if (!prompt) {
    return NextResponse.json({ error: "prompt が必要です" }, { status: 400 });
  }

  try {
    const [response] = await client.generateText({
      model: "models/text-bison-001",        // ← ここが重要
      prompt: { text: prompt },
      temperature: 0.7,
      maxOutputTokens: 512,
    });
    return NextResponse.json({ text: response.text });
  } catch (err) {
    console.error("Gemini 呼び出しエラー:", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}

