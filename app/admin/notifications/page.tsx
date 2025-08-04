"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
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
  createdAt: any;
};

export default function NotificationAdmin() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "通知"));
      setNotifications(
        snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            message: data.message,
            visible: data.visible,
            createdAt: data.createdAt,
          };
        })
      );
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg("通知取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function addNotification() {
    if (!newTitle.trim() || !newMessage.trim()) {
      setErrorMsg("タイトルとメッセージを入力してください");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "通知"), {
        title: newTitle,
        message: newMessage,
        visible: true,
        createdAt: serverTimestamp(),
      });
      setNewTitle("");
      setNewMessage("");
      await fetchNotifications();
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg("通知の追加に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisible(id: string, current: boolean) {
    try {
      const ref = doc(db, "通知", id);
      await updateDoc(ref, { visible: !current });
      await fetchNotifications();
    } catch {
      setErrorMsg("表示状態の更新に失敗しました");
    }
  }

  async function deleteNotification(id: string) {
    try {
      const ref = doc(db, "通知", id);
      await deleteDoc(ref);
      await fetchNotifications();
    } catch {
      setErrorMsg("通知の削除に失敗しました");
    }
  }

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h1>通知管理</h1>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="タイトル"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ marginRight: 10 }}
        />
        <input
          type="text"
          placeholder="メッセージ"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ marginRight: 10, width: "50%" }}
        />
        <button onClick={addNotification}>追加</button>
      </div>

      <table border={1} cellPadding={5} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>タイトル</th>
            <th>メッセージ</th>
            <th>表示中</th>
            <th>作成日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {notifications.length === 0 && (
            <tr>
              <td colSpan={5}>通知がありません</td>
            </tr>
          )}
          {notifications.map((n) => (
            <tr key={n.id}>
              <td>{n.title}</td>
              <td>{n.message}</td>
              <td>
                <input
                  type="checkbox"
                  checked={n.visible}
                  onChange={() => toggleVisible(n.id, n.visible)}
                />
              </td>
              <td>{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : "-"}</td>
              <td>
                <button onClick={() => deleteNotification(n.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
