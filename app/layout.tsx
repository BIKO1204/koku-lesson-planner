import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "./contexts/AuthContext";
import AuthWrapper from "../components/AuthWrapper";
import Link from "next/link";
import AdminLink from "../components/AdminLink";
import NotificationBanner from "../components/NotificationBanner";
import FirebaseAuthGate from "../components/FirebaseAuthGate"; // ★ 追加

export const metadata = {
  title: "国語授業案アプリ",
  manifest: "/manifest.json",
};

export function generateViewport() {
  return { themeColor: "#ffffff" };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/icon-192x192.png" />
      </head>
      <body>
        <Providers>
          <AuthProvider>
            <AuthWrapper>
              <FirebaseAuthGate /> {/* ★ 追加：NextAuthセッション→Firebaseに自動ログイン */}

              <NotificationBanner />

              <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
                <ul
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  <li>
                    <Link href="/">ホーム</Link>
                  </li>
                  <li>
                    <Link href="/contact">お問い合わせ</Link>
                  </li>
                  <AdminLink />
                </ul>
              </nav>

              <main>{children}</main>

              <footer
                style={{
                  padding: "1rem",
                  borderTop: "1px solid #ccc",
                  textAlign: "center",
                  color: "#666",
                  fontSize: "0.9rem",
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <Link
                    href="/terms"
                    style={{ marginRight: "1rem", textDecoration: "underline" }}
                  >
                    利用規約
                  </Link>
                  <Link
                    href="/privacy"
                    style={{ marginRight: "1rem", textDecoration: "underline" }}
                  >
                    プライバシーポリシー
                  </Link>
                  <Link href="/faq" style={{ textDecoration: "underline" }}>
                    よくある質問（FAQ）
                  </Link>
                </div>
                © 2025 国語授業案作成アプリ
              </footer>
            </AuthWrapper>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
