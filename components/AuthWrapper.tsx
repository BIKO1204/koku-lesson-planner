"use client";

import React, { useEffect } from "react";
import type { ReactNode } from "react";
import { useSession, signIn } from "next-auth/react";

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
    return <p>読み込み中...</p>; // ローディング表示
  }

  if (status === "authenticated") {
    return <>{children}</>; // 認証済みなら子コンポーネントを表示
  }

  return null; // その他は何も表示しない
}
