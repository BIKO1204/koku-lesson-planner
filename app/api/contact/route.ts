import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Firebase初期化済みのdbをエクスポートしているファイルパスに合わせてください
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json().catch(() => null);
    if (!data) {
      return NextResponse.json({ error: "無効なJSONです" }, { status: 400 });
    }

    const { name, email, message } = data;

    if (
      typeof name !== "string" || name.trim() === "" ||
      typeof email !== "string" || email.trim() === "" ||
      typeof message !== "string" || message.trim() === ""
    ) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    await addDoc(collection(db, "contacts"), {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ message: "お問い合わせを受け付けました" }, { status: 200 });
  } catch (error) {
    console.error("APIエラー:", error);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
