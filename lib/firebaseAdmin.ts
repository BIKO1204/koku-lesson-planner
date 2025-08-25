// lib/firebaseAdmin.ts

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "koku-lesson-planner.firebasestorage.app",
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
