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
  runTransaction,
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
  likedUsers?: string[]; // いいね済みユーザーIDリスト
  comments?: Comment[];
  grade?: string;
  genre?: string;
  unitName?: string;
};
type LessonPlan = {
  id: string;
  result: any;
};

export default function PracticeSharePage() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "";

  // 検索条件用入力状態
  const [inputGrade, setInputGrade] = useState<string>("");
  const [inputGenre, setInputGenre] = useState<string>("");
  const [inputUnitName, setInputUnitName] = useState<string>("");

  // 検索条件反映用フィルター
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [unitNameFilter, setUnitNameFilter] = useState<string | null>(null);

  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  // 画面幅によるレスポンシブ判定
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // FirestoreからpracticeRecordsを取得（practiceDate降順）
    const q = query(collection(db, "practiceRecords"), orderBy("practiceDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: PracticeRecord[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as PracticeRecord),
        lessonId: doc.id,
        likedUsers: (doc.data() as any).likedUsers || [],
      }));
      setRecords(recs);
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

    // 画面幅監視
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 検索実行ボタン
  const handleSearch = () => {
    setGradeFilter(inputGrade || null);
    setGenreFilter(inputGenre || null);
    setUnitNameFilter(inputUnitName.trim() || null);
  };

  // フィルター適用
  const filteredRecords = records.filter((r) => {
    if (gradeFilter && r.grade !== gradeFilter) return false;
    if (genreFilter && r.genre !== genreFilter) return false;
    if (unitNameFilter && !r.unitName?.includes(unitNameFilter)) return false;
    return true;
  });

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // いいね済みか判定
  const isLikedByUser = (record: PracticeRecord) => {
    if (!userId) return false;
    return record.likedUsers?.includes(userId) ?? false;
  };

  // いいね処理：一度だけいいねできるようトランザクションで制御
  const handleLike = async (lessonId: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    if (!userId) {
      alert("ユーザー情報が取得できません");
      return;
    }

    const docRef = doc(db, "practiceRecords", lessonId);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("該当データがありません");

        const data = docSnap.data();
        const likedUsers: string[] = data.likedUsers || [];

        if (likedUsers.includes(userId)) {
          throw new Error("すでにいいね済みです");
        }

        transaction.update(docRef, {
          likes: increment(1),
          likedUsers: arrayUnion(userId),
        });
      });
    } catch (error: any) {
      if (error.message === "すでにいいね済みです") {
        alert(error.message);
      } else {
        console.error("いいね処理中にエラー", error);
        alert("いいねに失敗しました");
      }
    }
  };

  // コメント入力管理
  const handleCommentChange = (lessonId: string, value: string) => {
    setNewComments((prev) => ({ ...prev, [lessonId]: value }));
  };

  // コメント投稿
  const handleAddComment = async (lessonId: string) => {
    if (!session) {
      alert("ログインしてください");
      return;
    }
    const comment = newComments[lessonId]?.trim();
    if (!comment) {
      alert("コメントを入力してください");
      return;
    }
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

  // --- スタイル定義 ---
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
  const wrapperResponsiveStyle: CSSProperties = {
    display: "flex",
    maxWidth: 1200,
    margin: "auto",
    paddingTop: isMobile ? 16 : 72,
    gap: 24,
    flexDirection: isMobile ? "column" : "row",
  };
  const sidebarResponsiveStyle: CSSProperties = {
    width: isMobile ? "100%" : 280,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    boxShadow: "0 0 6px rgba(0,0,0,0.1)",
    height: isMobile ? "auto" : "calc(100vh - 72px)",
    overflowY: "auto",
    position: isMobile ? "relative" : "sticky",
    top: isMobile ? "auto" : 72,
    marginBottom: isMobile ? 16 : 0,
  };
  const mainContentResponsiveStyle: CSSProperties = {
    flex: 1,
    fontFamily: "sans-serif",
    width: isMobile ? "100%" : "auto",
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
    opacity: 1,
  };
  const likeBtnDisabledStyle: CSSProperties = {
    ...likeBtnStyle,
    cursor: "default",
    opacity: 0.6,
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

  // --- JSX return ---
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

      {/* メニュー */}
      <div style={menuWrapperStyle} aria-hidden={!menuOpen}>
        <button
          onClick={() => {
            signOut();
            setMenuOpen(false);
          }}
          style={logoutButtonStyle}
        >
          🔓 ログアウト
        </button>

        <div style={menuScrollStyle}>
          <Link href="/" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            🏠 ホーム
          </Link>
          <Link href="/plan" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📋 授業作成
          </Link>
          <Link
            href="/plan/history"
            onClick={() => setMenuOpen(false)}
            style={navLinkStyle}
          >
            📖 計画履歴
          </Link>
          <Link
            href="/practice/history"
            onClick={() => setMenuOpen(false)}
            style={navLinkStyle}
          >
            📷 実践履歴
          </Link>
          <Link
            href="/practice/share"
            onClick={() => setMenuOpen(false)}
            style={navLinkStyle}
          >
            🌐 共有版実践記録
          </Link>
          <Link href="/models/create" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            ✏️ 教育観作成
          </Link>
          <Link href="/models" onClick={() => setMenuOpen(false)} style={navLinkStyle}>
            📚 教育観一覧
          </Link>
          <Link
            href="/models/history"
            onClick={() => setMenuOpen(false)}
            style={navLinkStyle}
          >
            🕒 教育観履歴
          </Link>
        </div>
      </div>

      {/* レスポンシブ横並び */}
      <div style={wrapperResponsiveStyle}>
        {/* サイドバー */}
        <aside style={sidebarResponsiveStyle}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 16 }}>絞り込み</h2>

          {/* 学年 */}
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
              <option value="">すべて</option>
              <option value="1年">1年</option>
              <option value="2年">2年</option>
              <option value="3年">3年</option>
              <option value="4年">4年</option>
              <option value="5年">5年</option>
              <option value="6年">6年</option>
            </select>
          </div>

          {/* ジャンル */}
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
              <option value="">すべて</option>
              <option value="物語文">物語文</option>
              <option value="説明文">説明文</option>
              <option value="詩">詩</option>
            </select>
          </div>

          {/* 単元名 */}
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
            表示
          </button>
        </aside>

        {/* メインコンテンツ */}
        <main style={mainContentResponsiveStyle}>
          {filteredRecords.length === 0 ? (
            <p>条件に合う実践記録がありません。</p>
          ) : (
            filteredRecords.map((r) => {
              const plan = lessonPlans.find((p) => p.id === r.lessonId);

              return (
                <article key={r.lessonId} style={cardStyle}>
                  <h2 style={{ marginBottom: 8 }}>{r.lessonTitle}</h2>

                  {/* 授業案詳細（スマホでもスクロールできるように調整） */}
                  {plan && typeof plan.result === "object" && (
                    <section
                      style={{
                        backgroundColor: "#fafafa",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 16,
                        maxHeight: isMobile ? 400 : "auto",
                        overflowY: isMobile ? "auto" : "visible",
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

                  {/* いいねボタン */}
                  <div style={{ marginTop: 12 }}>
                    <button
                      style={isLikedByUser(r) ? likeBtnDisabledStyle : likeBtnStyle}
                      onClick={() => !isLikedByUser(r) && handleLike(r.lessonId)}
                      disabled={!session || isLikedByUser(r)}
                      title={
                        !session
                          ? "ログインしてください"
                          : isLikedByUser(r)
                          ? "すでにいいね済みです"
                          : undefined
                      }
                    >
                      👍 いいね {r.likes || 0}
                    </button>
                  </div>

                  {/* コメントセクション */}
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
