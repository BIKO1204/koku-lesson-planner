"use client";

import { useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // 必要に応じて他の設定も
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export default function ContactForm() {
  const auth = getAuth();

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [user, setUser] = useState<any>(null);

  // ログイン状態監視
  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      if (!user) {
        alert("ログインしてください");
        setStatus("idle");
        return;
      }

      const idToken = await user.getIdToken();

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, idToken }),
      });

      const json = await res.json();

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      } else {
        console.error("送信エラー:", json.error);
        setStatus("error");
      }
    } catch (error) {
      console.error("通信エラー:", error);
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
