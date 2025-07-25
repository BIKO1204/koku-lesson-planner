import * as admin from "firebase-admin";
import path from "path";

// JSONファイルのフルパスを絶対パスで指定する（プロジェクトルートから見て1つ上ではなく、直接絶対パスで指定）
const serviceAccount = require("C:/Users/yukia/Downloads/koku-lesson-planner-firebase-adminsdk-fbsvc-30c6f22a07.json");

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

const targetUid = "ZI3uDGchMERLmi1eqvNZo1gPeQI3";

setAdmin(targetUid);
