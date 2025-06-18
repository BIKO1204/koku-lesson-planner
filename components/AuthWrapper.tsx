"use client";

import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

type AuthWrapperProps = {
  children: ReactNode;
};

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(); // ログインページへリダイレクト
    }
  }, [status]);

  if (status === "loading") {
    return <p>読み込み中...</p>;
  }

  if (status === "authenticated") {
    return (
      <>
        {/* ログアウトボタンをここに追加 */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="ログアウト"
          type="button"
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            padding: "8px 16px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            userSelect: "none",

            /* レスポンシブ用 */
            width: "auto",
            maxWidth: "90vw",
            transform: "none",
          }}
          className="logout-button"
        >
          ログアウト
        </button>

        {/* 認証済みコンテンツを表示 */}
        {children}

        {/* スタイルタグでメディアクエリを入れる */}
        <style jsx>{`
          @media (max-width: 600px) {
            .logout-button {
              top: 10px !important;
              right: 50% !important;
              transform: translateX(50%) !important;
              width: auto !important;
              max-width: 90vw !important;
              padding: 8px 20px !important;
              font-size: 1rem !important;
              border-radius: 8px !important;
            }
          }
        `}</style>
      </>
    );
  }

  return null;
}
