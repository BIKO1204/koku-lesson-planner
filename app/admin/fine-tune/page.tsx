"use client";

import { useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export const dynamic = "force-dynamic";

export default function FineTuneAdminPage() {
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);

  const email = (session?.user?.email ?? "").toLowerCase();
  const isAdmin = (session?.user as any)?.admin === true || (session?.user as any)?.role === "admin";

  // クライアント側 allowlist（表示・操作ガード用）
  const allowList = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_FINE_TUNE_ADMINS ?? "").trim();
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  const inAllowList = !!email && allowList.includes(email);
  const canUse = isAdmin || inAllowList;

  const getToken = async (): Promise<string | null> => {
    if (status !== "authenticated") {
      alert("ログインが必要です");
      return null;
    }
    if (!canUse) {
      alert("管理者権限がありません（allowlist/role どちらも該当なし）");
      return null;
    }
    const t = (session as any)?.accessToken;
    if (!t) {
      alert("accessToken が見つかりません（NextAuth session に載っていません）");
      return null;
    }
    return String(t);
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

  if (status === "loading") return <div style={{ padding: 16 }}>Loading...</div>;

  if (status !== "authenticated") {
    return (
      <div style={{ padding: 16 }}>
        <p>ログインしてください</p>
        <button onClick={() => signIn("google", { callbackUrl: "/admin" })}>Googleでログイン</button>
      </div>
    );
  }

  if (!canUse) return <div style={{ padding: 16 }}>管理者権限がありません</div>;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: "bold" }}>管理者：Fine-tune</h1>
      <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>
        login: {email || "(no email)"} / allowlist: {String(inAllowList)} / admin: {String(isAdmin)}
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
