// lib/firebaseAdmin.ts
import admin from "firebase-admin";

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  return JSON.parse(raw);
}

export function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const serviceAccount = getServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return admin.app();
}

export function getAdminAuth() {
  getAdminApp();
  return admin.auth();
}

export function getAdminDb() {
  getAdminApp();
  return admin.firestore();
}
