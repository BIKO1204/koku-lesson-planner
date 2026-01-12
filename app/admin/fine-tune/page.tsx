"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

type Target = "lesson" | "practice";

type SlimRow = {
  id: string;
  collection: string;
  fineTuneOptIn: boolean;
  unitName: string;
  grade: string;
  genre: string;
  createdAt: any;
};

export default function AdminFineTunePage() {
  const [target, setTarget] = useState<Target>("practice");
  const [rows, setRows] = useState<SlimRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
  }, []);

  async function getBearer() {
    const auth = getAuth();
    const u = auth.currentUser;
    if (!u) throw new Error("Not logged in");
    const token = await u.getIdToken(true);
    return token;
  }

  async function loadList(nextTarget: Target) {
    setLoading(true);
    try {
      const token = await getBearer();
      const res = await fetch(
        `/api/admin/fine-tune/list?target=${nextTarget}&optInOnly=0&limit=100&t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!uid) return;
    loadList(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, target]);

  async function toggleOptIn(rowId: string, collection: string, next: boolean) {
    setBusyId(rowId);
    try {
      const token = await getBearer();
      const res = await fetch(`/api/admin/fine-tune/optin?t=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ id: rowId, collection, next }),
      });
      if (!res.ok) throw new Error(await res.text());

      // 楽観更新
      setRows((prev) =>
        prev.map((r) => (r.id === rowId && r.collection === collection ? { ...r, fineTuneOptIn: next } : r))
      );
    } finally {
      setBusyId(null);
    }
  }

  async function downloadJsonl(scope: "all" | "mine", optInOnly: boolean) {
    const token = await getBearer();
    const url =
      `/api/admin/fine-tune/export?target=${target}` +
      `&scope=${scope}` +
      `&optInOnly=${optInOnly ? "1" : "0"}` +
      `&limit=5000&t=${Date.now()}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-store" },
    });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `train_${target}_${scope}${optInOnly ? "_optin" : ""}.jsonl`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>管理者：ファインチューニング</h1>

      {/* ▼ ファインチューニングボタン枠 */}
      <section style={{ border: "2px solid #00838f", borderRadius: 8, padding: 12, background: "#e0f7fa" }}>
        <strong style={{ color: "#006064" }}>🧠 ファインチューニング（管理者操作）</strong>

        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => setTarget("lesson")} style={btn(target === "lesson")}>📋 授業（lesson）</button>
          <button onClick={() => setTarget("practice")} style={btn(target === "practice")}>📷 実践（practice）</button>
          <button onClick={() => loadList(target)} disabled={loading} style={btn(false)}>
            {loading ? "⏳ 更新中..." : "🔄 一覧を更新"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <button onClick={() => downloadJsonl("all", true)} style={dlBtn}>
            ⬇ Opt-inのみ（全件）JSONL
          </button>
          <button onClick={() => downloadJsonl("all", false)} style={dlBtn}>
            ⬇ 全件（opt-in含む）JSONL
          </button>
          <button onClick={() => downloadJsonl("mine", true)} style={dlBtn}>
            ⬇ 自分のopt-inのみJSONL
          </button>
          <button onClick={() => downloadJsonl("mine", false)} style={dlBtn}>
            ⬇ 自分の全件JSONL
          </button>
        </div>

        <small style={{ color: "#006064", display: "block", marginTop: 8 }}>
          ※ Authorization(Bearer) 必須。opt-inのみDLは学習データ作成用。
        </small>
      </section>

      {/* ▼ 一覧 */}
      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>一覧（{target}）</h2>
        {rows.length === 0 ? (
          <p style={{ color: "#666" }}>データがありません（または権限/取得条件の問題）</p>
        ) : (
          <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            {rows.map((r) => (
              <div key={`${r.collection}_${r.id}`} style={{ display: "grid", gridTemplateColumns: "120px 1fr 160px", gap: 8, padding: 10, borderTop: "1px solid #eee", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={r.fineTuneOptIn}
                    disabled={busyId === r.id}
                    onChange={(e) => toggleOptIn(r.id, r.collection, e.target.checked)}
                  />
                  opt-in
                </label>

                <div style={{ fontSize: 13 }}>
                  <div><strong>{r.unitName || "(no title)"}</strong></div>
                  <div style={{ color: "#666" }}>{r.grade} / {r.genre}</div>
                  <div style={{ color: "#999", fontSize: 12 }}>{r.collection} / {r.id}</div>
                </div>

                <button
                  style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                  onClick={() => navigator.clipboard.writeText(`${r.collection}/${r.id}`)}
                >
                  📋 パスコピー
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function btn(active: boolean): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #4dd0e1",
    background: active ? "#b2ebf2" : "#fff",
    cursor: "pointer",
  };
}
const dlBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #4dd0e1",
  background: "#ffffff",
  cursor: "pointer",
};
