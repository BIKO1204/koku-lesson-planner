"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../firebaseConfig"; // ルート直下のfirebaseConfig.jsからの相対パス
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

export default function PlanPage() {
  const correctPassword = "92kofb";
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const [subject, setSubject] = useState("東京書籍");
  const [grade, setGrade] = useState("1年");
  const [genre, setGenre] = useState("物語文");
  const [unit, setUnit] = useState("");
  const [hours, setHours] = useState("");
  const [unitGoal, setUnitGoal] = useState("");
  const [evaluationPoints, setEvaluationPoints] = useState({
    knowledge: [""],
    thinking: [""],
    attitude: [""],
  });
  const [childImage, setChildImage] = useState("");
  const [lessonPlanList, setLessonPlanList] = useState([]);
  const [languageActivities, setLanguageActivities] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [saved, setSaved] = useState(false);

  // Firestoreから授業プラン一覧を取得（認証後に読み込む）
  useEffect(() => {
    if (!authenticated) return;

    const fetchLessonPlans = async () => {
      try {
        const q = query(collection(db, "lesson_plans"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const plans = [];
        querySnapshot.forEach((doc) => {
          plans.push(doc.data());
        });
        setLessonPlanList(plans.length > 0 ? plans[0].lessonPlanList || [] : []);
        setResult(plans.length > 0 ? plans[0].result || "" : "");
      } catch (error) {
        console.error("Firestoreからの読み込みエラー:", error);
      }
    };

    fetchLessonPlans();
  }, [authenticated]);

  const handleLessonChange = (index, value) => {
    const newList = [...lessonPlanList];
    newList[index] = value;
    setLessonPlanList(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    const lessonPlanText = lessonPlanList.map((text, i) => `${i + 1}時間目：${text}`).join("\n");
    const evaluationText = `① 知識・技能：
${evaluationPoints.knowledge.map((p) => `・${p}`).join("\n")}
② 思考・判断・表現：
${evaluationPoints.thinking.map((p) => `・${p}`).join("\n")}
③ 主体的に学習に取り組む態度：
${evaluationPoints.attitude.map((p) => `・${p}`).join("\n")}`.trim();

    // ここはAI生成APIの呼び出し例（省略可）
    const manualResult = `【単元名】${unit}
【単元の目標】
${unitGoal}
【評価の観点】
${evaluationText}
【育てたい子どもの姿】
${childImage}
【授業の展開】
${lessonPlanText}
【言語活動の工夫】
${languageActivities}`.trim();

    setResult(manualResult);
    setLoading(false);
  };

  const handleSavePlan = async () => {
    try {
      const timestamp = new Date().toISOString();
      const id = uuidv4();
      const newEntry = {
        id,
        timestamp,
        subject,
        grade,
        genre,
        unit,
        hours,
        unitGoal,
        evaluationPoints,
        childImage,
        lessonPlanList,
        languageActivities,
        result,
      };
      await addDoc(collection(db, "lesson_plans"), newEntry);
      setSaved(true);
      alert("授業案をFirestoreに保存しました！");
    } catch (error) {
      console.error("Firestore保存エラー:", error);
      alert("授業案の保存に失敗しました。");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.8rem",
    fontSize: "1.1rem",
    borderRadius: 8,
    border: "1px solid #ccc",
    marginBottom: "1rem",
  };

  return (
    <main style={{ padding: "1.5rem", fontFamily: "sans-serif", maxWidth: "90vw", margin: "0 auto" }}>
      {!authenticated ? (
        <div style={{ textAlign: "center" }}>
          <h2>パスワードを入力してください</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="パスワードを入力"
          />
          <button
            onClick={() =>
              password === correctPassword ? setAuthenticated(true) : alert("パスワードが違います")
            }
            style={{ ...inputStyle, backgroundColor: "#4CAF50", color: "white" }}
          >
            確認
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            単元名：
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
            授業時間数：
            <input
              type="number"
              min="1"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              style={inputStyle}
            />
          </label>

          {hours && lessonPlanList.length !== Number(hours) && (
            <button
              type="button"
              onClick={() => {
                const count = Number(hours);
                setLessonPlanList(Array.from({ length: count }, (_, i) => lessonPlanList[i] || ""));
              }}
              style={{ ...inputStyle, backgroundColor: "#03A9F4", color: "white" }}
            >
              ⏱ 授業時間にあわせて展開欄を生成する
            </button>
          )}

          {lessonPlanList.length > 0 &&
            lessonPlanList.map((text, i) => (
              <label key={i}>
                {i + 1}時間目：
                <textarea
                  value={text}
                  onChange={(e) => handleLessonChange(i, e.target.value)}
                  rows={2}
                  style={inputStyle}
                />
              </label>
            ))}

          <label>
            ■ 単元の目標：
            <textarea
              value={unitGoal}
              onChange={(e) => setUnitGoal(e.target.value)}
              rows={2}
              style={inputStyle}
            />
          </label>

          <label>
            育てたい子どもの姿：
            <textarea
              value={childImage}
              onChange={(e) => setChildImage(e.target.value)}
              rows={2}
              style={inputStyle}
            />
          </label>

          <label>
            言語活動の工夫：
            <textarea
              value={languageActivities}
              onChange={(e) => setLanguageActivities(e.target.value)}
              rows={2}
              style={inputStyle}
            />
          </label>

          <button type="submit" style={{ ...inputStyle, backgroundColor: "#4CAF50", color: "white" }}>
            授業案を表示する
          </button>

          {loading && <p>生成中...</p>}

          {result && (
            <>
              <button
                onClick={handleSavePlan}
                type="button"
                style={{ ...inputStyle, backgroundColor: "#FF9800", color: "white" }}
              >
                この授業案をFirestoreに保存する
              </button>

              <pre
                id="result-content"
                style={{ whiteSpace: "pre-wrap", border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}
              >
                {result}
              </pre>
            </>
          )}
        </form>
      )}
    </main>
  );
}
