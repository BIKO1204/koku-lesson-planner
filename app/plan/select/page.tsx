// ファイル: app/plan/select/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig"; // .js 拡張子は不要です

type LessonPlan = {
  id: string;
  timestamp: string;
  subject: string;
  grade: string;
  genre: string;
  unit: string;
  hours: number | string;
  languageActivities: string;
  result: string;
  usedStyleName?: string | null;
};

export default function SelectPlansPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Firestore から読み込み (モジュラー SDK 形式)
  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);

      try {
        // ① コレクション参照を作成
        const colRef = collection(db, "lesson_plans");
        // ② query を組み立て (timestamp 降順)
        const q = query(colRef, orderBy("timestamp", "desc"));
        // ③ ドキュメント群を取得
        const snapshot = await getDocs(q);
        // ④ スナップショットを配列に変換
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<LessonPlan, "id">),
        }));
        setPlans(docs);
      } catch (e) {
        console.error("Firestore 読み込みエラー:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  // チェックボックスのトグル
  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 選択データを JSON としてダウンロード
  const handleDownload = () => {
    if (selectedIds.size === 0) {
      alert("まずエクスポートする授業案を選択してください。");
      return;
    }
    const selected = plans.filter((p) => selectedIds.has(p.id));
    const blob = new Blob([JSON.stringify(selected, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected_plans.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 選択したものを Firestore から一括削除
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert("まず削除する授業案を選択してください。");
      return;
    }
    if (!confirm("選択した授業案を本当に削除しますか？")) return;

    const idsToDelete = Array.from(selectedIds);

    for (const id of idsToDelete) {
      try {
        // モジュラー SDK 形式で deleteDoc を使う
        await deleteDoc(doc(db, "lesson_plans", id));
      } catch (e) {
        console.error(`Firestore 削除エラー (ID=${id}):`, e);
        alert(`ID=${id} の削除に失敗しました`);
      }
    }
    // UI 更新: plans から削除済みを除去し、チェックセットをクリア
    setPlans((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  };

  if (loading) {
    return <p style={{ padding: "2rem", textAlign: "center" }}>読み込み中…</p>;
  }

  return (
    <main style={mainStyle}>
      <button onClick={() => router.back()} style={backButtonStyle}>
        ← 戻る
      </button>

      <h1 style={headingStyle}>Firestore: 授業案選択ページ</h1>

      <div style={actionsStyle}>
        <button onClick={handleDownload} style={downloadButtonStyle}>
          📥 選択データをJSONダウンロード
        </button>
        <button onClick={handleBulkDelete} style={deleteButtonStyle}>
          🗑 選択データを一括削除 ({selectedIds.size})
        </button>
      </div>

      {plans.length === 0 ? (
        <p style={emptyStyle}>Firestore に授業案が存在しません。</p>
      ) : (
        <ul style={listStyle}>
          {plans.map((p) => (
            <li key={p.id} style={itemStyle}>
              <input
                type="checkbox"
                checked={selectedIds.has(p.id)}
                onChange={() => toggle(p.id)}
                style={checkboxStyle}
              />
              <div style={infoStyle}>
                <strong>{p.unit}</strong> ({p.grade}・{p.genre})<br />
                <small>
                  {new Date(p.timestamp).toLocaleString()} ／{" "}
                  {p.usedStyleName || "スタイル未設定"}
                </small>
                <pre style={resultStyle}>{p.result}</pre>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// --- スタイル定義 ---

const mainStyle: React.CSSProperties = {
  padding: "1.5rem",
  fontFamily: "sans-serif",
  maxWidth: "900px",
  margin: "0 auto",
};

const backButtonStyle: React.CSSProperties = {
  marginBottom: "1rem",
  background: "none",
  border: "none",
  color: "#1976d2",
  cursor: "pointer",
  fontSize: "1rem",
};

const headingStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "1.6rem",
  marginBottom: "1rem",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "1rem",
};

const downloadButtonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  backgroundColor: "#009688",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  backgroundColor: "#f44336",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#666",
  marginTop: "2rem",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
};

const itemStyle: React.CSSProperties = {
  position: "relative",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1rem",
  display: "flex",
  gap: "0.75rem",
};

const checkboxStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "1.2rem",
  height: "1.2rem",
  marginTop: "0.4rem",
};

const infoStyle: React.CSSProperties = {
  flexGrow: 1,
};

const resultStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#fafafa",
  padding: "0.5rem",
  borderRadius: "4px",
  marginTop: "0.5rem",
  maxHeight: "150px",
  overflowY: "auto",
};
