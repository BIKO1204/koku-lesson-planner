// app/admin/fine-tune/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/firebaseConfig"; // 後述のfirebaseConfig.tsで統一

type Row = {
  id: string;
  collection: string;
  fineTuneOptIn: boolean;
  unitName: string;
  grade: string;
  genre: string;
};

export default function AdminFineTunePage() {
  const [token, setToken] = useState<string>("");
  const [target, setTarget] = useState<"practice" | "lesson">("practice");
  const [optInOnly, setOptInOnly] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const t = await u.getIdToken(true);
      setToken(t);
    })();
  }, []);

  async function reload() {
    if (!token) return;
    setBusy(true);
    try {
      const qs = new URLSearchParams({
        target,
        optInOnly: optInOnly ? "1" : "0",
        limit: "50",
      });
      const res = await fetch(`/api/admin/fine-tune/list?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRows(data.rows || []);
    } finally {
      setBusy(false);
    }
  }

  async function toggleOptIn(r: Row, next: boolean) {
    if (!token) return;
    await fetch("/api/admin/fine-tune/set-optin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ collection: r.collection, docId: r.id, fineTuneOptIn: next }),
    });
    setRows((prev) => prev.map((x) => (x.id === r.id && x.collection === r.collection ? { ...x, fineTuneOptIn: next } : x)));
  }

  async function download(scope: "all" | "mine") {
    if (!token) return;
    const qs = new URLSearchParams({
      target,
      scope,
      optInOnly: optInOnly ? "1" : "0",
      limit: "5000",
    });

    const res = await fetch(`/api/admin/fine-tune/export?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `train_${target}_${scope}${optInOnly ? "_optin" : ""}.jsonl`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>管理者：ファインチューニング</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <select value={target} onChange={(e) => setTarget(e.target.value as any)}>
          <option value="practice">実践</option>
          <option value="lesson">授業案</option>
        </select>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={optInOnly} onChange={(e) => setOptInOnly(e.target.checked)} />
          opt-in のみ
        </label>

        <button onClick={reload} disabled={!token || busy}>
          {busy ? "読み込み中..." : "一覧を更新"}
        </button>

        <button onClick={() => download("all")} disabled={!token}>
          JSONLダウンロード（all）
        </button>

        <button onClick={() => download("mine")} disabled={!token}>
          JSONLダウンロード（mine）
        </button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>教材</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>学年</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>ジャンル</th>
            <th style={{ borderBottom: "1px solid #ccc" }}>opt-in</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.collection}_${r.id}`}>
              <td style={{ borderBottom: "1px solid #eee" }}>{r.unitName}</td>
              <td style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>{r.grade}</td>
              <td style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>{r.genre}</td>
              <td style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={r.fineTuneOptIn}
                  onChange={(e) => toggleOptIn(r, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
