"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      user.getIdTokenResult().then((idTokenResult) => {
        console.log("Claims:", idTokenResult.claims);
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
