import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

export type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  disabled?: boolean;
};

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function getAuthToken() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("ログインしていません");
    return await user.getIdToken(true);
  }

  async function fetchUsers() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ユーザー一覧取得エラー");
      setUsers(data.users);
    } catch (error: any) {
      setErrorMsg(error.message || "ユーザー取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(user: User) {
    setLoading(true);
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
      await fetchUsers();
    } catch (error: any) {
      setErrorMsg(error.message || "更新に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, errorMsg, updateUser };
}
