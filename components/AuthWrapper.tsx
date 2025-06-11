// components/AuthWrapper.tsx
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
      signIn(); // 未認証ならログインページへリダイレクト
    }
  }, [status]);

  if (status === "loading") {
    return <p>読み込み中...</p>; // ローディング表示
  }

  if (status === "authenticated") {
    return <>{children}</>; // 認証済みなら子コンポーネントを表示
  }

  // ここには通常は来ないが、一応null返す
  return null;
}
