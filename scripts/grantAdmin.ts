// ts-node scripts/grantAdmin.ts "<メールアドレス>"
import { getAdminAuth } from "../lib/firebaseAdmin";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("使い方: ts-node scripts/grantAdmin.ts <email>");
    process.exit(1);
  }
  const auth = getAdminAuth();
  const user = await auth.getUserByEmail(email);
  const current = (user.customClaims ?? {}) as Record<string, any>;
  const next = { ...current, admin: true, role: "admin" as const };
  await auth.setCustomUserClaims(user.uid, next);
  console.log(`OK: ${email} に admin クレームを付与しました (uid=${user.uid})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
