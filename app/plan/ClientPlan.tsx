"use client";

import { useEffect, useMemo, useRef, useState, CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { db, auth } from "../firebaseConfig";
import { doc, setDoc, collection, getDocs, serverTimestamp, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSession } from "next-auth/react";

/** 下書きをローカル保存するキー */
const EDIT_KEY = "editLessonPlan";

/** 固定の保存先カテゴリ（履歴コレクション） */
const authors = [
  { label: "読解", id: "reading-model-id", collection: "lesson_plans_reading" },
  { label: "話し合い", id: "discussion-model-id", collection: "lesson_plans_discussion" },
  { label: "作文", id: "writing-model-id", collection: "lesson_plans_writing" },
  { label: "言語活動", id: "language-activity-model-id", collection: "lesson_plans_language_activity" },
] as const;

type AuthorId = (typeof authors)[number]["id"];

type StyleModel = {
  id: string;
  name: string;
  content: string; // philosophy（教育観）
  evaluationFocus?: string; // 評価観点の重視点
  languageFocus?: string; // 言語活動の重視点
  childFocus?: string; // 育てたい子どもの姿
  creatorName?: string; // 作成者名（任意）
};

type ParsedResult = {
  [key: string]: any;
  評価の観点: {
    "知識・技能": string[] | string;
    "思考・判断・表現": string[] | string;
    "主体的に学習に取り組む態度": string[] | string;
    態度?: string[] | string;
  };
  /** 互換：object/array/string を許容 */
  授業の流れ?: Record<string, string> | string[] | string;
};

type EvaluationPoints = {
  knowledge: string[];
  thinking: string[];
  attitude: string[];
};

type LessonPlanStored = {
  id: string;
  subject: string;
  grade: string;
  genre: string;
  unit: string; // 内部名は維持（教材名の実体）
  hours: string | number;
  unitGoal: string;
  evaluationPoints: EvaluationPoints;
  childVision: string;
  lessonPlanList: string[];
  languageActivities: string;

  /** 互換用：既存ページが参照している可能性があるキー（中身は教育観モデルIDに統一） */
  selectedStyleId: string;

  /** 新：4分類 */
  authorId: AuthorId;
  authorLabel: string;

  /** 新：教育観モデル（任意） */
  educationModelId?: string | null;
  educationModelName?: string | null;

  result: ParsedResult;
  timestamp: string;

  usedStyleName?: string | null;

  allowTrain?: boolean;
  allowTrainVersion?: string;
};

type LessonPlanDraft = {
  id?: string | null;
  mode: "ai" | "manual";
  subject: string;
  grade: string;
  genre: string;
  unit: string;
  hours: string | number;
  unitGoal: string;
  evaluationPoints: EvaluationPoints;
  childVision: string;
  languageActivities: string;
  lessonPlanList: string[];

  /** 新：4分類（必須） */
  authorId: AuthorId | null;

  /** 新：教育観モデル（任意） */
  educationModelId?: string | null;

  /** 互換用（保存時も維持したい場合用） */
  selectedStyleId?: string;

  result?: ParsedResult | null;
  timestamp: string;
  isDraft: true;

  allowTrain?: boolean;
};

/* ===================== 学習用Markdown生成 ===================== */
function toAssistantPlanMarkdown(r: ParsedResult): string {
  const toArr = (x: any): string[] => (Array.isArray(x) ? x : x != null ? [String(x)] : []);
  const goal = (r["単元の目標"] ?? "").toString().trim();

  const evalObj = r["評価の観点"] ?? {};
  const evalKnow = toArr(evalObj["知識・技能"]);
  const evalThink = toArr(evalObj["思考・判断・表現"]);
  const evalAtt = toArr(evalObj["主体的に学習に取り組む態度"]);

  const langAct = (r["言語活動の工夫"] ?? "").toString().trim();

  const flow = r["授業の流れ"];
  let flowLines = "";
  if (Array.isArray(flow)) {
    flowLines = flow
      .map((v, i) => `- ${i + 1}時間目：\n${String(v ?? "").trim()}`)
      .join("\n");
  } else if (typeof flow === "object" && flow) {
    flowLines = Object.keys(flow)
      .sort((a, b) => {
        const na = parseInt(a, 10);
        const nb = parseInt(b, 10);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b, "ja");
      })
      .map((k) => `- ${k}：\n${String((flow as any)[k] ?? "").trim()}`)
      .join("\n");
  } else if (typeof flow === "string") {
    const lines = flow
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    flowLines = lines.map((v, i) => `- ${i + 1}時間目：\n${v}`).join("\n");
  }

  const parts: string[] = [];
  parts.push("## 授業案");
  if (goal) parts.push(`### ねらい\n${goal}`);
  if (evalKnow.length || evalThink.length || evalAtt.length) {
    parts.push("### 評価");
    if (evalKnow.length) parts.push(`- 知識・技能\n${evalKnow.map((x) => `  - ${x}`).join("\n")}`);
    if (evalThink.length) parts.push(`- 思考・判断・表現\n${evalThink.map((x) => `  - ${x}`).join("\n")}`);
    if (evalAtt.length) parts.push(`- 主体的に学習に取り組む態度\n${evalAtt.map((x) => `  - ${x}`).join("\n")}`);
  }
  if (langAct) parts.push(`### 言語活動の工夫\n${langAct}`);
  if (flowLines) parts.push(`### 流れ\n${flowLines}`);
  return parts.join("\n\n").trim();
}

/* ========== 変換ユーティリティ（生成結果→入力欄へ反映） ========== */
const toStrArray = (v: any): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : v != null && String(v).trim() ? [String(v)] : [];

/** 授業の流れの受け取りを（array/object/string）で正規化 */
const sortedFlowEntries = (flow: any): string[] => {
  if (!flow) return [];
  if (Array.isArray(flow)) return flow.map((x) => String(x));
  if (typeof flow === "string") {
    return flow
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*\d+\s*時間目[:：]?\s*/, "").trim())
      .filter((s) => s.length > 0);
  }
  if (typeof flow === "object") {
    return Object.entries(flow)
      .sort((a, b) => {
        const na = parseInt(String(a[0]).match(/\d+/)?.[0] ?? "0", 10);
        const nb = parseInt(String(b[0]).match(/\d+/)?.[0] ?? "0", 10);
        return na - nb;
      })
      .map(([, v]) => String(v));
  }
  return [];
};

