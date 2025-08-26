export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminDb } from "@/lib/firebaseAdmin";

const MAX_SUBJECT = 100;
const MAX_MESSAGE = 1000;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const category = String(body.category ?? "質問").trim();
    const message = String(body.message ?? "").trim();

    // サーバー側バリデーション
    if (!name) return NextResponse.json({ error: "お名前は必須です" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "メールアドレスは必須です" }, { status: 400 });
    if (!emailRe.test(email)) return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
    if (!subject) return NextResponse.json({ error: "件名は必須です" }, { status: 400 });
    if (subject.length > MAX_SUBJECT) return NextResponse.json({ error: `件名は${MAX_SUBJECT}文字以内です` }, { status: 400 });
    if (!message) return NextResponse.json({ error: "お問い合わせ内容は必須です" }, { status: 400 });
    if (message.length > MAX_MESSAGE) return NextResponse.json({ error: `内容は${MAX_MESSAGE}文字以内です` }, { status: 400 });

    const session = await getServerSession(authOptions).catch(() => null);

    const db = getAdminDb();
    await db.collection("contacts").add({
      name,
      email,
      subject,
      category,
      message,
      createdAt: new Date(), // ここを FieldValue.serverTimestamp() にしてもOK（admin.firestore.FieldValue）
      // Firestore のタイムスタンプを使いたければ:
      // createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userEmail: session?.user?.email ?? null,
      userId: (session as any)?.userId ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact POST error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

