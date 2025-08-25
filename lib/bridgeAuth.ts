// lib/bridgeAuth.ts
"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { auth } from "@/lib/firebase";
import {
  browserLocalPersistence,
  setPersistence,
  signInWithCustomToken,
  signOut as firebaseSignOut,
} from "firebase/auth";

/**
 * NextAuthのセッションを確認し、必要なら /api/firebase/custom-token から
 * カスタムトークンを取得して Firebase にサインインする。
 *
 * - すでに同一UIDでサインイン済みなら何もしない
 * - 未ログイン or 異なるUIDなら再サインイン
 */
export async function ensureFirebaseAuth(): Promise<void> {
  // 既に同一UIDで入っていれば何もしない
  const current = auth.currentUser;
  if (current?.uid?.startsWith("nextauth:")) {
    (globalThis as any).__bridgeAuthLog?.("already signed in as", current.uid);
    return;
  }

  // NextAuth セッションから custom token を取得
  const res = await fetch("/api/firebase/custom-token", { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to get custom token (${res.status})`);
  }
  const data = await res.json();
  const customToken = data?.token as string;
  if (!customToken) throw new Error("No custom token returned");

  // 永続化（IndexedDB）
  await setPersistence(auth, browserLocalPersistence);

  // 既存ユーザーが居るがUIDが異なる場合は一度サインアウトしておく
  if (auth.currentUser && !auth.currentUser.uid.startsWith("nextauth:")) {
    await firebaseSignOut(auth);
  }

  // サインイン
  const cred = await signInWithCustomToken(auth, customToken);

  // デバッグ用に window へ触れる
  (globalThis as any).firebaseAuth = auth;
  (globalThis as any).__bridgeAuthLog?.("signed in:", cred.user.uid);
}

/**
 * アプリ起動時に一度だけ ensureFirebaseAuth() を呼ぶためのフック。
 * - NextAuth のセッションが "authenticated" になったら実行
 * - 連打防止のためガード
 */
export function useBridgeNextAuthToFirebase() {
  const { status } = useSession();
  const called = useRef(false);

  useEffect(() => {
    // ブラウザコンソールで簡易ログを見る用（任意）
    (globalThis as any).__bridgeAuthLog =
      (globalThis as any).__bridgeAuthLog ||
      ((...args: any[]) => {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[bridgeAuth]", ...args);
        }
      });

    if (status !== "authenticated") return;
    if (called.current) return;
    called.current = true;

    ensureFirebaseAuth().catch((e) => {
      // eslint-disable-next-line no-console
      console.error("ensureFirebaseAuth error:", e);
    });
  }, [status]);
}
