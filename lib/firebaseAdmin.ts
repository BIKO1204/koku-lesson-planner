// lib/firebaseAdmin.ts
import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type ServiceAccountLike = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function getServiceAccountFromEnv(): ServiceAccountLike {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
  }

  if (parsed.private_key && typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  if (!parsed.project_id) throw new Error("FIREBASE_SERVICE_ACCOUNT.project_id is missing");
  if (!parsed.client_email) throw new Error("FIREBASE_SERVICE_ACCOUNT.client_email is missing");
  if (!parsed.private_key) throw new Error("FIREBASE_SERVICE_ACCOUNT.private_key is missing");

  return parsed as ServiceAccountLike;
}

const ADMIN_APP_NAME = "admin";

export function getAdminApp(): App {
  // 既に同名があればそれを使う
  try {
    return getApp(ADMIN_APP_NAME);
  } catch {
    // ignore
  }

  // 念のため既存 apps がある場合は最初のを使う、ではなく「admin」名で作る
  const sa = getServiceAccountFromEnv();

  return initializeApp(
    {
      credential: cert({
        projectId: sa.project_id!,
        clientEmail: sa.client_email!,
        privateKey: sa.private_key!,
      }),
      projectId: sa.project_id!, // ★ここを明示（トークンとプロジェクト不一致事故を潰す）
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // 使うなら設定
    },
    ADMIN_APP_NAME
  );
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

/** デバッグ用：Adminがどのprojectを掴んでいるか */
export function getAdminProjectId(): string | undefined {
  const app = getAdminApp();
  // firebase-adminのAppOptionsにprojectIdが入る
  return (app.options as any)?.projectId;
}
