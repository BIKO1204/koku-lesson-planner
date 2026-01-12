// lib/verifyFirebaseToken.ts
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebaseAdmin";

/**
 * Next.js Route Handler (app/api/*) 用:
 * Authorization: Bearer <Firebase ID Token> を検証して decoded を返す
 */
export async function verifyBearerToken(req: Request): Promise<DecodedIdToken> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  return verifyBearerTokenFromHeader(authHeader);
}

/** Authorizationヘッダ文字列を直接渡したい場合 */
export async function verifyBearerTokenFromHeader(authHeader: string): Promise<DecodedIdToken> {
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    throw new Error("Missing Authorization Bearer token");
  }
  const token = m[1];

  // Firebase Admin SDK で検証
  const decoded = await getAdminAuth().verifyIdToken(token, true);
  return decoded;
}
