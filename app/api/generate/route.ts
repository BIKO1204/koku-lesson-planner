// app/api/generate/route.ts
import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const JSON_SCHEMA: Record<string, any> = {
  type: "object",
  additionalProperties: false,
  required: [
    "教科書名",
    "学年",
    "ジャンル",
    "教材名",
    "授業時間数",
    "単元の目標",
    "評価の観点",
    "育てたい子どもの姿",
    "授業の流れ",
    "言語活動の工夫",
    "結果",
  ],
  properties: {
    "教科書名": { type: "string" },
    "学年": { type: "string" },
    "ジャンル": { type: "string" },

    "教材名": { type: "string" },
    "単元名": { type: "string" }, // 後方互換（任意）

    "授業時間数": { type: "integer", minimum: 1 },

    "単元の目標": { type: "string" },

    "評価の観点": {
      type: "object",
      additionalProperties: false,
      required: ["知識・技能", "思考・判断・表現", "主体的に学習に取り組む態度"],
      properties: {
        "知識・技能": { type: "array", items: { type: "string" } },
        "思考・判断・表現": { type: "array", items: { type: "string" } },
        "主体的に学習に取り組む態度": { type: "array", items: { type: "string" } },
      },
    },

    "育てたい子どもの姿": { type: "string" },

    "授業の流れ": {
      type: "object",
      patternProperties: { "^\\d+時間目$": { type: "string" } },
      additionalProperties: false,
    },

    "言語活動の工夫": { type: "string" },
    "結果": { type: "string" },
  },
};

function pickModel(): string {
  return (
    (process.env.OPENAI_MODEL || "").trim() ||
    (process.env.OPENAI_BASE_MODEL || "").trim() ||
    "gpt-4o-2024-08-06"
  );
}

/** 全角数字→半角数字 */
function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/g, (d) => String("０１２３４５６７８９".indexOf(d)));
}

function extractHoursFromPrompt(prompt: string): number {
  const m = prompt.match(/【授業時間数】\s*([0-9０-９]+)/);
  if (!m) return 0;
  const n = Number(normalizeDigits(String(m[1])));
  return Number.isFinite(n) ? n : 0;
}

function toStringArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter((x) => x.trim().length > 0);
  if (v == null) return [];
  const s = String(v).trim();
  return s ? [s] : [];
}

function normalizeKeysAndShapes(obj: any, expectedHours: number) {
  if (!obj || typeof obj !== "object") obj = {};

  // 教材名/単元名 互換
  if (!obj["教材名"] && obj["単元名"]) obj["教材名"] = obj["単元名"];
  if (!obj["単元名"] && obj["教材名"]) obj["単元名"] = obj["教材名"];

  // 授業時間数は期待値に合わせる（モデル側のズレ防止）
  obj["授業時間数"] = Math.max(1, Math.floor(expectedHours || Number(obj["授業時間数"]) || 1));

  // 評価の観点：文字列で返ってきても配列化
  if (!obj["評価の観点"] || typeof obj["評価の観点"] !== "object") obj["評価の観点"] = {};
  const ev = obj["評価の観点"];
  ev["知識・技能"] = toStringArray(ev["知識・技能"]);
  ev["思考・判断・表現"] = toStringArray(ev["思考・判断・表現"]);
  // 態度 というキーで返る事故に備えて吸収（Client の applyParsedResultToInputs と整合）
  const att = ev["主体的に学習に取り組む態度"] ?? ev["態度"];
  ev["主体的に学習に取り組む態度"] = toStringArray(att);
  delete ev["態度"];

  // 結果キーが抜けた時の保険
  if (typeof obj["結果"] !== "string") obj["結果"] = String(obj["結果"] ?? "");

  return obj;
}

function ensureFlowKeys(obj: any, hours: number) {
  const h = Math.max(1, Math.floor(hours || 0));

  if (!obj || typeof obj !== "object") obj = {};
  if (!obj["授業の流れ"] || typeof obj["授業の流れ"] !== "object") obj["授業の流れ"] = {};

  const flow = obj["授業の流れ"] as Record<string, any>;

  // 必須キー生成
  for (let i = 1; i <= h; i++) {
    const k = `${i}時間目`;
    if (typeof flow[k] !== "string") flow[k] = String(flow[k] ?? "").trim();
    if (!flow[k]) flow[k] = ""; // 空で保持（後で補完対象）
  }

  // 余計なキー削除
  for (const k of Object.keys(flow)) {
    const m = k.match(/^(\d+)時間目$/);
    if (!m) {
      delete flow[k];
      continue;
    }
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 1 || n > h) delete flow[k];
  }

  return obj;
}

