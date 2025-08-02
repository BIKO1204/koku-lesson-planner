"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var firebase_admin_1 = require("firebase-admin");
var serviceAccount_json_1 = require("../serviceAccount.json"); // パスは適宜調整
// private_key の改行コードを正しく変換しつつ、余分なキーを除外
var private_key = serviceAccount_json_1.default.private_key, type = serviceAccount_json_1.default.type, project_id = serviceAccount_json_1.default.project_id, private_key_id = serviceAccount_json_1.default.private_key_id, client_email = serviceAccount_json_1.default.client_email, client_id = serviceAccount_json_1.default.client_id, auth_uri = serviceAccount_json_1.default.auth_uri, token_uri = serviceAccount_json_1.default.token_uri, auth_provider_x509_cert_url = serviceAccount_json_1.default.auth_provider_x509_cert_url, client_x509_cert_url = serviceAccount_json_1.default.client_x509_cert_url;
var serviceAccount = {
    private_key: private_key.replace(/\\n/g, "\n"),
    type: type,
    project_id: project_id,
    private_key_id: private_key_id,
    client_email: client_email,
    client_id: client_id,
    auth_uri: auth_uri,
    token_uri: token_uri,
    auth_provider_x509_cert_url: auth_provider_x509_cert_url,
    client_x509_cert_url: client_x509_cert_url,
};
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
var uid = "ZI3uDGchMERLmi1eqvNZo1gPeQI3";
function setAdmin() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, firebase_admin_1.default.auth().setCustomUserClaims(uid, { admin: true })];
                case 1:
                    _a.sent();
                    console.log("UID ".concat(uid, " \u306B\u7BA1\u7406\u8005\u6A29\u9650\u3092\u4ED8\u4E0E\u3057\u307E\u3057\u305F"));
                    process.exit(0);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("管理者権限付与エラー:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
setAdmin();
