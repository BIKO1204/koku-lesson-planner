// app/api/admin/fine-tune/list/route.ts
import { requireAdminFromRequest } from "@/lib/fineTune/auth";
import { fetchFineTuneDocs } from "@/lib/fineTune/query";
import { normalizeFineTuneTarget } from "@/lib/fineTune/collections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0; // ★追加

export async function GET(req: Request) {
  try {
    await requireAdminFromRequest(req);

    const { searchParams } = new URL(req.url);
    const rawTarget = searchParams.get("target") || "practice";
    const target = normalizeFineTuneTarget(rawTarget) ?? "practice";

    const optInOnly = searchParams.get("optInOnly") === "1";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const rows = await fetchFineTuneDocs({ target, scope: "all", optInOnly, limit });

    const slim = rows.map((r: any) => ({
      id: r.id,
      collection: r.collection ?? r.coll ?? "",
      fineTuneOptIn: !!r.fineTuneOptIn,
      unitName: r.unitName ?? "",
      grade: r.grade ?? "",
      genre: r.genre ?? "",
      createdAt: r.createdAt ?? null,
    }));

    return Response.json(
      { ok: true, target, rows: slim },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 401 });
  }
}
