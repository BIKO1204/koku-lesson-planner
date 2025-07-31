import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// 新規ユーザー作成時にFirestoreに同期
export const syncAuthUserToFirestore = functions.auth.user().onCreate(async (user) => {
  const userData = {
    email: user.email ?? "",
    name: user.displayName ?? "",
    role: "teacher",
    disabled: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("users").doc(user.uid).set(userData);
    console.log(`User ${user.uid} synced to Firestore.`);
  } catch (error) {
    console.error("Failed to sync user:", error);
  }
});

// Firestore usersコレクションのドキュメント更新を監視してユーザー情報更新を検知
export const onUserDocUpdate = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    console.log(`User document ${userId} updated.`);
    // 必要に応じて更新時の処理をここに書く

    return null;
  });
