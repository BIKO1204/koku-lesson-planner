// lib/verifyFirebaseToken.ts
import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "./firebaseAdmin";

export async function verifyFirebaseToken(req: NextRequest): Promise<DecodedIdToken> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) throw new Error("Invalid Authorization header (expected Bearer token)");

  const token = m[1].trim();
  const decoded = await getAdminAuth().verifyIdToken(token, true); // revokeチェックあり
  return decoded;
}
