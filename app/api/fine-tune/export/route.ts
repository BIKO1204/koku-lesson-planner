// app/api/fine-tune/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

export const runtime = "nodejs";

const COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_discussion",
  "lesson_plans_writing",
  "lesson_plans_language_activity",
] as const;

const TRAIN_SYSTEM = `
あなたは小学校国語の授業設計の専門家です。
必ずスキーマ準拠のJSONのみを返してください（説明文は禁止）。

【品質要件】
- 「単元の目標」は学習者の到達像が分かる1〜3文で具体化する。
- 「評価の観点」は各観点2〜5項目の配列で、観察可能な行動で書く。
- 「言語活動の工夫」は“何を／どの形式で／どう交流するか”が分かる具体で書く。
- 入力が空欄の時間目は、前後の流れに整合するよう補完する。
- 「教材名」を正式キーとして必ず含める（互換のため必要なら「単元名」も同値で含めてよい）。

【授業の流れ（表示要件）】
- 各「n時間目」の値は、箇条書きや見出しに分けず、連続した文章（1〜2段落）として書く。
- 文章の中に自然に「教師の手立て」「子どもの活動」「評価の見取り」が読み取れるように含める。
`.trim();

function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

type StoredDoc = {
  ownerUid?: string;
  userPromptText?: string;
  result?: any;
  allowTrain?: boolean; // ✅ 同意フラグ（Firestore保存側に合わせる）
  allowTrainVersion?: string;
};

function maskPII(s: string): string {
  if (!s) return s;
  let out = s;

  // Email
  out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "<EMAIL>");
  // Phone (ざっくり)
  out = out.replace(/(\+?\d{1,3}[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g, "<PHONE>");
  // URL
  out = out.replace(/https?:\/\/[^\s)]+/gi, "<URL>");
  // 16〜64桁くらいのトークン/IDっぽいもの
  out = out.replace(/\b[a-f0-9]{16,64}\b/gi, "<TOKEN>");
  // 長い連番
  out = out.replace(/\b\d{8,}\b/g, "<NUMBER>");

  return out;
}

function sanitizeAny(v: any): any {
  if (v == null) return v;
  if (typeof v === "string") return maskPII(v);
  if (Array.isArray(v)) return v.map(sanitizeAny);
  if (typeof v === "object") {
    const o: any = {};
    for (const [k, val] of Object.entries(v)) o[k] = sanitizeAny(val);
    return o;
  }
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const isAdmin = decoded.admin === true; // custom claims: admin:true

    const scope = (req.nextUrl.searchParams.get("scope") || "mine").toLowerCase(); // mine | all
    if (scope === "all" && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ UIが /export?limit=500 を叩いているので互換で受ける
    const limitParam = req.nextUrl.searchParams.get("limit");
    const maxTotalRaw = req.nextUrl.searchParams.get("maxTotal") || limitParam || "2000";
    const pageSizeRaw = req.nextUrl.searchParams.get("pageSize") || "500";

    const maxTotal = Math.min(Number(maxTotalRaw || "2000"), 5000);
    const pageSize = Math.min(Number(pageSizeRaw || "500"), 1000);

    // ✅ scope=all のときは opt-in のみ（デフォルトON）
    // optInOnly=0 を付けると全件（※運用上は基本おすすめしない）
    const optInOnly = (req.nextUrl.searchParams.get("optInOnly") ?? "1") !== "0";

    const lines: string[] = [];
    let total = 0;

    for (const colName of COLLECTIONS) {
      if (total >= maxTotal) break;

      const colRef = getAdminDb().collection(colName);

      // ページング用：docIdで走査
      let lastDocId: string | null = null;

      while (total < maxTotal) {
        let q = colRef.orderBy(FieldPath.documentId()).limit(pageSize);

        if (scope !== "all") {
          // mine: 自分のデータのみ
          q = colRef.where("ownerUid", "==", uid).orderBy(FieldPath.documentId()).limit(pageSize);

          // （任意）mineでも optInOnly=1 の場合だけ同意ONに絞る
          if (optInOnly) {
            // Firestoreは where を複数つけてもOK（等価フィルタ）
            q = colRef
              .where("ownerUid", "==", uid)
              .where("allowTrain", "==", true)
              .orderBy(FieldPath.documentId())
              .limit(pageSize);
          }
        } else {
          // all: 管理者
          if (optInOnly) {
            q = colRef.where("allowTrain", "==", true).orderBy(FieldPath.documentId()).limit(pageSize);
          }
        }

        if (lastDocId) q = q.startAfter(lastDocId);

        // ✅ 必要なフィールドだけ読む（コスト＆漏えい対策）
        const snap = await q.select("userPromptText", "result").get();
        if (snap.empty) break;

        for (const d of snap.docs) {
          if (total >= maxTotal) break;

          const data = d.data() as StoredDoc;

          const userPrompt = (data.userPromptText || "").trim();
          const resultObj = data.result;
          if (!userPrompt || !resultObj) continue;

          // 匿名化（prompt/result 両方）
          const safePrompt = maskPII(userPrompt);
          const safeResult = sanitizeAny(resultObj);

          // assistantは「JSON文字列だけ」
          const assistantJson = JSON.stringify(safeResult);

          const sample = {
            messages: [
              { role: "system", content: TRAIN_SYSTEM },
              { role: "user", content: safePrompt },
              { role: "assistant", content: assistantJson },
            ],
          };

          lines.push(JSON.stringify(sample));
          total++;
        }

        lastDocId = snap.docs[snap.docs.length - 1]?.id ?? null;
        if (!lastDocId) break;

        // 次ページへ
        if (snap.size < pageSize) break;
      }
    }

    const jsonl = lines.join("\n") + (lines.length ? "\n" : "");
    const filename =
      scope === "all"
        ? `train_all_${new Date().toISOString().slice(0, 10)}.jsonl`
        : `train_${uid}.jsonl`;

    return new NextResponse(jsonl, {
      status: 200,
      headers: {
        // jsonl の一般的なMIME
        "content-type": "application/x-ndjson; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
