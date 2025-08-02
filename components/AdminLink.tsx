"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth } from "firebase/auth";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    user.getIdTokenResult().then((idTokenResult) => {
      setIsAdmin(!!idTokenResult.claims.admin);
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <li>
      <Link href="/admin">管理者ページ</Link>
    </li>
  );
}
