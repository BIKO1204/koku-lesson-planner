import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/admin/users" style={{ marginRight: 20, textDecoration: "underline" }}>
          ユーザー管理
        </Link>
        <Link href="/admin/notifications" style={{ textDecoration: "underline" }}>
          通知管理
        </Link>
      </nav>
      <hr />
      <main style={{ marginTop: 20 }}>{children}</main>
    </div>
  );
}
