"use client";

import React, { useState, useEffect, useRef } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // firestore設定ファイル
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useSession, signOut } from "next-auth/react";

type MessageRole = "system" | "user" | "assistant";
type Message = { role: MessageRole; content: string };
type Step =
  | "selectModel"
  | "selectTextbook"
  | "selectGrade"
  | "selectGenre"
  | "inputUnitName"
  | "inputHours"
  | "inputUnitGoal"
  | "inputEvalKnowledge"
  | "inputEvalThinking"
  | "inputEvalAttitude"
  | "inputChildVision"
  | "inputLanguageActivityFree"
  | "inputFlowIntro"
  | "inputFlowMain"
  | "inputFlowSummary"
  | "confirm"
  | "preview";

const stepMessages: Record<Step, string> = {
  selectModel: "授業モデルを選んでください。",
  selectTextbook: "教科書名を選んでください。",
  selectGrade: "学年を選んでください。",
  selectGenre: "ジャンルを選んでください。",
  inputUnitName: "単元名を教えてください。",
  inputHours: "授業時間数を数字で教えてください。",
  inputUnitGoal: "単元の目標を入力してください（自由記述）。",
  inputEvalKnowledge: "知識・技能の評価観点を一つずつ入力し追加してください。",
  inputEvalThinking: "思考力・判断力・表現力の評価観点を一つずつ入力し追加してください。",
  inputEvalAttitude: "主体的に学習に取り組む態度の評価観点を一つずつ入力し追加してください。",
  inputChildVision: "育てたい子どもの姿を入力してください。",
  inputLanguageActivityFree: "言語活動の工夫を自由入力してください。",
  inputFlowIntro: "単元の導入の大まかな流れを教えてください。",
  inputFlowMain: "単元の展開の大まかな流れを教えてください。",
  inputFlowSummary: "単元のまとめ（言語活動）の大まかな流れを教えてください。",
  confirm: "内容を確認しました。AIで授業案を生成できます。",
  preview: "プレビュー画面です。各項目をクリックすると修正できます。",
};

