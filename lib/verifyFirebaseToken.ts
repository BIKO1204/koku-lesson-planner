// /lib/verifyFirebaseToken.ts
import "server-only";
import { getAdminAuth } from "@/lib/firebaseAdmin";

/**
 * Authorization: Bearer <Firebase ID Token>
 * を検証して decodedToken を返す
 */
export async function verifyBearerToken(authHeader: string | null) {
  if (!authHeader) throw new Error("Missing Authorization header");

  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) throw new Error("Invalid Authorization header format");

  const idToken = m[1].trim();
  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  return decoded;
}
