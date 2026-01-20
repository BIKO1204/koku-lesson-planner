"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { signInWithCustomToken, signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function FirebaseAuthGate() {
  const { data: session, status } = useSession();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // NextAuth 未確定の間は何もしない
        if (status === "loading") return;

        // NextAuth が未ログインなら Firebase もログアウト
        if (status === "unauthenticated") {
          if (auth.currentUser) await fbSignOut(auth);
          return;
        }

        // ここから authenticated
        const emailRaw = session?.user?.email ?? "";
        const email = emailRaw.trim().toLowerCase();
        if (!email) return;

        // すでに Firebase ログイン済みなら基本何もしない
        if (auth.currentUser) return;

        // custom token 取得 → Firebaseサインイン
        const res = await fetch("/api/firebase/custom-token", { method: "GET" });
        if (!res.ok) throw new Error(await res.text());

        const json = await res.json();
        const customToken = json?.customToken; // ★ここが重要（token ではない）
        if (!customToken) throw new Error("customToken missing in response");

        if (cancelled) return;
        await signInWithCustomToken(auth, customToken);
      } catch (e) {
        console.error("FirebaseAuthGate failed:", e);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email]);

  return null;
}
