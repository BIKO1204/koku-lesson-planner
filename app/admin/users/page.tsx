"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

type User = {
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<(User & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,               // FirestoreのドキュメントIDを別名で保持
          ...(doc.data() as User),
        }));
        setUsers(userList);
      } catch (error) {
        console.error("ユーザー一覧の取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>ユーザー管理ページ</h1>
      <table border={1} cellPadding={5} cellSpacing={0}>
        <thead>
          <tr>
            <th>ドキュメントID</th>
            <th>UID</th>
            <th>メール</th>
            <th>名前</th>
            <th>役割</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center" }}>
                ユーザーが見つかりません
              </td>
            </tr>
          ) : (
            users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.uid ?? "-"}</td>
                <td>{user.email ?? "-"}</td>
                <td>{user.name ?? "-"}</td>
                <td>{user.role ?? "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
