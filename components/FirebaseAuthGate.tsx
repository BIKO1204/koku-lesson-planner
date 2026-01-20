"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { signInWithCustomToken, signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type ApiOk = { ok: true; customToken: string; uid?: string };
type ApiNg = { ok: false; error: string };
type ApiRes = ApiOk | ApiNg;

const STORAGE_KEY = "firebaseAuthGate:lastEmail";

export default function FirebaseAuthGate() {
  const { data: session, status } = useSession();
  const runningRef = useRef(false);

  useEffect(() => {
    const email = (session?.user?.email ?? "").trim().toLowerCase();

    const run = async () => {
      // 未確定なら何もしない
      if (status === "loading") return;

      // 未ログインになったら Firebase もログアウト
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

      // authenticated だが email が無いケースは何もしない
      if (status !== "authenticated" || !email) return;

      // 二重実行防止
      if (runningRef.current) return;

      // Firebase 側がすでに同じ email でログイン済みなら何もしない
      const currentEmail = (auth.currentUser?.email ?? "").trim().toLowerCase();
      if (auth.currentUser && currentEmail === email) {
        // 念のためトークン更新（ルール評価の遅延対策）
        auth.currentUser.getIdToken(true).catch(() => {});
        return;
      }

      // 同一メールでの連打防止（レンダー連鎖対策）
      const last = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
      if (last === email && currentEmail !== email) {
        return;
      }

      runningRef.current = true;

      try {
        if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, email);

        const res = await fetch("/api/firebase/custom-token", { method: "GET", cache: "no-store" });
        const json = (await res.json()) as ApiRes;

        if (!res.ok || !json.ok) {
          const msg = !json.ok ? json.error : `custom-token api error (${res.status})`;
          throw new Error(msg);
        }

        const cred = await signInWithCustomToken(auth, json.customToken);
        await cred.user.getIdToken(true); // ★ 重要：直後の Firestore 権限判定を安定させる
      } catch (e) {
        console.error("Firebase custom-token sign-in failed:", e);
      } finally {
        runningRef.current = false;
      }
    };

    run();
  }, [status, session?.user?.email]);

  return null;
}
