import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// サービスアカウントJSONのパスを環境変数やデフォルトから取得
const serviceAccountPath =
  process.env.SERVICE_ACCOUNT_PATH ||
  path.resolve(__dirname, "../serviceAccount.json");

// JSONファイルを読み込む
const rawServiceAccount = fs.readFileSync(serviceAccountPath, "utf8");
const serviceAccountJson = JSON.parse(rawServiceAccount);

// 改行コードの修正
const {
  private_key,
  type,
  project_id,
  private_key_id,
  client_email,
  client_id,
  auth_uri,
  token_uri,
  auth_provider_x509_cert_url,
  client_x509_cert_url,
} = serviceAccountJson;

const serviceAccount = {
  private_key: (private_key as string).replace(/\\n/g, "\n"),
  type,
  project_id,
  private_key_id,
  client_email,
  client_id,
  auth_uri,
  token_uri,
  auth_provider_x509_cert_url,
  client_x509_cert_url,
} as admin.ServiceAccount;

// Firebase Admin SDK初期化（多重初期化防止）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// コマンドライン引数や環境変数でUID取得
const uid = process.argv[2] || process.env.TARGET_UID;

if (!uid) {
  console.error("Usage: node setAdmin.js <uid>");
  process.exit(1);
}

async function setAdmin(uid: string) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`UID ${uid} に管理者権限を付与しました`);
    process.exit(0);
  } catch (error) {
    console.error("管理者権限付与エラー:", error);
    process.exit(1);
  }
}

setAdmin(uid);
