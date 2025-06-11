import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "./contexts/AuthContext"; // app内のパス
import AuthWrapper from "../components/AuthWrapper";    // componentsのパス

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
          {/* まず認証状態を管理するコンテキストを提供 */}
          <AuthProvider>
            {/* 認証状態をもとにリダイレクトなど制御 */}
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
