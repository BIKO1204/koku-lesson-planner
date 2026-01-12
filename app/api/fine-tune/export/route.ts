// app/api/fine-tune/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

export const runtime = "nodejs";

/** 授業案コレクション */
const LESSON_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_discussion",
  "lesson_plans_writing",
  "lesson_plans_language_activity",
] as const;

/** 実践コレクション */
const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_writing",
  "practiceRecords_discussion",
  "practiceRecords_language_activity",
] as const;

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
あなたは小学校国語の授業改善・省察（振り返り）を支援する専門家です。
必ずJSONのみを返してください（説明文は禁止）。

【出力スキーマ】
{
  "振り返り": "…",
  "よかった点": ["…"],
  "改善点": ["…"],
  "次時の手立て": ["…"]
}

【品質要件】
- 「振り返り」は教師の省察として自然な文章（2〜6文程度）。
- 「よかった点／改善点／次時の手立て」は観察可能な事実と手立てで具体化。
- 個人情報（児童の氏名・顔等）に触れない。
`.trim();

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

/** 授業案doc */
type LessonDoc = {
  ownerUid?: string;
  userPromptText?: string;
  result?: any;
  fineTuneOptIn?: boolean;
};

/** 実践doc（あなたのPracticeAddPage保存形式に合わせる） */
type PracticeDoc = {
  ownerUid?: string;
  reflection?: string;
  grade?: string;
  genre?: string;
  unitName?: string;
  lessonTitle?: string;
  modelType?: string; // lesson_plans_*
  fineTuneOptIn?: boolean;
};

function toLessonCollectionFromPractice(coll: string) {
  return coll.replace("practiceRecords_", "lesson_plans_");
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const isAdmin = decoded.admin === true;

    const target = (req.nextUrl.searchParams.get("target") || "lesson").toLowerCase(); // lesson | practice
    if (target !== "lesson" && target !== "practice") {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const scope = (req.nextUrl.searchParams.get("scope") || "mine").toLowerCase(); // mine | all
    if (scope === "all" && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const maxTotal = Math.min(Number(req.nextUrl.searchParams.get("maxTotal") || "2000"), 5000);
    const pageSize = Math.min(Number(req.nextUrl.searchParams.get("pageSize") || "500"), 1000);

    // scope=all のときだけ opt-in を効かせる想定（デフォルトON）
    const optInOnly = (req.nextUrl.searchParams.get("optInOnly") ?? "1") !== "0";

    const db = getAdminDb();
    const lines: string[] = [];
    let total = 0;

    // 授業案の result を繰り返し読むのを減らす軽いキャッシュ
    const lessonCache = new Map<string, any>(); // key: `${collection}/${id}`

    const collections = target === "lesson" ? LESSON_COLLECTIONS : PRACTICE_COLLECTIONS;

    for (const colName of collections as readonly string[]) {
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

        const snap =
          target === "lesson"
            ? await q.select("userPromptText", "result").get()
            : await q.select("reflection", "grade", "genre", "unitName", "lessonTitle", "modelType").get();

        if (snap.empty) break;

        for (const d of snap.docs) {
          if (total >= maxTotal) break;

          const id = d.id;

          if (target === "lesson") {
            const data = d.data() as LessonDoc;
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
            continue;
          }

          // target === "practice"
          const p = d.data() as PracticeDoc;
          const reflection = (p.reflection || "").trim();
          if (!reflection) continue;

          // 対応する授業案 result を引っ張って「入力」にする（実践の中身＝学習対象）
          const lessonColl = (p.modelType && p.modelType.startsWith("lesson_plans_"))
            ? p.modelType
            : toLessonCollectionFromPractice(colName);

          const cacheKey = `${lessonColl}/${id}`;
          let lessonResult: any = lessonCache.get(cacheKey);

          if (lessonResult === undefined) {
            const lessonSnap = await db.collection(lessonColl).doc(id).get();
            lessonResult = lessonSnap.exists ? (lessonSnap.data() as any)?.result : null;
            lessonCache.set(cacheKey, lessonResult ?? null);
          }

          if (!lessonResult) continue;

          const safeLesson = sanitizeAny(lessonResult);
          const safeReflection = maskPII(reflection);

          const userPayload = {
            学年: p.grade || "",
            ジャンル: p.genre || "",
            教材名: p.unitName || "",
            授業タイトル: p.lessonTitle || "",
            授業案JSON: safeLesson,
          };

          // assistantは“JSON”で返す約束にする（後で使いやすい）
          const assistantPayload = {
            振り返り: safeReflection,
            よかった点: [],
            改善点: [],
            次時の手立て: [],
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
        if (!lastDocId) break;
        if (snap.size < pageSize) break;
      }
    }

    const jsonl = lines.join("\n") + (lines.length ? "\n" : "");
    const filenameBase =
      target === "practice"
        ? "practice"
        : "lesson";

    const filename =
      scope === "all"
        ? `train_${filenameBase}_all_${new Date().toISOString().slice(0, 10)}.jsonl`
        : `train_${filenameBase}_${uid}.jsonl`;

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
