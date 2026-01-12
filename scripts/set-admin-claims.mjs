import admin from "firebase-admin";
import fs from "fs";

// サービスアカウントJSONを読む（パスはあなたの環境に合わせて）
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccount.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uids = [
  "107175145055651337656",
  "115788597443760275804",
];

async function main() {
  for (const uid of uids) {
    // 既存claimsを維持して admin を足す（上書き事故防止）
    const user = await admin.auth().getUser(uid);
    const current = user.customClaims || {};
    await admin.auth().setCustomUserClaims(uid, { ...current, admin: true });
    console.log("✅ admin set:", uid);
  }
  console.log("done");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
