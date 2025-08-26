"use client";
import { useEffect } from "react";
import { getAuth, signInWithCustomToken } from "firebase/auth";

export default function EnsureFirebaseLogin() {
  useEffect(() => {
    (async () => {
      const auth = getAuth();
      if (auth.currentUser) return; // 既にログイン済みなら何もしない
      try {
        const res = await fetch("/api/firebase/custom-token", { cache: "no-store" });
        if (!res.ok) return; // 未ログイン(NextAuth)なら 401
        const { token } = await res.json();
        if (!token) return;
        await signInWithCustomToken(auth, token);
      } catch {
        /* noop */
      }
    })();
  }, []);
  return null;
}
