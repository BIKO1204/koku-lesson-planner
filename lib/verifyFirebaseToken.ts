// /lib/verifyFirebaseToken.ts
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

function initAdmin() {
  if (getApps().length) return;

  // 🔽 どれか1つの方式に寄せてください（あなたの既存方式に合わせる）
  // 方式A: 環境変数にサービスアカウントJSONを丸ごと入れている場合
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
  }
  const serviceAccount = JSON.parse(raw);

  initializeApp({
    credential: cert(serviceAccount),
  });
}

/** Authorization: Bearer <token> を検証して uid/email/claims を返す */
export async function verifyFirebaseToken(authHeader: string | null) {
  initAdmin();

  if (!authHeader) throw new Error("Missing Authorization header");
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error("Invalid Authorization header format");

  const idToken = m[1];
  const decoded = await getAuth().verifyIdToken(idToken, true);
  return decoded; // { uid, email, ...customClaims }
}

/** ★互換：route.ts が import している名前 */
export const verifyBearerToken = verifyFirebaseToken;
