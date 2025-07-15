import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid or missing messages" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    });

    return NextResponse.json({ result: completion.choices[0].message });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "OpenAI API request failed" },
      { status: 500 }
    );
  }
}
