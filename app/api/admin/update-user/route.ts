export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 認証（管理者チェック）
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証トークンがありません。" }, { status: 401 });
    }
    const idToken = authHeader.slice("Bearer ".length).trim();

    const adminAuth = getAdminAuth();
    const caller = await adminAuth.verifyIdToken(idToken);
    if (!(caller.admin === true || caller.role === "admin")) {
      return NextResponse.json({ error: "管理者権限がありません。" }, { status: 403 });
    }

    // 入力
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSONの解析に失敗しました。" }, { status: 400 });
    }

    const { uid, disabled, role } = body ?? {};
    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "uidは必須かつ文字列で指定してください。" }, { status: 400 });
    }

    const ops: Promise<any>[] = [];

    // disabled の更新
    if (typeof disabled === "boolean") {
      ops.push(adminAuth.updateUser(uid, { disabled }));
    }

    // role の更新（custom claims を安全にマージ）
    if (typeof role !== "undefined") {
      if (typeof role !== "string") {
        return NextResponse.json({ error: "roleは文字列で指定してください。" }, { status: 400 });
      }
      const validRoles = ["admin", "user", ""];
      if (role && !validRoles.includes(role)) {
        return NextResponse.json(
          { error: `roleは次のいずれかにしてください: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }

      const target = await adminAuth.getUser(uid);
      const current = (target.customClaims ?? {}) as Record<string, any>;
      const nextClaims = { ...current };

      if (role === "") {
        delete nextClaims.role; // role を外す
      } else {
        nextClaims.role = role;
        nextClaims.admin = role === "admin"; // role に合わせて admin も同期
      }

      ops.push(adminAuth.setCustomUserClaims(uid, nextClaims));
    }

    await Promise.all(ops);

    const latest = await adminAuth.getUser(uid);
    return NextResponse.json({
      message: "ユーザー情報を正常に更新しました。",
      result: {
        uid: latest.uid,
        disabled: latest.disabled,
        customClaims: latest.customClaims ?? {},
      },
      note:
        typeof role !== "undefined"
          ? "クライアント側で getIdToken(true) を呼んでトークンを更新してください。"
          : undefined,
    });
  } catch (err: any) {
    console.error("管理APIエラー:", err);
    const code: string = err?.code || "";
    if (code.startsWith?.("auth/")) {
      const status = code === "auth/user-not-found" ? 404 : 400;
      return NextResponse.json({ error: err.message || code }, { status });
    }
    return NextResponse.json({ error: "ユーザー更新処理中にエラーが発生しました。" }, { status: 500 });
  }
}
