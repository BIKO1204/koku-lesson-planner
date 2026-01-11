// app/api/fine-tune/consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

export const runtime = "nodejs";

const COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_discussion",
  "lesson_plans_writing",
  "lesson_plans_language_activity",
] as const;

function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json().catch(() => null);
    const optIn = body?.optIn === true;

    // 1) ユーザー設定（同意）を保存
    await getAdminDb()
      .collection("user_settings")
      .doc(uid)
      .set(
        {
          fineTuneOptIn: optIn,
          fineTuneOptInAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    // 2) 過去の保存授業案にフラグを一括反映（運用ラク）
    const pageSize = 400; // batch 500上限に余裕
    let updated = 0;

    for (const colName of COLLECTIONS) {
      const colRef = getAdminDb().collection(colName);

      let lastId: string | null = null;
      while (true) {
        let q = colRef
          .where("ownerUid", "==", uid)
          .orderBy(FieldPath.documentId())
          .limit(pageSize);

        if (lastId) q = q.startAfter(lastId);

        const snap = await q.get();
        if (snap.empty) break;

        const batch = getAdminDb().batch();
        for (const d of snap.docs) {
          batch.set(
            d.ref,
            {
              fineTuneOptIn: optIn,
              fineTuneOptInAt: new Date().toISOString(),
            },
            { merge: true }
          );
          updated++;
        }
        await batch.commit();

        lastId = snap.docs[snap.docs.length - 1]?.id ?? null;
        if (!lastId || snap.size < pageSize) break;
      }
    }

    return NextResponse.json({ ok: true, optIn, updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Consent update failed" }, { status: 500 });
  }
}
