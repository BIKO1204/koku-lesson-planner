"use client";

import { useState, useEffect, useRef, CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { db, auth } from "../firebaseConfig";
import { doc, setDoc, collection, getDocs, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
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

  /** 互換のため残す（= 教育観モデルID） */
  selectedStyleId: string; // 教育観モデルID（任意）
  usedStyleName?: string | null; // 画面で見せる用（教育観モデル名 or 作成モデル名）
  /** 保存先カテゴリ（必須） */
  selectedAuthorId?: string | null;

  result: ParsedResult;
  timestamp: string;

  // ★本人同意フラグ（学習提供）
  allowTrain?: boolean;
  allowTrainVersion?: string;
};

type LessonPlanDraft = {
  id?: string | null;
  mode: "ai" | "manual";
  subject: string;
  grade: string;
  genre: string;
  unit: string; // 内部名は維持（教材名の実体）
  hours: string | number;
  unitGoal: string;
  evaluationPoints: EvaluationPoints;
  childVision: string;
  languageActivities: string;
  lessonPlanList: string[];

  /** 互換のため残す（= 教育観モデルID） */
  selectedStyleId: string; // 教育観モデルID（任意）
  selectedStyleName?: string; // 教育観モデル名（任意）
  /** 保存先カテゴリ（必須） */
  selectedAuthorId?: string | null;

  result?: ParsedResult | null;
  timestamp: string;
  isDraft: true;

  // ★本人同意フラグ（下書きにも保持）
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
  const flow = r["授業の流れ"] ?? {};
  const flowLines = Object.keys(flow)
    .sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b, "ja");
    })
    .map((k) => `- ${k}：\n${String(flow[k] ?? "").trim()}`)
    .join("\n");
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

/* ===================== 4モデル別 方針テキスト ===================== */
function getAuthorGuidance(label: string): string {
  switch (label) {
    case "読解":
      return [
        "・本文の叙述（ことば）を根拠にして考える活動を中心にする。",
        "・『読み取る→確かめる→深める（解釈）→表現する』の流れが自然になるようにする。",
        "・発問は『どこからそう言える？』が成立する形にする。",
        "・評価は、根拠の示し方／読みの更新／言葉への着目が見えるようにする。",
      ].join("\n");
    case "話し合い":
      return [
        "・目的（何を決める/深める/共有するか）を明確にし、対話の型（聞く→つなぐ→深める）を入れる。",
        "・論点（比べる視点、理由、根拠）を用意し、役割やルール（相づち/質問/言い換え）を具体化する。",
        "・評価は、根拠のある発言／他者の意見の受け止め／話し合いの進め方が見えるようにする。",
      ].join("\n");
    case "作文":
      return [
        "・『目的/相手/内容』をはっきりさせ、構成（はじめ/中/おわり）や段落の見通しを持たせる。",
        "・モデル文や観点付きの推敲（分かりやすさ/具体さ/順序）を入れ、書く→直す→伝えるの往還をつくる。",
        "・評価は、内容のまとまり／表現の工夫／推敲による改善が見えるようにする。",
      ].join("\n");
    case "言語活動":
      return [
        "・語彙・表現・文の形（言葉の使い方）に焦点を当て、短い練習→活用場面（使ってみる）を入れる。",
        "・ゲーム性や操作活動（並べ替え/置き換え/付け足し）などで、言葉の働きを実感できるようにする。",
        "・評価は、学んだ表現を使えているか／使い分け・気づきがあるかが見えるようにする。",
      ].join("\n");
    default:
      return "";
  }
}

