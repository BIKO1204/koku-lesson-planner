// scripts/grantAdmin.mjs
import path from 'node:path';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

// .env.local から環境変数を読み込み（プロジェクト直下に置いてください）
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 使い方: node scripts/grantAdmin.mjs <email1> [email2 ...]
const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error('使い方: node scripts/grantAdmin.mjs <email1> [email2 ...]');
  process.exit(1);
}

// FIREBASE_SERVICE_ACCOUNT（一行JSON）は必須
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.error('FIREBASE_SERVICE_ACCOUNT が見つかりません。.env.local に設定してください。');
  process.exit(1);
}

let creds;
try {
  creds = JSON.parse(raw);
} catch (e) {
  console.error('FIREBASE_SERVICE_ACCOUNT の JSON 解析に失敗:', e?.message || e);
  process.exit(1);
}
// 改行の正規化（\\n → \n）
if (typeof creds.private_key === 'string') {
  creds.private_key = creds.private_key.replace(/\\n/g, '\n');
}

// Admin SDK 初期化
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(creds) });
}

// 付与処理（メールごと）
let ok = 0, ng = 0;
for (const email of emails) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    const current = user.customClaims || {};
    const next = { ...current, admin: true, role: 'admin' };
    await admin.auth().setCustomUserClaims(user.uid, next);
    console.log(`OK: ${email} を管理者にしました (uid=${user.uid})`);
    ok++;
  } catch (e) {
    console.error(`NG: ${email} の付与失敗:`, e?.message || e);
    ng++;
  }
}

console.log(`完了: 成功 ${ok}件 / 失敗 ${ng}件`);
process.exit(ng > 0 ? 1 : 0);
