"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantAdminRole = exports.onUserDocUpdate = exports.syncAuthUserToFirestore = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// 新規ユーザー作成時にFirestoreに同期
exports.syncAuthUserToFirestore = functions.auth.user().onCreate(async (user) => {
    var _a, _b;
    const userData = {
        email: (_a = user.email) !== null && _a !== void 0 ? _a : "",
        name: (_b = user.displayName) !== null && _b !== void 0 ? _b : "",
        role: "teacher",
        disabled: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    try {
        await db.collection("users").doc(user.uid).set(userData);
        console.log(`User ${user.uid} synced to Firestore.`);
    }
    catch (error) {
        console.error("Failed to sync user:", error);
    }
});
// Firestore usersドキュメント更新監視
exports.onUserDocUpdate = functions.firestore.document("users/{userId}").onUpdate(async (change, context) => {
    const userId = context.params.userId;
    console.log(`User document ${userId} updated.`);
    return null;
});
// 管理者権限付与のHTTPS Callable関数
exports.grantAdminRole = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!(((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin) === true || ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.token.role) === "admin")) {
        throw new functions.https.HttpsError("permission-denied", "管理者権限がありません。");
    }
    const uid = data.uid;
    if (!uid || typeof uid !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "有効なユーザーIDを指定してください。");
    }
    try {
        await admin.auth().setCustomUserClaims(uid, { role: "admin", admin: true });
        return { message: `ユーザー ${uid} に管理者権限を付与しました。` };
    }
    catch (error) {
        console.error("管理者権限付与エラー:", error);
        throw new functions.https.HttpsError("internal", "管理者権限の付与に失敗しました。", error);
    }
});
