// lib/firebaseAdmin.ts
import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * 遅延初期化（ビルド中に走らない）＋ \n / \\n の差を吸収
 * - FIREBASE_SERVICE_ACCOUNT: 一行JSON
 * - FIREBASE_STORAGE_BUCKET（任意）
 */

function initIfNeeded() {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");

  const creds: any = JSON.parse(raw);
  if (typeof creds.private_key === "string") {
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET; // ← できればこれだけにする

  return initializeApp({
    credential: cert(creds),
    ...(storageBucket ? { storageBucket } : {}),
  });
}

export function getAdminApp() {
  return initIfNeeded();
}
export function getAdminAuth() {
  return getAuth(initIfNeeded());
}
export function getAdminDb() {
  return getFirestore(initIfNeeded());
}
export function getAdminStorage() {
  return getStorage(initIfNeeded());
}
