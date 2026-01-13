// lib/fineTune/query.ts
import { getAdminDb } from "@/lib/firebaseAdmin";
import { collectionsByTarget, type FineTuneTarget } from "@/lib/fineTune/collections";

type Args = {
  target: FineTuneTarget;
  scope: "all" | "mine";
  ownerUid?: string;
  optInOnly: boolean;
  limit: number;
};

export async function fetchFineTuneDocs(args: Args) {
  const db = getAdminDb();
  const colls = collectionsByTarget[args.target] ?? [];

  console.log("[fineTune] target=", args.target, "colls=", colls);

  const out: any[] = [];

  for (const collName of colls) {
    let q: FirebaseFirestore.Query = db.collection(collName);

    if (args.scope === "mine" && args.ownerUid) {
      q = q.where("ownerUid", "==", args.ownerUid);
    }
    if (args.optInOnly) {
      q = q.where("fineTuneOptIn", "==", true);
    }

    const remaining = Math.max(args.limit - out.length, 0);
    if (remaining === 0) break;

    // ★ まずは orderBy なしで “取れるか” を優先（index問題を避ける）
    const snap = await q.limit(remaining).get();

    console.log("[fineTune] coll=", collName, "got=", snap.size);

    snap.forEach((d) => out.push({ id: d.id, collection: collName, ...d.data() }));
    if (out.length >= args.limit) break;
  }

  console.log("[fineTune] total=", out.length);
  return out;
}
