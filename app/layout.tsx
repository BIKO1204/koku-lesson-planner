// app/layout.tsx
import "./globals.css"
import { Providers } from "./providers"
import { AuthProvider } from "./contexts/AuthContext"

export const metadata = {
  title: "国語授業案アプリ",
  manifest: "/manifest.json",
}

export function generateViewport() {
  return { themeColor: "#ffffff" }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/icon-192x192.png" />
      </head>
      <body>
        {/* まず NextAuth の SessionProvider */}
        <Providers>
          {/* 次に独自 AuthContext */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
