import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .envなどで設定してください
});

export async function POST(req: NextRequest) {
  try {
    const { feedbackText, currentModel } = await req.json();

    const prompt = `
あなたは教育の専門家です。以下は現在の教育観モデルと授業振り返りです。
このフィードバックを踏まえて教育観モデルをどう更新すべきか、具体的に箇条書きで教えてください。

【現在の教育観モデル】
教育哲学：${currentModel.philosophy}
評価観点の重点：${currentModel.evaluationFocus}
言語活動の重点：${currentModel.languageFocus}
育てたい子どもの姿：${currentModel.childFocus}

【授業振り返り】
${feedbackText}

【更新案】
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const result = completion.choices[0].message?.content ?? "";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("updateEducationModel API error:", error);
    return NextResponse.json({ error: "APIエラーが発生しました。" }, { status: 500 });
  }
}
