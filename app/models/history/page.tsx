"use client";

import React, { useState, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type EducationHistory = {
  id: string;
  modelId: string;
  updatedAt: string;
  name: string;
  philosophy: string;
  evaluationFocus: string;
  languageFocus: string;
  childFocus: string;
  note?: string;
  creatorId: string; // 追加：作成者ID
};

type GroupedHistory = {
  modelId: string;
  modelName: string;
  histories: EducationHistory[];
};

export default function GroupedHistoryPage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "";
  const [groupedHistories, setGroupedHistories] = useState<GroupedHistory[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchAndGroup() {
      if (!userId) {
        setGroupedHistories([]);
        return;
      }
      try {
        const colRef = collection(db, "educationModelsHistory");
        const q = query(
          colRef,
          where("creatorId", "==", userId),
          orderBy("updatedAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EducationHistory, "id">),
        }));

        // modelIdでグルーピング
        const map = new Map<string, GroupedHistory>();
        data.forEach((h) => {
          if (!map.has(h.modelId)) {
            map.set(h.modelId, {
              modelId: h.modelId,
              modelName: h.name,
              histories: [],
            });
          }
          map.get(h.modelId)!.histories.push(h);
        });

        setGroupedHistories(Array.from(map.values()));
      } catch (e) {
        console.error("Firestore読み込み・グルーピングエラー", e);
        setGroupedHistories([]);
      }
    }
    fetchAndGroup();
  }, [userId]);

  const toggleExpand = (modelId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  };

  function formatDateTime(dateString: string): string {
    const d = new Date(dateString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  }

  function isChanged(current: string, prev: string | undefined): boolean {
    return prev === undefined || current.trim() !== prev.trim();
  }

  return (
    <>
      {/* ナビバー */}
      <nav style={navBarStyle}>
        <div
          style={hamburgerStyle}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setMenuOpen((v) => !v)}
        >
          <span style={barStyle} />
          <span style={barStyle} />
          <span style={barStyle} />
        </div>
        <h1 style={{ color: "white", marginLeft: 16, fontSize: "1.25rem" }}>
          国語授業プランナー
        </h1>
      </nav>

      {/* メニューオーバーレイ */}
      <div
        style={{
          ...overlayStyle,
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? "visible" : "hidden",
        }}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* メニュー */}
      <div
        style={{
          ...menuWrapperStyle,
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
        }}
        aria-hidden={!menuOpen}
      >
        <button onClick={() => signOut()} style={logoutButtonStyle}>
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

      <main style={mainStyle}>
        <h1 style={titleStyle}>🕒 教育観モデル履歴（本人のみ表示）</h1>

        {groupedHistories.length === 0 ? (
          <p style={emptyStyle}>まだ履歴がありません。</p>
        ) : (
          groupedHistories.map(({ modelId, modelName, histories }) => {
            const historiesAsc = [...histories].reverse();

            return (
              <section key={modelId} style={groupSectionStyle}>
                <button
                  onClick={() => toggleExpand(modelId)}
                  style={groupToggleBtnStyle}
                  aria-expanded={expandedIds.has(modelId)}
                  aria-controls={`section-${modelId}`}
                >
                  {expandedIds.has(modelId) ? "▼" : "▶"} {modelName} （履歴 {histories.length} 件）
                </button>

                {expandedIds.has(modelId) && (
                  <div id={`section-${modelId}`} style={historyListStyle}>
                    {historiesAsc.map((h, i) => {
                      const prev = i > 0 ? historiesAsc[i - 1] : undefined;

                      return (
                        <article key={h.id} style={cardStyle}>
                          <header style={cardHeaderStyle}>
                            <time style={dateStyle}>
                              {formatDateTime(h.updatedAt)}
                            </time>
                          </header>
                          <h2 style={cardTitleStyle}>{h.name}</h2>

                          <p
                            style={{
                              ...fieldStyle,
                              backgroundColor: isChanged(h.philosophy, prev?.philosophy)
                                ? "#fff9c4"
                                : undefined,
                            }}
                          >
                            <strong>教育観：</strong> {h.philosophy}
                          </p>
                          <p
                            style={{
                              ...fieldStyle,
                              backgroundColor: isChanged(h.evaluationFocus, prev?.evaluationFocus)
                                ? "#fff9c4"
                                : undefined,
                            }}
                          >
                            <strong>評価観点：</strong> {h.evaluationFocus}
                          </p>
                          <p
                            style={{
                              ...fieldStyle,
                              backgroundColor: isChanged(h.languageFocus, prev?.languageFocus)
                                ? "#fff9c4"
                                : undefined,
                            }}
                          >
                            <strong>言語活動：</strong> {h.languageFocus}
                          </p>
                          <p
                            style={{
                              ...fieldStyle,
                              backgroundColor: isChanged(h.childFocus, prev?.childFocus)
                                ? "#fff9c4"
                                : undefined,
                            }}
                          >
                            <strong>育てたい子どもの姿：</strong> {h.childFocus}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
    </>
  );
}

// --- Styles (レスポンシブ対応) ---

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
  width: "80vw",
  maxWidth: 280,
  height: "calc(100vh - 56px)",
  backgroundColor: "#f0f0f0",
  boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
  transition: "transform 0.3s ease",
  zIndex: 999,
  display: "flex",
  flexDirection: "column",
};

const menuScrollStyle: CSSProperties = {
  padding: "1rem",
  paddingBottom: 80,
  overflowY: "auto",
  flexGrow: 1,
};

const logoutButtonStyle: CSSProperties = {
  margin: "1rem",
  padding: "0.75rem 1rem",
  backgroundColor: "#e53935",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  zIndex: 1000,
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 56,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.3)",
  transition: "opacity 0.3s ease",
  zIndex: 998,
};

const navLinkStyle: CSSProperties = {
  display: "block",
  padding: "0.75rem 1rem",
  backgroundColor: "#1976d2",
  color: "white",
  fontWeight: "bold",
  borderRadius: 6,
  textDecoration: "none",
  marginBottom: "0.5rem",
  fontSize: "1rem",
};

const mainStyle: CSSProperties = {
  padding: "1.5rem 1rem",
  maxWidth: 900,
  margin: "0 auto",
  fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif, sans-serif",
  paddingTop: 80,
  boxSizing: "border-box",
};

const titleStyle: CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "1rem",
  textAlign: "center",
};

const emptyStyle: CSSProperties = {
  padding: "1.5rem",
  textAlign: "center",
  color: "#666",
  fontSize: "1.1rem",
};

const groupSectionStyle: CSSProperties = {
  marginBottom: "2rem",
};

const groupToggleBtnStyle: CSSProperties = {
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
  padding: "1rem 1.25rem",
  fontSize: "1.15rem",
  fontWeight: "bold",
  backgroundColor: "#e3f2fd",
  border: "none",
  borderRadius: 6,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  userSelect: "none",
};

const historyListStyle: CSSProperties = {
  marginTop: "1rem",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#fafafa",
  borderRadius: 8,
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  padding: "1rem",
  marginBottom: "1rem",
  display: "flex",
  flexDirection: "column",
  wordBreak: "break-word",
  fontSize: "1rem",
};

const cardHeaderStyle: CSSProperties = {
  marginBottom: "0.5rem",
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
  fontSize: "0.9rem",
  flexWrap: "wrap",
};

const dateStyle: CSSProperties = {
  color: "#555",
  whiteSpace: "nowrap",
};

const cardTitleStyle: CSSProperties = {
  fontSize: "1.2rem",
  margin: "0 0 0.5rem",
  wordBreak: "break-word",
};

const fieldStyle: CSSProperties = {
  marginBottom: "0.6rem",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};
