// app/api/fine-tune/summary/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyBearerToken } from "@/lib/verifyFirebaseToken";
import { assertAdmin } from "@/lib/assertAdmin";
import { LESSON_PLAN_COLLECTIONS, PRACTICE_COLLECTIONS } from "@/lib/collections";

export const runtime = "nodejs";

async function countOptInAcross(collections: readonly string[], optInOnly: boolean) {
  const db = getAdminDb();
  let total = 0;

  // Firestoreに横断countがないので、collectionごとにcount集計
  for (const coll of collections) {
    let q = db.collection(coll) as FirebaseFirestore.CollectionReference;
    if (optInOnly) q = q.where("fineTuneOptIn", "==", true) as any;
    // confirmedNoPersonalInfo を必須にするならここでwhere追加
    // q = q.where("confirmedNoPersonalInfo", "==", true) as any;

    const snap = await q.count().get();
    total += snap.data().count;
  }
  return total;
}

export async function GET(req: Request) {
  try {
    const user = await verifyBearerToken(req);
    assertAdmin(user);

    const [planOptIn, practiceOptIn] = await Promise.all([
      countOptInAcross(LESSON_PLAN_COLLECTIONS, true),
      countOptInAcross(PRACTICE_COLLECTIONS, true),
    ]);

    return NextResponse.json({
      ok: true,
      planOptIn,
      practiceOptIn,
      at: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 403 });
  }
}
