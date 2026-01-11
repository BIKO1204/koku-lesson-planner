// app/api/fine-tune/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

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
  userPromptText?: string; // lastPrompt
  result?: any;            // 生成JSON
};

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "500"), 2000);

    const lines: string[] = [];

    for (const colName of COLLECTIONS) {
      const snap = await getAdminDb()
        .collection(colName)
        .where("ownerUid", "==", uid)
        .limit(limit)
        .get();

      for (const d of snap.docs) {
        const data = d.data() as StoredDoc;

        const userPrompt = (data.userPromptText || "").trim();
        const resultObj = data.result;

        if (!userPrompt || !resultObj) continue;

        // assistantは「JSON文字列だけ」にする（学習が安定）
        const assistantJson = JSON.stringify(resultObj);

        const sample = {
          messages: [
            { role: "system", content: TRAIN_SYSTEM },
            { role: "user", content: userPrompt },
            { role: "assistant", content: assistantJson },
          ],
        };

        // JSONL：1行=1JSON
        lines.push(JSON.stringify(sample));
      }
    }

    const jsonl = lines.join("\n") + (lines.length ? "\n" : "");

    return new NextResponse(jsonl, {
      status: 200,
      headers: {
        "content-type": "application/jsonl; charset=utf-8",
        "content-disposition": `attachment; filename="train_${uid}.jsonl"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
