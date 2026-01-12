// app/api/admin/fine-tune/list/route.ts
import { requireAdminFromRequest } from "@/lib/fineTune/auth";
import { fetchFineTuneDocs } from "@/lib/fineTune/query";
import {
  normalizeFineTuneTarget,
  type FineTuneTarget,
} from "@/lib/fineTune/collections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdminFromRequest(req);

    const { searchParams } = new URL(req.url);

    // ★ lesson は互換として plan に寄せる（normalize で吸収）
    const rawTarget = searchParams.get("target") || "practice";
    const target = normalizeFineTuneTarget(rawTarget) ?? "practice";

    const optInOnly = searchParams.get("optInOnly") === "1";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const rows = await fetchFineTuneDocs({
      target,          // FineTuneTarget
      scope: "all",
      optInOnly,
      limit,
    });

    // UI用に軽量化（fetchFineTuneDocs 側の形に合わせる）
    const slim = rows.map((r: any) => ({
      id: r.id,
      collection: r.collection ?? r.coll ?? "", // どっちでも拾う
      fineTuneOptIn: !!r.fineTuneOptIn,
      unitName: r.unitName ?? "",
      grade: r.grade ?? "",
      genre: r.genre ?? "",
      createdAt: r.createdAt ?? null,
      // targetが plan の場合に unitName/grade/genre が無いこともあるので空でOK
    }));

    return Response.json({ ok: true, target, rows: slim });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 401 });
  }
}
