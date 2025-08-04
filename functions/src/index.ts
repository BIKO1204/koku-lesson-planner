import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// 新規ユーザー作成時にFirestoreに同期
export const syncAuthUserToFirestore = functions.auth.user().onCreate(async (user: any) => {
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

// Firestore usersドキュメント更新監視
export const onUserDocUpdate = functions.firestore.document("users/{userId}").onUpdate(async (change: any, context: any) => {
  const userId = context.params.userId;
  console.log(`User document ${userId} updated.`);
  return null;
});

// 管理者権限付与のHTTPS Callable関数
export const grantAdminRole = functions.https.onCall(async (data: any, context: any) => {
  if (!(context.auth?.token.admin === true || context.auth?.token.role === "admin")) {
    throw new functions.https.HttpsError("permission-denied", "管理者権限がありません。");
  }
  const uid = data.uid;
  if (!uid || typeof uid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "有効なユーザーIDを指定してください。");
  }
  try {
    await admin.auth().setCustomUserClaims(uid, { role: "admin", admin: true });
    return { message: `ユーザー ${uid} に管理者権限を付与しました。` };
  } catch (error) {
    console.error("管理者権限付与エラー:", error);
    throw new functions.https.HttpsError("internal", "管理者権限の付与に失敗しました。", error);
  }
});
