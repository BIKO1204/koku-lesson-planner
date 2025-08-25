// app/api/firebase/custom-token/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const uid =
    (session as any).userId ||
    (session as any).uid ||
    (session.user as any)?.id ||
    "";

  if (!uid) {
    return NextResponse.json(
      { error: "no-uid" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const token = await getAdminAuth().createCustomToken(uid);
  return NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store" } }
  );
}
