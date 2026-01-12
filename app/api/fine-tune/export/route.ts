// app/api/fine-tune/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

export const runtime = "nodejs";

/** ====== 対象コレクション ====== */
const LESSON_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_discussion",
  "lesson_plans_writing",
  "lesson_plans_language_activity",
] as const;

const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_discussion",
  "practiceRecords_writing",
  "practiceRecords_language_activity",
] as const;

/** ====== 学習用 system ====== */
const TRAIN_SYSTEM_LESSON = `
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
  "タグ": ["string", ...]  // 任意。本文から抽出した短いキーワード
}

【品質要件】
- 個人情報（氏名・メール・電話・URLなど）は含めない（見つけたら <MASK> に置換）。
- 文章は自然な日本語で、振り返りはそのまま維持する（要約しすぎない）。
`.trim();

/** ====== 共通 ====== */
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

type LessonStoredDoc = {
  ownerUid?: string;
  userPromptText?: string;
  result?: any;
  fineTuneOptIn?: boolean;
};

type PracticeStoredDoc = {
  ownerUid?: string;
  practiceDate?: string;
  authorName?: string; // ニックネーム
  grade?: string;
  genre?: string;
  unitName?: string; // 教材名
  lessonTitle?: string;
  reflection?: string;
  boardImages?: { name?: string; src?: string }[];
  fineTuneOptIn?: boolean;
};

type Dataset = "practice" | "lesson";

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const isAdmin = decoded.admin === true;

    const dataset = ((req.nextUrl.searchParams.get("dataset") || "practice").toLowerCase() as Dataset);
    const scope = (req.nextUrl.searchParams.get("scope") || "mine").toLowerCase(); // mine | all
    if (scope === "all" && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const maxTotal = Math.min(Number(req.nextUrl.searchParams.get("maxTotal") || "2000"), 5000);
    const pageSize = Math.min(Number(req.nextUrl.searchParams.get("pageSize") || "500"), 1000);

    // scope=all のとき opt-in のみ（デフォルトON）
    const optInOnly = (req.nextUrl.searchParams.get("optInOnly") ?? "1") !== "0";

    const lines: string[] = [];
    let total = 0;

    const db = getAdminDb();

    /** ====== LESSON ====== */
    const exportLesson = async () => {
      for (const colName of LESSON_COLLECTIONS) {
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

          const snap = await q.select("userPromptText", "result").get();
          if (snap.empty) break;

          for (const d of snap.docs) {
            if (total >= maxTotal) break;
            const data = d.data() as LessonStoredDoc;

            const userPrompt = (data.userPromptText || "").trim();
            const resultObj = data.result;
            if (!userPrompt || !resultObj) continue;

            const safePrompt = maskPII(userPrompt);
            const safeResult = sanitizeAny(resultObj);
            const assistantJson = JSON.stringify(safeResult);

            const sample = {
              messages: [
                { role: "system", content: TRAIN_SYSTEM_LESSON },
                { role: "user", content: safePrompt },
                { role: "assistant", content: assistantJson },
              ],
            };

            lines.push(JSON.stringify(sample));
            total++;
          }

          lastDocId = snap.docs[snap.docs.length - 1]?.id ?? null;
          if (!lastDocId || snap.size < pageSize) break;
        }
      }
    };

    /** ====== PRACTICE（実践中心） ====== */
    const exportPractice = async () => {
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

          // 必要なフィールドだけ読む
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

            // user には「素材（実践内容）」を入れる
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

            // assistant は「構造化JSON」を出す（＝学習ターゲット）
            const assistantPayload = {
              実践開始日: userPayload.実践開始日,
              作成者名: userPayload.作成者名,
              学年: userPayload.学年,
              ジャンル: userPayload.ジャンル,
              教材名: userPayload.教材名,
              授業案タイトル: userPayload.授業案タイトル,
              振り返り: userPayload.振り返り,
              板書写真枚数: userPayload.板書写真枚数,
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
    };

    if (dataset === "lesson") await exportLesson();
    else await exportPractice(); // デフォルト practice

    const jsonl = lines.join("\n") + (lines.length ? "\n" : "");
    const today = new Date().toISOString().slice(0, 10);
    const filename =
      dataset === "lesson"
        ? scope === "all"
          ? `train_lesson_all_${today}.jsonl`
          : `train_lesson_${uid}.jsonl`
        : scope === "all"
        ? `train_practice_all_${today}.jsonl`
        : `train_practice_${uid}.jsonl`;

    return new NextResponse(jsonl, {
      status: 200,
      headers: {
        "content-type": "application/jsonl; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Export failed" }, { status: 500 });
  }
}
