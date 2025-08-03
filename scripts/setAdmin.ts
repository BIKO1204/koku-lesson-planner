import * as admin from "firebase-admin";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function setAdmin(uid: string) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`UID: ${uid} に管理者権限を付与しました`);
  } catch (error) {
    console.error("管理者権限付与中にエラーが発生しました:", error);
  }
}

async function main() {
  const uid = process.argv[2] || process.env.TARGET_UID;
  if (!uid) {
    console.error("Usage: node setAdmin.js <uid>");
    process.exit(1);
  }
  await setAdmin(uid);
  process.exit(0);
}

main();
