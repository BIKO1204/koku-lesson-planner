// /lib/assertAdmin.ts
import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";

export function assertAdmin(decoded: DecodedIdToken) {
  // custom claims: { admin: true } を想定
  if ((decoded as any)?.admin === true) return;
  throw new Error("Forbidden: admin only");
}
