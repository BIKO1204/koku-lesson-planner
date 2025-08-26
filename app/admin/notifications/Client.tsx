"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Notification = {
  id: string;
  title: string;
  message: string;
  visible: boolean;
  createdAt: any; // Firestore Timestamp | null
};

export default function NotificationAdmin() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // 新規追加
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newVisible, setNewVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 編集
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editVisible, setEditVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  // リアルタイム購読
  useEffect(() => {
    const qy = query(collection(db, "通知"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: Notification[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            title: v.title ?? "",
            message: v.message ?? "",
            visible: !!v.visible,
            createdAt: v.createdAt ?? null,
          };
        });
        setNotifications(rows);
        setLoading(false);
        setErrorMsg(null);
      },
      (e) => {
        console.error(e);
        setErrorMsg("通知の読み込みに失敗しました");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // 新規追加
  async function addNotification() {
    if (!newTitle.trim() || !newMessage.trim()) {
      setErrorMsg("タイトルとメッセージを入力してください");
      return;
    }
    try {
      setSubmitting(true);
      await addDoc(collection(db, "通知"), {
        title: newTitle.trim(),
        message: newMessage.trim(),
        visible: newVisible,
        createdAt: serverTimestamp(),
      });
      setNewTitle("");
      setNewMessage("");
      setNewVisible(true);
      setOkMsg("通知を追加しました");
      setErrorMsg(null);
    } catch (e) {
      console.error(e);
      setErrorMsg("通知の追加に失敗しました");
    } finally {
      setSubmitting(false);
      setTimeout(() => setOkMsg(null), 3000);
    }
  }

  // 編集開始/キャンセル
  function startEdit(n: Notification) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditMessage(n.message);
    setEditVisible(n.visible);
    setErrorMsg(null);
    setOkMsg(null);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
    setEditVisible(true);
  }

  // 保存
  async function saveEdit() {
    if (!editingId) return;
    if (!editTitle.trim() || !editMessage.trim()) {
      setErrorMsg("タイトルとメッセージを入力してください");
      return;
    }
    try {
      setSaving(true);
      const ref = doc(db, "通知", editingId);
      await updateDoc(ref, {
        title: editTitle.trim(),
        message: editMessage.trim(),
        visible: editVisible,
      });
      setOkMsg("通知を更新しました");
      cancelEdit();
    } catch (e) {
      console.error(e);
      setErrorMsg("通知の更新に失敗しました");
    } finally {
      setSaving(false);
      setTimeout(() => setOkMsg(null), 3000);
    }
  }

  // 表示/非表示トグル
  async function toggleVisible(id: string, current: boolean) {
    try {
      const ref = doc(db, "通知", id);
      await updateDoc(ref, { visible: !current });
      setOkMsg(current ? "非表示にしました" : "表示にしました");
      setTimeout(() => setOkMsg(null), 2000);
    } catch (e) {
      console.error(e);
      setErrorMsg("表示状態の更新に失敗しました");
    }
  }

  // 削除
  async function deleteNotification(id: string) {
    if (!confirm("この通知を削除しますか？")) return;
    try {
      const ref = doc(db, "通知", id);
      await deleteDoc(ref);
      setOkMsg("通知を削除しました");
      setTimeout(() => setOkMsg(null), 2000);
    } catch (e) {
      console.error(e);
      setErrorMsg("通知の削除に失敗しました");
    }
  }

  // 文字数カウンター
  const newCount = useMemo(() => newMessage.length, [newMessage]);
  const editCount = useMemo(() => editMessage.length, [editMessage]);

  if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>読み込み中…</p>;

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>🔔 通知管理</h1>

      {errorMsg && <div style={alertStyle("error")}>{errorMsg}</div>}
      {okMsg && <div style={alertStyle("ok")}>{okMsg}</div>}

      {/* 新規追加カード */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>新規通知</h2>

        <div style={formRow}>
          <label style={labelStyle}>
            タイトル <span style={reqMark}>必須</span>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="例）システムメンテナンスのお知らせ"
              style={inputStyle}
            />
          </label>
        </div>

        <div style={formRow}>
          <label style={labelStyle}>
            メッセージ <span style={reqMark}>必須</span>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="例）9/10 20:00〜22:00 にメンテナンスを実施します。"
              rows={4}
              style={textareaStyle}
            />
            <span style={counterStyle}>{newCount} 文字</span>
          </label>
        </div>

        <div style={formRow}>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={newVisible}
              onChange={(e) => setNewVisible(e.target.checked)}
            />
            追加後に「表示する」
          </label>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={addNotification} disabled={submitting} style={primaryBtn}>
            {submitting ? "追加中…" : "追加する"}
          </button>
          <button
            type="button"
            onClick={() => { setNewTitle(""); setNewMessage(""); setNewVisible(true); }}
            disabled={submitting}
            style={secondaryBtn}
          >
            クリア
          </button>
        </div>

        {(newTitle || newMessage) && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>プレビュー</div>
            <div style={previewBox}>
              <div style={{ fontWeight: 700 }}>{newTitle || "（タイトル）"}</div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{newMessage || "（本文）"}</div>
              <span style={badgeStyle(newVisible ? "on" : "off")}>
                {newVisible ? "表示中" : "非表示"}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 一覧カード */}
      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h2 style={cardTitle}>通知一覧</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>表示</th>
                <th style={{ minWidth: 200 }}>タイトル</th>
                <th style={{ minWidth: 360 }}>メッセージ</th>
                <th>作成日時</th>
                <th style={{ minWidth: 180 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, color: "#666" }}>通知がありません</td>
                </tr>
              )}
              {notifications.map((n) => {
                const isEditing = editingId === n.id;
                return (
                  <tr key={n.id}>
                    <td>
                      <span style={badgeStyle(n.visible ? "on" : "off")}>
                        {n.visible ? "表示中" : "非表示"}
                      </span>
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        n.title
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div style={{ position: "relative" }}>
                          <textarea
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            rows={3}
                            style={textareaStyle}
                          />
                          <span style={counterStyle}>{editCount} 文字</span>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap" }}>{n.message}</div>
                      )}
                    </td>

                    <td>
                      {n.createdAt?.toDate
                        ? n.createdAt.toDate().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                        : "—"}
                    </td>

                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={editVisible}
                              onChange={(e) => setEditVisible(e.target.checked)}
                            />
                            表示する
                          </label>
                          <button onClick={saveEdit} disabled={saving} style={primaryBtn}>
                            {saving ? "保存中…" : "保存"}
                          </button>
                          <button onClick={cancelEdit} disabled={saving} style={secondaryBtn}>
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => startEdit(n)} style={secondaryBtn}>編集</button>
                          <button onClick={() => toggleVisible(n.id, n.visible)} style={ghostBtn}>
                            {n.visible ? "非表示にする" : "表示にする"}
                          </button>
                          <button onClick={() => deleteNotification(n.id)} style={dangerBtn}>削除</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ---------------- styles ---------------- */

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  padding: 16,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  marginBottom: 12,
};

