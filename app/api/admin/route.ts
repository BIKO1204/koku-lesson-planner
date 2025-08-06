export const runtime = "nodejs"; // ← これを必ず先頭に

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  let serviceAccount = null;
  try {
    if (!serviceAccountRaw) throw new Error("サービスアカウント情報が設定されていません。");
    serviceAccount = JSON.parse(serviceAccountRaw);

    // 「\\n」を「\n」に置換！（これが重要）
    if (serviceAccount.private_key && typeof serviceAccount.private_key === "string") {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
  } catch (e) {
    throw new Error("サービスアカウント情報のJSON解析に失敗しました。" + (e instanceof Error ? e.message : ""));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });
}

export async function GET(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証トークンがありません。" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!(decodedToken.admin === true || decodedToken.role === "admin")) {
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

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証トークンがありません。" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!(decodedToken.admin === true || decodedToken.role === "admin")) {
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

    // role のバリデーション
    const validRoles = ["admin", "user", ""];
    if (role !== undefined && typeof role !== "string") {
      return NextResponse.json({ error: "roleは文字列で指定してください。" }, { status: 400 });
    }
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `roleは以下のいずれかで指定してください: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const promises = [];
    if (role !== undefined) {
      const isAdmin = role === "admin";
      promises.push(admin.auth().setCustomUserClaims(uid, { role, admin: isAdmin }));
    }
    if ("disabled" in updateParams) {
      promises.push(admin.auth().updateUser(uid, updateParams));
    }

    await Promise.all(promises);

    return NextResponse.json({ message: "ユーザー情報を正常に更新しました。" }, { status: 200 });
  } catch (error) {
    console.error("管理APIエラー:", error);
    return NextResponse.json({ error: "ユーザー更新処理中にエラーが発生しました。" }, { status: 500 });
  }
}
