// app/api/firebase/custom-token/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      // 2) preferredUid が無いなら、email で既存ユーザーを探す（←これが重要）
      try {
        const byEmail = await adminAuth.getUserByEmail(email);
        uidToUse = byEmail.uid; // 既存UIDを採用（email重複エラー回避）
      } catch (e2: any) {
        // 3) email も無いなら、新規作成（preferredUid で作る）
        if (e2?.code === "auth/user-not-found") {
          await adminAuth.createUser({ uid: preferredUid, email });
          uidToUse = preferredUid;
        } else {
          throw e2;
        }
      }
    }

    // 必要なら claim もここで付与（例：adminなど）
    // await adminAuth.setCustomUserClaims(uidToUse, { admin: true });

    const customToken = await adminAuth.createCustomToken(uidToUse);
    return NextResponse.json({ ok: true, customToken, uid: uidToUse });
  } catch (e: any) {
    console.error("[custom-token] error:", e?.stack || e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
