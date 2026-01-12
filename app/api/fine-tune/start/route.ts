// app/api/fine-tune/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

export const runtime = "nodejs";

/** ====== 対象 ====== */
const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_discussion",
  "practiceRecords_writing",
  "practiceRecords_language_activity",
] as const;

type Dataset = "practice" | "lesson";
type Scope = "mine" | "all";

const TRAIN_SYSTEM_PRACTICE = `
あなたは小学校国語の授業の実践記録を「研究用の構造化JSON」に整える専門家です。
必ずJSONのみを返してください（説明文は禁止）。

【出力スキーマ（必須キー）】
{
  "実践開始日": "YYYY-MM-DD",
  "作成者名": "ニックネーム",
  "学年": "1年|2年|3年|4年|5年|6年",
  "ジャンル": "物語文|説明文|詩|その他",
  "教材名": "string",
  "授業案タイトル": "string",
  "振り返り": "string",
  "板書写真枚数": number,
  "タグ": ["string", ...]
}

【品質要件】
- 個人情報（氏名・メール・電話・URLなど）は含めない（見つけたら <MASK> に置換）。
- 文章は自然な日本語で、振り返りはそのまま維持する（要約しすぎない）。
`.trim();

/** ====== util ====== */
function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

function maskPII(s: string): string {
  if (!s) return s;
  let out = s;
  out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "<EMAIL>");
  out = out.replace(/(\+?\d{1,3}[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g, "<PHONE>");
  out = out.replace(/https?:\/\/[^\s)]+/gi, "<URL>");
  out = out.replace(/\b[a-f0-9]{16,64}\b/gi, "<TOKEN>");
  out = out.replace(/\b\d{8,}\b/g, "<NUMBER>");
  return out;
}

type PracticeStoredDoc = {
  ownerUid?: string;
  practiceDate?: string;
  authorName?: string;
  grade?: string;
  genre?: string;
  unitName?: string;
  lessonTitle?: string;
  reflection?: string;
  boardImages?: { name?: string; src?: string }[];
  fineTuneOptIn?: boolean;
};

async function buildPracticeJsonl(opts: {
  uid: string;
  scope: Scope;
  isAdmin: boolean;
  optInOnly: boolean;
  maxTotal: number;
  pageSize: number;
}) {
  const { uid, scope, isAdmin, optInOnly, maxTotal, pageSize } = opts;

  if (scope === "all" && !isAdmin) throw new Error("Forbidden");

  const db = getAdminDb();
  const lines: string[] = [];
  let total = 0;

  for (const colName of PRACTICE_COLLECTIONS) {
    if (total >= maxTotal) break;

    const colRef = db.collection(colName);
    let lastDocId: string | null = null;

    while (total < maxTotal) {
      let q = colRef.orderBy(FieldPath.documentId()).limit(pageSize);

      if (scope !== "all") {
        q = colRef.where("ownerUid", "==", uid).orderBy(FieldPath.documentId()).limit(pageSize);
      } else if (optInOnly) {
        q = colRef.where("fineTuneOptIn", "==", true).orderBy(FieldPath.documentId()).limit(pageSize);
      }

      if (lastDocId) q = q.startAfter(lastDocId);

      const snap = await q
        .select("practiceDate", "authorName", "grade", "genre", "unitName", "lessonTitle", "reflection", "boardImages")
        .get();

      if (snap.empty) break;

      for (const d of snap.docs) {
        if (total >= maxTotal) break;
        const data = d.data() as PracticeStoredDoc;

        const practiceDate = (data.practiceDate || "").trim();
        const authorName = (data.authorName || "").trim();
        const grade = (data.grade || "").trim();
        const genre = (data.genre || "").trim();
        const unitName = (data.unitName || "").trim();
        const lessonTitle = (data.lessonTitle || "").trim();
        const reflection = (data.reflection || "").trim();

        if (!practiceDate || !authorName || !grade || !genre || !unitName || !reflection) continue;

        const imagesCount = Array.isArray(data.boardImages) ? data.boardImages.length : 0;

        const userPayload = {
          実践開始日: maskPII(practiceDate),
          作成者名: maskPII(authorName),
          学年: maskPII(grade),
          ジャンル: maskPII(genre),
          教材名: maskPII(unitName),
          授業案タイトル: maskPII(lessonTitle || unitName),
          振り返り: maskPII(reflection),
          板書写真枚数: imagesCount,
        };

        const assistantPayload = {
          ...userPayload,
          タグ: [] as string[],
        };

        const sample = {
          messages: [
            { role: "system", content: TRAIN_SYSTEM_PRACTICE },
            { role: "user", content: JSON.stringify(userPayload) },
            { role: "assistant", content: JSON.stringify(assistantPayload) },
          ],
        };

        lines.push(JSON.stringify(sample));
        total++;
      }

      lastDocId = snap.docs[snap.docs.length - 1]?.id ?? null;
      if (!lastDocId || snap.size < pageSize) break;
    }
  }

  return lines.join("\n") + (lines.length ? "\n" : "");
}

/** ====== OpenAI helper ====== */
async function uploadJsonlToOpenAI(jsonl: string, filename: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  // multipart/form-data
  const form = new FormData();
  form.append("purpose", "fine-tune");
  form.append(
    "file",
    new Blob([jsonl], { type: "application/jsonl" }),
    filename
  );

  const res = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI file upload failed");
  return data?.id as string; // file id
}

async function createFineTuneJob(trainingFileId: string, suffix?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseModel = process.env.OPENAI_FINE_TUNE_BASE_MODEL;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  if (!baseModel) throw new Error("Missing OPENAI_FINE_TUNE_BASE_MODEL");

  const body: any = {
    model: baseModel,
    training_file: trainingFileId,
  };
  if (suffix) body.suffix = suffix;

  const res = await fetch("https://api.openai.com/v1/fine_tuning/jobs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI fine-tune create failed");
  return data;
}

/** ====== POST ====== */
export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const isAdmin = decoded.admin === true;

    const body = await req.json().catch(() => ({}));
    const dataset: Dataset = (String(body.dataset || "practice").toLowerCase() as Dataset);
    const scope: Scope = (String(body.scope || "all").toLowerCase() as Scope); // 管理者運用はall想定
    const optInOnly: boolean = body.optInOnly !== false; // default true

    const maxTotal = Math.min(Number(body.maxTotal || 2000), 5000);
    const pageSize = Math.min(Number(body.pageSize || 500), 1000);

    if (dataset !== "practice") {
      return NextResponse.json(
        { error: "This start route is configured for practice dataset only. Use export for lesson." },
        { status: 400 }
      );
    }

    const jsonl = await buildPracticeJsonl({ uid, scope, isAdmin, optInOnly, maxTotal, pageSize });
    if (!jsonl.trim()) return NextResponse.json({ error: "No training samples" }, { status: 400 });

    const today = new Date().toISOString().slice(0, 10);
    const filename = scope === "all" ? `train_practice_all_${today}.jsonl` : `train_practice_${uid}.jsonl`;

    const fileId = await uploadJsonlToOpenAI(jsonl, filename);

    const suffix = body.suffix ? String(body.suffix) : `practice-${today}`;
    const job = await createFineTuneJob(fileId, suffix);

    // （任意）Firestoreにジョブログ保存
    try {
      await getAdminDb().collection("fineTuneJobs").add({
        createdAt: new Date(),
        createdByUid: uid,
        scope,
        optInOnly,
        dataset,
        openaiFileId: fileId,
        openaiJob: job,
      });
    } catch {}

    return NextResponse.json({ ok: true, fileId, job }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Fine-tune start failed" }, { status: 500 });
  }
}
