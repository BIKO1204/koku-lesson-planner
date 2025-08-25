// app/api/firebase/custom-token/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as
      | (import("next-auth").Session & { userId?: string })
      | null;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized (no session)" }, { status: 401 });
    }

    const sub = session.userId ?? (session as any).user?.id ?? null;
    const email = (session as any).user?.email ?? null;

    if (!sub) {
      return NextResponse.json({ error: "Unauthorized (no userId/sub)" }, { status: 401 });
    }

    // UID は nextauth:<Google sub> に統一
    const uid = `nextauth:${sub}`;

    const claims: Record<string, any> = {
      provider: "google",
      email,
      name: (session as any).user?.name ?? null,
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
