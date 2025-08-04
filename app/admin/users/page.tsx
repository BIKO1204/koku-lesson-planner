"use client";

import React, { useState } from "react";
import { useUsers, User } from "@/hooks/useUsers";
import UserTable from "@/components/UserTable";

export default function AdminUserPage() {
  const { users, loading, errorMsg, updateUser } = useUsers();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  async function handleUpdate(user: User) {
    setUpdatingUserId(user.id);
    try {
      await updateUser(user);
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading) return <p>読み込み中…</p>;

  return (
    <div>
      <h1>管理者ページ - ユーザー一覧</h1>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <UserTable users={users} onChangeUser={handleUpdate} updatingUserId={updatingUserId} />
    </div>
  );
}