/* ===================== 入力→プロンプト整形 ===================== */
function buildUserPromptFromInputs(args: {
  authorLabel: string;
  educationModelName?: string;
  subject: string;
  grade: string;
  genre: string;
  unit: string; // 教材名の実体
  hours: number;
  unitGoal: string;
  evaluationPoints: EvaluationPoints;
  childVision: string;
  languageActivities: string;
  lessonPlanList: string[];
}): string {
  const {
    authorLabel,
    educationModelName,
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

  const flowLines = Array.from({ length: hours }, (_, i) => {
    const step = lessonPlanList[i] || "";
    return `${i + 1}時間目: ${step}`;
  }).join("\n");

  return [
    "あなたは小学校の国語授業プランナーのアシスタントです。",
    `【作成モデル】${authorLabel}`,
    educationModelName ? `【教育観モデル】${educationModelName}` : "【教育観モデル】（未選択）",
    `【教科書名】${subject}`,
    `【学年】${grade}`,
    `【ジャンル】${genre}`,
    `【教材名】${unit}`,
    `【授業時間数】${hours}`,
    "",
    "■ 単元の目標:",
    unitGoal,
    "",
    "■ 評価の観点:",
    `知識・技能=${evaluationPoints.knowledge.join("、")};`,
    `思考・判断・表現=${evaluationPoints.thinking.join("、")};`,
    `主体的に学習に取り組む態度=${evaluationPoints.attitude.join("、")}`,
    "",
    "■ 育てたい子どもの姿:",
    childVision,
    "",
    "■ 授業の流れ:",
    flowLines,
    "",
    "※空欄の時間はAIが補完してください。",
    "",
    "■ 言語活動の工夫:",
    languageActivities,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ========== 変換ユーティリティ（生成結果→入力欄へ反映） ========== */
const toStrArray = (v: any): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : v != null && String(v).trim() ? [String(v)] : [];

const sortedFlowEntries = (flow: any): string[] => {
  if (!flow) return [];
  if (Array.isArray(flow)) return flow.map((x) => String(x));
  if (typeof flow === "string") {
    return flow.split(/\r?\n/).map((s) => s.replace(/^\s*\d+\s*時間目[:：]?\s*/, "").trim());
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
  const {
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
  } = setters;

  const subject = String(data["教科書名"] ?? "").trim();
  const grade = String(data["学年"] ?? "").trim();
  const genre = String(data["ジャンル"] ?? "").trim();
  const unit = String(data["教材名"] ?? data["単元名"] ?? "").trim();
  const hours = Number(data["授業時間数"] ?? 0);
  const unitGoal = String(data["単元の目標"] ?? "").trim();
  const childVision = String(data["育てたい子どもの姿"] ?? "").trim();
  const languageActivities = String(data["言語活動の工夫"] ?? "").trim();

  const evalObj = (data["評価の観点"] ?? {}) as ParsedResult["評価の観点"];
  const knowledge = toStrArray(evalObj?.["知識・技能"]);
  const thinking = toStrArray(evalObj?.["思考・判断・表現"]);
  const attitude = toStrArray(evalObj?.["主体的に学習に取り組む態度"] ?? evalObj?.["態度"]);

  const flowList = sortedFlowEntries(data["授業の流れ"]);
  const finalHours = hours || flowList.length || 0;
  const paddedFlow = Array.from({ length: finalHours }, (_, i) => flowList[i] ?? "");

  if (subject) setSubject(subject);
  if (grade) setGrade(grade);
  if (genre) setGenre(genre);
  if (unit) setUnit(unit);
  if (finalHours >= 0) setHours(String(finalHours));
  setUnitGoal(unitGoal);
  setChildVision(childVision);
  setLanguageActivities(languageActivities);
  setEvaluationPoints({ knowledge, thinking, attitude });
  setLessonPlanList(paddedFlow);
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

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [styleModels, setStyleModels] = useState<StyleModel[]>([]);

  /** 教育観モデル（任意） */
  const [selectedEducationModelId, setSelectedEducationModelId] = useState<string>("");
  const [selectedEducationModelName, setSelectedEducationModelName] = useState<string>("");

  /** 作成モデル（保存先カテゴリ／必須） */
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

  const [subject, setSubject] = useState("東京書籍");
  const [grade, setGrade] = useState("1年");
  const [genre, setGenre] = useState("物語文");
  const [unit, setUnit] = useState(""); // 教材名の実体（内部名は unit）
  const [hours, setHours] = useState("");
  const [unitGoal, setUnitGoal] = useState("");

  // ✅ 現在の入力値
  const [evaluationPoints, setEvaluationPoints] = useState<EvaluationPoints>({
    knowledge: [""],
    thinking: [""],
    attitude: [""],
  });

  // ✅ CSVテンプレ保持（クリア時にここへ戻す）
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

  /** 学習用に保存するプロンプト */
  const [lastPrompt, setLastPrompt] = useState<string>("");

  /** ★本人同意（学習提供） */
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
    if ((plan as any).result) setParsedResult((plan as any).result as ParsedResult);
    if ((plan as any).mode) setMode((plan as any).mode as "ai" | "manual");

    // 互換: 旧キー selectedStyleId/Name を「教育観モデル」として復元
    const legacyEduId = (plan as any).selectedStyleId;
    const legacyEduName = (plan as any).selectedStyleName;
    if (legacyEduId != null) setSelectedEducationModelId(String(legacyEduId));
    if (legacyEduName != null) setSelectedEducationModelName(String(legacyEduName));

    if ((plan as any).selectedAuthorId !== undefined) setSelectedAuthorId((plan as any).selectedAuthorId ?? null);

    // ★同意状態も復元
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

      // URL param styleId は「教育観モデルID」として扱う
      const styleIdParam = searchParams?.get?.("styleId");
      if (styleIdParam) {
        const found = styleModels.find((m) => m.id === styleIdParam);
        setSelectedEducationModelId(styleIdParam);
        setSelectedEducationModelName(found ? found.name : "");
      }

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
        if (e?.name !== "AbortError") {
          console.warn("テンプレCSVの読み込みに失敗:", e);
        }
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

    // 互換のため旧キー名を維持（=教育観モデル）
    selectedStyleId: selectedEducationModelId,
    selectedStyleName: selectedEducationModelName,

    selectedAuthorId,
    result: parsedResult ?? null,
    timestamp: new Date().toISOString(),
    isDraft: true,

    // ★同意も下書きに保存
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
      await setDoc(doc(db, "lesson_plan_drafts", uid), { ownerUid: uid, payload: draft, updatedAt: serverTimestamp() }, { merge: true });
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
    selectedEducationModelId,
    selectedEducationModelName,
    selectedAuthorId,
    parsedResult,
    consentTrain,
  ]);

  /* ===== 入力ハンドラ ===== */
  const handleAddPoint = (f: keyof EvaluationPoints) => setEvaluationPoints((p) => ({ ...p, [f]: [...p[f], ""] }));
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
    setMode("ai");

    setSelectedEducationModelId("");
    setSelectedEducationModelName("");
    setSelectedAuthorId(null);

    setSubject("東京書籍");
    setGrade("1年");
    setGenre("物語文");
    setUnit("");
    setHours("");
    setUnitGoal("");

    // ✅クリアしてもフォーマットが消えないようテンプレに戻す
    setEvaluationPoints(templateEvaluationPoints);

    setChildVision("");
    setLanguageActivities("");
    setLessonPlanList([]);

    setParsedResult(null);
    setLastPrompt("");

    // ★同意もリセット（毎回明示的にチェックさせる）
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

    if (!selectedAuthorId) {
      alert("作成モデルを選択してください");
      return;
    }

    setLoading(true);
    setParsedResult(null);

    const count = Number(hours) || 0;
    const newList = Array.from({ length: count }, (_, i) => lessonPlanList[i] || "");
    setLessonPlanList(newList);

    const author = authors.find((a) => a.id === selectedAuthorId);
    const authorLabel = author?.label ?? "";

    const userPromptFromInputs = buildUserPromptFromInputs({
      authorLabel,
      educationModelName: selectedEducationModelName || undefined,
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

    // 手動モード：入力をそのまま構造化
    if (mode === "manual") {
      const manualFlow: Record<string, string> = {};
      newList.forEach((step, idx) => {
        manualFlow[`${idx + 1}時間目`] = step;
      });

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
        授業の流れ: manualFlow,
        言語活動の工夫: languageActivities,
        結果: "",
      };

      setLastPrompt(userPromptFromInputs);
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
      const selectedEduModel = selectedEducationModelId
        ? styleModels.find((m) => m.id === selectedEducationModelId)
        : undefined;

      const educationModelExtras = selectedEduModel
        ? [
            `【教育観モデル名】${selectedEduModel.name}`,
            `【教育観】${selectedEduModel.content}`,
            selectedEduModel.evaluationFocus ? `【評価観点の重視点】${selectedEduModel.evaluationFocus}` : "",
            selectedEduModel.languageFocus ? `【言語活動の重視点】${selectedEduModel.languageFocus}` : "",
            selectedEduModel.childFocus ? `【育てたい子どもの姿】${selectedEduModel.childFocus}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "";

      const authorGuidance = authorLabel ? getAuthorGuidance(authorLabel) : "";

      const flowLines = newList
        .map((step, idx) => (step.trim() ? `${idx + 1}時間目: ${step}` : `${idx + 1}時間目: `))
        .join("\n");

      const prompt = `
あなたは小学校の国語の授業プランナーです。

【重要（必ず守る）】
1. 入力済みの内容（単元の目標、評価観点、授業の流れの記入済み行）は勝手に改変しない。空欄のみ補完する。
2. 作成モデルの方針と教育観モデルがある場合は、最優先で尊重し、矛盾する活動・評価は入れない。
3. 出力は必ずJSONのみ。前置きや解説は禁止。

【作成モデル（必須）】
${authorLabel}
${authorGuidance ? `【作成モデル方針】\n${authorGuidance}` : ""}

${educationModelExtras ? `【教育観モデル（任意）】\n${educationModelExtras}\n` : "【教育観モデル（任意）】未選択\n"}

【教科書名】${subject}
【学年】${grade}
【ジャンル】${genre}
【教材名】${unit}
【授業時間数】${count}

■ 単元の目標:
${unitGoal}

■ 評価の観点:
知識・技能=${evaluationPoints.knowledge.join("、")};
思考・判断・表現=${evaluationPoints.thinking.join("、")};
主体的に学習に取り組む態度=${evaluationPoints.attitude.join("、")}

■ 育てたい子どもの姿:
${childVision}

■ 授業の流れ:
${flowLines}

※上記で「n時間目: 」だけの箇所は、空欄のみを自然に補完してください（記入済み行は改変禁止）。

■ 言語活動の工夫:
${languageActivities}

—返却フォーマット（JSONのみ）—
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
  "授業の流れ": {
    "1時間目": string,
    "2時間目": string,
    "${count}時間目": string
  },
  "言語活動の工夫": string,
  "結果": string
}
      `.trim();

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

  /* ===== ★同意（allowTrain）をこの授業案に反映（保存済みのみ） ===== */
  const setAllowTrainForThisPlan = async (next: boolean) => {
    if (!uid) {
      alert("ログイン状態を確認できません。");
      return;
    }
    if (!editId) {
      alert("この授業案はまだFirestoreに保存されていません。先に「💾 授業案を保存する」を押してください。");
      return;
    }
    if (!selectedAuthorId) {
      alert("作成モデル（保存先カテゴリ）が不明です。");
      return;
    }
    const author = authors.find((a) => a.id === selectedAuthorId);
    if (!author) {
      alert("保存先カテゴリが見つかりません。");
      return;
    }

    try {
      await updateDoc(doc(db, author.collection, editId), {
        allowTrain: next,
        allowTrainAt: next ? serverTimestamp() : null,
        allowTrainVersion: "v1",
      });
      setConsentTrain(next);
      alert(next ? "学習への提供をONにしました。" : "学習への提供をOFFに戻しました。");
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました。");
    }
  };

  /* ===== 正式保存（履歴＋Firestore）。保存後、下書きをクリア ===== */
  const handleSave = async () => {
    if (!parsedResult) {
      alert("まず授業案を生成してください");
      return;
    }
    if (!selectedAuthorId) {
      alert("作成モデルを選択してください");
      return;
    }
    if (!uid) {
      alert("ログイン状態を確認できません。再読み込み後にお試しください。");
      return;
    }

    const isEdit = Boolean(editId);
    const idToUse = isEdit ? (editId as string) : Date.now().toString();

    const author = authors.find((a) => a.id === selectedAuthorId);
    if (!author) {
      alert("不正な作成モデルが選択されています");
      return;
    }
    const collectionName = author.collection;

    const assistantPlanMarkdown = toAssistantPlanMarkdown(parsedResult);

    // 表示用のモデル名：教育観モデルがあればそれを優先、なければ作成モデル名
    const usedStyleName = selectedEducationModelName || author.label;

    const existingArr: LessonPlanStored[] = JSON.parse(
      typeof window !== "undefined" ? localStorage.getItem("lessonPlans") || "[]" : "[]"
    );

    if (isEdit) {
      const newArr = existingArr.map((p) =>
        p.id === idToUse
          ? {
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

              selectedStyleId: selectedEducationModelId, // 教育観モデルID（任意）
              usedStyleName,
              selectedAuthorId,

              result: parsedResult,
              timestamp: new Date().toISOString(),
              allowTrain: consentTrain,
              allowTrainVersion: "v1",
            }
          : p
      );
      localStorage.setItem("lessonPlans", JSON.stringify(newArr));
    } else {
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

        selectedStyleId: selectedEducationModelId, // 教育観モデルID（任意）
        usedStyleName,
        selectedAuthorId,

        result: parsedResult,
        timestamp: new Date().toISOString(),
        allowTrain: consentTrain,
        allowTrainVersion: "v1",
      };
      existingArr.push(newPlan);
      localStorage.setItem("lessonPlans", JSON.stringify(existingArr));
    }

    try {
      const eduModel = selectedEducationModelId ? styleModels.find((m) => m.id === selectedEducationModelId) : null;

      await setDoc(
        doc(db, collectionName, idToUse),
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

          // 互換：既存の参照が selectedStyleId にある場合を想定して残す（教育観モデルID）
          selectedStyleId: selectedEducationModelId || "",
          usedStyleName,
          selectedAuthorId,

          result: parsedResult,
          assistantPlanMarkdown,
          userPromptText: lastPrompt,
          timestamp: serverTimestamp(),

          author: session?.user?.email || "",

          // 教育観モデルスナップショット（任意）
          modelSnapshot: eduModel
            ? {
                kind: "user-model" as const,
                id: eduModel.id,
                name: eduModel.name,
                at: new Date().toISOString(),
              }
            : null,

          // ★本人同意（学習提供）
          allowTrain: consentTrain,
          allowTrainAt: consentTrain ? serverTimestamp() : null,
          allowTrainVersion: "v1",
        },
        { merge: true }
      );

      // 保存できたので editId を更新（次回 updateDoc で使える）
      setEditId(idToUse);
    } catch (error) {
      console.error("Firestoreへの保存エラー:", error);
      alert("Firestoreへの保存中にエラーが発生しました");
      return;
    }

    try {
      localStorage.removeItem(EDIT_KEY);
      if (uid) {
        await setDoc(doc(db, "lesson_plan_drafts", uid), { ownerUid: uid, payload: null, updatedAt: serverTimestamp() }, { merge: true });
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
        <section style={infoNoteStyle} role="note">
          <p style={{ margin: 0 }}>
            授業案を作成するには、<strong>AIモード</strong>と<strong>手動モード</strong>があります。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            <strong>作成モデル（4分類）は保存先カテゴリであり必須</strong>です。必要に応じて<strong>教育観モデル</strong>（任意）を選ぶと、授業案の方針に反映されます。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            <strong>下書きを保存する際は、必ず📝下書きを保存ボタンを押してください。</strong>
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
              onChange={(e) => {
                const val = e.target.value;
                setSelectedEducationModelId(val);
                const found = styleModels.find((m) => m.id === val);
                setSelectedEducationModelName(found ? found.name : "");
              }}
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
                {f === "knowledge" ? "① 知識・技能：" : f === "thinking" ? "② 思考・判断・表現：" : "③ 主体的に学習に取り組む態度："}
              </label>
              {evaluationPoints[f].map((v, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <textarea value={v} onChange={(e) => handleChangePoint(f, i, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={() => handleRemovePoint(f, i)}>
                    🗑
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => handleAddPoint(f)} style={{ ...inputStyle, backgroundColor: "#9C27B0", color: "white" }}>
                ＋ 追加
              </button>
            </div>
          ))}

          <label>
            ■ 育てたい子どもの姿：<br />
            <textarea value={childVision} onChange={(e) => setChildVision(e.target.value)} rows={2} style={inputStyle} />
          </label>

          <label>
            ■ 言語活動の工夫：<br />
            <textarea value={languageActivities} onChange={(e) => setLanguageActivities(e.target.value)} rows={2} style={inputStyle} />
          </label>

          {hours && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.5rem" }}>■ 授業の展開（手動で入力／空欄はAIが生成）</div>
              {Array.from({ length: Number(hours) }, (_, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: "4rem", lineHeight: "2rem" }}>{i + 1}時間目:</span>
                  <textarea value={lessonPlanList[i] || ""} onChange={(e) => handleLessonChange(i, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
              ))}
            </div>
          )}

          {/* 作成モデル（必須） */}
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>作成モデル（保存先カテゴリ）を選択してください（必須）</div>
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

            {/* 選択中の方針メモ（見える化） */}
            {selectedAuthorId && (
              <div style={{ marginTop: 10, fontSize: "0.92rem", opacity: 0.9 }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>作成モデル方針メモ</div>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, background: "#f7f7f7", padding: 10, borderRadius: 8, border: "1px solid #eee" }}>
                  {getAuthorGuidance(authors.find((a) => a.id === selectedAuthorId)?.label ?? "")}
                </pre>
              </div>
            )}
          </div>

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
                    await setDoc(doc(db, "lesson_plan_drafts", uid), { ownerUid: uid, payload: null, updatedAt: serverTimestamp() }, { merge: true });
                  } catch {}
                }

                // 自動保存の空書き戻し抑止＆リセット
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
            {/* ★本人同意UI */}
            <div style={{ ...cardStyle, backgroundColor: "#fafafa" }}>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>学習への提供（本人同意）</div>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={consentTrain} onChange={(e) => setConsentTrain(e.target.checked)} />
                この授業案を、AIの改善（fine-tune等）の学習データとして提供することに同意します。
              </label>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setAllowTrainForThisPlan(true)}
                  disabled={!consentTrain}
                  style={{
                    ...inputStyle,
                    width: "auto",
                    backgroundColor: consentTrain ? "#2E7D32" : "#ccc",
                    color: "white",
                    marginBottom: 0,
                    cursor: consentTrain ? "pointer" : "not-allowed",
                  }}
                >
                  ✅ 同意してON（保存済みの授業案に反映）
                </button>

                <button
                  type="button"
                  onClick={() => setAllowTrainForThisPlan(false)}
                  style={{
                    ...inputStyle,
                    width: "auto",
                    backgroundColor: "#757575",
                    color: "white",
                    marginBottom: 0,
                  }}
                >
                  ⛔ OFFに戻す（保存済みの授業案に反映）
                </button>
              </div>

              <p style={{ margin: "8px 0 0", fontSize: "0.9rem", opacity: 0.85 }}>
                ※保存すると Firestore に <code>allowTrain</code> が記録され、ON の授業案だけを管理者が学習に集約できます。
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
                    Array.isArray(parsedResult["評価の観点"]?.["知識・技能"]) || typeof parsedResult["評価の観点"]?.["知識・技能"] === "string"
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
                    Array.isArray(parsedResult["評価の観点"]?.["思考・判断・表現"]) || typeof parsedResult["評価の観点"]?.["思考・判断・表現"] === "string"
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
                    Array.isArray(parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"]) || typeof parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"] === "string"
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
                <ul style={listStyle}>
                  {parsedResult["授業の流れ"] &&
                    typeof parsedResult["授業の流れ"] === "object" &&
                    Object.entries(parsedResult["授業の流れ"]).map(([key, val], i) => (
                      <li key={`flow-${i}`}>
                        <strong>{key}：</strong> {String(val)}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
