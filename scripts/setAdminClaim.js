const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccount.json"); // pathは適宜修正

const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");

const serviceAccountConfig = {
  ...serviceAccount,
  private_key: privateKey,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountConfig),
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
