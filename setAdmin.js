const admin = require("firebase-admin");

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  const uid = process.argv[2];
  if (!uid || typeof uid !== "string") {
    console.error("Usage: node setAdmin.js <uid>");
    process.exit(1);
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`UID: ${uid} に管理者権限を付与しました`);
    process.exit(0);
  } catch (error) {
    console.error("権限付与に失敗しました:", error.message || error);
    process.exit(1);
  }
}

main();
