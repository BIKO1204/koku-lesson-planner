// lib/firebase.ts
"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

/**
 * Firebase クライアント初期化
 * - Firestore は persistentLocalCache を有効化してオフラインや複数タブに強く
 * - 既存コードとの互換のために fetch* を残しつつ、リアルタイム購読の subscribe* も提供
 */

const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore をオフラインキャッシュ込みで初期化（getFirestore より先に実行）
initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const auth: Auth = getAuth(app);

/* =========================================
 *  ユーザー関連
 * =======================================*/

/** 既存互換：単発取得 */
export async function fetchUsers() {
  const usersCol = collection(db, "users");
  const usersSnapshot = await getDocs(usersCol);
  return usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** 推奨：リアルタイム購読（unsub を返す） */
export function subscribeUsers(
  callback: (users: Array<{ id: string; [k: string]: any }>) => void
) {
  const colRef = collection(db, "users");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
  return unsub;
}

/* =========================================
 *  通知関連
 * =======================================*/

/** 既存互換：単発取得 */
export async function fetchNotifications() {
  const notificationsCol = collection(db, "通知");
  const notificationsSnapshot = await getDocs(notificationsCol);
  return notificationsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** 推奨：リアルタイム購読（unsub を返す） */
export function subscribeNotifications(
  callback: (items: Array<{ id: string; [k: string]: any }>) => void
) {
  const colRef = collection(db, "通知");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const unsub = onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
  return unsub;
}

export async function addNotification(title: string, message: string) {
  const notificationsCol = collection(db, "通知");
  await addDoc(notificationsCol, {
    title,
    message,
    visible: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNotification(
  id: string,
  data: Partial<{ title: string; message: string; visible: boolean }>
) {
  const notificationDoc = doc(db, "通知", id);
  await updateDoc(notificationDoc, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteNotification(id: string) {
  const notificationDoc = doc(db, "通知", id);
  await deleteDoc(notificationDoc);
}
