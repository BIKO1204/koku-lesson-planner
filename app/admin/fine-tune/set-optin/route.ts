// app/api/admin/fine-tune/set-optin/route.ts
import { requireAdminFromRequest } from "@/lib/fineTune/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    await requireAdminFromRequest(req);

    const body = await req.json();
    const { collection, docId, fineTuneOptIn } = body as {
      collection: string;
      docId: string;
      fineTuneOptIn: boolean;
    };

    if (!collection || !docId) return new Response("Bad Request", { status: 400 });

    const db = getAdminDb();
    await db.collection(collection).doc(docId).set(
      {
        fineTuneOptIn: !!fineTuneOptIn,
        fineTuneOptInAt: new Date(),
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 401 });
  }
}