const formRow: React.CSSProperties = {
  marginBottom: 12,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginBottom: 6,
};

const reqMark: React.CSSProperties = {
  background: "#E53935",
  color: "#fff",
  fontSize: 12,
  borderRadius: 4,
  padding: "1px 6px",
  marginLeft: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  outline: "none",
  resize: "vertical",
};

const previewBox: React.CSSProperties = {
  padding: 12,
  border: "1px dashed #90CAF9",
  background: "#E3F2FD",
  borderRadius: 8,
  position: "relative",
};

const badgeStyle = (mode: "on" | "off"): React.CSSProperties => ({
  display: "inline-block",
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 999,
  marginTop: 8,
  background: mode === "on" ? "#E8F5E9" : "#ECEFF1",
  color: mode === "on" ? "#2E7D32" : "#455A64",
  border: `1px solid ${mode === "on" ? "#A5D6A7" : "#CFD8DC"}`,
});

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const primaryBtn: React.CSSProperties = {
  background: "#1976D2",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  background: "#ECEFF1",
  color: "#37474F",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  color: "#1976D2",
  border: "1px solid #90CAF9",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  background: "#E53935",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const alertStyle = (kind: "ok" | "error"): React.CSSProperties => ({
  padding: "10px 12px",
  borderRadius: 8,
  marginBottom: 12,
  background: kind === "ok" ? "#E8F5E9" : "#FFEBEE",
  border: `1px solid ${kind === "ok" ? "#A5D6A7" : "#FFCDD2"}`,
  color: kind === "ok" ? "#2E7D32" : "#C62828",
});

const counterStyle: React.CSSProperties = {
  position: "absolute",
  right: 6,
  bottom: 6,
  fontSize: 12,
  color: "#607D8B",
};
