import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { feedbackText, currentModel } = await request.json();

    const prompt = `
あなたは教育観モデルのアシスタントです。
以下の現在の教育観モデルに対して、振り返り文章を考慮し、
教育観、評価観点の重視、言語活動の重視、育てたい子どもの姿を
具体的かつ端的に更新してください。

現在のモデル：
教育観：${currentModel.philosophy}
評価観点の重視：${currentModel.evaluationFocus}
言語活動の重視：${currentModel.languageFocus}
育てたい子どもの姿：${currentModel.childFocus}

振り返り文章：
${feedbackText}

更新案をJSON形式で次のキーで返してください：
philosophy, evaluationFocus, languageFocus, childFocus
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0].message?.content || "{}";

    let updatedModel = {};
    try {
      updatedModel = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AIの返答がJSON形式ではありません。" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "解析に失敗しました。" },
      { status: 500 }
    );
  }
}

