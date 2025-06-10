// components/AuthWrapper.tsx
import React, { ReactNode, useEffect } from "react";
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

  // ここには通常来ないけど、一応null返す
  return null;
}
