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
      // NextAuthが未確定なら何もしない
      if (status === "loading") return;

      // NextAuthが未ログインならFirebaseもログアウト
      if (status === "unauthenticated") {
        if (auth.currentUser) {
          try {
            await fbSignOut(auth);
          } catch (e) {
            console.error("Firebase signOut failed:", e);
          }
        }
        return;
      }

      // NextAuthログイン済み
      const emailRaw = session?.user?.email;
      const email = (emailRaw ?? "").trim().toLowerCase();
      if (!email) return;

      // Firebase側がすでに同一メールでログインしているなら何もしない
      if (auth.currentUser?.email?.toLowerCase() === email) return;

      try {
        const res = await fetch("/api/firebase/custom-token", { method: "GET" });
        if (!res.ok) throw new Error(await res.text());

        const json = await res.json();

        // ★ここが重要：customToken を使う
        const customToken = json?.customToken;
        if (!customToken) throw new Error("customToken is missing in response");

        await signInWithCustomToken(auth, customToken);
        if (cancelled) return;

        // console.log("Firebase signed in:", auth.currentUser?.uid, auth.currentUser?.email);
      } catch (e) {
        console.error("Firebase custom-token sign-in failed:", e);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email]);

  return null;
}
