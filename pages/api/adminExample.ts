import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "../../lib/firebaseAdmin";

type Data = { message: string; data?: any } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "認証トークンがありません" });
    }
    const idToken = authHeader.split("Bearer ")[1];

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!decodedToken.admin) {
      return res.status(403).json({ error: "管理者権限がありません" });
    }

    const snapshot = await adminDb.collection("secretCollection").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ message: "管理者認証成功", data });
  } catch (error) {
    console.error("管理者APIエラー:", error);
    return res.status(500).json({ error: "認証エラーまたは処理失敗" });
  }
}
