import admin from "firebase-admin";
import serviceAccountJson from "../serviceAccount.json"; // パスは適宜調整

// private_key の改行コードを正しく変換しつつ、余分なキーを除外
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = "ZI3uDGchMERLmi1eqvNZo1gPeQI3";

async function setAdmin() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`UID ${uid} に管理者権限を付与しました`);
    process.exit(0);
  } catch (error) {
    console.error("管理者権限付与エラー:", error);
    process.exit(1);
  }
}

setAdmin();
