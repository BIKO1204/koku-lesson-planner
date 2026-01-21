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
    教科書名: { type: "string" },
    学年: { type: "string" },
    ジャンル: { type: "string" },

    教材名: { type: "string" },
    単元名: { type: "string" }, // 後方互換（任意）

    授業時間数: { type: "integer", minimum: 1 },
    単元の目標: { type: "string" },
    評価の観点: {
      type: "object",
      additionalProperties: false,
      required: ["知識・技能", "思考・判断・表現", "主体的に学習に取り組む態度"],
      properties: {
        "知識・技能": { type: "array", items: { type: "string" } },
        "思考・判断・表現": { type: "array", items: { type: "string" } },
        "主体的に学習に取り組む態度": { type: "array", items: { type: "string" } },
      },
    },
    育てたい子どもの姿: { type: "string" },
    授業の流れ: {
      type: "object",
      patternProperties: { "^\\d+時間目$": { type: "string" } },
      additionalProperties: false,
    },
    言語活動の工夫: { type: "string" },
    結果: { type: "string" },
  },
};

function pickModel(): string {
  const m =
    (process.env.OPENAI_MODEL || "").trim() ||
    (process.env.OPENAI_BASE_MODEL || "").trim() ||
    "gpt-4o-2024-08-06";
  return m;
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeKeys(obj: any) {
  if (!obj || typeof obj !== "object") return obj;

  if (!obj["教材名"] && obj["単元名"]) obj["教材名"] = obj["単元名"];
  if (!obj["単元名"] && obj["教材名"]) obj["単元名"] = obj["教材名"];

  return obj;
}

/** prompt から授業時間数を推定（入力側が正なので、これを優先する） */
function extractRequestedHours(prompt: string): number | null {
  // 例：【授業時間数】11
  const m1 = prompt.match(/【授業時間数】\s*([0-9]{1,2})/);
  if (m1?.[1]) return Number(m1[1]);

  // 例：授業時間数: 11 / 授業時間数】11 / 授業時間数】 11
  const m2 = prompt.match(/授業時間数[^0-9]{0,10}([0-9]{1,2})/);
  if (m2?.[1]) return Number(m2[1]);

  return null;
}

function getMissingHourKeys(flow: any, hours: number): string[] {
  const missing: string[] = [];
  const obj = flow && typeof flow === "object" ? flow : {};
  for (let i = 1; i <= hours; i++) {
    const k = `${i}時間目`;
    const v = obj[k];
    if (typeof v !== "string" || v.trim().length === 0) missing.push(k);
  }
  return missing;
}

/** flow を 1..hours で必ず揃える（不足は空文字で埋める） */
function ensureFlowKeys(flow: any, hours: number): Record<string, string> {
  const src = flow && typeof flow === "object" ? flow : {};
  const out: Record<string, string> = {};
  for (let i = 1; i <= hours; i++) {
    const k = `${i}時間目`;
    const v = src[k];
    out[k] = typeof v === "string" ? v : "";
  }
  return out;
}

/** 不足時間目だけ補完する（既存の時間目は原則変更しない） */
async function repairMissingFlow(args: {
  model: string;
  temperature: number;
  maxTokens: number;
  baseSystem: string;
  originalPrompt: string;
  partial: any;
  requestedHours: number;
  missingKeys: string[];
}) {
  const { model, temperature, maxTokens, baseSystem, originalPrompt, partial, requestedHours, missingKeys } = args;

  const repairSystem = `
${baseSystem}

【重要：補完ルール】
- あなたは「授業の流れ」の欠けている時間目だけを補完する。
- 既に埋まっている時間目の文章は原則変更しない（必要でも最小修正）。
- 「授業の流れ」は 1時間目〜${requestedHours}時間目 を必ずすべて含めること。
- 各時間目の値は、箇条書きや見出しにせず、連続した文章（1〜2段落）で書くこと。
- 文字数目安は120〜200字／時間。
`.trim();

  const repairUser = `
以下は一度生成されたJSONです。授業時間数は ${requestedHours} です。
しかし、次の時間目が欠けています：${missingKeys.join("、")}

【既存JSON】
${JSON.stringify(partial, null, 2)}

【元の入力（参照）】
${originalPrompt}

—返却—
修正後の完全なJSON（スキーマ準拠）を返してください。
`.trim();

  // ※修復時は strict schema でもよいが、欠けを絶対埋めたいので json_object にして確実にパースする
  const fb = await openai.chat.completions.create({
    model,
    temperature: Math.min(temperature, 0.3),
    max_tokens: Math.max(maxTokens, 3500),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: repairSystem },
      { role: "user", content: repairUser },
    ],
  });

  const text = fb.choices?.[0]?.message?.content ?? "{}";
  const obj = normalizeKeys(safeJsonParse(text) ?? {});
  return obj;
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

  // ★重要：デフォルト 2000 は短すぎることが多い（特に 8時間以上）
  // ここを大きくする（環境変数で上書き可能）
  const maxTokens = Number(process.env.GENERATE_MAX_TOKENS ?? 6000);

  const system = `
あなたは小学校国語の授業設計の専門家です。
必ずスキーマ準拠のJSONのみを返してください（説明文は禁止）。

【品質要件】
- 「単元の目標」は学習者の到達像が分かる1〜3文で具体化する。
- 「評価の観点」は各観点2〜5項目の配列で、観察可能な行動で書く。
- 「言語活動の工夫」は“何を／どの形式で／どう交流するか”が分かる具体で書く。
- 入力が空欄の時間目は、前後の流れに整合するよう補完する。
- 「教材名」を正式キーとして必ず含める（互換のため必要なら「単元名」も同値で含めてよい）。

【授業の流れ（必須）】
- 「授業時間数」が N のとき、「授業の流れ」には 1時間目〜N時間目 を必ずすべて含める。
- 各「n時間目」の値は、箇条書きや見出し（例：教師の手立て：／評価：など）に分けず、
  連続した文章（1〜2段落）として書く。
- 文章の中に自然に「教師の手立て」「子どもの活動」「評価の見取り」が読み取れるように含める。
- 各時間の文字数は120〜200字程度を目安にする（長すぎ禁止／短すぎ禁止）。
`.trim();

  const requestedHours = extractRequestedHours(prompt);

  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: {
        type: "json_schema",
        json_schema: { name: "LessonPlan", strict: true, schema: JSON_SCHEMA },
      },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });

    const text = resp.choices?.[0]?.message?.content ?? "{}";
    let obj = normalizeKeys(safeJsonParse(text) ?? {});

    // ====== ここが「欠け対策」の本体 ======
    const hoursFromObj = Number(obj?.["授業時間数"] ?? 0);
    const targetHours = (requestedHours && requestedHours > 0 ? requestedHours : hoursFromObj) || 0;

    if (targetHours > 0) {
      // まず空で揃える（クライアント側で配列化したときに必ずN個になる）
      obj["授業時間数"] = targetHours;
      obj["授業の流れ"] = ensureFlowKeys(obj["授業の流れ"], targetHours);

      // 足りない時間目があるなら、追加で“不足分だけ”補完する（最大1回）
      const missing = getMissingHourKeys(obj["授業の流れ"], targetHours);
      if (missing.length > 0) {
        const repaired = await repairMissingFlow({
          model,
          temperature,
          maxTokens,
          baseSystem: system,
          originalPrompt: prompt,
          partial: obj,
          requestedHours: targetHours,
          missingKeys: missing,
        });

        // 修復結果の flow から “欠けていた分だけ” 埋める（既存は維持）
        const repairedFlow = ensureFlowKeys(repaired?.["授業の流れ"], targetHours);
        const mergedFlow: Record<string, string> = { ...(obj["授業の流れ"] as Record<string, string>) };
        for (const k of missing) {
          const v = repairedFlow[k];
          if (typeof v === "string" && v.trim().length > 0) mergedFlow[k] = v;
        }
        obj["授業の流れ"] = mergedFlow;
      }
    }
    // ====== ここまで ======

    const res = NextResponse.json(obj);
    res.headers.set("X-OpenAI-Model-Used", model);
    res.headers.set("X-Requested-Hours", String(requestedHours ?? ""));
    res.headers.set("X-Target-Hours", String(targetHours));
    return res;
  } catch (e: any) {
    // フォールバック：json_object
    try {
      const fb = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      });

      const text = fb.choices?.[0]?.message?.content ?? "{}";
      let obj = normalizeKeys(safeJsonParse(text) ?? {});

      const hoursFromObj = Number(obj?.["授業時間数"] ?? 0);
      const targetHours = (requestedHours && requestedHours > 0 ? requestedHours : hoursFromObj) || 0;

      if (targetHours > 0) {
        obj["授業時間数"] = targetHours;
        obj["授業の流れ"] = ensureFlowKeys(obj["授業の流れ"], targetHours);

        const missing = getMissingHourKeys(obj["授業の流れ"], targetHours);
        if (missing.length > 0) {
          const repaired = await repairMissingFlow({
            model,
            temperature,
            maxTokens,
            baseSystem: system,
            originalPrompt: prompt,
            partial: obj,
            requestedHours: targetHours,
            missingKeys: missing,
          });

          const repairedFlow = ensureFlowKeys(repaired?.["授業の流れ"], targetHours);
          const mergedFlow: Record<string, string> = { ...(obj["授業の流れ"] as Record<string, string>) };
          for (const k of missing) {
            const v = repairedFlow[k];
            if (typeof v === "string" && v.trim().length > 0) mergedFlow[k] = v;
          }
          obj["授業の流れ"] = mergedFlow;
        }
      }

      const res = NextResponse.json(obj);
      res.headers.set("X-OpenAI-Model-Used", model);
      res.headers.set("X-Requested-Hours", String(requestedHours ?? ""));
      res.headers.set("X-Target-Hours", String(targetHours));
      return res;
    } catch (e2: any) {
      return NextResponse.json(
        { error: e2?.message || "Internal Error", modelUsed: model },
        { status: 500 }
      );
    }
  }
}
