"use client";

import ContactForm from "../../components/ContactForm";

export default function ContactPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 600, margin: "auto" }}>
      <h1>お問い合わせ</h1>
      <p>ご質問やご意見など、お気軽にお問い合わせください。</p>
      <ContactForm />
    </main>
  );
}

