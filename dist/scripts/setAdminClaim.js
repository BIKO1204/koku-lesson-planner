"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccount_json_1 = __importDefault(require("../serviceAccount.json")); // パスは適宜調整
// private_key の改行コードを正しく変換しつつ、余分なキーを除外
const { private_key, type, project_id, private_key_id, client_email, client_id, auth_uri, token_uri, auth_provider_x509_cert_url, client_x509_cert_url, } = serviceAccount_json_1.default;
const serviceAccount = {
    private_key: private_key.replace(/\\n/g, "\n"),
    type,
    project_id,
    private_key_id,
    client_email,
    client_id,
    auth_uri,
    token_uri,
    auth_provider_x509_cert_url,
    client_x509_cert_url,
};
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
const uid = "ZI3uDGchMERLmi1eqvNZo1gPeQI3";
async function setAdmin() {
    try {
        await firebase_admin_1.default.auth().setCustomUserClaims(uid, { admin: true });
        console.log(`UID ${uid} に管理者権限を付与しました`);
        process.exit(0);
    }
    catch (error) {
        console.error("管理者権限付与エラー:", error);
        process.exit(1);
    }
}
setAdmin();
