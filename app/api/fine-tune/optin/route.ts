// app/api/fine-tune/optin/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyBearerToken } from "@/lib/verifyFirebaseToken";
import { assertAdmin } from "@/lib/assertAdmin";

export const runtime = "nodejs";

type Body = {
  collection: string; // lesson_plans_* or practiceRecords_*
  docId: string;
  next: boolean;
};

export async function POST(req: Request) {
  try {
    const user = await verifyBearerToken(req);
    assertAdmin(user);

    const body = (await req.json()) as Body;
    if (!body?.collection || !body?.docId || typeof body.next !== "boolean") {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection(body.collection).doc(body.docId).set(
      {
        fineTuneOptIn: body.next,
        fineTuneOptInAt: new Date(),
        fineTuneOptInBy: user.uid,
        fineTuneOptInByEmail: user.email ?? null,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 403 });
  }
}
