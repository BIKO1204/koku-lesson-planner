// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

const serviceAccount = require("../serviceAccountKey.json"); // ご自身のJSONパスに置き換えてください

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Realtime Databaseを使う場合はdatabaseURLも指定
    // databaseURL: "https://<your-project-id>.firebaseio.com",
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
