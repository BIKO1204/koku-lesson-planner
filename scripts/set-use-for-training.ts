// scripts/set-use-for-training.ts
import fs from "fs";
import * as admin from "firebase-admin";

const saPath = process.env.SA_KEY_PATH;
if (!saPath) throw new Error("SA_KEY_PATH が未設定です。serviceAccountKey.json への絶対パスを設定してください。");
const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}
const db = admin.firestore();

// どれかの方法で特定します：MODEL_ID か、MODEL_NAME+CREATOR_ID
const MODEL_ID = process.env.MODEL_ID;
const MODEL_NAME = process.env.MODEL_NAME;
const CREATOR_ID = process.env.CREATOR_ID;

async function main() {
  let ref: FirebaseFirestore.DocumentReference;

  if (MODEL_ID) {
    ref = db.collection("educationModels").doc(MODEL_ID);
  } else if (MODEL_NAME && CREATOR_ID) {
    const snap = await db
      .collection("educationModels")
      .where("name", "==", MODEL_NAME)
      .where("creatorId", "==", CREATOR_ID)
      .limit(1)
      .get();
    if (snap.empty) {
      throw new Error("該当ドキュメントが見つかりません。MODEL_ID か MODEL_NAME+CREATOR_ID を見直してください。");
    }
    ref = snap.docs[0].ref;
    console.log("見つかったドキュメントID:", ref.id);
  } else {
    throw new Error("MODEL_ID か MODEL_NAME+CREATOR_ID のいずれかを指定してください。");
  }

  await ref.set({ useForTraining: true }, { merge: true });

  const after = await ref.get();
  console.log("更新完了:", after.id, "useForTraining =", after.data()?.useForTraining);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
