// lib/firebaseAdmin.ts
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT (or *_JSON) env");
  }

  // JSON文字列がそのまま入っている想定（Vercelの環境変数）
  // 改行やエスケープの影響がある場合もあるので、一応 trim
  try {
    return JSON.parse(raw.trim());
  } catch {
    // たまに \" や \\n が混ざるケースの救済
    const fixed = raw
      .trim()
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"');
    return JSON.parse(fixed);
  }
}

export function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const serviceAccount = getServiceAccount();
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
