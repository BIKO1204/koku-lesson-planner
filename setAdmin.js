// setAdmin.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // JSONファイルが同じフォルダにある場合

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2];

if (!uid) {
  console.error("Usage: node setAdmin.js <uid>");
  process.exit(1);
}

admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`UID: ${uid} に管理者権限を付与しました`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("権限付与に失敗しました:", error);
    process.exit(1);
  });
