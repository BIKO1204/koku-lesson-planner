"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

type FormState = {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
};

// 簡易バリデーション
const MAX_SUBJECT = 100;
const MAX_MESSAGE = 1000;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactClient() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    category: "質問",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ログインしていれば、初期値を自動入力
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return;
      setForm((prev) => ({
        ...prev,
        name: prev.name || u.displayName || "",
        email: prev.email || u.email || "",
      }));
    });
    return () => unsub();
  }, []);

  const subjectCount = useMemo(() => form.subject.length, [form.subject]);
  const messageCount = useMemo(() => form.message.length, [form.message]);

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    // 入力中にエラーを解消
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "お名前を入力してください";
    if (!form.email.trim()) e.email = "メールアドレスを入力してください";
    else if (!emailRe.test(form.email.trim())) e.email = "メールアドレスの形式が正しくありません";
    if (!form.subject.trim()) e.subject = "件名を入力してください";
    else if (form.subject.length > MAX_SUBJECT) e.subject = `件名は${MAX_SUBJECT}文字以内で入力してください`;
    if (!form.message.trim()) e.message = "お問い合わせ内容を入力してください";
    else if (form.message.length > MAX_MESSAGE) e.message = `内容は${MAX_MESSAGE}文字以内で入力してください`;
    setErrors(e);
    return Object.keys(e).length === 0;
    }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "送信に失敗しました");
      }
      setOkMsg("送信しました。折り返しご連絡いたします。");
      setForm({ name: "", email: "", subject: "", category: "質問", message: "" });
    } catch (err: any) {
      setErrMsg(err?.message || "送信に失敗しました");
    } finally {
      setSubmitting(false);
      setTimeout(() => setOkMsg(null), 5000);
    }
  }

  return (
    <main style={container}>
      <h1 style={title}>✉️ お問い合わせ</h1>

      <p style={lead}>
        ご質問・不具合・機能要望など、お気軽にお知らせください。<br />
        <small style={{ color: "#607D8B" }}>
          * は必須項目です。できるだけ具体的にご記入ください。
        </small>
      </p>

      {okMsg && <div style={alert("ok")}>{okMsg}</div>}
      {errMsg && <div style={alert("ng")}>{errMsg}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* 名前 */}
        <div style={row}>
          <label htmlFor="name" style={label}>お名前 <span style={req}>*</span></label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="例）山田 太郎"
            style={input(errors.name)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-err" : undefined}
          />
          {errors.name && <div id="name-err" style={help("ng")}>{errors.name}</div>}
        </div>

        {/* メール */}
        <div style={row}>
          <label htmlFor="email" style={label}>メールアドレス <span style={req}>*</span></label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="例）example@example.com"
            style={input(errors.email)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-err" : "email-help"}
          />
          {!errors.email && (
            <div id="email-help" style={help()}>
              返信用に使用します。受信可能なアドレスをご入力ください。
            </div>
          )}
          {errors.email && <div id="email-err" style={help("ng")}>{errors.email}</div>}
        </div>

        {/* 件名 */}
        <div style={row}>
          <label htmlFor="subject" style={label}>件名 <span style={req}>*</span></label>
          <input
            id="subject"
            type="text"
            value={form.subject}
            onChange={(e) => setField("subject", e.target.value.slice(0, MAX_SUBJECT))}
            placeholder="例）授業案の保存について"
            style={input(errors.subject)}
            aria-invalid={!!errors.subject}
            aria-describedby="subject-count"
          />
          <div id="subject-count" style={counter}>
            {subjectCount}/{MAX_SUBJECT}
          </div>
          {errors.subject && <div style={help("ng")}>{errors.subject}</div>}
        </div>

        {/* カテゴリ */}
        <div style={row}>
          <label htmlFor="category" style={label}>カテゴリ</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            style={select}
          >
            <option>質問</option>
            <option>不具合報告</option>
            <option>機能要望</option>
            <option>その他</option>
          </select>
        </div>

        {/* 内容 */}
        <div style={row}>
          <label htmlFor="message" style={label}>お問い合わせ内容 <span style={req}>*</span></label>
          <div style={{ position: "relative" }}>
            <textarea
              id="message"
              rows={6}
              value={form.message}
              onChange={(e) => setField("message", e.target.value.slice(0, MAX_MESSAGE))}
              placeholder={`例）「保存された授業案を見る」の画面で…\n発生手順：\n1) 〜を押す\n2) 〜を開く\n期待：〜\n実際：〜`}
              style={textarea(errors.message)}
              aria-invalid={!!errors.message}
              aria-describedby="message-count"
            />
            <div id="message-count" style={{ ...counter, right: 8, bottom: 8 }}>
              {messageCount}/{MAX_MESSAGE}
            </div>
          </div>
          {errors.message && <div style={help("ng")}>{errors.message}</div>}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="submit" disabled={submitting} style={buttonPrimary}>
            {submitting ? "送信中…" : "送信する"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm({ name: "", email: "", subject: "", category: "質問", message: "" });
              setErrors({});
              setErrMsg(null);
              setOkMsg(null);
            }}
            disabled={submitting}
            style={buttonGhost}
          >
            クリア
          </button>
        </div>

        <p style={{ fontSize: 12, color: "#607D8B", marginTop: 16 }}>
          いただいた内容はサービス改善のために利用します。個人情報の取り扱いについては校内/学校の方針に従います。
        </p>
      </form>
    </main>
  );
}

/* -------- styles -------- */
const container: React.CSSProperties = {
  maxWidth: 720,
  margin: "32px auto",
  padding: "0 16px",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif",
};
const title: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 12 };
const lead: React.CSSProperties = { marginBottom: 16, lineHeight: 1.6 };

const row: React.CSSProperties = { marginBottom: 14 };
const label: React.CSSProperties = { display: "block", fontWeight: 700, marginBottom: 6 };
const req: React.CSSProperties = { background: "#E53935", color: "#fff", fontSize: 12, padding: "1px 6px", borderRadius: 4, marginLeft: 6 };

const input = (err?: string): React.CSSProperties => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${err ? "#EF9A9A" : "#CFD8DC"}`,
  outline: "none",
  boxShadow: err ? "0 0 0 3px rgba(244, 67, 54, 0.12)" : "none",
  background: "#fff",
});
const textarea = (err?: string): React.CSSProperties => ({ ...input(err), resize: "vertical" });
const select: React.CSSProperties = { ...input(), appearance: "auto" };

const counter: React.CSSProperties = { fontSize: 12, color: "#607D8B", marginTop: 6, textAlign: "right" };
const help = (kind: "ok" | "ng" = "ok"): React.CSSProperties => ({
  fontSize: 12,
  color: kind === "ok" ? "#607D8B" : "#C62828",
  marginTop: 6,
});
const alert = (kind: "ok" | "ng"): React.CSSProperties => ({
  background: kind === "ok" ? "#E8F5E9" : "#FFEBEE",
  border: `1px solid ${kind === "ok" ? "#A5D6A7" : "#FFCDD2"}`,
  color: kind === "ok" ? "#2E7D32" : "#C62828",
  padding: "10px 12px",
  borderRadius: 10,
  marginBottom: 12,
});
const buttonPrimary: React.CSSProperties = {
  background: "#1976D2",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};
const buttonGhost: React.CSSProperties = {
  background: "transparent",
  color: "#1976D2",
  border: "1px solid #90CAF9",
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
};
