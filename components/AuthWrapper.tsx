"use client";

import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

type AuthWrapperProps = {
  children: ReactNode;
};

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? ""; // nullの場合は空文字列を代入

  // 認証不要ページのパス
  const noAuthPaths = ["/chatbot"]; // 必要に応じて追加してください

  useEffect(() => {
    if (status === "unauthenticated" && !noAuthPaths.includes(pathname)) {
      signIn();
    }

    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [status, pathname]);

  if (status === "loading") {
    return <p>読み込み中...</p>;
  }

  // 認証不要ページなら認証スキップして即レンダー
  if (noAuthPaths.includes(pathname)) {
    return (
      <>
        {/* 認証なしでも使えるページの中身 */}
        <main style={{ paddingTop: 48 }}>{children}</main>
      </>
    );
  }

  if (status === "authenticated") {
    return (
      <>
        {/* ヘッダーのメニュー */}
        <header
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            padding: "8px",
            zIndex: 1000,
            background: "white",
            borderBottomLeftRadius: 8,
            boxShadow: "0 0 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* スマホはメニューボタン表示 */}
          {isMobile ? (
            <>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="メニュー開閉"
                style={{
                  fontSize: 24,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ☰
              </button>
              {menuOpen && (
                <nav
                  style={{
                    position: "absolute",
                    top: "40px",
                    right: 0,
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    borderRadius: 6,
                    padding: 8,
                    minWidth: 120,
                  }}
                >
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "none",
                      backgroundColor: "#f44336",
                      color: "white",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    ログアウト
                  </button>
                </nav>
              )}
            </>
          ) : (
            /* PCはそのまま表示 */
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                padding: "6px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.9rem",
                color: "#333",
                background: "transparent",
              }}
            >
              ログアウト
            </button>
          )}
        </header>

        {/* 認証済みコンテンツ */}
        <main style={{ paddingTop: 48 }}>{children}</main>
      </>
    );
  }

  return null;
}
