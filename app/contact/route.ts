// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Firebase初期化済み
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { name, email, message } = data;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  try {
    await addDoc(collection(db, "contacts"), {
      name,
      email,
      message,
      createdAt: Timestamp.now(),
    });
    return NextResponse.json({ message: "お問い合わせを受け付けました" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
