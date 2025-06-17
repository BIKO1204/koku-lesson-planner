"use client";

import { useSession } from "next-auth/react";

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FileUploader() {
  const { data: session } = useSession();

  async function upload(file: File) {
    if (!(session as any)?.accessToken) {
      alert("ログインしてください");
      return;
    }

    const base64 = await toBase64(file);

    const res = await fetch("/api/drive-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64: base64.split(",")[1],
        filename: file.name,
        mimeType: file.type,
        accessToken: (session as any).accessToken,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(`アップロード成功！ ファイルURL:\n${data.webViewLink}`);
    } else {
      alert(`アップロード失敗: ${data.error}`);
    }
  }

  return (
    <input
      type="file"
      onChange={(e) => {
        if (e.target.files?.[0]) upload(e.target.files[0]);
      }}
    />
  );
}
