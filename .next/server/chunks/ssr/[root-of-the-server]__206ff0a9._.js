module.exports = {

"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/module [external] (module, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("module", () => require("module"));

module.exports = mod;
}}),
"[project]/app/models/create/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// app/models/create/page.tsx
__turbopack_context__.s({
    "default": (()=>CreateModelPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html2pdf.js/dist/html2pdf.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function CreateModelPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [models, setModels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        philosophy: "",
        evaluationFocus: "",
        languageFocus: "",
        childFocus: "",
        note: ""
    });
    const [editId, setEditId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    // localStorage から既存モデルを読み込み
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const stored = localStorage.getItem("styleModels");
        if (stored) setModels(JSON.parse(stored));
    }, []);
    const handleChange = (field, value)=>{
        setForm((prev)=>({
                ...prev,
                [field]: value
            }));
    };
    // Google Drive へPDFアップロード関数
    async function uploadPdfToDrive(blob, filename) {
        const accessToken = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ACCESS_TOKEN;
        if (!accessToken) throw new Error("Google Driveアクセストークンが設定されていません");
        const metadata = {
            name: filename,
            mimeType: "application/pdf"
        };
        const formData = new FormData();
        formData.append("metadata", new Blob([
            JSON.stringify(metadata)
        ], {
            type: "application/json"
        }));
        formData.append("file", blob);
        const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Driveアップロード失敗: ${errorText}`);
        }
        return response.json();
    }
    const handleSave = async ()=>{
        setError("");
        if (!form.name.trim() || !form.philosophy.trim() || !form.evaluationFocus.trim() || !form.languageFocus.trim() || !form.childFocus.trim()) {
            setError("すべての必須項目を入力してください。");
            return;
        }
        const now = new Date().toISOString();
        let updatedModels;
        if (editId) {
            updatedModels = models.map((m)=>m.id === editId ? {
                    ...m,
                    ...form,
                    updatedAt: now
                } : m);
        } else {
            updatedModels = [
                {
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    name: form.name.trim(),
                    philosophy: form.philosophy.trim(),
                    evaluationFocus: form.evaluationFocus.trim(),
                    languageFocus: form.languageFocus.trim(),
                    childFocus: form.childFocus.trim(),
                    updatedAt: now
                },
                ...models
            ];
        }
        // 1) localStorage に保存
        localStorage.setItem("styleModels", JSON.stringify(updatedModels));
        setModels(updatedModels);
        // 2) 履歴データを localStorage に追加
        const newHistoryEntry = {
            id: editId || updatedModels[0].id,
            name: form.name.trim(),
            philosophy: form.philosophy.trim(),
            evaluationFocus: form.evaluationFocus.trim(),
            languageFocus: form.languageFocus.trim(),
            childFocus: form.childFocus.trim(),
            updatedAt: now,
            note: form.note.trim() || "（更新時にメモなし）"
        };
        const prevHistory = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]");
        const updatedHistory = [
            newHistoryEntry,
            ...prevHistory
        ];
        localStorage.setItem("educationStylesHistory", JSON.stringify(updatedHistory));
        // 3) PDF生成＆Drive保存
        try {
            // PDF化対象のHTML要素を一時生成
            const tempDiv = document.createElement("div");
            tempDiv.style.padding = "20px";
            tempDiv.style.fontFamily = "sans-serif";
            tempDiv.style.backgroundColor = "#fff";
            tempDiv.style.color = "#000";
            tempDiv.innerHTML = `
        <h1>${form.name.trim()}</h1>
        <h2>教育観</h2>
        <p>${form.philosophy.trim().replace(/\n/g, "<br>")}</p>
        <h2>評価観点の重視点</h2>
        <p>${form.evaluationFocus.trim().replace(/\n/g, "<br>")}</p>
        <h2>言語活動の重視点</h2>
        <p>${form.languageFocus.trim().replace(/\n/g, "<br>")}</p>
        <h2>育てたい子どもの姿</h2>
        <p>${form.childFocus.trim().replace(/\n/g, "<br>")}</p>
        <h2>更新メモ</h2>
        <p>${form.note.trim().replace(/\n/g, "<br>")}</p>
        <p>更新日時: ${now}</p>
      `;
            document.body.appendChild(tempDiv);
            const pdfBlob = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])().from(tempDiv).set({
                margin: 10,
                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "portrait"
                },
                html2canvas: {
                    scale: 2
                },
                pagebreak: {
                    mode: [
                        "avoid-all"
                    ]
                }
            }).outputPdf("blob");
            document.body.removeChild(tempDiv);
            await uploadPdfToDrive(pdfBlob, `${form.name.trim()}_${now}.pdf`);
            alert("✅ ローカル保存およびGoogle Drive保存が完了しました！");
            router.push("/models/history");
        } catch (e) {
            alert("⚠️ PDF生成またはGoogle Drive保存でエラーが発生しました。");
            console.error(e);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            padding: "2rem 4rem",
            width: "100%",
            maxWidth: 1200,
            margin: "0 auto",
            fontFamily: "sans-serif"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                style: {
                    display: "flex",
                    gap: 12,
                    marginBottom: 24,
                    overflowX: "auto"
                },
                children: [
                    [
                        "/",
                        "🏠 ホーム"
                    ],
                    [
                        "/plan",
                        "📋 授業作成"
                    ],
                    [
                        "/plan/history",
                        "📖 計画履歴"
                    ],
                    [
                        "/practice/history",
                        "📷 実践履歴"
                    ],
                    [
                        "/models/create",
                        "✏️ 教育観作成"
                    ],
                    [
                        "/models",
                        "📚 教育観一覧"
                    ],
                    [
                        "/models/history",
                        "🕒 教育観履歴"
                    ]
                ].map(([href, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: href,
                        style: {
                            padding: "8px 12px",
                            backgroundColor: href === "/models/create" ? "#4CAF50" : "#1976d2",
                            color: "white",
                            borderRadius: 6,
                            textDecoration: "none",
                            whiteSpace: "nowrap"
                        },
                        children: label
                    }, href, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 214,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                style: {
                    fontSize: "2rem",
                    marginBottom: "1.5rem",
                    textAlign: "center"
                },
                children: editId ? "✏️ 教育観モデルを編集" : "✏️ 新しい教育観モデルを作成"
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 231,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    color: "red",
                    marginBottom: "1rem",
                    textAlign: "center"
                },
                children: error
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 242,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    backgroundColor: "#f9f9f9",
                    padding: 24,
                    borderRadius: 8,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12
                        },
                        children: [
                            "モデル名（必須）：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: form.name,
                                onChange: (e)=>handleChange("name", e.target.value),
                                style: {
                                    width: "100%",
                                    padding: "0.8rem",
                                    fontSize: "1.1rem",
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    marginTop: 4
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 263,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 261,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12
                        },
                        children: [
                            "教育観（必須）：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                rows: 2,
                                value: form.philosophy,
                                onChange: (e)=>handleChange("philosophy", e.target.value),
                                style: {
                                    width: "100%",
                                    padding: "0.8rem",
                                    fontSize: "1.1rem",
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    marginTop: 4
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 280,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 278,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12
                        },
                        children: [
                            "評価観点の重視点（必須）：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                rows: 2,
                                value: form.evaluationFocus,
                                onChange: (e)=>handleChange("evaluationFocus", e.target.value),
                                style: {
                                    width: "100%",
                                    padding: "0.8rem",
                                    fontSize: "1.1rem",
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    marginTop: 4
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 297,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 295,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12
                        },
                        children: [
                            "言語活動の重視点（必須）：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                rows: 2,
                                value: form.languageFocus,
                                onChange: (e)=>handleChange("languageFocus", e.target.value),
                                style: {
                                    width: "100%",
                                    padding: "0.8rem",
                                    fontSize: "1.1rem",
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    marginTop: 4
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 314,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12
                        },
                        children: [
                            "育てたい子どもの姿（必須）：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                rows: 2,
                                value: form.childFocus,
                                onChange: (e)=>handleChange("childFocus", e.target.value),
                                style: {
                                    width: "100%",
                                    padding: "0.8rem",
                                    fontSize: "1.1rem",
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    marginTop: 4
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 331,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 329,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 24
                        },
                        children: [
                            "更新メモ（任意）：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                rows: 2,
                                value: form.note,
                                onChange: (e)=>handleChange("note", e.target.value),
                                style: {
                                    width: "100%",
                                    padding: "0.8rem",
                                    fontSize: "1.1rem",
                                    borderRadius: 6,
                                    border: "1px solid #ccc",
                                    marginTop: 4,
                                    fontStyle: "italic"
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 348,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 346,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: "center"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleSave,
                            style: {
                                padding: "0.8rem 2rem",
                                fontSize: "1.1rem",
                                backgroundColor: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer"
                            },
                            children: editId ? "更新して保存" : "作成して保存"
                        }, void 0, false, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 365,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 364,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 253,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/models/create/page.tsx",
        lineNumber: 187,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__206ff0a9._.js.map