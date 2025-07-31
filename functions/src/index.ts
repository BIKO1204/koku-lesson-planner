import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const syncAuthUserToFirestore = functions.auth.user().onCreate(
  async (user: functions.auth.UserRecord) => {
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
  }
);

export const onUserDocUpdate = functions.firestore
  .document("users/{userId}")
  .onUpdate(
    async (
      change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
      context: functions.EventContext
    ) => {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const userId = context.params.userId;

      console.log(`User document ${userId} updated.`);
      return null;
    }
  );
