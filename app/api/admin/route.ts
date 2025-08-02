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
  });
}

// GET：ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証トークンがありません。" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 管理者権限判定を admin:true に変更
    if (!decodedToken.admin) {
      return NextResponse.json({ error: "管理者権限がありません。" }, { status: 403 });
    }

    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map((userRecord) => ({
      id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      role: userRecord.customClaims?.role ?? null,
      disabled: userRecord.disabled,
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error);
    return NextResponse.json({ error: "ユーザー一覧の取得に失敗しました。" }, { status: 500 });
  }
}

// POST：ユーザー停止・役割変更
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証トークンがありません。" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 管理者権限判定を admin:true に変更
    if (!decodedToken.admin) {
      return NextResponse.json({ error: "管理者権限がありません。" }, { status: 403 });
    }

    const { uid, disabled, role } = await request.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "uidは必須かつ文字列で指定してください。" }, { status: 400 });
    }

    const updateParams: admin.auth.UpdateRequest = {};

    if (typeof disabled === "boolean") {
      updateParams.disabled = disabled;
    }

    if (typeof role === "string") {
      await admin.auth().setCustomUserClaims(uid, { role });
    }

    if ("disabled" in updateParams) {
      await admin.auth().updateUser(uid, updateParams);
    }

    return NextResponse.json({ message: "ユーザー情報を正常に更新しました。" }, { status: 200 });
  } catch (error) {
    console.error("管理APIエラー:", error);
    return NextResponse.json({ error: "ユーザー更新処理中にエラーが発生しました。" }, { status: 500 });
  }
}
