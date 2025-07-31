import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { uid, disabled, role } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "uidが必要です" }, { status: 400 });
    }

    // ユーザー無効化・有効化
    if (typeof disabled === "boolean") {
      await admin.auth().updateUser(uid, { disabled });
    }

    // 役割（カスタムクレーム）設定
    if (typeof role === "string") {
      await admin.auth().setCustomUserClaims(uid, { role });
    }

    return NextResponse.json({ message: "ユーザー情報を更新しました" }, { status: 200 });
  } catch (error) {
    console.error("管理APIエラー:", error);
    return NextResponse.json({ error: "ユーザー更新に失敗しました" }, { status: 500 });
  }
}
