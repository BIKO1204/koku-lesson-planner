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
          style={{ position: "fixed", top: 10, right: 10 }}
        >
          ログアウト
        </button>

        {/* 認証済みコンテンツを表示 */}
        {children}
      </>
    );
  }

  return null;
}
