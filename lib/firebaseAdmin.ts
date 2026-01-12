// /lib/firebaseAdmin.ts
import "server-only";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  // どちらでもOK：FIREBASE_SERVICE_ACCOUNT か GOOGLE_APPLICATION_CREDENTIALS_JSON
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!raw) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT (JSON string)."
    );
  }

  // JSON文字列をそのまま貼る運用を想定（改行エスケープにも耐える）
  try {
    return JSON.parse(raw);
  } catch {
    // Vercelの環境変数で `\n` が入るケース
    return JSON.parse(raw.replace(/\\n/g, "\n"));
  }
}

function initAdmin(): App {
  if (getApps().length) return getApps()[0]!;
  const sa = getServiceAccount();

  return initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }),
  });
}

export function getAdminApp() {
  return initAdmin();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
