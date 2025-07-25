// lib/firebaseAdmin.ts

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  // 環境変数からサービスアカウント情報をJSONパースして取得
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Realtime Databaseを使う場合は以下をコメント解除して設定
    // databaseURL: "https://<your-project-id>.firebaseio.com",
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
