// lib/firebaseAdmin.ts
import admin from "firebase-admin";

/**
 * Firebase Admin SDK 初期化（サービスアカウント一行JSON）
 * - FIREBASE_SERVICE_ACCOUNT: 一行JSON
 * - FIREBASE_STORAGE_BUCKET または NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET を使用
 */

// dev のホットリロード対策（多重初期化防止）
declare global {
  // eslint-disable-next-line no-var
  var __adminApp: admin.app.App | undefined;
}

if (!global.__adminApp) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
  }

  let credentials: admin.ServiceAccount;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
  }

  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET; // どちらか入っていればOK

  global.__adminApp = admin.initializeApp({
    credential: admin.credential.cert(credentials),
    ...(storageBucket ? { storageBucket } : {}), // 未設定なら省略（落ちない）
  });
}

export const adminApp = global.__adminApp!;
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);

// Storage は“使う時だけ”参照（@google-cloud/storage 未導入でもここまでは落ちない）
export const getAdminStorage = () => admin.storage(adminApp);
