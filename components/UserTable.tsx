import React from "react";
import { User } from "@/hooks/useUsers";

type Props = {
  users: User[];
  onChangeUser: (user: User) => void;  // 名前は useUsers に合わせる
  updatingUserId: string | null;
};

export default function UserTable({ users, onChangeUser, updatingUserId }: Props) {
  return (
    <table border={1} cellPadding={5} style={{ borderCollapse: "collapse", width: "100%" }}>
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
        {users.length === 0 ? (
          <tr>
            <td colSpan={6}>ユーザーが見つかりません</td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email ?? "-"}</td>
              <td>{user.name ?? "-"}</td>
              <td>
                <select
                  value={user.role ?? ""}
                  onChange={(e) =>
                    onChangeUser({ ...user, role: e.target.value || undefined })
                  }
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
                  onChange={(e) =>
                    onChangeUser({ ...user, disabled: e.target.checked })
                  }
                />
              </td>
              <td>
                <button disabled={updatingUserId === user.id} onClick={() => onChangeUser(user)}>
                  {updatingUserId === user.id ? "更新中…" : "更新"}
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
