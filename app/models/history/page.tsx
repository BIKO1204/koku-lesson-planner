"use client";

import React, { useState, useEffect, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import WordCloud from "react-wordcloud";
import kuromoji from "kuromoji";

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
  creatorId: string;
};

type GroupedHistory = {
  modelId: string;
  modelName: string;
  histories: EducationHistory[];
};

function FieldWithDiff({
  current,
  previous,
  label,
}: {
  current: string;
  previous?: string;
  label: string;
}) {
  const isChanged = previous === undefined || current.trim() !== previous.trim();
  return (
    <p
      style={{
        backgroundColor: isChanged ? "#fff9c4" : undefined,
        position: "relative",
        cursor: isChanged ? "help" : undefined,
        whiteSpace: "pre-wrap",
        marginBottom: 6,
        padding: isChanged ? "4px 8px" : undefined,
        borderRadius: isChanged ? 4 : undefined,
        transition: "background-color 0.3s ease",
      }}
      title={isChanged && previous ? `${label}（前回）: ${previous}` : undefined}
    >
      <strong>{label}：</strong> {current}
    </p>
  );
}

function TimelineItem({ date, children }: { date: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <time
        style={{
          width: 140,
          color: "#555",
          whiteSpace: "nowrap",
          flexShrink: 0,
          fontSize: 14,
          fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
        }}
      >
        {date}
      </time>
      <div
        style={{
          marginLeft: 12,
          borderLeft: "4px solid #1976d2",
          paddingLeft: 12,
          flexGrow: 1,
          backgroundColor: "#f9fbff",
          borderRadius: 8,
          paddingTop: 12,
          paddingBottom: 12,
          boxShadow: "0 2px 8px rgba(25, 118, 210, 0.1)",
          fontSize: 15,
          fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
          minWidth: 0,
          wordBreak: "break-word",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// 形態素解析してワードクラウド用の単語頻度リストを生成
async function parseWords(text: string): Promise<{ text: string; value: number }[]> {
  return new Promise((resolve, reject) => {
    kuromoji.builder("/dict/").build((err: any, tokenizer: any) => {
      if (err) {
        reject(err);
        return;
      }
      const tokens = tokenizer.tokenize(text);
      const freqMap: Record<string, number> = {};
      tokens.forEach((token: any) => {
        // 名詞・動詞・形容詞のみを対象（助詞・助動詞除外）
        if (token.pos === "名詞" || token.pos === "動詞" || token.pos === "形容詞") {
          const w = token.basic_form === "*" ? token.surface_form : token.basic_form;
          if (w.length > 1) {
            freqMap[w] = (freqMap[w] || 0) + 1;
          }
        }
      });
      const words = Object.entries(freqMap).map(([text, value]) => ({ text, value }));
      resolve(words);
    });
  });
}

export default function GroupedHistoryPage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "";
  const [groupedHistories, setGroupedHistories] = useState<GroupedHistory[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [wordClouds, setWordClouds] = useState<Record<string, { text: string; value: number }[]>>({});
  const router = useRouter();

  // localStorageから展開状態読み込み
  useEffect(() => {
    const saved = localStorage.getItem("expandedIds");
    if (saved) {
      try {
        const parsed: string[] = JSON.parse(saved);
        setExpandedIds(new Set(parsed));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // 展開状態をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem("expandedIds", JSON.stringify(Array.from(expandedIds)));
  }, [expandedIds]);

  // Firestoreから履歴を取得・グループ化・ワードクラウド生成
  useEffect(() => {
    async function fetchAndGroup() {
      if (!userId) {
        setGroupedHistories([]);
        setWordClouds({});
        return;
      }
      try {
        const colRef = collection(db, "educationModelsHistory");
        const q = query(colRef, where("creatorId", "==", userId), orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EducationHistory, "id">),
        }));

        // グループ化
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
        const grouped = Array.from(map.values());
        setGroupedHistories(grouped);

        // 教育観を全文結合してワードクラウド生成
        const clouds: Record<string, { text: string; value: number }[]> = {};
        await Promise.all(
          grouped.map(async (group) => {
            const fullText = group.histories.map((h) => h.philosophy).join(" ");
            try {
              clouds[group.modelId] = await parseWords(fullText);
            } catch {
              clouds[group.modelId] = [];
            }
          })
        );
        setWordClouds(clouds);
      } catch (e) {
        console.error("Firestore読み込み・グルーピングエラー", e);
        setGroupedHistories([]);
        setWordClouds({});
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

  const wordCloudOptions = {
    rotations: 2,
    rotationAngles: [-45, 0] as [number, number],
    fontSizes: [16, 36] as [number, number],
    fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
    colors: ["#1976d2", "#2196f3", "#64b5f6", "#90caf9"],
  };

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
        <h1 style={navTitleStyle}>国語授業プランナー</h1>
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
        <h1 style={titleStyle}>🕒 教育観モデル履歴とワードクラウド</h1>

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
                  <>
                    <div id={`section-${modelId}`} style={historyListStyle}>
                      {historiesAsc.map((h, i) => {
                        const prev = i > 0 ? historiesAsc[i - 1] : undefined;
                        return (
                          <TimelineItem key={h.id} date={formatDateTime(h.updatedAt)}>
                            <h2 style={cardTitleStyle}>{h.name}</h2>
                            <FieldWithDiff current={h.philosophy} previous={prev?.philosophy} label="教育観" />
                            <FieldWithDiff
                              current={h.evaluationFocus}
                              previous={prev?.evaluationFocus}
                              label="評価観点"
                            />
                            <FieldWithDiff current={h.languageFocus} previous={prev?.languageFocus} label="言語活動" />
                            <FieldWithDiff current={h.childFocus} previous={prev?.childFocus} label="育てたい子どもの姿" />
                          </TimelineItem>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 20, height: 300 }}>
                      {wordClouds[modelId] && wordClouds[modelId].length > 0 ? (
                        <WordCloud
                          words={wordClouds[modelId]}
                          options={wordCloudOptions}
                          size={[window.innerWidth > 600 ? 600 : window.innerWidth - 40, 300]}
                        />
                      ) : (
                        <p style={{ color: "#999", fontStyle: "italic" }}>ワードクラウドを生成できる単語がありません</p>
                      )}
                    </div>
                  </>
                )}
              </section>
            );
          })
        )}
      </main>
    </>
  );
}

// --- スタイル ---

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

const navTitleStyle: CSSProperties = {
  color: "white",
  marginLeft: 16,
  fontSize: "1.25rem",
  userSelect: "none",
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
  fontFamily: "'Yu Gothic', '游ゴシック', 'Noto Sans JP', sans-serif",
  paddingTop: 80,
  boxSizing: "border-box",
};

const titleStyle: CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "1rem",
  textAlign: "center",
  userSelect: "none",
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

const cardTitleStyle: CSSProperties = {
  fontSize: "1.2rem",
  margin: "0 0 0.5rem",
  wordBreak: "break-word",
};
