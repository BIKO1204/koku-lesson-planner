// pages/admin/users.tsx
import { useEffect, useState } from "react";
import { fetchUsers } from "../../lib/firebase";

type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  disabled?: boolean;
};

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then(userList => {
      setUsers(userList);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <h1>ユーザー一覧</h1>
      <table border={1} cellPadding={5}>
        <thead>
          <tr>
            <th>ID</th>
            <th>メールアドレス</th>
            <th>名前</th>
            <th>役割</th>
            <th>利用停止中</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
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
