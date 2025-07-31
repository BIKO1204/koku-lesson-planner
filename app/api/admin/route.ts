// app/api/admin/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// Firebase設定（環境変数やconfigファイルに合わせて変更）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebaseアプリ初期化（複数回呼ばれないように）
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function GET(request: NextRequest) {
  try {
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
