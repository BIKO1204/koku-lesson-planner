"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin");
        const data = await res.json();
        setUsers(data.users);
      } catch (error) {
        console.error("ユーザー取得エラー:", error);
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
        <tbody>
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
        </tbody>
      </table>
    </div>
  );
}
