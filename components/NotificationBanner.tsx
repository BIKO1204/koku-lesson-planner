"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Firebase初期化ファイルのパスに合わせてください

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  visible: boolean;
};

export default function NotificationBanner() {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      const q = query(
        collection(db, "通知"), // コレクション名をFirestoreの名前に合わせてください
        where("visible", "==", true),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        setNotification({
          id: doc.id,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt,
          visible: data.visible,
        });
      }
    };
    fetchNotification();
  }, []);

  if (!notification) return null;

  return (
    <div
      style={{
        background: "#ffe082",
        color: "#333",
        padding: "1rem",
        textAlign: "center",
        borderBottom: "1px solid #ffb300",
        fontWeight: "bold",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <span>
        {notification.title ? `[${notification.title}] ` : ""}
        {notification.message}
      </span>
    </div>
  );
}
