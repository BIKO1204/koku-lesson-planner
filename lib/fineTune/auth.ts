// lib/fineTune/auth.ts
import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function requireAdminFromRequest(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer (.+)$/);
  if (!m) throw new Error("Missing Bearer token");

  const decoded = await getAdminAuth().verifyIdToken(m[1], true);

  if (decoded.admin !== true) {
    throw new Error("Not admin");
  }
  return decoded; // { uid, email, admin: true, ... }
}
