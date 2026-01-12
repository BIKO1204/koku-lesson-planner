// lib/firebaseAdmin.ts
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      const fixed = raw.replace(/\\n/g, "\n");
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

export function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const sa = getServiceAccountFromEnv();
  if (!sa) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is missing. Set it to the Firebase service account JSON string in env."
    );
  }

  return initializeApp({
    credential: cert(sa as any),
  });
}

export function getAdminAuth(): Auth {
  const app = getAdminApp();
  return getAuth(app);
}

export function getAdminDb(): Firestore {
  const app = getAdminApp();
  return getFirestore(app);
}
