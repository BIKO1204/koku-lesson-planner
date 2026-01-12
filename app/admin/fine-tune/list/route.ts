// app/api/admin/fine-tune/list/route.ts
import { requireAdminFromRequest } from "@/lib/fineTune/auth";
import { fetchFineTuneDocs } from "@/lib/fineTune/query";

export async function GET(req: Request) {
  try {
    await requireAdminFromRequest(req);

    const { searchParams } = new URL(req.url);
    const target = (searchParams.get("target") || "practice") as "lesson" | "practice";
    const optInOnly = searchParams.get("optInOnly") === "1";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const rows = await fetchFineTuneDocs({
      target,
      scope: "all",
      optInOnly,
      limit,
    });

    // UI用に軽量化
    const slim = rows.map((r) => ({
      id: r.id,
      collection: r.coll,
      fineTuneOptIn: !!r.fineTuneOptIn,
      unitName: r.unitName ?? "",
      grade: r.grade ?? "",
      genre: r.genre ?? "",
      createdAt: r.createdAt ?? null,
    }));

    return Response.json({ ok: true, rows: slim });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 401 });
  }
}
