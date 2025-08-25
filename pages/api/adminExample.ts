// pages/api/adminExample.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminAuth, getAdminDb } from "../../lib/firebaseAdmin";

type Data = { message: string; data?: any } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Authorization: Bearer <ID_TOKEN>
    const authHeader = (req.headers.authorization as string | undefined) ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "認証トークンがありません" });
    }
    const idToken = authHeader.slice("Bearer ".length).trim();

    // Firebase ID トークンの検証
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    // 例: カスタムクレームに { admin: true } を付けている前提
    if (!decodedToken.admin) {
      return res.status(403).json({ error: "管理者権限がありません" });
    }

    // Firestore から機密データを取得
    const snap = await getAdminDb().collection("secretCollection").get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ message: "管理者認証成功", data });
  } catch (err: any) {
    console.error("管理者APIエラー:", err);
    // 認証系のエラーは 401 に寄せる
    if (err?.code?.startsWith?.("auth/")) {
      return res.status(401).json({ error: err.message ?? "認証エラー" });
    }
    return res.status(500).json({ error: "認証エラーまたは処理失敗" });
  }
}
