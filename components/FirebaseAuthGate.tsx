"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getAuth, signInWithCustomToken, signOut as fbSignOut } from "firebase/auth";

// ※ ここはあなたの firebase 初期化ファイルに合わせてください
//   （前に作った lib/firebase で auth を export 済と仮定）
import { auth } from "@/lib/firebase";

export default function FirebaseAuthGate() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const run = async () => {
      const fb = getAuth();

      if (status === "authenticated" && session?.user?.email) {
        // すでに同一UID(=email)でログイン済みなら何もしない
        if (fb.currentUser?.uid === session.user.email) return;

        try {
          const res = await fetch("/api/firebase/custom-token");
          if (!res.ok) throw new Error(await res.text());
          const { token } = await res.json();
          await signInWithCustomToken(auth, token);
          // console.log("Firebase signed in with custom token");
        } catch (e) {
          console.error("Firebase custom-token sign-in failed:", e);
        }
      }

      if (status === "unauthenticated" && fb.currentUser) {
        try {
          await fbSignOut(fb);
        } catch (e) {
          console.error("Firebase signOut failed:", e);
        }
      }
    };

    run();
  }, [status, session?.user?.email]);

  return null;
}
