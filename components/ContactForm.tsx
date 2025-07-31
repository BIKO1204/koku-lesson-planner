// components/ContactForm.tsx
"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setStatus("success");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="お名前"
        required
        style={{ padding: "0.5rem", fontSize: "1rem" }}
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="メールアドレス"
        required
        style={{ padding: "0.5rem", fontSize: "1rem" }}
      />
      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        placeholder="お問い合わせ内容"
        required
        rows={6}
        style={{ padding: "0.5rem", fontSize: "1rem" }}
      />
      <button type="submit" disabled={status === "sending"} style={{ padding: "0.75rem", fontSize: "1rem" }}>
        送信
      </button>
      {status === "success" && <p style={{ color: "green" }}>送信が完了しました。ありがとうございます。</p>}
      {status === "error" && <p style={{ color: "red" }}>送信に失敗しました。もう一度お試しください。</p>}
    </form>
  );
}