function applyParsedResultToInputs(
  data: ParsedResult,
  setters: {
    setSubject: (v: string) => void;
    setGrade: (v: string) => void;
    setGenre: (v: string) => void;
    setUnit: (v: string) => void;
    setHours: (v: string) => void;
    setUnitGoal: (v: string) => void;
    setChildVision: (v: string) => void;
    setLanguageActivities: (v: string) => void;
    setEvaluationPoints: (v: EvaluationPoints) => void;
    setLessonPlanList: (v: string[]) => void;
  }
) {
  const subject = String(data["教科書名"] ?? "").trim();
  const grade = String(data["学年"] ?? "").trim();
  const genre = String(data["ジャンル"] ?? "").trim();
  const unit = String(data["教材名"] ?? data["単元名"] ?? "").trim();

  const hoursNum = Number(data["授業時間数"] ?? 0);
  const unitGoal = String(data["単元の目標"] ?? "").trim();
  const childVision = String(data["育てたい子どもの姿"] ?? "").trim();
  const languageActivities = String(data["言語活動の工夫"] ?? "").trim();

  const evalObj = (data["評価の観点"] ?? {}) as ParsedResult["評価の観点"];
  const knowledge = toStrArray(evalObj?.["知識・技能"]);
  const thinking = toStrArray(evalObj?.["思考・判断・表現"]);
  const attitude = toStrArray(evalObj?.["主体的に学習に取り組む態度"] ?? evalObj?.["態度"]);

  const flowList = sortedFlowEntries(data["授業の流れ"]);
  const finalHours = hoursNum || flowList.length || 0;

  // ★ここが重要：時間数ぶん必ず配列を用意（不足は空文字で埋める）
  const paddedFlow = Array.from({ length: finalHours }, (_, i) => flowList[i] ?? "");

  if (subject) setters.setSubject(subject);
  if (grade) setters.setGrade(grade);
  if (genre) setters.setGenre(genre);
  if (unit) setters.setUnit(unit);
  if (finalHours >= 0) setters.setHours(String(finalHours));

  setters.setUnitGoal(unitGoal);
  setters.setChildVision(childVision);
  setters.setLanguageActivities(languageActivities);
  setters.setEvaluationPoints({ knowledge, thinking, attitude });
  setters.setLessonPlanList(paddedFlow);
}

/* ===================== 4分類の方針（指導要領に沿うための最低要件） ===================== */
function getAuthorGuidelines(authorId: AuthorId, grade: string): string {
  const common = [
    "・学習指導要領に照らして、3観点（知識・技能／思考・判断・表現／主体的に学習に取り組む態度）の整合をとる。",
    "・各時間の『授業の流れ』は、次の4要素を必ず含める：①教師の手立て（発問・提示・板書・ICT）②子どもの活動（個→ペア→全体等）③教材の根拠（本文の叙述・資料・例文等）④見取る評価（どの観点をどこで）。",
    "・1時間目あたり120〜200字程度を目安に具体化する（短すぎる一般論は禁止）。",
    "・時間配分は、導入→探究→統合→振り返りの積み上がりが分かるようにする。",
    "・教師の言葉（問い）と、子どものアウトプット（発言・ノート・ワークシート等）が見える形で書く。",
  ].join("\n");

  const byType: Record<AuthorId, string> = {
    "reading-model-id": [
      "【読解（読むこと中心）としての最低要件】",
      "・本文の叙述に必ず戻り、根拠（言葉・文・段落）を押さえて解釈が進む構造にする。",
      "・発問は『叙述→解釈→交流→再解釈』の循環になるように設計する。",
      `・学年（${grade}）に応じて、本文理解の支援（音読・挿絵・場面分け・人物表等）を入れる。`,
      "・交流は“根拠付きで説明”を促す（理由の言語化）。",
    ].join("\n"),
    "discussion-model-id": [
      "【話し合い（話す・聞く中心）としての最低要件】",
      "・目的（比べる／整理する／合意形成／問いを深める）を明確にし、役割・型（例：一言共有→理由→質問）を設定する。",
      "・聞く活動が可視化される工夫（メモ、うなずき、要約、リフレーズ等）を入れる。",
      "・発話が苦手な子にも参加できる支援（文型、カード、選択肢、ペア先行）を入れる。",
      "・話し合いの成果物（まとめ、共同板書、振り返り）を設定する。",
    ].join("\n"),
    "writing-model-id": [
      "【作文（書くこと中心）としての最低要件】",
      "・構想→下書き→推敲→共有のプロセスを授業の中で段階化する。",
      "・書くための材料集め（経験・資料・本文・メモ）と、文章構成（はじめ/中/おわり等）の支援を入れる。",
      "・推敲の観点（内容／構成／表現／誤字脱字等）を具体化し、チェック方法（ペア推敲等）を設計する。",
      "・完成の基準（評価規準）と提出形態（ノート／プリント／ICT）を明確にする。",
    ].join("\n"),
    "language-activity-model-id": [
      "【言語活動（言葉の働き・言語文化を活かす活動）としての最低要件】",
      "・語彙、表現、文の組み立て、言葉のきまり等を“使ってみる”活動に落とす（練習→活用）。",
      "・活動の目的（伝える／比べる／整える／説明する等）を明確にし、言語材料（語句・表現例）を提示する。",
      "・誤りを学びに変える場面（言い換え、整える、推敲）を入れる。",
      "・実生活や他教科につながる活用場面を一部に入れる。",
    ].join("\n"),
  };

  return [common, byType[authorId]].join("\n\n").trim();
}

