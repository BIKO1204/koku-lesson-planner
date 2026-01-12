// lib/fineTune/query.ts
import { getAdminDb } from "@/lib/firebaseAdmin";
import { collectionsByTarget, type FineTuneTarget } from "@/lib/fineTune/collections";

type Args = {
  target: FineTuneTarget;
  scope: "all" | "mine";
  ownerUid?: string;     // scope==="mine" の時だけ入れる
  optInOnly: boolean;
  limit: number;
};

export async function fetchFineTuneDocs(args: Args) {
  const db = getAdminDb();
  const colls = collectionsByTarget[args.target];

  const out: any[] = [];
  for (const collName of colls) {
    // ★ opt-in 条件や ownerUid 条件はデータ構造に合わせて調整
    let q: FirebaseFirestore.Query = db.collection(collName);

    if (args.scope === "mine" && args.ownerUid) {
      q = q.where("ownerUid", "==", args.ownerUid);
    }
    if (args.optInOnly) {
      q = q.where("fineTuneOptIn", "==", true);
    }

    const snap = await q.limit(args.limit).get();
    snap.forEach((d) => out.push({ id: d.id, collection: collName, ...d.data() }));

    if (out.length >= args.limit) break;
  }

  return out.slice(0, args.limit);
}
