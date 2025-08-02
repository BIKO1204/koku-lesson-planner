"use client";

import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  disabled?: boolean;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function getAuthToken() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("ログインしていません");
    return await user.getIdToken(true);
  }

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = await getAuthToken();
        const res = await fetch("/api/admin", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "ユーザー一覧取得エラー");
        setUsers(data.users);
      } catch (error: any) {
        console.error("ユーザー取得エラー:", error);
        setErrorMsg(error.message || "ユーザー取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h1>管理者ページ - ユーザー一覧</h1>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <table border={1} cellPadding={5} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>メールアドレス</th>
            <th>名前</th>
            <th>役割</th>
            <th>停止中</th>
          </tr>
        </thead>
        {/* tbody の代わりに React.Fragment を使う */}
        <React.Fragment>
          {users.length === 0 && (
            <tr>
              <td colSpan={5}>ユーザーが見つかりません</td>
            </tr>
          )}
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email ?? "-"}</td>
              <td>{user.name ?? "-"}</td>
              <td>{user.role ?? "-"}</td>
              <td>{user.disabled ? "はい" : "いいえ"}</td>
            </tr>
          ))}
        </React.Fragment>
      </table>
    </div>
  );
}
