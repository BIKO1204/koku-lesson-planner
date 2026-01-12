import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function requireAdminFromRequest(req: Request): Promise<{ uid: string; email?: string }> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error("Missing Bearer token");

  const token = m[1];
  const decoded = await getAdminAuth().verifyIdToken(token, true);

  if (decoded.admin !== true) throw new Error("Admin only");

  return { uid: decoded.uid, email: decoded.email };
}
