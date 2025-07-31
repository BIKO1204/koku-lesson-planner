// app/admin/page.tsx

import Link from "next/link";

export default function AdminPage() {
  return (
    <main style={{ padding: "1rem" }}>
      <h1>管理者メニュー</h1>
      <ul>
        <li><Link href="/admin/users">ユーザー管理</Link></li>
        {/* 他の管理機能へのリンクをここに追加 */}
      </ul>
    </main>
  );
}
