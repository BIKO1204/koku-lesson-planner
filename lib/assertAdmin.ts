// lib/assertAdmin.ts
import type { DecodedIdToken } from "firebase-admin/auth";

export function assertAdmin(decoded: DecodedIdToken) {
  if (decoded?.admin === true) return;
  throw new Error("Forbidden: admin only");
}
