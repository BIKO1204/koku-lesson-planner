"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      user.getIdTokenResult().then((idTokenResult) => {
        console.log("Claims:", idTokenResult.claims); // デバッグ用
        setIsAdmin(!!idTokenResult.claims.admin);
      });
    });
    return () => unsubscribe();
  }, []);

  if (!isAdmin) return null;

  return (
    <li>
      <Link href="/admin">管理者ページ</Link>
    </li>
  );
}
