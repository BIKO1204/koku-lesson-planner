export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireAdminFromRequest } from "@/lib/fineTune/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const admin = await requireAdminFromRequest(req);

    const { id, collection, next } = (await req.json()) as {
      id: string;
      collection: string;
      next: boolean;
    };

    if (!id || !collection) return new Response("bad request", { status: 400 });

    const db: any = getAdminDb();

    await db
      .collection(collection)
      .doc(id)
      .set(
        {
          fineTuneOptIn: !!next,
          fineTuneOptInAt: FieldValue.serverTimestamp(),
          fineTuneOptInBy: admin.uid,
        },
        { merge: true }
      );

    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 401 });
  }
}
