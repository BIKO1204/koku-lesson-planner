// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// .env.local に以下のような環境変数を必ず設定してください
// NEXT_PUBLIC_FIREBASE_API_KEY=
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
// NEXT_PUBLIC_FIREBASE_APP_ID=
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebaseがすでに初期化済みならそのインスタンスを取得し、未初期化なら新規初期化する
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Firestore、Auth、Storage のインスタンスを取得
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
