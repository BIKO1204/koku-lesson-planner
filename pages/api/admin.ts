import type { NextApiRequest, NextApiResponse } from "next";
import admin from "firebase-admin";

// Firebase Admin SDK 初期化（すでに初期化済みなら不要）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  disabled?: boolean;
};

type Data =
  | { users?: User[]; message?: string }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // AuthorizationヘッダーからBearerトークン取得
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "認証トークンがありません" });
    }
    const idToken = authHeader.split("Bearer ")[1];

    // トークン検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 管理者権限チェック
    if (!decodedToken.admin) {
      return res.status(403).json({ error: "管理者権限がありません" });
    }

    if (req.method === "GET") {
      // ユーザー一覧取得
      const listUsersResult = await admin.auth().listUsers(1000); // 最大1000ユーザー取得
      const users: User[] = listUsersResult.users.map((userRecord) => ({
        id: userRecord.uid,
        email: userRecord.email ?? undefined,
        name: userRecord.displayName ?? undefined,
        // roleやdisabledはカスタムクレームやユーザーデータに合わせて取得してください
        role: userRecord.customClaims?.role ?? undefined,
        disabled: userRecord.disabled,
      }));
      return res.status(200).json({ users });
    } else if (req.method === "POST") {
      // ユーザー更新
      const { uid, role, disabled } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "uidが指定されていません" });
      }

      // ユーザー情報更新
      await admin.auth().updateUser(uid, {
        disabled: disabled ?? false,
      });

      // カスタムクレーム更新（例：role）
      if (role) {
        await admin.auth().setCustomUserClaims(uid, { role, admin: role === "admin" });
      } else {
        // roleが空ならカスタムクレーム削除（もしくは空に設定）
        await admin.auth().setCustomUserClaims(uid, { admin: false });
      }

      return res.status(200).json({ message: "ユーザー情報を更新しました" });
    } else {
      return res.status(405).json({ error: "許可されていないHTTPメソッドです" });
    }
  } catch (error: any) {
    console.error("APIエラー:", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
}
