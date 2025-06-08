module.exports = {

"[project]/lib/drive.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "uploadToDrive": (()=>uploadToDrive)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-ssr] (ecmascript)");
;
async function uploadToDrive(blob, filename, mimeType, folderId) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSession"])();
    // 型拡張がまだなら any で回避
    const accessToken = session?.accessToken;
    if (!accessToken) {
        throw new Error("Drive 用のアクセストークンが取得できませんでした");
    }
    const metadata = {
        name: filename,
        mimeType,
        ...folderId ? {
            parents: [
                folderId
            ]
        } : {}
    };
    const form = new FormData();
    form.append("metadata", new Blob([
        JSON.stringify(metadata)
    ], {
        type: "application/json"
    }));
    form.append("file", blob);
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        body: form
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Driveアップロード失敗:", errorText);
        throw new Error("Drive へのファイルアップロードに失敗しました");
    }
    const { id } = await res.json();
    return id;
}
}}),

};

//# sourceMappingURL=lib_drive_ts_158bf9d5._.js.map