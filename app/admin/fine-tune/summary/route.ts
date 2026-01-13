// app/api/admin/fine-tune/summary/route.ts
import { requireAdminFromRequest } from "@/lib/fineTune/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { collectionsByTarget, normalizeFineTuneTarget } from "@/lib/fineTune/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdminFromRequest(req);

    const { searchParams } = new URL(req.url);
    const targetRaw = searchParams.get("target") || "practice";
    const target = normalizeFineTuneTarget(targetRaw) ?? "practice";

    const db = getAdminDb();
    const colls = collectionsByTarget[target];

    const out: any[] = [];
    for (const coll of colls) {
      const snapAll = await db.collection(coll).limit(50000).get();
      let opt = 0;
      snapAll.forEach((d) => {
        if (d.data()?.fineTuneOptIn === true) opt++;
      });
      out.push({ collection: coll, total: snapAll.size, optIn: opt });
    }

    const total = out.reduce((a, b) => a + b.total, 0);
    const optIn = out.reduce((a, b) => a + b.optIn, 0);

    return Response.json({ ok: true, target, total, optIn, byCollection: out });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 401 });
  }
}
