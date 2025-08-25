// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

/**
 * Firebase Admin SDK 初期化
 * - 環境変数 FIREBASE_SERVICE_ACCOUNT は JSON 文字列で設定
 * - FIREBASE_STORAGE_BUCKET は Firebase コンソールに表示されるバケット名をそのまま
 */

if (!admin.apps.length) {
  const serviceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {};

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // ← コンソールの値をそのまま使う
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
