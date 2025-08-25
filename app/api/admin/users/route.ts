import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  let serviceAccount = null;
  try {
    serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;
  } catch (e) {
    throw new Error("サービスアカウント情報のJSON解析に失敗しました。");
  }

  if (!serviceAccount) {
    throw new Error("サービスアカウント情報が設定されていません。");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });
}

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    // --- 管理者認証チェック ---
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "認証トークンがありません。" },
        { status: 401 }
      );
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!(decodedToken.admin === true || decodedToken.role === "admin")) {
      return NextResponse.json(
        { error: "管理者権限がありません。" },
        { status: 403 }
      );
    }

    // --- リクエストボディの取得 ---
    const { uid, disabled, role } = await request.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { error: "uidは必須かつ文字列で指定してください。" },
        { status: 400 }
      );
    }

    // --- 更新内容の準備 ---
    const updateParams: admin.auth.UpdateRequest = {};
    if (typeof disabled === "boolean") {
      updateParams.disabled = disabled;
    }

    // --- role のバリデーション ---
    const validRoles = ["admin", "user", ""];
    if (role !== undefined && typeof role !== "string") {
      return NextResponse.json(
        { error: "roleは文字列で指定してください。" },
        { status: 400 }
      );
    }
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `roleは以下のいずれかで指定してください: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // --- 並列更新 ---
    const promises = [];

    if (role !== undefined) {
      const isAdmin = role === "admin";
      promises.push(admin.auth().setCustomUserClaims(uid, { role, admin: isAdmin }));
    }
    if ("disabled" in updateParams) {
      promises.push(admin.auth().updateUser(uid, updateParams));
    }

    await Promise.all(promises);

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
