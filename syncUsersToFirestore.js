const admin = require("firebase-admin");

// サービスアカウントのパスを指定
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// すべてのユーザーを取得しFirestoreに同期する関数
async function syncAllUsers(nextPageToken) {
  try {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    const users = listUsersResult.users;

    const batch = db.batch();

    users.forEach(userRecord => {
      const userDocRef = db.collection("users").doc(userRecord.uid);
      const userData = {
        email: userRecord.email || "",
        name: userRecord.displayName || "",
        role: "teacher", // 必要に応じて設定
        disabled: userRecord.disabled || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.set(userDocRef, userData, { merge: true });
    });

    await batch.commit();

    console.log(`Synced ${users.length} users.`);

    if (listUsersResult.pageToken) {
      // ページネーションがあれば再帰的に取得
      await syncAllUsers(listUsersResult.pageToken);
    } else {
      console.log("All users synced.");
    }
  } catch (error) {
    console.error("Error syncing users:", error);
  }
}

// 実行
syncAllUsers();