/* ===================== 教育観モデルの整形（長文化を抑える） ===================== */
function buildEducationModelBlock(model?: StyleModel | null): string {
  if (!model) return "";
  const lines = [
    "【教育観モデル（最優先）】",
    `・モデル名：${model.name}`,
    model.creatorName ? `・作成者：${model.creatorName}` : "",
    model.content ? `・教育観：${model.content}` : "",
    model.evaluationFocus ? `・評価観点の重視点：${model.evaluationFocus}` : "",
    model.languageFocus ? `・言語活動の重視点：${model.languageFocus}` : "",
    model.childFocus ? `・育てたい子どもの姿：${model.childFocus}` : "",
    "",
    "※上の教育観モデルを最優先の判断基準として授業案を作成せよ。4分類モデルは指導要領に沿うための最低要件として満たし、衝突した場合は教育観モデルを優先しつつ最低要件が失われないよう形を調整する。",
  ].filter(Boolean);

  const block = lines.join("\n");
  return block.length > 2000 ? block.slice(0, 2000) + "\n（…以下省略）" : block;
}

/* ===================== 入力→プロンプト整形 ===================== */
function buildPrompt(args: {
  authorId: AuthorId;
  authorLabel: string;

  educationModel?: StyleModel | null;

  subject: string;
  grade: string;
  genre: string;
  unit: string;
  hours: number;
  unitGoal: string;
  evaluationPoints: EvaluationPoints;
  childVision: string;
  languageActivities: string;
  lessonPlanList: string[];
}): string {
  const {
    authorId,
    authorLabel,
    educationModel,
    subject,
    grade,
    genre,
    unit,
    hours,
    unitGoal,
    evaluationPoints,
    childVision,
    languageActivities,
    lessonPlanList,
  } = args;

  const flowLines = lessonPlanList
    .map((step, idx) => (step.trim() ? `${idx + 1}時間目: ${step}` : `${idx + 1}時間目: `))
    .join("\n");

  const eduBlock = buildEducationModelBlock(educationModel);
  const authorBlock = [
    `【作成モデル（4分類 / 最低要件）：${authorLabel}】`,
    getAuthorGuidelines(authorId, grade),
  ].join("\n");

  // ★追加：言語活動をゴールにした逆算設計を強制（ここが②）
  const backwardDesignBlock = `
【逆算設計（必須）】
- この単元のゴール（最終成果物）を「言語活動（入力欄）」で定義し、最終時（${hours}時間目）で必ず達成させること。
- 1〜${hours}時間目は、最終成果に向けた段階（目的共有→本文理解/材料集め→技能練習→構想→試作/リハ→改善→本番→振り返り等）として“意味のある積み上がり”にすること。
- 「授業の流れ」は、必ず ${hours} 個の要素を持つ配列（string[]）で返すこと。欠けてはいけない。
- 各時間目（配列の各要素）は、読みやすい日本語の“文”で120〜200字程度を目安に書くこと（箇条書き羅列は避ける）。
- 各時間目の文に、次の4点を必ず入れる：
  ①教師の手立て（発問・提示・板書・ICT）
  ②子どもの活動（個/ペア/全体/グループ）
  ③教材の根拠（本文の叙述・語句・段落等）
  ④見取る評価（3観点のどれをどこで）
- 最終時（${hours}時間目）は「言語活動の成果を発表/提出し、評価と振り返りを行う」文にすること。
`.trim();

  // ★重要：返却フォーマットで「1,2,${hours}だけ」の例をやめ、全時間の配列で返させる（ここが①）
  return `
あなたは小学校の国語授業プランナーです。
必ず学習指導要領に沿い、入力情報と3観点評価の整合をとり、実行可能で具体的な授業案を作成してください。

${eduBlock ? `${eduBlock}\n` : ""}

${authorBlock}

${backwardDesignBlock}

【教科書名】${subject}
【学年】${grade}
【ジャンル】${genre}
【教材名】${unit}
【授業時間数】${hours}

■ 単元の目標:
${unitGoal}

■ 評価の観点:
知識・技能=${evaluationPoints.knowledge.join("、")};
思考・判断・表現=${evaluationPoints.thinking.join("、")};
主体的に学習に取り組む態度=${evaluationPoints.attitude.join("、")}

■ 育てたい子どもの姿:
${childVision}

■ 授業の流れ（入力が空欄の時間はAIが埋める。先生が書いた内容は上書きしない）:
${flowLines}

■ 言語活動（ゴール/最終成果物の定義）:
${languageActivities}

—返却フォーマット（必ずJSONのみ。前後に文章を付けない）—
{
  "教科書名": string,
  "学年": string,
  "ジャンル": string,
  "教材名": string,
  "授業時間数": number,
  "単元の目標": string,
  "評価の観点": {
    "知識・技能": string[],
    "思考・判断・表現": string[],
    "主体的に学習に取り組む態度": string[]
  },
  "育てたい子どもの姿": string,
  "授業の流れ": string[],
  "言語活動の工夫": string,
  "結果": string
}

制約：
- "授業の流れ" は必ず長さ ${hours} の配列（string[]）にする（1時間目=配列[0]、${hours}時間目=配列[${Math.max(
    0,
    hours - 1
  )}]）。
- 配列要素の欠落は禁止。空文字は禁止。
- 各時間目は120〜200字程度を目安に、教師の手立て・子どもの活動・教材根拠・評価の見取りが必ず含まれること。
- 具体的な発問（教師の問い）を各時間に最低1つは含めること。
- 活動形態（個人/ペア/全体/グループ）を各時間に明記すること。
- 学年に合わない過度に抽象的・専門的な表現は避けること。
  `.trim();
}

