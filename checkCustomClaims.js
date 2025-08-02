const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 確認したいユーザーのUIDをここに入力してください
const targetUid = "ZI3uDGchMERLmi1eqvNZo1gPeQI3";

async function checkCustomClaims() {
  try {
    const user = await admin.auth().getUser(targetUid);
    console.log("Custom claims:", user.customClaims);
  } catch (error) {
    console.error("Error getting user data:", error);
  }
}

checkCustomClaims();
