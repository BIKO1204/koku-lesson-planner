// app/admin/fine-tune/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/app/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export const dynamic = "force-dynamic";

export default function Page() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setReady(true);
      if (!u) return setIsAdmin(false);
      const r = await u.getIdTokenResult(true);
      setIsAdmin(r?.claims?.admin === true);
    });
    return () => unsub();
  }, []);

  const downloadJsonl = async () => {
    const u = auth.currentUser;
    if (!u) return alert("Firebaseログインが必要です");
    const tokenResult = await u.getIdTokenResult(true);
    if (tokenResult?.claims?.admin !== true) return alert("admin権限がありません");

    const url =
      "/api/fine-tune/export?target=lesson&scope=all&maxTotal=5000&pageSize=500&optInOnly=1";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenResult.token}` },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return alert(`export失敗: ${res.status}\n${t}`);
    }

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);

    const cd = res.headers.get("content-disposition") || "";
    const m = cd.match(/filename="([^"]+)"/);
    a.download = m?.[1] || "train_lesson_all.jsonl";

    a.click();
    URL.revokeObjectURL(a.href);
  };

  const startFineTune = async () => {
    const u = auth.currentUser;
    if (!u) return alert("Firebaseログインが必要です");
    const tokenResult = await u.getIdTokenResult(true);
    if (tokenResult?.claims?.admin !== true) return alert("admin権限がありません");

    const expUrl =
      "/api/fine-tune/export?target=lesson&scope=all&maxTotal=5000&pageSize=500&optInOnly=1";

    const exp = await fetch(expUrl, {
      headers: { Authorization: `Bearer ${tokenResult.token}` },
    });
    if (!exp.ok) {
      const t = await exp.text().catch(() => "");
      return alert(`export失敗: ${exp.status}\n${t}`);
    }

    const jsonlText = await exp.text();
    if (!jsonlText.trim()) return alert("学習データが空です（同意ONの授業案なし）");

    const st = await fetch("/api/fine-tune/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenResult.token}`,
      },
      body: JSON.stringify({ jsonlText }),
    });

    const out = await st.text();
    if (!st.ok) return alert(out);

    try {
      const data = JSON.parse(out);
      alert(`fine-tune開始: job_id=${data.job_id} status=${data.status}`);
    } catch {
      alert(out);
    }
  };

  if (!ready) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!auth.currentUser) return <div style={{ padding: 16 }}>ログインしてください</div>;
  if (!isAdmin) return <div style={{ padding: 16 }}>管理者権限がありません</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h1>管理者：Fine-tune</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={downloadJsonl}>⬇️ JSONLダウンロード</button>
        <button onClick={startFineTune}>🧠 fine-tune開始</button>
      </div>
    </div>
  );
}
