"use client";

import { useState, useEffect, CSSProperties } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSession, signOut } from "next-auth/react";

type BoardImage = { name: string; src: string };
type Comment = { userId: string; comment: string; createdAt: string };
type PracticeRecord = {
  lessonId: string;
  lessonTitle: string;
  practiceDate: string;
  reflection: string;
  boardImages: BoardImage[];
  likes?: number;
  comments?: Comment[];
  grade?: string; // 学年
  genre?: string; // ジャンル
  unitName?: string; // 単元名
};
type LessonPlan = {
  id: string;
  result: any;
};

export default function PracticeSharePage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "guest";

  // 入力状態（検索実行前）
  const [inputGrade, setInputGrade] = useState<string>("");
  const [inputGenre, setInputGenre] = useState<string>("");
  const [inputUnitName, setInputUnitName] = useState<string>("");

  // フィルター状態（検索実行後）
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [unitNameFilter, setUnitNameFilter] = useState<string | null>(null);

  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const [gradeList, setGradeList] = useState<string[]>([]);
  const [genreList, setGenreList] = useState<string[]>([]);
  const [unitNameList, setUnitNameList] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "practiceRecords"), orderBy("practiceDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: PracticeRecord[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as PracticeRecord),
        lessonId: doc.id,
      }));

      setRecords(recs);

      // フィルター一覧作成
      const grades = new Set<string>();
      const genres = new Set<string>();
      const units = new Set<string>();

      recs.forEach((r) => {
        if (r.grade && r.grade !== "すべて") grades.add(r.grade);
        if (r.genre && r.genre !== "すべて") genres.add(r.genre);
        if (r.unitName && r.unitName !== "すべて") units.add(r.unitName);
      });

      setGradeList(Array.from(grades).sort());
      setGenreList(Array.from(genres).sort());
      setUnitNameList(Array.from(units).sort((a, b) => a.localeCompare(b, "ja")));
    });

    // ローカルストレージから授業案を取得
    const plans = localStorage.getItem("lessonPlans");
    if (plans) {
      try {
        setLessonPlans(JSON.parse(plans));
      } catch {
        setLessonPlans([]);
      }
    }

    return () => unsubscribe();
  }, []);

  // 検索ボタン押下時にフィルターを更新
  const handleSearch = () => {
    setGradeFilter(inputGrade || null);
    setGenreFilter(inputGenre || null);
    setUnitNameFilter(inputUnitName.trim() || null);
  };

  // フィルターに合う実践記録だけ抽出
  const filteredRecords = records.filter((r) => {
    if (gradeFilter && r.grade !== gradeFilter) return false;
    if (genreFilter && r.genre !== genreFilter) return false;
    if (unitNameFilter && !r.unitName?.includes(unitNameFilter)) return false;
    return true;
  });

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleLike = async (lessonId: string) => {
    if (!session) return alert("ログインしてください");
    try {
      const docRef = doc(db, "practiceRecords", lessonId);
      await updateDoc(docRef, { likes: increment(1) });
    } catch (e) {
      console.error("いいね失敗", e);
      alert("いいねに失敗しました");
    }
  };

  const handleCommentChange = (lessonId: string, value: string) => {
    setNewComments((prev) => ({ ...prev, [lessonId]: value }));
  };

  const handleAddComment = async (lessonId: string) => {
    if (!session) return alert("ログインしてください");
    const comment = newComments[lessonId]?.trim();
    if (!comment) return alert("コメントを入力してください");
    try {
      const docRef = doc(db, "practiceRecords", lessonId);
      await updateDoc(docRef, {
        comments: arrayUnion({
          userId,
          comment,
          createdAt: new Date().toISOString(),
        }),
      });
      setNewComments((prev) => ({ ...prev, [lessonId]: "" }));
    } catch (e) {
      console.error("コメント追加失敗", e);
      alert("コメントの投稿に失敗しました");
    }
  };

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
  const menuWrapperStyle: CSSProperties = {
    position: "fixed",
    top: 56,
    left: 0,
    width: 250,
    height: "100vh",
    backgroundColor: "#f0f0f0",
    boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
    transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
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

  // 画面全体の横並びレイアウト
  const wrapperStyle: CSSProperties = {
    display: "flex",
    maxWidth: 1200,
    margin: "auto",
    paddingTop: 72,
    gap: 24,
  };

  // 左の絞り込みサイドバー
  const sidebarStyle: CSSProperties = {
    width: 280,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    boxShadow: "0 0 6px rgba(0,0,0,0.1)",
    height: "calc(100vh - 72px)",
    overflowY: "auto",
    position: "sticky",
    top: 72,
  };

  // メインコンテンツ（右側）
  const mainContentStyle: CSSProperties = {
    flex: 1,
    fontFamily: "sans-serif",
  };

  const cardStyle: CSSProperties = {
    border: "2px solid #ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: "#fdfdfd",
    wordBreak: "break-word",
  };
  const boardImageContainerStyle: CSSProperties = {
    width: "100%",
    marginBottom: 12,
    pageBreakInside: "avoid",
  };
  const likeBtnStyle: CSSProperties = {
    marginRight: 12,
    cursor: "pointer",
    color: "#1976d2",
    fontSize: "1rem",
  };
  const commentListStyle: CSSProperties = {
    maxHeight: 150,
    overflowY: "auto",
    marginTop: 8,
    border: "1px solid #ddd",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fff",
  };
  const commentInputStyle: CSSProperties = {
    width: "100%",
    padding: 8,
    marginTop: 8,
    borderRadius: 4,
    border: "1px solid #ccc",
  };
  const commentBtnStyle: CSSProperties = {
    marginTop: 8,
    padding: "6px 12px",
    backgroundColor: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
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

  const filterSectionTitleStyle: CSSProperties = {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    fontSize: "1.1rem",
  };

  const filterItemStyle: CSSProperties = {
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    marginBottom: 6,
  };

  // フィルター選択時のハイライト色
  const selectedFilterStyle: CSSProperties = {
    backgroundColor: "#1976d2",
    color: "white",
    fontWeight: "bold",
  };

  return (
    <>
      {/* ナビバー */}
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

      {/* メニューオーバーレイ */}
      <div
        style={overlayStyle}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* メニュー全体 */}
      <div style={menuWrapperStyle} aria-hidden={!menuOpen}>
        {/* ログアウトボタン */}
        <button onClick={() => signOut()} style={logoutButtonStyle}>
          🔓 ログアウト
        </button>

        {/* メニューリンク */}
        <div style={menuScrollStyle}>
          <Link href="/" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            🏠 ホーム
          </Link>
          <Link href="/plan" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📋 授業作成
          </Link>
          <Link href="/plan/history" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📖 計画履歴
          </Link>
          <Link href="/practice/history" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📷 実践履歴
          </Link>
          <Link href="/practice/share" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            🌐 共有版実践記録
          </Link>
          <Link href="/models/create" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            ✏️ 教育観作成
          </Link>
          <Link href="/models" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📚 教育観一覧
          </Link>
          <Link href="/models/history" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            🕒 教育観履歴
          </Link>
        </div>
      </div>

      {/* 画面横並びの全体ラッパー */}
      <div style={wrapperStyle}>
        {/* 左サイドバー */}
        <aside style={sidebarStyle}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 16 }}>絞り込み</h2>

          <div>
            <div style={filterSectionTitleStyle}>学年</div>
            <select
              value={inputGrade}
              onChange={(e) => setInputGrade(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            >
              {/* ここで「すべて」は選択肢に出さない */}
              {gradeList.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={filterSectionTitleStyle}>ジャンル</div>
            <select
              value={inputGenre}
              onChange={(e) => setInputGenre(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            >
              {/* ここで「すべて」は選択肢に出さない */}
              {genreList.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={filterSectionTitleStyle}>単元名</div>
            <input
              type="text"
              placeholder="単元名を入力"
              value={inputUnitName}
              onChange={(e) => setInputUnitName(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={handleSearch}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "8px 0",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            検索
          </button>
        </aside>

        {/* メインコンテンツ */}
        <main style={mainContentStyle}>
          {filteredRecords.length === 0 ? (
            <p>条件に合う実践記録がありません。</p>
          ) : (
            filteredRecords.map((r) => {
              const plan = lessonPlans.find((p) => p.id === r.lessonId);

              return (
                <article key={r.lessonId} style={cardStyle}>
                  <h2 style={{ marginBottom: 8 }}>{r.lessonTitle}</h2>

                  {plan && typeof plan.result === "object" && (
                    <section
                      style={{
                        backgroundColor: "#fafafa",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      <strong>授業案</strong>
                      <p>
                        <strong>教科書名：</strong> {plan.result["教科書名"] || "－"}
                      </p>
                      <p>
                        <strong>単元名：</strong> {plan.result["単元名"] || "－"}
                      </p>
                      <p>
                        <strong>授業時間数：</strong> {plan.result["授業時間数"] || "－"}時間
                      </p>
                      <p>
                        <strong>単元の目標：</strong> {plan.result["単元の目標"] || "－"}
                      </p>

                      {plan.result["評価の観点"] && (
                        <div>
                          <strong>評価の観点：</strong>

                          <strong>知識・技能</strong>
                          <ul>
                            {(Array.isArray(plan.result["評価の観点"]?.["知識・技能"])
                              ? plan.result["評価の観点"]["知識・技能"]
                              : plan.result["評価の観点"]?.["知識・技能"]
                              ? [plan.result["評価の観点"]["知識・技能"]]
                              : []
                            ).map((v: string, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>

                          <strong>思考・判断・表現</strong>
                          <ul>
                            {(Array.isArray(plan.result["評価の観点"]?.["思考・判断・表現"])
                              ? plan.result["評価の観点"]["思考・判断・表現"]
                              : plan.result["評価の観点"]?.["思考・判断・表現"]
                              ? [plan.result["評価の観点"]["思考・判断・表現"]]
                              : []
                            ).map((v: string, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>

                          <strong>主体的に学習に取り組む態度</strong>
                          <ul>
                            {(Array.isArray(
                              plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
                            )
                              ? plan.result["評価の観点"]["主体的に学習に取り組む態度"]
                              : plan.result["評価の観点"]?.["主体的に学習に取り組む態度"]
                              ? [plan.result["評価の観点"]["主体的に学習に取り組む態度"]]
                              : plan.result["評価の観点"]?.["態度"]
                              ? [plan.result["評価の観点"]["態度"]]
                              : []
                            ).map((v: string, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p>
                        <strong>育てたい子どもの姿：</strong>{" "}
                        {plan.result["育てたい子どもの姿"] || "－"}
                      </p>
                      <p>
                        <strong>言語活動の工夫：</strong>{" "}
                        {plan.result["言語活動の工夫"] || "－"}
                      </p>

                      {plan.result["授業の流れ"] && (
                        <div>
                          <strong>授業の流れ：</strong>
                          <ul>
                            {Object.entries(plan.result["授業の流れ"]).map(
                              ([key, val]) => {
                                const content =
                                  typeof val === "string" ? val : JSON.stringify(val);
                                return (
                                  <li key={key}>
                                    <strong>{key}:</strong> {content}
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        </div>
                      )}
                    </section>
                  )}

                  <p>
                    <strong>実施日：</strong> {r.practiceDate}
                  </p>
                  <p>
                    <strong>振り返り：</strong>
                    <br />
                    {r.reflection}
                  </p>

                  {r.boardImages.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        marginTop: 12,
                      }}
                    >
                      {r.boardImages.map((img, i) => (
                        <div key={i} style={boardImageContainerStyle}>
                          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
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
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* いいねとコメント */}
                  <div style={{ marginTop: 12 }}>
                    <button
                      style={likeBtnStyle}
                      onClick={() => handleLike(r.lessonId)}
                      disabled={!session}
                      title={session ? undefined : "ログインしてください"}
                    >
                      👍 いいね {r.likes || 0}
                    </button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <strong>コメント</strong>
                    <div style={commentListStyle}>
                      {(r.comments || []).map((c, i) => (
                        <div key={i}>
                          <b>{c.userId}</b>{" "}
                          <small>({new Date(c.createdAt).toLocaleString()})</small>
                          <br />
                          {c.comment}
                          <hr />
                        </div>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      placeholder="コメントを入力"
                      value={newComments[r.lessonId] || ""}
                      onChange={(e) => handleCommentChange(r.lessonId, e.target.value)}
                      style={commentInputStyle}
                      disabled={!session}
                      title={session ? undefined : "ログインしてください"}
                    />
                    <button
                      style={commentBtnStyle}
                      onClick={() => handleAddComment(r.lessonId)}
                      disabled={!session}
                      title={session ? undefined : "ログインしてください"}
                    >
                      コメント投稿
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>
    </>
  );
}
