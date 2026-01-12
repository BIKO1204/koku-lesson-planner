// lib/firebaseAdmin.ts
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

/**
 * FIREBASE_SERVICE_ACCOUNT は Vercel の Env に
 * JSON文字列で丸ごと入れる想定（serviceAccount.json の中身）
 */
function getServiceAccountFromEnv(): object {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not set.");
  }

  try {
    // Vercel等で \n がエスケープされて入るケースに対応
    const normalized = raw.replace(/\\n/g, "\n");
    return JSON.parse(normalized);
  } catch (e) {
    throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON.");
  }
}

function getStorageBucketName(serviceAccount: any): string | undefined {
  // 優先：明示 env → なければ serviceAccount の project_id から推測
  const fromEnv = process.env.FIREBASE_STORAGE_BUCKET;
  if (fromEnv) return fromEnv;

  const projectId = serviceAccount?.project_id || process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return undefined;

  // 多くの環境では `${projectId}.appspot.com`
  return `${projectId}.appspot.com`;
}

let _app: App | null = null;

export function getAdminApp(): App {
  if (_app) return _app;

  if (getApps().length) {
    _app = getApps()[0]!;
    return _app;
  }

  const serviceAccount: any = getServiceAccountFromEnv();
  const bucket = getStorageBucketName(serviceAccount);

  _app = initializeApp({
    credential: cert(serviceAccount as any),
    ...(bucket ? { storageBucket: bucket } : {}),
  });

  return _app;
}

/** Firestore */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/** Auth（必要なら） */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Storage（←今回のエラーはこれが無い） */
export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

/** 便利：Bucketを直接返す（route 側で bucket() を毎回書かない） */
export function getAdminBucket() {
  const app = getAdminApp();
  const storage = getStorage(app);

  // initializeApp で storageBucket を渡していれば bucket() でOK
  // 念のため env 指定も見る
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    (app.options as any)?.storageBucket;

  return bucketName ? storage.bucket(bucketName) : storage.bucket();
}
