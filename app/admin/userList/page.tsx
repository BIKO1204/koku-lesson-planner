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
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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

  async function handleUpdate(user: User) {
    setUpdatingUserId(user.id);
    setErrorMsg(null);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: user.id,
          disabled: user.disabled,
          role: user.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新エラー");
      // 更新後に再取得
      const refreshedRes = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedData = await refreshedRes.json();
      setUsers(refreshedData.users);
    } catch (error: any) {
      console.error("更新エラー:", error);
      setErrorMsg(error.message || "更新に失敗しました");
    } finally {
      setUpdatingUserId(null);
    }
  }

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
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={6}>ユーザーが見つかりません</td>
            </tr>
          )}
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email ?? "-"}</td>
              <td>{user.name ?? "-"}</td>
              <td>
                <select
                  value={user.role ?? ""}
                  onChange={(e) => {
                    const newRole = e.target.value || undefined;
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === user.id ? { ...u, role: newRole } : u
                      )
                    );
                  }}
                >
                  <option value="">なし</option>
                  <option value="admin">管理者</option>
                  <option value="user">一般ユーザー</option>
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={user.disabled ?? false}
                  onChange={(e) => {
                    const newDisabled = e.target.checked;
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === user.id ? { ...u, disabled: newDisabled } : u
                      )
                    );
                  }}
                />
              </td>
              <td>
                <button
                  disabled={updatingUserId === user.id}
                  onClick={() => handleUpdate(user)}
                >
                  {updatingUserId === user.id ? "更新中…" : "更新"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