function stripHourPrefixFromFlow(obj: any) {
  const flow = obj?.["授業の流れ"];
  if (!flow || typeof flow !== "object") return obj;

  for (const k of Object.keys(flow)) {
    const v = String(flow[k] ?? "");
    flow[k] = v
      .replace(/^\s*(第?\s*[0-9０-９]+\s*(時間目|時))\s*(は|:|：|-|—|ー)?\s*/u, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return obj;
}

function missingFlowKeys(obj: any, hours: number): string[] {
  const h = Math.max(1, Math.floor(hours || 0));
  const flow = obj?.["授業の流れ"];
  const miss: string[] = [];
  for (let i = 1; i <= h; i++) {
    const k = `${i}時間目`;
    if (!flow || typeof flow !== "object" || !flow[k] || !String(flow[k]).trim()) miss.push(k);
  }
  return miss;
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  if (!prompt) return NextResponse.json({ error: "prompt が必要です" }, { status: 400 });

  const model = pickModel();
  const temperature = Number(process.env.GENERATE_TEMPERATURE ?? 0.4);
  const maxTokens = Number(process.env.GENERATE_MAX_TOKENS ?? 2600);

  const hoursFromBody = Number(body?.hours ?? 0); // いまClientは送ってないが、将来のために対応
  const hoursFromPrompt = extractHoursFromPrompt(prompt);
  const expectedHours = Math.max(1, Math.floor(hoursFromBody || hoursFromPrompt || 1));

  const system = `
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
- 文章の中に自然に「教師の手立て」「子どもの活動（個/ペア/全体/グループ）」「評価の見取り」が読み取れるように含める。
- 各時間目の文章の冒頭に「〇時間目は」「第〇時は」などのラベルを付けない（文章から開始）。
  `.trim();

  const callOnce = async (userContent: string, strictSchema: boolean) => {
    const resp = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: strictSchema
        ? {
            type: "json_schema",
            json_schema: { name: "LessonPlan", strict: true, schema: JSON_SCHEMA },
          }
        : { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    });

    return resp.choices?.[0]?.message?.content ?? "{}";
  };

  const parseJson = (text: string) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      // ありがちな「前後に文章が付く」事故の保険（最初の { から最後の } までを抜く）
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first >= 0 && last > first) {
        return JSON.parse(text.slice(first, last + 1));
      }
      throw e;
    }
  };

  try {
    // 1st（厳格スキーマ）
    const text1 = await callOnce(prompt, true);
    let obj = parseJson(text1);

    obj = normalizeKeysAndShapes(obj, expectedHours);
    obj = ensureFlowKeys(obj, expectedHours);

    // 欠けがあるなら「欠けだけ埋める」2nd → マージ
    const miss = missingFlowKeys(obj, expectedHours);
    if (miss.length > 0) {
      const repairPrompt = `
以下は授業案JSONの途中結果です。
欠けている時間目だけを、条件を満たす文章で補完してください。
既存の時間目の文章は変更せず、欠けているキー（空文字を含む）だけを埋めてください。
必ず「授業の流れ」に 1時間目〜${expectedHours}時間目 の全キーを含めてください。
各時間の文章は120〜200字程度。冒頭に「〇時間目は」を付けない。箇条書き禁止。

【元の依頼プロンプト】
${prompt}

【途中結果JSON】
${JSON.stringify(obj, null, 2)}

【欠けているキー】
${miss.join("、")}
      `.trim();

      const text2 = await callOnce(repairPrompt, true);
      const obj2raw = parseJson(text2);

      let obj2 = normalizeKeysAndShapes(obj2raw, expectedHours);
      obj2 = ensureFlowKeys(obj2, expectedHours);

      // ★ここが重要：欠けキーだけをマージ（既存時間の改変を防ぐ）
      const flow = obj["授業の流れ"] as Record<string, string>;
      const flow2 = obj2["授業の流れ"] as Record<string, string>;
      for (const k of miss) {
        const v = String(flow2?.[k] ?? "").trim();
        if (v) flow[k] = v;
      }
    }

    obj = stripHourPrefixFromFlow(obj);

    const res = NextResponse.json(obj);
    res.headers.set("X-OpenAI-Model-Used", model);
    return res;
  } catch (e) {
    // フォールバック：json_object（スキーマが厳しすぎる/モデルが非対応の時用）
    try {
      const text = await callOnce(prompt, false);
      let obj = parseJson(text);

      obj = normalizeKeysAndShapes(obj, expectedHours);
      obj = ensureFlowKeys(obj, expectedHours);
      obj = stripHourPrefixFromFlow(obj);

      const res = NextResponse.json(obj);
      res.headers.set("X-OpenAI-Model-Used", model);
      return res;
    } catch (e2: any) {
      return NextResponse.json(
        { error: e2?.message || "Internal Error", modelUsed: model },
        { status: 500 }
      );
    }
  }
}
