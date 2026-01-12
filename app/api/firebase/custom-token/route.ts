// app/api/firebase/custom-token/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // ←こっち推奨
import { authOptions } from "@/lib/authOptions";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const uid = `email:${email}`;

    try {
      await adminAuth.getUser(uid);
    } catch {
      await adminAuth.createUser({ uid, email });
    }

    const customToken = await adminAuth.createCustomToken(uid);
    return NextResponse.json({ ok: true, customToken });
  } catch (e: any) {
    console.error("[custom-token] error:", e?.stack || e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
