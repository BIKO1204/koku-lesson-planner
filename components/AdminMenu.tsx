"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function AdminMenu() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setRole(null);
      return;
    }

    user.getIdTokenResult().then((tokenResult) => {
      const roleClaim = tokenResult.claims.role;
      if (typeof roleClaim === "string") {
        setRole(roleClaim);
      } else {
        setRole(null);
      }
    });
  }, []);

  if (role !== "admin") {
    return <p>管理者のみ閲覧可能です。</p>;
  }

  return (
    <nav>
      <ul>
        <li><a href="/admin/userList">ユーザー管理</a></li>
        <li><a href="/admin/settings">システム設定</a></li>
        <li><a href="/admin/logs">アクセスログ</a></li>
        <li><a href="/admin/inquiries">問い合わせ管理</a></li>
      </ul>
    </nav>
  );
}
