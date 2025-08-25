// lib/firebaseAdmin.ts
import admin from "firebase-admin";

/**
 * 遅延初期化（ビルド中に走らない）＋ \n / \\n の差を吸収
 * - FIREBASE_SERVICE_ACCOUNT: 一行JSON
 * - FIREBASE_STORAGE_BUCKET または NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET（任意）
 */

let _app: admin.app.App | null = null;

function initIfNeeded(): admin.app.App {
  if (_app) return _app;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    // ここで throw しても「初期化が必要なAPIを叩いた時」にだけ起きる
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
  }

  const creds: any = JSON.parse(raw);
  if (typeof creds.private_key === "string") {
    // ← ここが肝。\\n → \n を吸収（すでに \n なら無害）
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  }

  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  _app = admin.initializeApp({
    credential: admin.credential.cert(creds),
    ...(storageBucket ? { storageBucket } : {}),
  });

  return _app!;
}

export function getAdminApp() {
  return initIfNeeded();
}
export function getAdminAuth() {
  return admin.auth(initIfNeeded());
}
export function getAdminDb() {
  return admin.firestore(initIfNeeded());
}
// Storage は使う時だけ
export function getAdminStorage() {
  return admin.storage(initIfNeeded());
}
