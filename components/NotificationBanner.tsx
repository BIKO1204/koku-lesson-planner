"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  visible: boolean;
};

export default function NotificationBanner() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    // ローカルストレージに閉じた通知IDがあれば非表示にする
    const closedId = localStorage.getItem("closedNotificationId");
    if (closedId) {
      setIsClosed(true);
    }

    const fetchNotification = async () => {
      const q = query(
        collection(db, "通知"),
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

  const handleClose = () => {
    if (notification) {
      localStorage.setItem("closedNotificationId", notification.id);
      setIsClosed(true);
    }
  };

  if (!notification || isClosed) return null;

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span style={{ flex: 1, textAlign: "left" }}>
        {notification.title ? `[${notification.title}] ` : ""}
        {notification.message}
      </span>
      <button
        onClick={handleClose}
        aria-label="閉じる"
        style={{
          background: "transparent",
          border: "none",
          fontWeight: "bold",
          fontSize: "1.2rem",
          cursor: "pointer",
          color: "#333",
          paddingLeft: "1rem",
        }}
      >
        ×
      </button>
    </div>
  );
}
