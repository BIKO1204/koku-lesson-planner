"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/app/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export const dynamic = "force-dynamic";

export default function FineTuneAdminPage() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [hasAdminClaim, setHasAdminClaim] = useState(false);

  // クライアント側 allowlist（表示・操作ガード用）
  const allowList = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_FINE_TUNE_ADMINS ?? "").trim();
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  const inAllowList = !!email && allowList.includes(email.toLowerCase());
  const canUse = inAllowList || hasAdminClaim;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setReady(true);
      if (!u) {
        setEmail("");
        setHasAdminClaim(false);
        return;
      }
      const em = (u.email ?? "").toLowerCase();
      setEmail(em);
      try {
        const r = await u.getIdTokenResult(true);
        setHasAdminClaim(r?.claims?.admin === true);
      } catch {
        setHasAdminClaim(false);
      }
    });
    return () => unsub();
  }, []);

  const getToken = async (): Promise<string | null> => {
    const u = auth.currentUser;
    if (!u) {
      alert("Firebaseログインが必要です");
      return null;
    }
    // claimがなくても allowlist なら通す（サーバーも ADMIN_EMAILS で許可される前提）
    if (!canUse) {
      alert("管理者権限がありません（allowlist/claim どちらも該当なし）");
      return null;
    }
    const r = await u.getIdTokenResult(true);
    return r.token;
  };

  const downloadJsonl = async () => {
    const token = await getToken();
    if (!token) return;

    setBusy(true);
    try {
      const url =
        "/api/fine-tune/export" +
        "?target=lesson" +
        "&scope=all" +
        "&maxTotal=5000" +
        "&pageSize=500" +
        "&optInOnly=1";

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(`export失敗: ${res.status}\n${t}`);
        return;
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);

      const cd = res.headers.get("content-disposition") || "";
      const m = cd.match(/filename="([^"]+)"/);
      a.download = m?.[1] || "train_lesson_all.jsonl";

      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  };

  const startFineTune = async () => {
    const token = await getToken();
    if (!token) return;

    setBusy(true);
    try {
      // 1) export
      const expUrl =
        "/api/fine-tune/export" +
        "?target=lesson" +
        "&scope=all" +
        "&maxTotal=5000" +
        "&pageSize=500" +
        "&optInOnly=1";

      const exp = await fetch(expUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!exp.ok) {
        const t = await exp.text().catch(() => "");
        alert(`export失敗: ${exp.status}\n${t}`);
        return;
      }

      const jsonlText = await exp.text();
      if (!jsonlText.trim()) {
        alert("学習データが空です（同意ONの授業案が見つかりませんでした）");
        return;
      }

      // 2) start
      const st = await fetch("/api/fine-tune/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jsonlText }),
      });

      const out = await st.text();
      if (!st.ok) {
        alert(out);
        return;
      }

      try {
        const data = JSON.parse(out);
        alert(`fine-tune開始: job_id=${data.job_id} status=${data.status}`);
      } catch {
        alert(out);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!auth.currentUser) return <div style={{ padding: 16 }}>ログインしてください</div>;
  if (!canUse) return <div style={{ padding: 16 }}>管理者権限がありません</div>;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: "bold" }}>管理者：Fine-tune</h1>
      <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>
        login: {email || "(no email)"} / allowlist: {String(inAllowList)} / claim: {String(hasAdminClaim)}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <button onClick={downloadJsonl} disabled={busy}>
          ⬇️ JSONLダウンロード
        </button>
        <button onClick={startFineTune} disabled={busy}>
          🧠 fine-tune開始
        </button>
      </div>

      {busy && <p style={{ marginTop: 12 }}>処理中…</p>}
    </div>
  );
}