export default function KokuLessonChatBot() {
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！国語授業プランナーのチャットボットです。質問や相談があれば入力してください。選択肢もありますので、クリックでもどうぞ。",
    },
    { role: "assistant", content: stepMessages["selectModel"] },
  ]);
  const [step, setStep] = useState<Step>("selectModel");
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 入力データ管理
  const [context, setContext] = useState<Record<string, any>>({});
  // 評価観点別配列
  const [evalKnowledge, setEvalKnowledge] = useState<string[]>([]);
  const [evalThinking, setEvalThinking] = useState<string[]>([]);
  const [evalAttitude, setEvalAttitude] = useState<string[]>([]);
  const [evalInputText, setEvalInputText] = useState("");

  // AI生成結果格納
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  // スクロール自動
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // メッセージ追加
  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);

  // 次のステップへ
  const goNextStep = () => {
    const stepOrder: Step[] = [
      "selectModel",
      "selectTextbook",
      "selectGrade",
      "selectGenre",
      "inputUnitName",
      "inputHours",
      "inputUnitGoal",
      "inputEvalKnowledge",
      "inputEvalThinking",
      "inputEvalAttitude",
      "inputChildVision",
      "inputLanguageActivityFree",
      "inputFlowIntro",
      "inputFlowMain",
      "inputFlowSummary",
      "confirm",
      "preview",
    ];
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) {
      const nextStep = stepOrder[idx + 1];
      setStep(nextStep);
      addMessage({ role: "assistant", content: stepMessages[nextStep] });
    }
  };

  // ユーザー選択肢クリック
  const onSelectOption = (option: { id: string; label: string }) => {
    if (loading) return;
    setLoading(true);
    addMessage({ role: "user", content: option.label });
    setContext((prev) => ({ ...prev, [step]: option.label }));

    setTimeout(() => {
      setLoading(false);
      goNextStep();
    }, 300);
  };

  // ユーザー自由入力送信
  const onSendText = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);

    addMessage({ role: "user", content: inputText.trim() });

    // 評価観点入力処理（3段階）
    if (
      step === "inputEvalKnowledge" ||
      step === "inputEvalThinking" ||
      step === "inputEvalAttitude"
    ) {
      if (!inputText.trim()) {
        alert("評価観点を入力してください。");
        setLoading(false);
        return;
      }
      // 対応する配列とset関数取得
      const [arr, setArr] = getEvalArray(step);
      setArr([...arr, inputText.trim()]);
      setInputText("");
      setLoading(false);
      return;
    }

    setContext((prev) => ({ ...prev, [step]: inputText.trim() }));

    setInputText("");
    setLoading(false);
    goNextStep();
  };

  // 対応する評価配列とset関数を返す
  const getEvalArray = (
    step: Step
  ): [string[], React.Dispatch<React.SetStateAction<string[]>>] => {
    switch (step) {
      case "inputEvalKnowledge":
        return [evalKnowledge, setEvalKnowledge];
      case "inputEvalThinking":
        return [evalThinking, setEvalThinking];
      case "inputEvalAttitude":
        return [evalAttitude, setEvalAttitude];
      default:
        return [[], () => {}];
    }
  };

  // 評価観点削除
  const removeEvalInput = (step: Step, index: number) => {
    const [arr, setArr] = getEvalArray(step);
    setArr(arr.filter((_, i) => i !== index));
  };

  // 戻るボタン
  const onBack = () => {
    if (loading) return;
    const stepOrder: Step[] = [
      "selectModel",
      "selectTextbook",
      "selectGrade",
      "selectGenre",
      "inputUnitName",
      "inputHours",
      "inputUnitGoal",
      "inputEvalKnowledge",
      "inputEvalThinking",
      "inputEvalAttitude",
      "inputChildVision",
      "inputLanguageActivityFree",
      "inputFlowIntro",
      "inputFlowMain",
      "inputFlowSummary",
      "confirm",
      "preview",
    ];
    const idx = stepOrder.indexOf(step);
    if (idx <= 0) return;
    const prevStep = stepOrder[idx - 1];
    setStep(prevStep);
    addMessage({ role: "assistant", content: stepMessages[prevStep] });
  };

  // AI授業案生成API呼び出し
  const callGenerateAPI = async () => {
    setLoading(true);
    try {
      // AI生成用プロンプト構築
      const prompt = `
以下の条件で小学校国語の授業プランを作成してください。

授業モデル：${context["selectModel"] || ""}
教科書名：${context["selectTextbook"] || ""}
学年：${context["selectGrade"] || ""}
ジャンル：${context["selectGenre"] || ""}
単元名：${context["inputUnitName"] || ""}
授業時間数：${context["inputHours"] || ""}
単元の目標：${context["inputUnitGoal"] || ""}

評価の観点：
知識・技能=${evalKnowledge.join("、")}
思考力・判断力・表現力=${evalThinking.join("、")}
主体的に学習に取り組む態度=${evalAttitude.join("、")}

育てたい子どもの姿：${context["inputChildVision"] || ""}

言語活動の工夫：${context["inputLanguageActivityFree"] || ""}

単元の導入の流れ：${context["inputFlowIntro"] || ""}
単元の展開の流れ：${context["inputFlowMain"] || ""}
単元のまとめの流れ：${context["inputFlowSummary"] || ""}

上記情報をもとに、時間割形式（例：1時間目: ○○、2時間目: ○○）で授業案の詳細をJSONで返してください。`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      setGeneratedPlan(data);
      addMessage({
        role: "assistant",
        content: "授業案が生成されました。プレビュー画面で内容を確認してください。",
      });
      setStep("preview");
    } catch (e: any) {
      alert("生成に失敗しました：" + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Firestoreに保存
  const saveToFirestore = async () => {
    if (!generatedPlan) {
      alert("まず授業案を生成してください。");
      return;
    }
    try {
      const id = Date.now().toString();
      await setDoc(doc(db, "lesson_plans", id), {
        context,
        evalKnowledge,
        evalThinking,
        evalAttitude,
        generatedPlan,
        createdAt: new Date().toISOString(),
      });
      alert("Firestoreに保存しました。");
    } catch {
      alert("Firestoreへの保存でエラーが発生しました。");
    }
  };

  // PDF生成＆ダウンロード
  const generatePDF = async () => {
    if (!generatedPlan) {
      alert("授業案を生成してください。");
      return;
    }
    const input = document.getElementById("pdf-content");
    if (!input) {
      alert("PDF生成対象が見つかりません。");
      return;
    }

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${context["inputUnitName"] || "授業案"}.pdf`);
  };

  // Google Driveアップロード
  const uploadToGoogleDrive = async () => {
    if (!generatedPlan) {
      alert("授業案を生成してください。");
      return;
    }
    const input = document.getElementById("pdf-content");
    if (!input) {
      alert("アップロード対象が見つかりません。");
      return;
    }
    try {
      // PDF化してBlob取得
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output("blob");

      // Google Driveアップロード用アクセストークン取得
      const accessToken = (session as any)?.accessToken;
      if (!accessToken) {
        alert("Google Driveアップロード用アクセストークンがありません。ログインしてください。");
        return;
      }

      // multipart/form-dataでアップロード
      const metadata = {
        name: `${context["inputUnitName"] || "授業案"}.pdf`,
        mimeType: "application/pdf",
      };
      const formData = new FormData();
      formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      formData.append("file", pdfBlob);

      const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Google Driveアップロードに失敗しました");

      alert("Google Driveにアップロードしました。");
    } catch (e: any) {
      alert("Google Driveアップロード中にエラーが発生しました：" + e.message);
    }
  };

  // プレビュー編集項目クリックで戻る
  const onEditField = (field: Step) => {
    setStep(field);
    addMessage({ role: "assistant", content: stepMessages[field] });
  };

  // UIの選択肢データ
  const lessonModels = [
    { id: "model_reading", label: "読解モデル" },
    { id: "model_writing", label: "作文モデル" },
    { id: "model_discussion", label: "話し合いモデル" },
  ];
  const textbooks = [
    { id: "tokyo", label: "東京書籍" },
    { id: "mitsumura", label: "光村図書" },
    { id: "kyoiku", label: "教育出版" },
  ];
  const grades = [
    { id: "1年", label: "1年生" },
    { id: "2年", label: "2年生" },
    { id: "3年", label: "3年生" },
    { id: "4年", label: "4年生" },
    { id: "5年", label: "5年生" },
    { id: "6年", label: "6年生" },
  ];
  const genres = [
    { id: "物語文", label: "物語文" },
    { id: "説明文", label: "説明文" },
    { id: "詩", label: "詩" },
  ];

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "90vh",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <header
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>国語授業プランナー チャットボット</h1>
        <button
          onClick={() => signOut()}
          style={{
            background: "transparent",
            border: "none",
            color: "#1976d2",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          aria-label="ログアウト"
        >
          🔓 ログアウト
        </button>
      </header>

      {/* チャット表示部分 */}
      <div
        ref={chatContainerRef}
        style={{
          flexGrow: 1,
          overflowY: "auto",
          backgroundColor: "#f9f9f9",
          padding: 12,
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 12,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={i}
              style={{
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "75%",
                padding: "10px 16px",
                borderRadius: 20,
                backgroundColor: isUser ? "#0d47a1" : "#e0e0e0",
                color: isUser ? "white" : "black",
                boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 16,
                userSelect: "text",
                display: "flex",
                alignItems: "center",
              }}
              aria-label={isUser ? "ユーザー発言" : "システム発言"}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "inline-block",
                  textAlign: "center",
                  lineHeight: "30px",
                  marginRight: 8,
                  userSelect: "none",
                  fontSize: 20,
                  backgroundColor: isUser ? "#1565c0" : "#616161",
                  color: "white",
                }}
                aria-hidden="true"
              >
                {isUser ? "👤" : "👩‍🏫"}
              </span>
              <span>{msg.content}</span>
            </div>
          );
        })}
        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              fontStyle: "italic",
              color: "#666",
              padding: "8px 16px",
            }}
          >
            ・・・考えています・・・
          </div>
        )}
      </div>

      {/* 選択肢表示 */}
      {(step === "selectModel" ||
        step === "selectTextbook" ||
        step === "selectGrade" ||
        step === "selectGenre") && (
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {(step === "selectModel"
            ? lessonModels
            : step === "selectTextbook"
            ? textbooks
            : step === "selectGrade"
            ? grades
            : genres
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelectOption(opt)}
              disabled={loading}
              style={{
                flex: "1 1 calc(33% - 12px)",
                minWidth: 100,
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #1976d2",
                backgroundColor: "#2196f3",
                color: "white",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                userSelect: "none",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) =>
                !loading && (e.currentTarget.style.backgroundColor = "#1976d2")
              }
              onMouseLeave={(e) =>
                !loading && (e.currentTarget.style.backgroundColor = "#2196f3")
              }
              aria-label={opt.label}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* 自由入力欄・評価観点入力 */}
      {(step ===
        "inputUnitName" ||
        step === "inputHours" ||
        step === "inputUnitGoal" ||
        step === "inputChildVision" ||
        step === "inputLanguageActivityFree" ||
        step === "inputFlowIntro" ||
        step === "inputFlowMain" ||
        step === "inputFlowSummary") && (
        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <input
            type={step === "inputHours" ? "number" : "text"}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder={
              step === "inputUnitName"
                ? "単元名を入力してください"
                : step === "inputHours"
                ? "授業時間数を数字で入力してください"
                : step === "inputUnitGoal"
                ? "単元の目標を入力してください。例：物語の面白さを見つけよう"
                : step === "inputChildVision"
                ? "育てたい子どもの姿を入力してください"
                : step === "inputLanguageActivityFree"
                ? "言語活動の工夫を入力してください"
                : step === "inputFlowIntro"
                ? "単元の導入の大まかな流れを入力してください"
                : step === "inputFlowMain"
                ? "単元の展開の大まかな流れを入力してください"
                : "単元のまとめ（言語活動）の大まかな流れを入力してください"
            }
            style={{
              flexGrow: 1,
              padding: 10,
              fontSize: 16,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSendText();
              }
            }}
            aria-label="自由入力"
          />
          <button
            onClick={onSendText}
            disabled={loading || !inputText.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#4caf50",
              color: "white",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            送信
          </button>
        </div>
      )}

      {/* 評価観点入力モード */}
      {(step === "inputEvalKnowledge" ||
        step === "inputEvalThinking" ||
        step === "inputEvalAttitude") && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={evalInputText}
            onChange={(e) => setEvalInputText(e.target.value)}
            disabled={loading}
            placeholder={
              step === "inputEvalKnowledge"
                ? "知識・技能の評価観点を入力して追加"
                : step === "inputEvalThinking"
                ? "思考力・判断力・表現力の評価観点を入力して追加"
                : "主体的に学習に取り組む態度の評価観点を入力して追加"
            }
            style={{
              width: "100%",
              padding: 10,
              fontSize: 16,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (evalInputText.trim()) {
                  const [arr, setArr] = getEvalArray(step);
                  setArr([...arr, evalInputText.trim()]);
                  setEvalInputText("");
                }
              }
            }}
            aria-label="評価の観点入力"
          />
          <button
            onClick={() => {
              if (evalInputText.trim()) {
                const [arr, setArr] = getEvalArray(step);
                setArr([...arr, evalInputText.trim()]);
                setEvalInputText("");
              }
            }}
            disabled={loading || !evalInputText.trim()}
            style={{
              marginTop: 8,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#2196f3",
              color: "white",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            追加
          </button>
          <ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 8 }}>
            {(() => {
              const [arr] = getEvalArray(step);
              if (arr.length === 0) {
                return (
                  <li style={{ fontStyle: "italic", color: "#666" }}>
                    まだ評価が追加されていません。
                  </li>
                );
              }
              return arr.map((val, idx) => (
                <li
                  key={idx}
                  style={{ marginBottom: 6, cursor: "default", userSelect: "text" }}
                >
                  {val}
                  <button
                    onClick={() => removeEvalInput(step, idx)}
                    disabled={loading}
                    style={{
                      marginLeft: 12,
                      color: "red",
                      border: "none",
                      background: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                    title="削除"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </li>
              ));
            })()}
          </ul>

          <button
            onClick={() => {
              const [arr] = getEvalArray(step);
              if (arr.length === 0) {
                alert("評価観点を1つ以上追加してください。");
                return;
              }
              // 確認画面へ進むためユーザーメッセージ追加
              let userMsg = "";
              switch (step) {
                case "inputEvalKnowledge":
                  userMsg = "知識・技能の評価観点入力：" + arr.join("、");
                  break;
                case "inputEvalThinking":
                  userMsg = "思考力・判断力・表現力の評価観点入力：" + arr.join("、");
                  break;
                case "inputEvalAttitude":
                  userMsg = "主体的に学習に取り組む態度の評価観点入力：" + arr.join("、");
                  break;
              }
              addMessage({ role: "user", content: userMsg });
              goNextStep();
            }}
            disabled={loading}
            style={{
              marginTop: 12,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#4caf50",
              color: "white",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            次へ進む
          </button>
        </div>
      )}

      {/* 確認画面 */}
      {step === "confirm" && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 16 }}>
          <button
            onClick={onBack}
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#757575",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              minWidth: 120,
            }}
          >
            修正する
          </button>
          <button
            onClick={callGenerateAPI}
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#2196f3",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              minWidth: 180,
            }}
          >
            AIで授業案を生成する
          </button>
        </div>
      )}

      {/* プレビュー画面 */}
      {step === "preview" && (
        <div style={{ marginTop: 16, overflowY: "auto" }}>
          <h2 style={{ marginBottom: 16 }}>授業案プレビュー</h2>
          <div
            id="pdf-content"
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              backgroundColor: "white",
              userSelect: "text",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {Object.entries(context).map(([key, val]) => (
              <div
                key={key}
                style={{ cursor: "pointer", marginBottom: 8 }}
                onClick={() => onEditField(key as Step)}
                title="クリックで編集"
              >
                <strong>{key}：</strong> {Array.isArray(val) ? val.join("、") : String(val)}
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <strong>評価の観点：</strong>
              {evalKnowledge.length + evalThinking.length + evalAttitude.length > 0 ? (
                <>
                  {evalKnowledge.length > 0 && (
                    <>
                      <strong>知識・技能：</strong>
                      <ul style={{ paddingLeft: 20 }}>
                        {evalKnowledge.map((v, i) => (
                          <li key={"k" + i}>{v}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {evalThinking.length > 0 && (
                    <>
                      <strong>思考力・判断力・表現力：</strong>
                      <ul style={{ paddingLeft: 20 }}>
                        {evalThinking.map((v, i) => (
                          <li key={"t" + i}>{v}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {evalAttitude.length > 0 && (
                    <>
                      <strong>主体的に学習に取り組む態度：</strong>
                      <ul style={{ paddingLeft: 20 }}>
                        {evalAttitude.map((v, i) => (
                          <li key={"a" + i}>{v}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <span>未入力</span>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>AI生成授業案の詳細：</strong>
              <pre
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: 8,
                  borderRadius: 6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 300,
                  overflowY: "auto",
                  fontSize: 14,
                }}
              >
                {JSON.stringify(generatedPlan || {}, null, 2)}
              </pre>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button
              onClick={() => setStep("confirm")}
              style={{
                flex: 1,
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#757575",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              戻る（確認画面へ）
            </button>
            <button
              onClick={() => {
                generatePDF();
                saveToFirestore();
                uploadToGoogleDrive();
              }}
              style={{
                flex: 1,
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#4caf50",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              PDF保存してFirestore・Driveにアップロード
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
