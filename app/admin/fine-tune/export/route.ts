// app/api/admin/fine-tune/export/route.ts
import { requireAdminFromRequest } from "@/lib/fineTune/auth";
import { fetchFineTuneDocs } from "@/lib/fineTune/query";
import { toJsonlLines } from "@/lib/fineTune/jsonl";
import { normalizeFineTuneTarget } from "@/lib/fineTune/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAdminFromRequest(req);

    const { searchParams } = new URL(req.url);

    const targetRaw = searchParams.get("target") || "practice";
    const target = normalizeFineTuneTarget(targetRaw);
    if (!target) return new Response("invalid target", { status: 400 });

    const scope = (searchParams.get("scope") || "all") as "all" | "mine";
    const optInOnly = searchParams.get("optInOnly") === "1";
    const limit = Math.min(parseInt(searchParams.get("limit") || "2000", 10), 5000);

    const rows = await fetchFineTuneDocs({
      target,
      scope,
      ownerUid: scope === "mine" ? admin.uid : undefined,
      optInOnly,
      limit,
    });

    const lines = toJsonlLines(target, rows).join("\n") + "\n";
    const filename = `train_${target}_${scope}${optInOnly ? "_optin" : ""}.jsonl`;

    return new Response(lines, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 401 });
  }
}