/* ===================== メイン ===================== */
export default function ClientPlan() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Firebase認証UID（クラウド下書き用） */
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  /** 復元→自動保存の競合を抑止するためのフラグ */
  const restoringRef = useRef(true);
  /** クリア直後に自動保存で空状態を書き戻さないための1回スキップ */
  const skipAutoSaveOnceRef = useRef(false);

  // ★ 初期は手動モード（文言に合わせる）
  const [mode, setMode] = useState<"ai" | "manual">("manual");

  /** 教育観モデル一覧 */
  const [styleModels, setStyleModels] = useState<StyleModel[]>([]);

  /** 4分類（必須） */
  const [selectedAuthorId, setSelectedAuthorId] = useState<AuthorId | null>(null);

  /** 教育観モデル（任意） */
  const [selectedEducationModelId, setSelectedEducationModelId] = useState<string>("");

  const selectedAuthor = useMemo(
    () => (selectedAuthorId ? authors.find((a) => a.id === selectedAuthorId) ?? null : null),
    [selectedAuthorId]
  );

  const selectedEducationModel = useMemo(
    () => (selectedEducationModelId ? styleModels.find((m) => m.id === selectedEducationModelId) ?? null : null),
    [selectedEducationModelId, styleModels]
  );

  const [subject, setSubject] = useState("東京書籍");
  const [grade, setGrade] = useState("1年");
  const [genre, setGenre] = useState("物語文");
  const [unit, setUnit] = useState("");
  const [hours, setHours] = useState("");
  const [unitGoal, setUnitGoal] = useState("");

  const [evaluationPoints, setEvaluationPoints] = useState<EvaluationPoints>({
    knowledge: [""],
    thinking: [""],
    attitude: [""],
  });

  const [templateEvaluationPoints, setTemplateEvaluationPoints] = useState<EvaluationPoints>({
    knowledge: [""],
    thinking: [""],
    attitude: [""],
  });

  const [childVision, setChildVision] = useState("");
  const [languageActivities, setLanguageActivities] = useState("");
  const [lessonPlanList, setLessonPlanList] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  /** 保存するプロンプト（後で参照用） */
  const [lastPrompt, setLastPrompt] = useState<string>("");

  /** 本人同意（将来用：現ページでは保持のみ。fine-tune関連UI/処理は削除） */
  const [consentTrain, setConsentTrain] = useState<boolean>(false);

  /* ===== 教育観モデルの取得 ===== */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const colRef = collection(db, "educationModels");
        const snapshot = await getDocs(colRef);
        if (!mounted) return;
        const models = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          return {
            id: docSnap.id,
            name: d.name || "無名のモデル",
            content: d.philosophy || "",
            evaluationFocus: d.evaluationFocus || "",
            languageFocus: d.languageFocus || "",
            childFocus: d.childFocus || "",
            creatorName: d.creatorName || "",
          } as StyleModel;
        });
        setStyleModels(models);
      } catch (error) {
        console.error("教育観モデルの読み込みに失敗:", error);
        setStyleModels([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ===== draft適用ヘルパ ===== */
  const applyDraftToState = (plan: Partial<LessonPlanDraft | LessonPlanStored>) => {
    if (!plan) return;

    setEditId((plan as any).id ?? null);

    if ((plan as any).mode) setMode((plan as any).mode as "ai" | "manual");

    if (plan.subject != null) setSubject(plan.subject as string);
    if (plan.grade != null) setGrade(plan.grade as string);
    if (plan.genre != null) setGenre(plan.genre as string);
    if (plan.unit != null) setUnit(plan.unit as string);
    if (plan.hours != null) setHours(String(plan.hours));
    if (plan.unitGoal != null) setUnitGoal(plan.unitGoal as string);

    if (plan.evaluationPoints != null) setEvaluationPoints(plan.evaluationPoints as EvaluationPoints);
    if (plan.childVision != null) setChildVision(plan.childVision as string);
    if (plan.languageActivities != null) setLanguageActivities(plan.languageActivities as string);
    if (plan.lessonPlanList != null) setLessonPlanList(plan.lessonPlanList as string[]);

    // 新：4分類
    const authorId = (plan as any).authorId as AuthorId | null | undefined;
    if (authorId !== undefined) setSelectedAuthorId(authorId ?? null);

    // 新：教育観モデル（任意）
    const emId = (plan as any).educationModelId as string | null | undefined;
    if (emId !== undefined) setSelectedEducationModelId(emId ?? "");

    if ((plan as any).result) setParsedResult((plan as any).result as ParsedResult);

    if ((plan as any).allowTrain != null) setConsentTrain(Boolean((plan as any).allowTrain));
  };

  const pickLatestDraft = (a: any, b: any) => {
    const ta = a?.timestamp ? Date.parse(a.timestamp) : -1;
    const tb = b?.timestamp ? Date.parse(b.timestamp) : -1;
    if (ta < 0 && tb < 0) return null;
    if (tb > ta) return b;
    return a ?? b ?? null;
  };

  /* ===== 起動時の復元（ローカル→クラウド比較で新しい方） ===== */
  useEffect(() => {
    (async () => {
      let local: any = null;
      try {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(EDIT_KEY);
          if (raw) local = JSON.parse(raw);
        }
      } catch (e) {
        console.warn("ローカル下書きの読み込みに失敗:", e);
      }

      let cloud: any = null;
      if (uid) {
        try {
          const snap = await getDoc(doc(db, "lesson_plan_drafts", uid));
          if (snap.exists()) cloud = snap.data()?.payload ?? null;
        } catch (e) {
          console.warn("クラウド下書きの読み込みに失敗:", e);
        }
      }

      const chosen = pickLatestDraft(local, cloud);
      if (chosen) {
        try {
          localStorage.setItem(EDIT_KEY, JSON.stringify(chosen));
        } catch {}
        applyDraftToState(chosen);
      }

      // URL で教育観モデルを指定したい場合（任意）
      const eduIdParam = searchParams?.get?.("educationModelId");
      if (eduIdParam) setSelectedEducationModelId(eduIdParam);

      restoringRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  /* ===== 学年×ジャンルの評価観点テンプレ（CSV） ===== */
  useEffect(() => {
    if (genre === "その他") {
      const blank = { knowledge: [""], thinking: [""], attitude: [""] };
      setEvaluationPoints(blank);
      setTemplateEvaluationPoints(blank);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/templates.csv", { signal: controller.signal });
        if (!res.ok) return;
        const text = await res.text();
        const data = Papa.parse(text, { header: true }).data as any[];
        const matched = data.filter((r) => r.学年 === grade && r.ジャンル === genre);
        const grouped: EvaluationPoints = {
          knowledge: matched.filter((r) => r.観点 === "knowledge").map((r) => r.内容),
          thinking: matched.filter((r) => r.観点 === "thinking").map((r) => r.内容),
          attitude: matched.filter((r) => r.観点 === "attitude").map((r) => r.内容),
        };
        if (grouped.knowledge.length || grouped.thinking.length || grouped.attitude.length) {
          setEvaluationPoints(grouped);
          setTemplateEvaluationPoints(grouped);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") console.warn("テンプレCSVの読み込みに失敗:", e);
      }
    })();
    return () => controller.abort();
  }, [grade, genre]);

  /* ===== 下書きの作成/保存（ローカル＋クラウド、デバウンス） ===== */
  const buildDraft = (): LessonPlanDraft => ({
    id: editId ?? null,
    mode,
    subject,
    grade,
    genre,
    unit,
    hours,
    unitGoal,
    evaluationPoints,
    childVision,
    languageActivities,
    lessonPlanList,

    authorId: selectedAuthorId,
    educationModelId: selectedEducationModelId || null,

    // 互換：教育観モデルIDを selectedStyleId として維持（必要なら）
    selectedStyleId: selectedEducationModelId || "",

    result: parsedResult ?? null,
    timestamp: new Date().toISOString(),
    isDraft: true,

    allowTrain: consentTrain,
  });

  const saveDraftLocal = (draft: LessonPlanDraft) => {
    try {
      localStorage.setItem(EDIT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn("ローカル下書き保存失敗:", e);
    }
  };

  const saveDraftCloud = async (draft: LessonPlanDraft) => {
    if (!uid) return;
    try {
      await setDoc(
        doc(db, "lesson_plan_drafts", uid),
        { ownerUid: uid, payload: draft, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.warn("クラウド下書き保存失敗:", e);
    }
  };

  useEffect(() => {
    if (restoringRef.current) return;

    if (skipAutoSaveOnceRef.current) {
      skipAutoSaveOnceRef.current = false;
      return;
    }

    const t = setTimeout(() => {
      const draft = buildDraft();
      saveDraftLocal(draft);
      void saveDraftCloud(draft);
    }, 800);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    uid,
    mode,
    subject,
    grade,
    genre,
    unit,
    hours,
    unitGoal,
    evaluationPoints,
    childVision,
    languageActivities,
    lessonPlanList,
    selectedAuthorId,
    selectedEducationModelId,
    parsedResult,
    consentTrain,
  ]);

  /* ===== 入力ハンドラ ===== */
  const handleAddPoint = (f: keyof EvaluationPoints) =>
    setEvaluationPoints((p) => ({ ...p, [f]: [...p[f], ""] }));
  const handleRemovePoint = (f: keyof EvaluationPoints, i: number) =>
    setEvaluationPoints((p) => ({ ...p, [f]: p[f].filter((_, idx) => idx !== i) }));
  const handleChangePoint = (f: keyof EvaluationPoints, i: number, v: string) => {
    const arr = [...evaluationPoints[f]];
    arr[i] = v;
    setEvaluationPoints((p) => ({ ...p, [f]: arr }));
  };
  const handleLessonChange = (i: number, v: string) => {
    const arr = [...lessonPlanList];
    arr[i] = v;
    setLessonPlanList(arr);
  };

  /* ===== 画面の全入力＆生成結果を初期化（クリア用） ===== */
  const resetAll = () => {
    setEditId(null);
    // ★ クリア後も手動に戻す（文言に合わせる）
    setMode("manual");

    setSelectedAuthorId(null);
    setSelectedEducationModelId("");

    setSubject("東京書籍");
    setGrade("1年");
    setGenre("物語文");
    setUnit("");
    setHours("");
    setUnitGoal("");

    setEvaluationPoints(templateEvaluationPoints);

    setChildVision("");
    setLanguageActivities("");
    setLessonPlanList([]);

    setParsedResult(null);
    setLastPrompt("");

    setConsentTrain(false);
  };

  /* ===================== スタイル ===================== */
  const containerStyle: CSSProperties = { maxWidth: 800, margin: "auto", padding: "1rem" };
  const cardStyle: CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "1rem",
    marginBottom: "1rem",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
  const titleStyle: CSSProperties = { fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" };
  const listStyle: CSSProperties = { paddingLeft: "1rem", marginTop: "0.5rem" };
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "0.8rem",
    fontSize: "1.1rem",
    borderRadius: 8,
    border: "1px solid #ccc",
    marginBottom: "1rem",
  };

  const navBarStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: 56,
    backgroundColor: "#1976d2",
    display: "flex",
    alignItems: "center",
    padding: "0 1rem",
    zIndex: 1000,
  };
  const hamburgerStyle: CSSProperties = {
    cursor: "pointer",
    width: 30,
    height: 22,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };
  const barStyle: CSSProperties = {
    height: 4,
    backgroundColor: "white",
    borderRadius: 2,
  };
  const menuWrapperStyle: CSSProperties = {
    position: "fixed",
    top: 56,
    left: 0,
    width: 250,
    height: "calc(100vh - 56px)",
    backgroundColor: "#f0f0f0",
    boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
    transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.3s ease",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
  };
  const menuScrollStyle: CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    paddingBottom: 0,
  };
  const logoutButtonStyle: CSSProperties = {
    padding: "0.75rem 1rem",
    backgroundColor: "#e53935",
    color: "white",
    fontWeight: "bold",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    margin: "1rem",
    position: "relative",
    zIndex: 1000,
  };

  const overlayStyle: CSSProperties = {
    position: "fixed",
    top: 56,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.3)",
    opacity: menuOpen ? 1 : 0,
    visibility: menuOpen ? "visible" : "hidden",
    transition: "opacity 0.3s ease",
    zIndex: 998,
  };
  const navLinkStyle: CSSProperties = {
    display: "block",
    padding: "0.5rem 1rem",
    backgroundColor: "#1976d2",
    color: "white",
    fontWeight: "bold",
    borderRadius: 6,
    textDecoration: "none",
    marginBottom: "0.5rem",
  };

  const infoNoteStyle: CSSProperties = {
    background: "#fffef7",
    border: "1px solid #ffecb3",
    borderRadius: 8,
    padding: "12px",
    color: "#604a00",
    marginBottom: "12px",
    lineHeight: 1.6,
    fontSize: "0.95rem",
  };

  /* ===================== 生成・表示（送信） ===================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedAuthorId || !selectedAuthor) {
      alert("作成モデル（4分類）を選択してください");
      return;
    }

    setLoading(true);
    setParsedResult(null);

    const count = Number(hours) || 0;
    const newList = Array.from({ length: count }, (_, i) => lessonPlanList[i] || "");
    setLessonPlanList(newList);

    // 手動モードは「表示」用に整形して即時反映
    if (mode === "manual") {
      const manualResult: ParsedResult = {
        教科書名: subject,
        学年: grade,
        ジャンル: genre,
        教材名: unit,
        授業時間数: count,
        単元の目標: unitGoal,
        評価の観点: {
          "知識・技能": evaluationPoints.knowledge,
          "思考・判断・表現": evaluationPoints.thinking,
          "主体的に学習に取り組む態度": evaluationPoints.attitude,
        },
        育てたい子どもの姿: childVision,
        // ★統一：配列で保持（表示・保存の互換は下で対応）
        授業の流れ: newList,
        言語活動の工夫: languageActivities,
        結果: "",
      };

      // 保存用には「プロンプト相当のテキスト」も残す（任意）
      const pseudoPrompt = buildPrompt({
        authorId: selectedAuthor.id,
        authorLabel: selectedAuthor.label,
        educationModel: selectedEducationModel,
        subject,
        grade,
        genre,
        unit,
        hours: count,
        unitGoal,
        evaluationPoints,
        childVision,
        languageActivities,
        lessonPlanList: newList,
      });
      setLastPrompt(pseudoPrompt);

      setParsedResult(manualResult);
      applyParsedResultToInputs(manualResult, {
        setSubject,
        setGrade,
        setGenre,
        setUnit,
        setHours,
        setUnitGoal,
        setChildVision,
        setLanguageActivities,
        setEvaluationPoints,
        setLessonPlanList,
      });

      setLoading(false);
      return;
    }

    // AIモード
    try {
      const prompt = buildPrompt({
        authorId: selectedAuthor.id,
        authorLabel: selectedAuthor.label,
        educationModel: selectedEducationModel,
        subject,
        grade,
        genre,
        unit,
        hours: count,
        unitGoal,
        evaluationPoints,
        childVision,
        languageActivities,
        lessonPlanList: newList,
      });

      setLastPrompt(prompt);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || res.statusText);

      let data: ParsedResult;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("サーバーから無効なJSONが返ってきました");
      }

      setParsedResult(data);

      applyParsedResultToInputs(data, {
        setSubject,
        setGrade,
        setGenre,
        setUnit,
        setHours,
        setUnitGoal,
        setChildVision,
        setLanguageActivities,
        setEvaluationPoints,
        setLessonPlanList,
      });
    } catch (e: any) {
      alert(`生成に失敗しました：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ===== 正式保存（ローカル＋Firestore）。保存後、下書きをクリア ===== */
  const handleSave = async () => {
    if (!parsedResult) {
      alert("まず授業案を生成してください");
      return;
    }
    if (!selectedAuthorId || !selectedAuthor) {
      alert("作成モデル（4分類）を選択してください");
      return;
    }
    if (!uid) {
      alert("ログイン状態を確認できません。再読み込み後にお試しください。");
      return;
    }

    const isEdit = Boolean(editId);
    const idToUse = isEdit ? (editId as string) : Date.now().toString();

    const assistantPlanMarkdown = toAssistantPlanMarkdown(parsedResult);

    const educationModelId = selectedEducationModelId || null;
    const educationModelName = selectedEducationModel?.name || null;

    // ローカル保存（履歴）
    const existingArr: LessonPlanStored[] = JSON.parse(
      typeof window !== "undefined" ? localStorage.getItem("lessonPlans") || "[]" : "[]"
    );

    const newPlan: LessonPlanStored = {
      id: idToUse,
      subject,
      grade,
      genre,
      unit,
      hours,
      unitGoal,
      evaluationPoints,
      childVision,
      lessonPlanList,
      languageActivities,

      // 互換：教育観モデルIDをselectedStyleIdへ（空なら空）
      selectedStyleId: educationModelId ?? "",

      authorId: selectedAuthor.id,
      authorLabel: selectedAuthor.label,

      educationModelId,
      educationModelName,

      result: parsedResult,
      timestamp: new Date().toISOString(),

      usedStyleName: selectedAuthor.label, // 表示用（旧UI救済）
      allowTrain: consentTrain,
      allowTrainVersion: "v1",
    };

    if (isEdit) {
      const newArr = existingArr.map((p) => (p.id === idToUse ? newPlan : p));
      localStorage.setItem("lessonPlans", JSON.stringify(newArr));
    } else {
      existingArr.push(newPlan);
      localStorage.setItem("lessonPlans", JSON.stringify(existingArr));
    }

    // Firestore保存先（4分類コレクション）
    try {
      await setDoc(
        doc(db, selectedAuthor.collection, idToUse),
        {
          ownerUid: uid,

          subject,
          grade,
          genre,
          unit,
          hours,
          unitGoal,
          evaluationPoints,
          childVision,
          lessonPlanList,
          languageActivities,

          // 互換（中身は教育観モデルID）
          selectedStyleId: educationModelId ?? "",

          // 新：4分類
          authorId: selectedAuthor.id,
          authorLabel: selectedAuthor.label,

          // 新：教育観モデル（任意）
          educationModelId,
          educationModelName,

          result: parsedResult,
          assistantPlanMarkdown,
          userPromptText: lastPrompt,

          timestamp: serverTimestamp(),
          usedStyleName: selectedAuthor.label,

          author: session?.user?.email || "",

          // 既存互換のスナップ（残したい場合）
          modelId: educationModelId,
          modelName: educationModelName,
          modelNameCanonical: (educationModelName || "").toLowerCase().replace(/\s+/g, "-") || null,
          modelSnapshot: selectedEducationModel
            ? {
                kind: "user-model" as const,
                id: selectedEducationModel.id,
                name: selectedEducationModel.name,
                at: new Date().toISOString(),
              }
            : null,

          allowTrain: consentTrain,
          allowTrainAt: consentTrain ? serverTimestamp() : null,
          allowTrainVersion: "v1",
        },
        { merge: true }
      );

      setEditId(idToUse);
    } catch (error) {
      console.error("Firestoreへの保存エラー:", error);
      alert("Firestoreへの保存中にエラーが発生しました");
      return;
    }

    // 下書きクリア
    try {
      localStorage.removeItem(EDIT_KEY);
      if (uid) {
        await setDoc(
          doc(db, "lesson_plan_drafts", uid),
          { ownerUid: uid, payload: null, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    } catch {}

    alert("一括保存しました（ローカル・Firestore）");
    router.push("/plan/history");
  };

  /* ===================== JSX ===================== */
  return (
    <>
      <nav style={navBarStyle}>
        <div
          style={hamburgerStyle}
          onClick={toggleMenu}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && toggleMenu()}
        >
          <span style={barStyle}></span>
          <span style={barStyle}></span>
          <span style={barStyle}></span>
        </div>
        <h1 style={{ color: "white", marginLeft: "1rem", fontSize: "1.25rem" }}>国語授業プランナー</h1>
      </nav>

      <div style={overlayStyle} onClick={() => setMenuOpen(false)} aria-hidden={!menuOpen} />

      <div style={menuWrapperStyle} aria-hidden={!menuOpen}>
        <button
          onClick={() => {
            import("next-auth/react").then(({ signOut }) => signOut());
          }}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

        <div style={menuScrollStyle}>
          <Link href="/" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            🏠 ホーム
          </Link>
          <Link href="/plan" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📋 授業作成
          </Link>
          <Link href="/plan/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📖 計画履歴
          </Link>
          <Link href="/practice/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📷 実践履歴
          </Link>
          <Link href="/practice/share" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            🌐 共有版実践記録
          </Link>
          <Link href="/models/create" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            ✏️ 教育観作成
          </Link>
          <Link href="/models" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            📚 教育観一覧
          </Link>
          <Link href="/models/history" style={navLinkStyle} onClick={() => setMenuOpen(false)}>
            🕒 教育観履歴
          </Link>
        </div>
      </div>

      <main style={{ ...containerStyle, paddingTop: 56 }}>
        {/* ★ ここが「最初の文言」：元に戻した版 */}
        <section style={infoNoteStyle} role="note">
          <p style={{ margin: 0 }}>
            授業案を作成するには、<strong>AIモード</strong>と<strong>手動モード</strong>があります。現在はAIモードで作成しても{" "}
            <strong>理想となる授業案は作成されません</strong>。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            みなさんの作成した授業案、後に作成する授業実践案をAIに学習させることで、AIモードで{" "}
            <strong>面白く・活動が具体的な国語の授業案</strong>を一緒に考えることができます。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            まずは、<strong>手動モード</strong>で授業案を生成していきましょう。 作成モデルは<strong>自分の授業に近いモデル</strong>を
            <strong>4つ</strong>の中から選択してください。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            <strong>下書きを保存する際は、必ず📝下書きを保存ボタンを押してください。</strong>
          </p>
          <p style={{ margin: "6px 0 0" }}>
            ※必要に応じて<strong>教育観モデル（任意）</strong>も選ぶと、授業の方針（評価・言語活動・育てたい姿）をそろえたまま作成できます。
          </p>
        </section>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ marginRight: "1rem" }}>
              <input type="radio" value="ai" checked={mode === "ai"} onChange={() => setMode("ai")} /> AIモード
            </label>
            <label>
              <input type="radio" value="manual" checked={mode === "manual"} onChange={() => setMode("manual")} /> 手動モード
            </label>
          </div>

          {/* 教育観モデル（任意） */}
          <label>
            教育観モデル（任意）：<br />
            <select
              value={selectedEducationModelId}
              onChange={(e) => setSelectedEducationModelId(e.target.value)}
              style={inputStyle}
            >
              <option value="">（未選択）</option>
              {styleModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {/* 作成モデル（4分類）必須 */}
          <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
            <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>作成モデル（4分類）を選択してください（必須）</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {authors.map((author) => (
                <button
                  key={author.id}
                  type="button"
                  onClick={() => setSelectedAuthorId(author.id)}
                  style={{
                    flex: 1,
                    padding: "0.8rem 1rem",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: selectedAuthorId === author.id ? "#1976d2" : "#ccc",
                    color: selectedAuthorId === author.id ? "white" : "black",
                    fontWeight: "bold",
                  }}
                >
                  {author.label}
                </button>
              ))}
            </div>
          </div>

          <label>
            教科書名：<br />
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
              <option>東京書籍</option>
              <option>光村図書</option>
              <option>教育出版</option>
            </select>
          </label>

          <label>
            学年：<br />
            <select value={grade} onChange={(e) => setGrade(e.target.value)} style={inputStyle}>
              <option>1年</option>
              <option>2年</option>
              <option>3年</option>
              <option>4年</option>
              <option>5年</option>
              <option>6年</option>
            </select>
          </label>

          <label>
            ジャンル：<br />
            <select value={genre} onChange={(e) => setGenre(e.target.value)} style={inputStyle}>
              <option>物語文</option>
              <option>説明文</option>
              <option>詩</option>
              <option>その他</option>
            </select>
          </label>

          <label>
            教材名：<br />
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
          </label>

          <label>
            授業時間数：<br />
            <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} style={inputStyle} min={0} />
          </label>

          <label>
            ■ 単元の目標：<br />
            <textarea value={unitGoal} onChange={(e) => setUnitGoal(e.target.value)} rows={2} style={inputStyle} />
          </label>

          {(["knowledge", "thinking", "attitude"] as const).map((f) => (
            <div key={f} style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                {f === "knowledge"
                  ? "① 知識・技能："
                  : f === "thinking"
                  ? "② 思考・判断・表現："
                  : "③ 主体的に学習に取り組む態度："}
              </label>
              {evaluationPoints[f].map((v, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <textarea
                    value={v}
                    onChange={(e) => handleChangePoint(f, i, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button type="button" onClick={() => handleRemovePoint(f, i)}>
                    🗑
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddPoint(f)}
                style={{ ...inputStyle, backgroundColor: "#9C27B0", color: "white" }}
              >
                ＋ 追加
              </button>
            </div>
          ))}

          <label>
            ■ 育てたい子どもの姿：<br />
            <textarea value={childVision} onChange={(e) => setChildVision(e.target.value)} rows={2} style={inputStyle} />
          </label>

          <label>
            ■ 言語活動（ゴール/最終成果物）：<br />
            <textarea
              value={languageActivities}
              onChange={(e) => setLanguageActivities(e.target.value)}
              rows={2}
              style={inputStyle}
            />
          </label>

          {hours && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.5rem" }}>■ 授業の展開（手動で入力／空欄はAIが生成）</div>
              {Array.from({ length: Number(hours) }, (_, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: "4rem", lineHeight: "2rem" }}>{i + 1}時間目:</span>
                  <textarea
                    value={lessonPlanList[i] || ""}
                    onChange={(e) => handleLessonChange(i, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={!selectedAuthorId}
              style={{
                ...inputStyle,
                backgroundColor: selectedAuthorId ? "#2196F3" : "#ccc",
                color: "white",
                cursor: selectedAuthorId ? "pointer" : "not-allowed",
                marginBottom: 0,
              }}
            >
              {mode === "manual" ? "授業案を表示する" : "授業案を生成する"}
            </button>

            <button
              type="button"
              onClick={() => {
                const draft = buildDraft();
                saveDraftLocal(draft);
                void saveDraftCloud(draft);
                alert("下書きを保存しました（ローカル＋クラウド）");
              }}
              style={{
                ...inputStyle,
                backgroundColor: "#13b4f4ce",
                color: "white",
                marginBottom: 0,
              }}
            >
              📝 下書きを保存
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  localStorage.removeItem(EDIT_KEY);
                } catch {}
                if (uid) {
                  try {
                    await setDoc(
                      doc(db, "lesson_plan_drafts", uid),
                      { ownerUid: uid, payload: null, updatedAt: serverTimestamp() },
                      { merge: true }
                    );
                  } catch {}
                }

                skipAutoSaveOnceRef.current = true;
                resetAll();

                alert("下書きを削除しました（ローカル＋クラウド／画面もクリア）");
              }}
              style={{
                ...inputStyle,
                backgroundColor: "#bc181885",
                color: "white",
                marginBottom: 0,
              }}
            >
              🧹 下書きと入力をクリア
            </button>
          </div>
        </form>

        {loading && <p>生成中…</p>}

        {parsedResult && (
          <>
            {/* 本人同意（保持のみ。fine-tune関連はこのページから削除済み） */}
            <div style={{ ...cardStyle, backgroundColor: "#fafafa" }}>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>学習への提供（本人同意）</div>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={consentTrain} onChange={(e) => setConsentTrain(e.target.checked)} />
                この授業案を、AIの改善（将来的な学習）に提供することに同意します。
              </label>

              <p style={{ margin: "8px 0 0", fontSize: "0.9rem", opacity: 0.85 }}>
                ※このページでは同意情報を保存時に記録します。
              </p>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={handleSave}
                style={{
                  padding: "12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontSize: "1.1rem",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                💾 授業案を保存する
              </button>
            </div>

            <div id="result-content" style={{ ...cardStyle, backgroundColor: "white", minHeight: "500px", padding: "16px" }}>
              <div style={titleStyle}>授業の概要</div>
              <p>教科書名：{parsedResult["教科書名"]}</p>
              <p>学年：{parsedResult["学年"]}</p>
              <p>ジャンル：{parsedResult["ジャンル"]}</p>
              <p>教材名：{parsedResult["教材名"] ?? parsedResult["単元名"]}</p>
              <p>授業時間数：{parsedResult["授業時間数"]}時間</p>
              <p>育てたい子どもの姿：{parsedResult["育てたい子どもの姿"] || ""}</p>

              <div style={{ marginTop: 12 }}>
                <div style={titleStyle}>単元の目標</div>
                <p>{parsedResult["単元の目標"]}</p>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={titleStyle}>評価の観点</div>

                <strong>知識・技能</strong>
                <ul style={listStyle}>
                  {(
                    Array.isArray(parsedResult["評価の観点"]?.["知識・技能"]) ||
                    typeof parsedResult["評価の観点"]?.["知識・技能"] === "string"
                      ? Array.isArray(parsedResult["評価の観点"]?.["知識・技能"])
                        ? parsedResult["評価の観点"]["知識・技能"]
                        : [parsedResult["評価の観点"]?.["知識・技能"]]
                      : []
                  ).map((v: string, i: number) => (
                    <li key={`knowledge-${i}`}>{v}</li>
                  ))}
                </ul>

                <strong>思考・判断・表現</strong>
                <ul style={listStyle}>
                  {(
                    Array.isArray(parsedResult["評価の観点"]?.["思考・判断・表現"]) ||
                    typeof parsedResult["評価の観点"]?.["思考・判断・表現"] === "string"
                      ? Array.isArray(parsedResult["評価の観点"]?.["思考・判断・表現"])
                        ? parsedResult["評価の観点"]["思考・判断・表現"]
                        : [parsedResult["評価の観点"]?.["思考・判断・表現"]]
                      : []
                  ).map((v: string, i: number) => (
                    <li key={`thinking-${i}`}>{v}</li>
                  ))}
                </ul>

                <strong>主体的に学習に取り組む態度</strong>
                <ul style={listStyle}>
                  {(
                    Array.isArray(parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"]) ||
                    typeof parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"] === "string"
                      ? Array.isArray(parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"])
                        ? parsedResult["評価の観点"]["主体的に学習に取り組む態度"]
                        : [parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"]]
                      : []
                  ).map((v: string, i: number) => (
                    <li key={`attitude-${i}`}>{v}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={titleStyle}>言語活動の工夫</div>
                <p>{parsedResult["言語活動の工夫"]}</p>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={titleStyle}>授業の流れ</div>

                {/* ★ array/object 両対応で表示（生成側は配列を強制） */}
                {Array.isArray(parsedResult["授業の流れ"]) ? (
                  <ul style={listStyle}>
                    {(parsedResult["授業の流れ"] as string[]).map((val, i) => (
                      <li key={`flow-arr-${i}`}>
                        <strong>{i + 1}時間目：</strong> {String(val)}
                      </li>
                    ))}
                  </ul>
                ) : parsedResult["授業の流れ"] && typeof parsedResult["授業の流れ"] === "object" ? (
                  <ul style={listStyle}>
                    {Object.entries(parsedResult["授業の流れ"] as Record<string, any>).map(([key, val], i) => (
                      <li key={`flow-obj-${i}`}>
                        <strong>{key}：</strong> {String(val)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ opacity: 0.8 }}>（授業の流れがありません）</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
