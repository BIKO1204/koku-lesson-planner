// app/api/firebase/custom-token/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminAuth } from "@/lib/firebaseAdmin";
import type { Session } from "next-auth";

export async function GET() {
  try {
    // 型を明示
    const session = (await getServerSession(authOptions)) as Session & {
      accessToken?: string;
      error?: string;
      userId?: string;
    };

    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Google の sub を UID として統一
    const uid = `nextauth:${session.userId}`;

    const claims: Record<string, any> = {
      provider: "google",
      email: session.user?.email ?? null,
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
