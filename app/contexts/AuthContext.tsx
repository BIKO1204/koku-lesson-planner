"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { auth } from "@/lib/firebase";
import {
  signInWithCustomToken,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

type Ctx = { firebaseReady: boolean; signOutAll: () => Promise<void> };

const AuthCtx = createContext<Ctx>({
  firebaseReady: false,
  signOutAll: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Firebase 側の状態が立ち上がったかどうか
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      setFirebaseReady(true);
    });
    return unsub;
  }, []);

  // NextAuth がログイン済みなら custom-token で Firebase にもログイン
  useEffect(() => {
    async function link() {
      if (status !== "authenticated") {
        // NextAuth がログアウトになったら Firebase もサインアウト
        if (auth.currentUser) {
          try {
            await firebaseSignOut(auth);
          } catch {}
        }
        return;
      }
      if (isLinking) return;
      if (auth.currentUser) return; // 既にサインイン済みなら何もしない

      setIsLinking(true);
      try {
        const res = await fetch("/api/firebase/custom-token", {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error(`custom-token ${res.status}`);
        const { token } = await res.json();
        await signInWithCustomToken(auth, token);
      } catch (e) {
        console.error("Firebase custom token sign-in failed:", e);
      } finally {
        setIsLinking(false);
      }
    }
    link();
  }, [status]);

  // 両方まとめてサインアウトしたい時用（任意）
  async function signOutAll() {
    try {
      await firebaseSignOut(auth);
    } catch {}
    await nextAuthSignOut();
  }

  return (
    <AuthCtx.Provider value={{ firebaseReady, signOutAll }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuthLink() {
  return useContext(AuthCtx);
}
