"use client";

import { useState, useEffect, CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { db } from "../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { useSession } from "next-auth/react";

const EDIT_KEY = "editLessonPlan";

const authors = [
  { label: "読解", id: "reading-model-id", collection: "lesson_plans_reading" },
  { label: "話し合い", id: "discussion-model-id", collection: "lesson_plans_discussion" },
  { label: "作文", id: "writing-model-id", collection: "lesson_plans_writing" },
  { label: "言語活動", id: "language-activity-model-id", collection: "lesson_plans_language_activity" },
];

type StyleModel = {
  id: string;
  name: string;
  content: string;
};

type ParsedResult = {
  [key: string]: any;
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

export default function ClientPlan() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("ログイン状態:", status);
    console.log("セッション情報:", session);
  }, [session, status]);

  const router = useRouter();
  const searchParams = useSearchParams() as URLSearchParams;

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [styleModels, setStyleModels] = useState<StyleModel[]>([]);

  const [selectedStyleId, setSelectedStyleId] = useState<string>("");
  const [selectedStyleName, setSelectedStyleName] = useState<string>("");  // ← 追加

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

  useEffect(() => {
    async function fetchStyleModels() {
      try {
        const colRef = collection(db, "educationModels");
        const snapshot = await getDocs(colRef);
        const models = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "無名のモデル",
          content: doc.data().philosophy || "",
        }));
        setStyleModels(models);
      } catch (error) {
        console.error("教育観モデルの読み込みに失敗しました:", error);
        setStyleModels([]);
      }
    }
    fetchStyleModels();
  }, []);

  useEffect(() => {
    const storedEdit = localStorage.getItem(EDIT_KEY);
    if (storedEdit) {
      try {
        const plan = JSON.parse(storedEdit) as LessonPlanStored;
        setEditId(plan.id);
        setSubject(plan.subject);
        setGrade(plan.grade);
        setGenre(plan.genre);
        setUnit(plan.unit);
        setHours(String(plan.hours));
        setUnitGoal(plan.unitGoal);
        setEvaluationPoints(plan.evaluationPoints);
        setChildVision(plan.childVision);
        setLanguageActivities(plan.languageActivities);
        setLessonPlanList(plan.lessonPlanList);
        setSelectedStyleId(plan.selectedStyleId);

        // 編集時に対応するモデル名もセット
        const found = styleModels.find((m) => m.id === plan.selectedStyleId);
        setSelectedStyleName(found ? found.name : "");

        setParsedResult(plan.result);
        setInitialData(plan);

        const authorFromStyle = authors.find((a) => a.id === plan.selectedStyleId);
        if (authorFromStyle) {
          setSelectedAuthorId(authorFromStyle.id);
        }

        setMode("ai");
      } catch {
        setEditId(null);
        setInitialData(null);
        localStorage.removeItem(EDIT_KEY);
      }
    }
    const styleIdParam = searchParams.get("styleId");
    if (styleIdParam) {
      setSelectedStyleId(styleIdParam);
      // styleModelsがまだ空の場合に備え、こちらはfetch完了後に設定される想定
    }
  }, [searchParams, styleModels]);

  useEffect(() => {
    fetch("/templates.csv")
      .then((res) => res.text())
      .then((text) => {
        const data = Papa.parse(text, { header: true }).data as any[];
        const matched = data.filter(
          (r) => r.学年 === grade && r.ジャンル === genre
        );
        const grouped: EvaluationPoints = {
          knowledge: matched
            .filter((r) => r.観点 === "knowledge")
            .map((r) => r.内容),
          thinking: matched
            .filter((r) => r.観点 === "thinking")
            .map((r) => r.内容),
          attitude: matched
            .filter((r) => r.観点 === "attitude")
            .map((r) => r.内容),
        };
        if (
          grouped.knowledge.length ||
          grouped.thinking.length ||
          grouped.attitude.length
        ) {
          setEvaluationPoints(grouped);
        }
      })
      .catch(() => {});
  }, [grade, genre]);

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedStyleId(selectedId);
    const found = styleModels.find((m) => m.id === selectedId);
    setSelectedStyleName(found ? found.name : "");
  };

  const handleAddPoint = (f: keyof EvaluationPoints) =>
    setEvaluationPoints((p) => ({ ...p, [f]: [...p[f], ""] }));

  const handleRemovePoint = (f: keyof EvaluationPoints, i: number) =>
    setEvaluationPoints((p) => ({
      ...p,
      [f]: p[f].filter((_, idx) => idx !== i),
    }));

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

  const handleAuthorSelect = (id: string) => {
    setSelectedAuthorId(id);
  };

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

    if (mode === "manual") {
      const manualFlow: Record<string, string> = {};
      newList.forEach((step, idx) => {
        manualFlow[`${idx + 1}時間目`] = step;
      });

      const manualResult: ParsedResult = {
        "教科書名": subject,
        "学年": grade,
        "ジャンル": genre,
        "単元名": unit,
        "授業時間数": count,
        "単元の目標": unitGoal,
        "評価の観点": {
          "知識・技能": evaluationPoints.knowledge,
          "思考・判断・表現": evaluationPoints.thinking,
          "主体的に学習に取り組む態度": evaluationPoints.attitude,
        },
        "育てたい子どもの姿": childVision,
        "授業の流れ": manualFlow,
        "言語活動の工夫": languageActivities,
        "結果": "",
      };

      setParsedResult(manualResult);
      setLoading(false);
      return;
    }

    try {
      const selectedModel = styleModels.find((m) => m.id === selectedStyleId);
      const modelContent = selectedModel ? selectedModel.content : "";

      const flowLines = newList
        .map((step, idx) => {
          if (step.trim()) {
            return `${idx + 1}時間目: ${step}`;
          } else {
            return `${idx + 1}時間目: `;
          }
        })
        .join("\n");

      const prompt = `
あなたは小学校の国語の授業プランナーです。
${modelContent ? `以下の教育観を反映してください。\n${modelContent}\n` : ""}

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
    // … 
    "${count}時間目": string
  },
  "言語活動の工夫": string,
  "結果": string
}
      `;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || res.statusText);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("サーバーから無効なJSONが返ってきました");
      }

      setParsedResult(data as ParsedResult);
    } catch (e: any) {
      alert(`生成に失敗しました：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedResult) {
      alert("まず授業案を生成してください");
      return;
    }
    if (!selectedAuthorId) {
      alert("作成モデルを選択してください");
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
              usedStyleName: selectedStyleName || author.label,  // ← ここで selectedStyleName 優先
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
        usedStyleName: selectedStyleName || author.label,  // ← 同じく優先
      };
      existingArr.push(newPlan);
      localStorage.setItem("lessonPlans", JSON.stringify(existingArr));
    }

    try {
      await setDoc(
        doc(db, collectionName, idToUse),
        {
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
          usedStyleName: selectedStyleName || author.label,  // ← 同じく優先
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Firestoreへの保存中にエラーが発生しました:", error);
      alert("Firestoreへの保存中にエラーが発生しました");
      return;
    }

    localStorage.removeItem(EDIT_KEY);
    alert("一括保存しました（ローカル・Firestore）");
    router.push("/plan/history");
  };

  // 以下スタイルなどは省略しません

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
        <h1 style={{ color: "white", marginLeft: "1rem", fontSize: "1.25rem" }}>
          国語授業プランナー
        </h1>
      </nav>

      <div
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

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
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ marginRight: "1rem" }}>
              <input
                type="radio"
                value="ai"
                checked={mode === "ai"}
                onChange={() => setMode("ai")}
              />{" "}
              AIモード
            </label>
            <label>
              <input
                type="radio"
                value="manual"
                checked={mode === "manual"}
                onChange={() => setMode("manual")}
              />{" "}
              手動モード
            </label>
          </div>

          <label>
            モデル選択：<br />
            <select value={selectedStyleId} onChange={handleStyleChange} style={inputStyle}>
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
            </select>
          </label>

          <label>
            単元名：<br />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={inputStyle}
            />
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
            <textarea
              value={unitGoal}
              onChange={(e) => setUnitGoal(e.target.value)}
              rows={2}
              style={inputStyle}
            />
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
                <div
                  key={i}
                  style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
                >
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
            <textarea
              value={childVision}
              onChange={(e) => setChildVision(e.target.value)}
              rows={2}
              style={inputStyle}
            />
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
              <div style={{ marginBottom: "0.5rem" }}>
                ■ 授業の展開（手動で入力／空欄はAIが生成）
              </div>
              {Array.from({ length: Number(hours) }, (_, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
                >
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
            <div style={{ marginBottom: "0.5rem", fontWeight: "bold" }}>
              作成モデルを選択してください（必須）
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {authors.map((author) => (
                <button
                  key={author.id}
                  type="button"
                  onClick={() => handleAuthorSelect(author.id)}
                  style={{
                    flex: 1,
                    padding: "0.8rem 1rem",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor:
                      selectedAuthorId === author.id ? "#1976d2" : "#ccc",
                    color: selectedAuthorId === author.id ? "white" : "black",
                    fontWeight: "bold",
                  }}
                >
                  {author.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedAuthorId}
            style={{
              ...inputStyle,
              backgroundColor: selectedAuthorId ? "#2196F3" : "#ccc",
              color: "white",
              cursor: selectedAuthorId ? "pointer" : "not-allowed",
            }}
          >
            {mode === "manual" ? "授業案を表示する" : "授業案を生成する"}
          </button>
        </form>

        {loading && <p>生成中…</p>}

        {parsedResult && (
          <>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
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

              <button
                onClick={async () => {
                  if (!parsedResult) {
                    alert("まず授業案を生成してください");
                    return;
                  }
                  const el = document.getElementById("result-content");
                  if (!el) return alert("PDF生成対象がありません");
                  const html2pdf = (await import("html2pdf.js")).default;
                  html2pdf()
                    .from(el)
                    .set({
                      margin: 5,
                      filename: `${unit}_授業案.pdf`,
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                      pagebreak: { mode: ["avoid-all"] },
                    })
                    .save();
                }}
                style={{
                  padding: 12,
                  backgroundColor: "#FF9800",
                  color: "white",
                  fontSize: "1.1rem",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                📄 PDFをダウンロード
              </button>
            </div>

            <div id="result-content" style={cardStyle}>
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
                      : parsedResult["評価の観点"]?.["態度"]
                      ? [parsedResult["評価の観点"]["態度"]]
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
