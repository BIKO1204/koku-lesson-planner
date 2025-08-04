import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// --- ユーザー関連 --- //
export async function fetchUsers() {
  const usersCol = collection(db, "users");
  const usersSnapshot = await getDocs(usersCol);
  return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- 通知関連 --- //
export async function fetchNotifications() {
  const notificationsCol = collection(db, "通知");
  const notificationsSnapshot = await getDocs(notificationsCol);
  return notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addNotification(title: string, message: string) {
  const notificationsCol = collection(db, "通知");
  await addDoc(notificationsCol, {
    title,
    message,
    visible: true,
    createdAt: serverTimestamp(),
  });
}

export async function updateNotification(
  id: string,
  data: Partial<{ title: string; message: string; visible: boolean }>
) {
  const notificationDoc = doc(db, "通知", id);
  await updateDoc(notificationDoc, data);
}

export async function deleteNotification(id: string) {
  const notificationDoc = doc(db, "通知", id);
  await deleteDoc(notificationDoc);
}
