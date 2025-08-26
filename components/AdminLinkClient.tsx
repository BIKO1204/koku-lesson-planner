"use client";

import React from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function AdminLinkClient(props: { style?: React.CSSProperties }) {
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setIsAdmin(false);
      const { claims } = await user.getIdTokenResult();
      setIsAdmin(claims.admin === true || claims.role === "admin");
    });
    return () => unsub();
  }, []);

  if (!isAdmin) return null;
  return (
    <Link href="/admin/users" style={props.style}>
      🔧 管理者ページ
    </Link>
  );
}
