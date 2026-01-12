// lib/fineTune/query.ts
import { getAdminDb } from "@/lib/firebaseAdmin";
import { collectionsByTarget, FineTuneTarget } from "@/lib/fineTune/collections";

type Scope = "all" | "mine";

export async function fetchFineTuneDocs(opts: {
  target: FineTuneTarget;
  scope: Scope;
  ownerUid?: string;      // mineの場合に使う（必要なら）
  optInOnly: boolean;
  limit: number;
}) {
  const db = getAdminDb();
  const colls = collectionsByTarget(opts.target);

  const results: any[] = [];
  for (const coll of colls) {
    let q: FirebaseFirestore.Query = db.collection(coll);

    if (opts.optInOnly) q = q.where("fineTuneOptIn", "==", true);
    if (opts.scope === "mine" && opts.ownerUid) q = q.where("ownerUid", "==", opts.ownerUid);

    q = q.orderBy("createdAt", "desc").limit(opts.limit);

    const snap = await q.get();
    snap.docs.forEach((d) => results.push({ id: d.id, coll, ...d.data() }));
  }

  return results;
}
