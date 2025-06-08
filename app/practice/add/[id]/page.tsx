"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";

type BoardImage = { name: string; src: string }; // srcはGoogle Driveの公開URL

type PracticeRecord = {
  lessonId: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  lessonTitle: string;
};

type LessonPlan = {
  id: string;
  result?: string | object;
};

// 安全に文字列化する補助
function safeRender(value: any): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function PracticeAddPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [practiceDate, setPracticeDate] = useState("");
  const [reflection, setReflection] = useState("");
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [uploading, setUploading] = useState(false);

  // 授業案＆過去記録読み込み（ローカルストレージ）
  useEffect(() => {
    const plansJson = localStorage.getItem("lessonPlans") || "[]";
    let plans: LessonPlan[];
    try {
      plans = JSON.parse(plansJson) as LessonPlan[];
    } catch {
      plans = [];
    }
    const plan = plans.find((p) => p.id === id) || null;
    setLessonPlan(plan);

    if (plan && plan.result) {
      if (typeof plan.result === "string") {
        const firstLine = plan.result.split("\n")[0].replace(/^【単元名】\s*/, "");
        setLessonTitle(firstLine);
      } else if (typeof plan.result === "object") {
        const unitName = (plan.result as any)["単元名"];
        setLessonTitle(typeof unitName === "string" ? unitName : "");
      } else {
        setLessonTitle("");
      }
    } else {
      setLessonTitle("");
    }

    const recsJson = localStorage.getItem("practiceRecords") || "[]";
    let recs: PracticeRecord[];
    try {
      recs = JSON.parse(recsJson) as PracticeRecord[];
    } catch {
      recs = [];
    }
    const existing = recs.find((r) => r.lessonId === id) || null;
    if (existing) {
      setPracticeDate(existing.practiceDate);
      setReflection(existing.reflection);
      setBoardImages(existing.boardImages);
      setRecord({ ...existing, lessonTitle: existing.lessonTitle || "" });
    }
  }, [id]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages: BoardImage[] = files.map((file) => ({
      name: file.name,
      src: URL.createObjectURL(file),
    }));
    setBoardImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  // 画像削除ボタン処理
  const handleRemoveImage = (i: number) =>
    setBoardImages((prev) => prev.filter((_, idx) => idx !== i));

  // プレビュー作成＝recordセット
  const handlePreview = (e: FormEvent) => {
    e.preventDefault();
    setRecord({
      lessonId: id,
      practiceDate,
      reflection,
      boardImages,
      lessonTitle,
    });
  };

  // ローカル保存（プレビュー生成済み必須）
  const handleSaveLocal = () => {
    if (!record) {
      alert("プレビューを作成してください");
      return;
    }
    const recsJson = localStorage.getItem("practiceRecords") || "[]";
    let recs: PracticeRecord[];
    try {
      recs = JSON.parse(recsJson) as PracticeRecord[];
    } catch {
      recs = [];
    }
    const idx = recs.findIndex((r) => r.lessonId === id);
    if (idx >= 0) recs[idx] = record;
    else recs.push(record);

    try {
      localStorage.setItem("practiceRecords", JSON.stringify(recs));
      alert("ローカルに保存しました");
      router.push("/practice/history");
    } catch (e) {
      alert("localStorageへの保存に失敗しました。容量オーバーかもしれません。");
      console.error(e);
    }
  };

  // スタイル
  const containerStyle: React.CSSProperties = {
    padding: 24,
    maxWidth: 800,
    margin: "auto",
    fontFamily: "sans-serif",
  };

  const navBtnStyle: React.CSSProperties = {
    marginRight: 8,
    padding: "8px 12px",
    backgroundColor: "#1976d2",
    color: "#fff",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  };

  const sectionStyle: React.CSSProperties = {
    border: "2px solid #1976d2",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  };

  const uploadLabelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 8,
    cursor: "pointer",
    padding: "8px 12px",
    backgroundColor: "#1976d2",
    color: "#fff",
    borderRadius: 6,
    textAlign: "center",
  };

  const boardImageWrapperStyle: React.CSSProperties = {
    marginTop: 12,
  };

  const boardImageContainerStyle: React.CSSProperties = {
    width: "100%",
    marginBottom: 12,
  };

  const boardImageStyle: React.CSSProperties = {
    width: "100%", // 横幅いっぱいにして見やすく
    height: "auto",
    borderRadius: 8,
    border: "1px solid #ccc",
    display: "block",
    maxWidth: "100%",
  };

  const removeBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(229, 57, 53, 0.85)",
    border: "none",
    borderRadius: "50%",
    color: "white",
    width: 24,
    height: 24,
    cursor: "pointer",
    fontWeight: "bold",
  };

  // 教育観情報 一行テキスト
  const infoRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    flexWrap: "nowrap",
    marginBottom: 16,
    overflowX: "auto",
  };

  const infoItemStyle: React.CSSProperties = {
    whiteSpace: "nowrap",
    fontWeight: "bold",
    backgroundColor: "#1976d2",
    color: "white",
    padding: "6px 12px",
    borderRadius: 6,
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: 12,
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    width: "100%",
    cursor: "pointer",
    marginTop: 16,
  };

  return (
    <main style={containerStyle}>
      <nav style={{ display: "flex", overflowX: "auto", marginBottom: 24 }}>
        <button onClick={() => router.push("/")} style={navBtnStyle}>
          🏠 ホーム
        </button>
        <button onClick={() => router.push("/plan")} style={navBtnStyle}>
          📋 授業作成
        </button>
        <button onClick={() => router.push("/plan/history")} style={navBtnStyle}>
          📖 計画履歴
        </button>
        <button onClick={() => router.push("/practice/history")} style={navBtnStyle}>
          📷 実践履歴
        </button>
        <button onClick={() => router.push("/models/create")} style={navBtnStyle}>
          ✏️ 教育観作成
        </button>
        <button onClick={() => router.push("/models")} style={navBtnStyle}>
          📚 教育観一覧
        </button>
        <button onClick={() => router.push("/models")} style={navBtnStyle}>
          🕒 教育観履歴
        </button>
      </nav>

      <h2>実践記録作成・編集</h2>

      <form onSubmit={handlePreview}>
        <div style={sectionStyle}>
          <label>
            実施日：<br />
            <input
              type="date"
              value={practiceDate}
              required
              onChange={(e) => setPracticeDate(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={sectionStyle}>
          <label>
            振り返り：<br />
            <textarea
              value={record?.reflection ?? reflection}
              required
              onChange={(e) => setReflection(e.target.value)}
              rows={6}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <label style={uploadLabelStyle}>
          📷 板書写真をアップロード
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>

        <div style={boardImageWrapperStyle}>
          {boardImages.map((img, i) => (
            <div key={img.name + i} style={boardImageContainerStyle}>
              <div style={{ marginBottom: 6, fontWeight: "bold" }}>板書{i + 1}</div>
              <img src={img.src} alt={img.name} style={boardImageStyle} />
              <button
                type="button"
                aria-label="画像を削除"
                onClick={() => handleRemoveImage(i)}
                style={{
                  ...removeBtnStyle,
                  position: "relative",
                  top: "auto",
                  right: "auto",
                  marginTop: 4,
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  fontWeight: "bold",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* 教育観情報 一行テキスト表示 */}
        {lessonPlan?.result && typeof lessonPlan.result === "object" && (
          <div style={infoRowStyle}>
            {["教科書名", "学年", "ジャンル", "単元名", "授業時間数"].map((key) => (
              <div
                key={key}
                style={infoItemStyle}
                title={String((lessonPlan.result as any)[key] ?? "")}
              >
                {key}: {(lessonPlan.result as any)[key] ?? "－"}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          style={{
            padding: 12,
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            width: "100%",
            marginBottom: 16,
          }}
          disabled={uploading}
        >
          {uploading ? "アップロード中..." : "プレビューを生成"}
        </button>
      </form>

      {/* プレビュー表示 */}
      {record && (
        <section
          id="practice-preview"
          style={{
            marginTop: 24,
            padding: 24,
            border: "1px solid #ccc",
            borderRadius: 6,
            backgroundColor: "#fff",
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
          }}
        >
          <h2>
            {lessonPlan?.result && typeof lessonPlan.result === "object"
              ? safeRender((lessonPlan.result as any)["単元名"])
              : lessonTitle}
          </h2>

          {lessonPlan?.result && typeof lessonPlan.result === "object" && (
            <>
              <section style={{ marginBottom: 16 }}>
                <h3>授業の概要</h3>
                <p>
                  <strong>教科書名：</strong>
                  {safeRender((lessonPlan.result as any)["教科書名"])}
                </p>
                <p>
                  <strong>学年：</strong>
                  {safeRender((lessonPlan.result as any)["学年"])}
                </p>
                <p>
                  <strong>ジャンル：</strong>
                  {safeRender((lessonPlan.result as any)["ジャンル"])}
                </p>
                <p>
                  <strong>授業時間数：</strong>
                  {safeRender((lessonPlan.result as any)["授業時間数"])}時間
                </p>
                <p>
                  <strong>育てたい子どもの姿：</strong>
                  {safeRender((lessonPlan.result as any)["育てたい子どもの姿"])}
                </p>
              </section>

              <section style={{ marginBottom: 16 }}>
                <h3>単元の目標</h3>
                <p>{safeRender((lessonPlan.result as any)["単元の目標"])}</p>
              </section>

              {(lessonPlan.result as any)["評価の観点"] && (
                <section style={{ marginBottom: 16 }}>
                  <h3>評価の観点</h3>
                  {Object.entries((lessonPlan.result as any)["評価の観点"]).map(([k, v]) => (
                    <div key={k}>
                      <strong>{k}</strong>
                      <ul>
                        {(Array.isArray(v) ? v : []).map((item, i) => (
                          <li key={i}>{safeRender(item)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {(lessonPlan.result as any)["言語活動の工夫"] && (
                <section style={{ marginBottom: 16 }}>
                  <h3>言語活動の工夫</h3>
                  <p>{safeRender((lessonPlan.result as any)["言語活動の工夫"])}</p>
                </section>
              )}

              {(lessonPlan.result as any)["授業の流れ"] && (
                <section style={{ marginBottom: 16 }}>
                  <h3>授業の流れ</h3>
                  <ul>
                    {Object.entries((lessonPlan.result as any)["授業の流れ"]).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}：</strong>
                        {typeof value === "string" ? value : safeRender(value)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          <section style={{ marginTop: 24 }}>
            <h3>実施記録</h3>
            <p>
              <strong>実施日：</strong> {record.practiceDate}
            </p>
            <p>
              <strong>振り返り：</strong>
            </p>
            <p>{record.reflection}</p>

            {record.boardImages.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>板書写真：</strong>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {record.boardImages.map((img, i) => (
                    <div key={img.name + i} style={{ width: "100%" }}>
                      <div style={{ marginBottom: 6, fontWeight: "bold" }}>
                        板書{i + 1}
                      </div>
                      <img
                        src={img.src}
                        alt={img.name}
                        style={{
                          width: "100%",
                          height: "auto",
                          borderRadius: 8,
                          border: "1px solid #ccc",
                          display: "block",
                          maxWidth: "100%",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </section>
      )}

      {/* 保存ボタンは常に一番下に */}
      <button onClick={handleSaveLocal} style={saveBtnStyle} disabled={uploading}>
        💾 ローカルに保存して実践履歴へ
      </button>
    </main>
  );
}
