"use client";

import { useState, useEffect, useMemo, useRef, CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { db, auth } from "../firebaseConfig";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSession } from "next-auth/react";

/* ===================== 定数 ===================== */
const EDIT_KEY = "editLessonPlan"; // 画面固有のドラフトキー
const DEVICE_ID_KEY = "deviceId";  // 端末識別（任意）

/* ===================== 固定モデル ===================== */
const authors = [
  { label: "読解", id: "reading-model-id", collection: "lesson_plans_reading" },
  { label: "話し合い", id: "discussion-model-id", collection: "lesson_plans_discussion" },
  { label: "作文", id: "writing-model-id", collection: "lesson_plans_writing" },
  { label: "言語活動", id: "language-activity-model-id", collection: "lesson_plans_language_activity" },
];

/* ===================== 型 ===================== */
type StyleModel = {
  id: string;
  name: string;
  content: string;          // philosophy（教育観）
  evaluationFocus?: string; // 評価観点の重視点
  languageFocus?: string;   // 言語活動の重視点
  childFocus?: string;      // 育てたい子どもの姿
  creatorName?: string;     // 作成者名（任意）
};

type ParsedResult = {
  [key: string]: any;
  評価の観点: {
    "知識・技能": string[] | string;
    "思考・判断・表現": string[] | string;
    "主体的に学習に取り組む態度": string[] | string;
    態度?: string[]; // 互換用
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
  unit: string;
  hours: string | number;
  unitGoal: string;
  evaluationPoints: EvaluationPoints;
  childVision: string;
  lessonPlanList: string[];
  languageActivities: string;
  selectedStyleId: string;
  result: ParsedResult;
  timestamp: string;
  usedStyleName?: string | null;
};

type LessonPlanDraft = {
  // 下書き用（未生成でもOKな緩い型）
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
  selectedStyleId: string;
  selectedStyleName?: string;
  selectedAuthorId?: string | null;
  result?: ParsedResult | null;
  timestamp: string;
  isDraft: true;
  /** 追加：LWW 用のクライアント保存時刻（ms） */
  updatedAtMs?: number;
};

/* ===================== 学習用のMarkdown構築ヘルパ ===================== */
function toAssistantPlanMarkdown(r: ParsedResult): string {
  const getA = (arrLike: any): string[] => {
    if (!arrLike) return [];
    return Array.isArray(arrLike) ? arrLike : [String(arrLike)];
  };

  const goal = (r["単元の目標"] ?? "").toString().trim();
  const evalObj = r["評価の観点"] ?? {};
  const evalKnow = getA(evalObj["知識・技能"]);
  const evalThink = getA(evalObj["思考・判断・表現"]);
  const evalAtt = getA(evalObj["主体的に学習に取り組む態度"]);
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

/* 入力値からユーザープロンプト（学習用）を組み立てる */
function buildUserPromptFromInputs(args: {
  styleName: string;
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
    styleName,
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
    styleName ? `モデル:${styleName}` : "",
    `【教科書名】${subject}`,
    `【学年】${grade}`,
    `【ジャンル】${genre}`,
    `【単元名】${unit}`,
    `【授業時間数】${hours}`,
    "",
    "■ 単元の目標:",
    unitGoal,
    "",
    "■ 評価の観点 (JSON 配列形式):",
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

/* ===================== 本体 ===================== */
export default function ClientPlan() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams() as unknown as URLSearchParams;

  /* Firebase Auth UID を安定取得 */
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  /* 端末ID（任意） */
  const deviceIdRef = useRef<string>("");
  useEffect(() => {
    const existed = localStorage.getItem(DEVICE_ID_KEY);
    if (existed) {
      deviceIdRef.current = existed;
    } else {
      const id = crypto?.randomUUID?.() ?? `dev_${Math.random().toString(36).slice(2)}`;
      deviceIdRef.current = id;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
  }, []);

  /* 状態 */
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [styleModels, setStyleModels] = useState<StyleModel[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>("");
  const [selectedStyleName, setSelectedStyleName] = useState<string>("");
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

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

  const [childVision, setChildVision] = useState("");
  const [languageActivities, setLanguageActivities] = useState("");
  const [lessonPlanList, setLessonPlanList] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<LessonPlanStored | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // 学習用に保存するユーザープロンプト
  const [lastPrompt, setLastPrompt] = useState<string>("");

  /* クラウド同期状態 */
  const [cloudStatus, setCloudStatus] = useState<"idle" | "saving" | "saved" | "error" | "offline">("idle");
  const skipNextCloudSaveRef = useRef(false);
  const lastRemoteMsRef = useRef<number>(0);
  const lastLocalMsRef = useRef<number>(0);

  /* ===================== Firestore: 教育観モデル読み込み ===================== */
  useEffect(() => {
    async function fetchStyleModels() {
      try {
        const colRef = collection(db, "educationModels");
        const snapshot = await getDocs(colRef);
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
        console.error("教育観モデルの読み込みに失敗しました:", error);
        setStyleModels([]);
      }
    }
    fetchStyleModels();
  }, []);

  /* ===================== 共有関数: DraftをSTATEへ反映 ===================== */
  function applyDraftToState(plan: LessonPlanDraft | LessonPlanStored) {
    setEditId((plan as any).id ?? null);
    setSubject(plan.subject);
    setGrade(plan.grade);
    setGenre(plan.genre);
    setUnit(plan.unit);
    setHours(String(plan.hours));
    setUnitGoal(plan.unitGoal);
    setEvaluationPoints(plan.evaluationPoints);
    setChildVision(plan.childVision);
    setLanguageActivities(plan.languageActivities);
    setLessonPlanList(plan.lessonPlanList || []);
    setSelectedStyleId(plan.selectedStyleId || "");
    setSelectedStyleName((plan as any).selectedStyleName || "");

    if ("selectedAuthorId" in plan) {
      setSelectedAuthorId((plan as LessonPlanDraft).selectedAuthorId ?? null);
    }
    if ("mode" in plan) {
      setMode((plan as LessonPlanDraft).mode);
    } else {
      setMode("ai");
    }
    if ((plan as any).result) {
      setParsedResult((plan as any).result);
    } else {
      setParsedResult(null);
    }
    setInitialData((plan as any).isDraft ? null : (plan as LessonPlanStored));
  }

  /* ===================== 初期復元（ローカル優先 → URL反映） ===================== */
  useEffect(() => {
    const storedEdit = typeof window !== "undefined" ? localStorage.getItem(EDIT_KEY) : null;
    if (storedEdit) {
      try {
        const plan = JSON.parse(storedEdit) as LessonPlanDraft | LessonPlanStored;
        applyDraftToState(plan);
        // LWW比較用
        const localMs =
          typeof (plan as LessonPlanDraft).updatedAtMs === "number"
            ? (plan as LessonPlanDraft).updatedAtMs!
            : Date.parse((plan as any).timestamp ?? "") || 0;
        lastLocalMsRef.current = localMs || 0;
      } catch {
        setEditId(null);
        setInitialData(null);
        if (typeof window !== "undefined") localStorage.removeItem(EDIT_KEY);
      }
    }
    const styleIdParam = (searchParams as any)?.get?.("styleId");
    if (styleIdParam) setSelectedStyleId(styleIdParam);
  }, [searchParams, styleModels]);

  /* ===================== CSVテンプレ補完 ===================== */
  useEffect(() => {
    fetch("/templates.csv")
      .then((res) => res.text())
      .then((text) => {
        const data = Papa.parse(text, { header: true }).data as any[];
        const matched = data.filter((r) => r.学年 === grade && r.ジャンル === genre);
        const grouped: EvaluationPoints = {
          knowledge: matched.filter((r) => r.観点 === "knowledge").map((r) => r.内容),
          thinking: matched.filter((r) => r.観点 === "thinking").map((r) => r.内容),
          attitude: matched.filter((r) => r.観点 === "attitude").map((r) => r.内容),
        };
        if (grouped.knowledge.length || grouped.thinking.length || grouped.attitude.length) {
          setEvaluationPoints(grouped);
        }
      })
      .catch(() => {});
  }, [grade, genre]);

  /* ===================== 下書きオブジェクト構築 ===================== */
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
    selectedStyleId,
    selectedStyleName,
    selectedAuthorId,
    result: parsedResult ?? null,
    timestamp: new Date().toISOString(),
    isDraft: true,
  });

  /* ===================== クラウド保存関数 ===================== */
  const cloudDocRef = useMemo(() => {
    if (!uid) return null;
    return doc(db, "users", uid, "drafts", EDIT_KEY);
  }, [uid]);

  async function saveDraftToCloud(d: LessonPlanDraft) {
    if (!cloudDocRef || !uid) return;
    if (skipNextCloudSaveRef.current) return; // 直近の受信直後は保存抑制

    try {
      setCloudStatus("saving");
      await setDoc(
        cloudDocRef,
        {
          ownerUid: uid,
          ...d,
          updatedAtMs: d.updatedAtMs ?? Date.now(),
          updatedAt: serverTimestamp(),
          deviceId: deviceIdRef.current,
        },
        { merge: true }
      );
      setCloudStatus("saved");
    } catch (e) {
      console.error("Cloud save failed:", e);
      setCloudStatus(navigator.onLine ? "error" : "offline");
    }
  }

  /* ===================== 自動保存（ローカル & クラウド） ===================== */
  function localSave(d: LessonPlanDraft) {
    try {
      localStorage.setItem(EDIT_KEY, JSON.stringify(d));
    } catch (e) {
      console.error("ローカル一時保存に失敗:", e);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      const updatedAtMs = Date.now();
      const draft = { ...buildDraft(), updatedAtMs };
      // LWW用にローカル時刻を更新
      lastLocalMsRef.current = updatedAtMs;

      // ローカル保存
      localSave(draft);
      // クラウド保存（ログイン時のみ）
      if (uid) saveDraftToCloud(draft);
    }, 800); // 0.8秒デバウンス
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
    selectedStyleId,
    selectedStyleName,
    selectedAuthorId,
    parsedResult,
  ]);

  /* ===================== クラウド→ローカル 受信同期 ===================== */
  useEffect(() => {
    if (!cloudDocRef) return;
    const unsub = onSnapshot(cloudDocRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      const remoteMs = typeof data.updatedAtMs === "number" ? data.updatedAtMs : 0;

      // 受信が自分より古ければ無視（LWW）
      const localMs = lastLocalMsRef.current || 0;
      const alreadyAppliedMs = lastRemoteMsRef.current || 0;
      if (remoteMs <= localMs || remoteMs <= alreadyAppliedMs) return;

      // 反映
      const plan = data as LessonPlanDraft;
      applyDraftToState(plan);

      // 受信直後の自動保存ループを抑制
      lastRemoteMsRef.current = remoteMs;
      skipNextCloudSaveRef.current = true;
      setTimeout(() => {
        skipNextCloudSaveRef.current = false;
      }, 1200);
    });
    return () => unsub();
  }, [cloudDocRef]);

  /* ===================== 入力系ハンドラ ===================== */
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

  /* ===================== 生成 ===================== */
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

    // 学習用プロンプト
    const userPromptFromInputs = buildUserPromptFromInputs({
      styleName: selectedStyleName,
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

    if (mode === "manual") {
      const manualFlow: Record<string, string> = {};
      newList.forEach((step, idx) => {
        manualFlow[`${idx + 1}時間目`] = step;
      });

      const manualResult: ParsedResult = {
        教科書名: subject,
        学年: grade,
        ジャンル: genre,
        単元名: unit,
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
      setLoading(false);
      return;
    }

    try {
      const selectedModel = styleModels.find((m) => m.id === selectedStyleId);
      const modelExtras = selectedModel
        ? [
            `【モデル名】${selectedModel.name}`,
            `【教育観】${selectedModel.content}`,
            selectedModel.evaluationFocus ? `【評価観点の重視点】${selectedModel.evaluationFocus}` : "",
            selectedModel.languageFocus ? `【言語活動の重視点】${selectedModel.languageFocus}` : "",
            selectedModel.childFocus ? `【育てたい子どもの姿】${selectedModel.childFocus}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "";

      const flowLines = newList
        .map((step, idx) => (step.trim() ? `${idx + 1}時間目: ${step}` : `${idx + 1}時間目: `))
        .join("\n");

      const prompt = `
あなたは小学校の国語の授業プランナーです。
${modelExtras ? `— この授業で反映してほしいモデル情報 —\n${modelExtras}\n` : ""}

【教科書名】${subject}
【学年】${grade}
【ジャンル】${genre}
【単元名】${unit}
【授業時間数】${count}

■ 単元の目標:
${unitGoal}

■ 評価の観点 (JSON 配列形式):
知識・技能=${evaluationPoints.knowledge.join("、")};
思考・判断・表現=${evaluationPoints.thinking.join("、")};
主体的に学習に取り組む態度=${evaluationPoints.attitude.join("、")}

■ 育てたい子どもの姿:
${childVision}

■ 授業の流れ:
${flowLines}

※上記で「n時間目: 」だけ書かれている箇所は、AI が自動生成してください。

■ 言語活動の工夫:
${languageActivities}

—返却フォーマット—
{
  "教科書名": string,
  "学年": string,
  "ジャンル": string,
  "単元名": string,
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
    } catch (e: any) {
      alert(`生成に失敗しました：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== 正式保存（本番コレクション） ===================== */
  const handleSave = async () => {
    if (!parsedResult) {
      alert("まず授業案を生成してください");
      return;
    }
    if (!selectedAuthorId) {
      alert("作成モデルを選択してください");
      return;
    }

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      alert("認証中です。数秒後に再度お試しください。");
      return;
    }

    const isEdit = Boolean(editId);
    const idToUse = isEdit ? editId! : Date.now().toString();
    const timestamp = new Date().toISOString();

    const author = authors.find((a) => a.id === selectedAuthorId);
    if (!author) {
      alert("不正な作成モデルが選択されています");
      return;
    }
    const collectionName = author.collection;

    const assistantPlanMarkdown = toAssistantPlanMarkdown(parsedResult);

    // ローカルにもミラー保存
    const existingArr: LessonPlanStored[] = JSON.parse(localStorage.getItem("lessonPlans") || "[]");
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
              selectedStyleId,
              result: parsedResult,
              timestamp,
              usedStyleName: selectedStyleName || author.label,
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
        selectedStyleId,
        result: parsedResult,
        timestamp,
        usedStyleName: selectedStyleName || author.label,
      };
      existingArr.push(newPlan);
      localStorage.setItem("lessonPlans", JSON.stringify(existingArr));
    }

    // Firestore へ保存（正本）
    try {
      await setDoc(
        doc(db, collectionName, idToUse),
        {
          ownerUid: currentUid,
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
          selectedStyleId,
          result: parsedResult,
          assistantPlanMarkdown, // 教師データ: assistant 側
          userPromptText: lastPrompt, // 教師データ: user 側
          timestamp: serverTimestamp(),
          usedStyleName: selectedStyleName || author.label,
          author: session?.user?.email || "",
          modelId: selectedStyleId || null,
          modelName: selectedStyleName || null,
          modelNameCanonical:
            (selectedStyleName || "").toLowerCase().replace(/\s+/g, "-") || null,
          modelSnapshot: selectedStyleId
            ? (styleModels.find((m) => m.id === selectedStyleId)
                ? {
                    kind: "user-model",
                    id: selectedStyleId,
                    name: styleModels.find((m) => m.id === selectedStyleId)!.name,
                    at: new Date().toISOString(),
                  }
                : authors.find((a) => a.id === selectedStyleId)
                ? {
                    kind: "builtin",
                    id: selectedStyleId,
                    name: authors.find((a) => a.id === selectedStyleId)!.label,
                    at: new Date().toISOString(),
                  }
                : null)
            : null,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Firestoreへの保存中にエラーが発生しました:", error);
      alert("Firestoreへの保存中にエラーが発生しました");
      return;
    }

    // 正式保存後はドラフトをクリア（ローカル＆クラウド）
    localStorage.removeItem(EDIT_KEY);
    if (cloudDocRef) {
      try {
        await deleteDoc(cloudDocRef);
      } catch (e) {
        console.warn("クラウド下書き削除に失敗（無視可）:", e);
      }
    }
    alert("一括保存しました（ローカル・Firestore）");
    router.push("/plan/history");
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
    border: "1px solid " + "#ccc",
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
  const barStyle: CSSProperties = { height: 4, backgroundColor: "white", borderRadius: 2 };
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
  const menuScrollStyle: CSSProperties = { flex: 1, overflowY: "auto", padding: "1rem", paddingBottom: 0 };
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

  /* ===================== UI ===================== */
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
        {/* 注釈ボックス */}
        <section style={infoNoteStyle} role="note">
          <p style={{ margin: 0 }}>
            授業案を作成するには、<strong>AIモード</strong>と<strong>手動モード</strong>があります。現在はAIモードで作成しても
            <strong>理想となる授業案は作成されません</strong>。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            みなさんの作成した授業案、後に作成する授業実践案を学習させることで、AIモードで
            <strong>面白く・活動が具体的な国語の授業案</strong>を一緒に考えることができる。そんな未来が待っています。
          </p>
          <p style={{ margin: "6px 0 0" }}>
            まずは、<strong>手動モード</strong>で授業案を生成していきましょう。
            作成モデルは<strong>自分の授業に近いモデル</strong>を<strong>4つ</strong>の中から選択してください。
          </p>
        </section>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ marginRight: "1rem" }}>
              <input type="radio" value="ai" checked={mode === "ai"} onChange={() => setMode("ai")} />{" "}
              AIモード
            </label>
            <label>
              <input type="radio" value="manual" checked={mode === "manual"} onChange={() => setMode("manual")} />{" "}
              手動モード
            </label>
          </div>

          <label>
            モデル選択：<br />
            <select
              value={selectedStyleId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedStyleId(val);

                const foundAuthor = authors.find((a) => a.id === val);
                if (foundAuthor) {
                  setSelectedStyleName(foundAuthor.label);
                  setSelectedAuthorId(val);
                } else {
                  const foundStyle = styleModels.find((m) => m.id === val);
                  setSelectedStyleName(foundStyle ? foundStyle.name : "");
                  setSelectedAuthorId(null); // 教育観モデル選択時は保存カテゴリは未選択のまま
                }
              }}
              style={inputStyle}
            >
              <option value="">（未選択）</option>
              <optgroup label="固定モデル">
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="教育観モデル一覧">
                {styleModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
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
            </select>
          </label>

          <label>
            単元名：<br />
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
          </label>

          <label>
            授業時間数：<br />
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              style={inputStyle}
              min={0}
            />
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
                  <textarea
                    value={v}
                    onChange={(e) => handleChangePoint(f, i, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button type="button" onClick={() => handleRemovePoint(f, i)}>🗑</button>
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
            ■ 言語活動の工夫：<br />
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

          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>作成モデルを選択してください（必須）</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {authors.map((author) => (
                <button
                  key={author.id}
                  type="button"
                  onClick={() => {
                    setSelectedAuthorId(author.id);
                    setSelectedStyleName(author.label);
                  }}
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

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
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

            {/* 手動の一時保存（ローカルのみ） */}
            <button
              type="button"
              onClick={() => {
                const draft = { ...buildDraft(), updatedAtMs: Date.now() };
                localSave(draft);
                lastLocalMsRef.current = draft.updatedAtMs!;
                alert("下書きを保存しました（この端末のローカルのみ）");
              }}
              style={{
                ...inputStyle,
                backgroundColor: "#757575",
                color: "white",
                marginBottom: 0,
              }}
            >
              📝 一時保存（ローカル）
            </button>

            {/* 明示的にクラウド保存 */}
            <button
              type="button"
              onClick={async () => {
                if (!uid) {
                  alert("ログインが必要です。");
                  return;
                }
                const draft = { ...buildDraft(), updatedAtMs: Date.now() };
                localSave(draft);
                lastLocalMsRef.current = draft.updatedAtMs!;
                await saveDraftToCloud(draft);
                alert("下書きを保存しました（クラウド）");
              }}
              style={{
                ...inputStyle,
                backgroundColor: "#4DB6AC",
                color: "white",
                marginBottom: 0,
              }}
            >
              ☁ 一時保存（クラウド）
            </button>

            {/* 下書きクリア（ローカル＋クラウド） */}
            <button
              type="button"
              onClick={async () => {
                localStorage.removeItem(EDIT_KEY);
                if (cloudDocRef) {
                  try {
                    await deleteDoc(cloudDocRef);
                  } catch (e) {
                    console.warn("クラウド下書き削除エラー:", e);
                  }
                }
                alert("下書きを削除しました（ローカル・クラウド）");
              }}
              style={{
                ...inputStyle,
                backgroundColor: "#BDBDBD",
                color: "white",
                marginBottom: 0,
              }}
            >
              🧹 下書きをクリア
            </button>

            {/* 同期ステータス表示 */}
            <span style={{ fontSize: "0.9rem", color: "#555" }}>
              同期:{" "}
              {cloudStatus === "saving"
                ? "保存中…"
                : cloudStatus === "saved"
                ? "保存済み"
                : cloudStatus === "offline"
                ? "オフライン（ローカル保存中）"
                : cloudStatus === "error"
                ? "エラー（後で再試行）"
                : "待機中"}
            </span>
          </div>
        </form>

        {loading && <p>生成中…</p>}

        {parsedResult && (
          <>
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
                💾 一括保存 (ローカル・Firestore)
              </button>
            </div>

            {/* 表示領域 */}
            <div
              id="result-content"
              style={{ ...cardStyle, backgroundColor: "white", minHeight: "500px", padding: "16px" }}
            >
              <div style={titleStyle}>授業の概要</div>
              <p>教科書名：{parsedResult["教科書名"]}</p>
              <p>学年：{parsedResult["学年"]}</p>
              <p>ジャンル：{parsedResult["ジャンル"]}</p>
              <p>単元名：{parsedResult["単元名"]}</p>
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
                    Array.isArray(parsedResult["評価の観点"]?.["知識・技能"])
                      ? parsedResult["評価の観点"]["知識・技能"]
                      : parsedResult["評価の観点"]?.["知識・技能"]
                      ? [parsedResult["評価の観点"]["知識・技能"]]
                      : []
                  ).map((v: string, i: number) => (
                    <li key={`knowledge-${i}`}>{v}</li>
                  ))}
                </ul>

                <strong>思考・判断・表現</strong>
                <ul style={listStyle}>
                  {(
                    Array.isArray(parsedResult["評価の観点"]?.["思考・判断・表現"])
                      ? parsedResult["評価の観点"]["思考・判断・表現"]
                      : parsedResult["評価の観点"]?.["思考・判断・表現"]
                      ? [parsedResult["評価の観点"]["思考・判断・表現"]]
                      : []
                  ).map((v: string, i: number) => (
                    <li key={`thinking-${i}`}>{v}</li>
                  ))}
                </ul>

                <strong>主体的に学習に取り組む態度</strong>
                <ul style={listStyle}>
                  {(
                    Array.isArray(parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"])
                      ? parsedResult["評価の観点"]["主体的に学習に取り組む態度"]
                      : parsedResult["評価の観点"]?.["主体的に学習に取り組む態度"]
                      ? [parsedResult["評価の観点"]["主体的に学習に取り組む態度"]]
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
