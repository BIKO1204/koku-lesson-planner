import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (!serviceAccount) {
    throw new Error("サービスアカウント情報が設定されていません。");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { uid, disabled, role } = await request.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { error: "uidは必須かつ文字列で指定してください。" },
        { status: 400 }
      );
    }

    const updateParams: admin.auth.UpdateRequest = {};

    if (typeof disabled === "boolean") {
      updateParams.disabled = disabled;
    }

    if (typeof role === "string") {
      // カスタムクレームは別APIで設定することもありますが、ここでまとめて処理可能です。
      await admin.auth().setCustomUserClaims(uid, { role });
    }

    // disabledが指定されている場合のみユーザー更新
    if ("disabled" in updateParams) {
      await admin.auth().updateUser(uid, updateParams);
    }

    return NextResponse.json(
      { message: "ユーザー情報を正常に更新しました。" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("管理APIエラー:", error);
    return NextResponse.json(
      { error: "ユーザー更新処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
