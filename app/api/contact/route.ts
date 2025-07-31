import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,  // ここを追加
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, email, message, idToken } = data;

    if (!idToken) {
      return NextResponse.json({ error: "認証トークンがありません" }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken).catch(() => null);
    if (!decodedToken) {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
    }

    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof message !== "string" || !message.trim()
    ) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    await db.collection("contacts").add({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      uid: decodedToken.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: "お問い合わせを受け付けました" }, { status: 200 });
  } catch (error) {
    console.error("APIエラー:", error);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
