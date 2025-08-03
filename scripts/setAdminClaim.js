const admin = require("firebase-admin");
const path = require("path");

// サービスアカウントJSONのパスを環境変数かデフォルトで指定
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || path.join(__dirname, "serviceAccount.json");
const serviceAccount = require(serviceAccountPath);

// private_keyの改行コード問題対応
const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
const serviceAccountConfig = {
  ...serviceAccount,
  private_key: privateKey,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountConfig),
  });
}

// コマンドライン引数 or 環境変数からUID取得
const uid = process.argv[2] || process.env.TARGET_UID;

if (!uid) {
  console.error("Usage: node setAdmin.js <uid>");
  process.exit(1);
}

async function setAdmin(uid) {
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
