// app/api/firebase/custom-token/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminAuth } from "@/lib/firebaseAdmin";
import type { Session } from "next-auth";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;

    // NextAuth の標準セッションは userId を含まないため、email を必須にします
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // email を UID として利用（端末間で同一アカウントを同一UIDに統一）
    const uid = email;

    const claims: Record<string, any> = {
      provider: "google",
      email: email,
      name: session.user?.name ?? null,
    };

    const customToken = await adminAuth.createCustomToken(uid, claims);
    return NextResponse.json({ token: customToken }, { status: 200 });
  } catch (e: any) {
    console.error("custom-token error:", e);
    return NextResponse.json(
      { error: "Internal Server Error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
