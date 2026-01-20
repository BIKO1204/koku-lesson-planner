// app/api/firebase/custom-token/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { getAdminAuth, getAdminProjectId } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUserNotFound(e: any) {
  return e?.code === "auth/user-not-found";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const emailRaw = session?.user?.email;
    const email = (emailRaw ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminAuth = getAdminAuth();

    // 既存仕様の「理想UID」
    const preferredUid = `email:${email}`;

    // 実際にtoken発行に使うUID
    let uidToUse = preferredUid;

    // 1) preferredUid が存在するならそれを使う
    try {
      await adminAuth.getUser(preferredUid);
      uidToUse = preferredUid;
    } catch (e: any) {
      // not-found のときだけ次へ（それ以外は異常系として上げる）
      if (!isUserNotFound(e)) throw e;

      // 2) preferredUid が無いなら email で既存ユーザーを探す（email重複回避）
      try {
        const byEmail = await adminAuth.getUserByEmail(email);
        uidToUse = byEmail.uid;
      } catch (e2: any) {
        if (!isUserNotFound(e2)) throw e2;

        // 3) email も無いなら新規作成（preferredUid で作る）
        await adminAuth.createUser({ uid: preferredUid, email });
        uidToUse = preferredUid;
      }
    }

    // 必要ならここで claims を付ける（例：admin）
    // await adminAuth.setCustomUserClaims(uidToUse, { admin: true });

    const customToken = await adminAuth.createCustomToken(uidToUse);

    return NextResponse.json({
      ok: true,
      customToken,
      uid: uidToUse,
      // デバッグ用（本番で消してもOK）
      adminProjectId: getAdminProjectId?.(),
    });
  } catch (e: any) {
    console.error("[custom-token] error:", e?.stack || e);
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
