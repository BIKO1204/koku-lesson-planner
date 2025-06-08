module.exports = {

"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
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
__turbopack_context__.s({
    "default": (()=>ModelListPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html2pdf.js/dist/html2pdf.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function ModelListPage() {
    const { data: session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSession"])();
    const [models, setModels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [editId, setEditId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        philosophy: "",
        evaluationFocus: "",
        languageFocus: "",
        childFocus: ""
    });
    const [sortOrder, setSortOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("newest");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const stored = localStorage.getItem("styleModels");
        if (stored) {
            try {
                setModels(JSON.parse(stored));
            } catch  {
                setModels([]);
            }
        }
    }, []);
    const handleChange = (field, value)=>{
        setForm((prev)=>({
                ...prev,
                [field]: value
            }));
    };
    const startEdit = (m)=>{
        setEditId(m.id);
        setForm({
            name: m.name,
            philosophy: m.philosophy,
            evaluationFocus: m.evaluationFocus,
            languageFocus: m.languageFocus,
            childFocus: m.childFocus
        });
        setError("");
    };
    const cancelEdit = ()=>{
        setEditId(null);
        setForm({
            name: "",
            philosophy: "",
            evaluationFocus: "",
            languageFocus: "",
            childFocus: ""
        });
        setError("");
    };
    const saveModel = ()=>{
        if (!form.name.trim() || !form.philosophy.trim() || !form.evaluationFocus.trim() || !form.languageFocus.trim() || !form.childFocus.trim()) {
            setError("必須項目をすべて入力してください。");
            return false;
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
        localStorage.setItem("styleModels", JSON.stringify(updatedModels));
        setModels(updatedModels);
        cancelEdit();
        return true;
    };
    async function generatePdf(model) {
        const now = new Date().toISOString();
        const tempDiv = document.createElement("div");
        tempDiv.style.padding = "20px";
        tempDiv.style.fontFamily = "sans-serif";
        tempDiv.style.backgroundColor = "#fff";
        tempDiv.style.color = "#000";
        tempDiv.innerHTML = `
      <h1>${model.name}</h1>
      <h2>教育観</h2><p>${model.philosophy.replace(/\n/g, "<br>")}</p>
      <h2>評価観点の重視点</h2><p>${model.evaluationFocus.replace(/\n/g, "<br>")}</p>
      <h2>言語活動の重視点</h2><p>${model.languageFocus.replace(/\n/g, "<br>")}</p>
      <h2>育てたい子どもの姿</h2><p>${model.childFocus.replace(/\n/g, "<br>")}</p>
      <p>生成日時: ${now}</p>
    `;
        document.body.appendChild(tempDiv);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])().from(tempDiv).set({
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
            }).save();
        } catch (e) {
            alert("PDF生成に失敗しました");
            console.error(e);
        } finally{
            document.body.removeChild(tempDiv);
        }
    }
    async function uploadPdfToDrive(model) {
        if (!session || typeof session.accessToken !== "string") {
            alert("Google Driveアップロード用のアクセストークンが取得できません。再ログインしてください。");
            return;
        }
        const now = new Date().toISOString();
        const tempDiv = document.createElement("div");
        tempDiv.style.padding = "20px";
        tempDiv.style.fontFamily = "sans-serif";
        tempDiv.style.backgroundColor = "#fff";
        tempDiv.style.color = "#000";
        tempDiv.innerHTML = `
      <h1>${model.name}</h1>
      <h2>教育観</h2><p>${model.philosophy.replace(/\n/g, "<br>")}</p>
      <h2>評価観点の重視点</h2><p>${model.evaluationFocus.replace(/\n/g, "<br>")}</p>
      <h2>言語活動の重視点</h2><p>${model.languageFocus.replace(/\n/g, "<br>")}</p>
      <h2>育てたい子どもの姿</h2><p>${model.childFocus.replace(/\n/g, "<br>")}</p>
      <p>生成日時: ${now}</p>
    `;
        document.body.appendChild(tempDiv);
        try {
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
            const metadata = {
                name: `教育観モデル_${model.name}_${now}.pdf`,
                mimeType: "application/pdf"
            };
            const formData = new FormData();
            formData.append("metadata", new Blob([
                JSON.stringify(metadata)
            ], {
                type: "application/json"
            }));
            formData.append("file", pdfBlob);
            const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`
                },
                body: formData
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Google Driveアップロード失敗: ${errorText}`);
            }
            alert("✅ Google DriveにPDFをアップロードしました。");
        } catch (e) {
            alert("⚠️ PDF生成またはGoogle Driveアップロードに失敗しました。");
            console.error(e);
            document.body.removeChild(tempDiv);
        }
    }
    const sortedModels = ()=>{
        const copy = [
            ...models
        ];
        if (sortOrder === "newest") {
            return copy.sort((a, b)=>new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        return copy.sort((a, b)=>a.name.localeCompare(b.name));
    };
    const handleDelete = (id)=>{
        if (!confirm("このモデルを削除しますか？")) return;
        const remaining = models.filter((m)=>m.id !== id);
        localStorage.setItem("styleModels", JSON.stringify(remaining));
        setModels(remaining);
        if (editId === id) cancelEdit();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            padding: 24,
            fontFamily: "sans-serif",
            maxWidth: 900,
            margin: "0 auto"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                style: {
                    display: "flex",
                    gap: 16,
                    overflowX: "auto",
                    padding: 16,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 8,
                    marginBottom: 24
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        style: navLinkStyle,
                        children: "🏠 ホーム"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 253,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/plan",
                        style: navLinkStyle,
                        children: "📋 授業作成"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/plan/history",
                        style: navLinkStyle,
                        children: "📖 計画履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 259,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/practice/history",
                        style: navLinkStyle,
                        children: "📷 実践履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 262,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models/create",
                        style: navLinkStyle,
                        children: "✏️ 教育観作成"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models",
                        style: navLinkStyle,
                        children: "📚 教育観一覧"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 268,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models/history",
                        style: navLinkStyle,
                        children: "🕒 教育観履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 242,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                style: {
                    fontSize: 24,
                    marginBottom: 16
                },
                children: "教育観モデル一覧・編集"
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 276,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                style: {
                    display: "block",
                    marginBottom: 16
                },
                children: [
                    "並び替え：",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: sortOrder,
                        onChange: (e)=>setSortOrder(e.target.value),
                        style: {
                            marginLeft: 8,
                            padding: 4
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "newest",
                                children: "新着順"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 286,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "nameAsc",
                                children: "名前順"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 281,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 279,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    color: "red",
                    marginBottom: 16,
                    fontWeight: "bold"
                },
                children: error
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 293,
                columnNumber: 9
            }, this),
            editId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: cardStyle,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            marginTop: 0
                        },
                        children: "編集モード"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 301,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        placeholder: "モデル名",
                        value: form.name,
                        onChange: (e)=>handleChange("name", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 302,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "教育観",
                        rows: 2,
                        value: form.philosophy,
                        onChange: (e)=>handleChange("philosophy", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 308,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "評価観点の重視点",
                        rows: 2,
                        value: form.evaluationFocus,
                        onChange: (e)=>handleChange("evaluationFocus", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 315,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "言語活動の重視点",
                        rows: 2,
                        value: form.languageFocus,
                        onChange: (e)=>handleChange("languageFocus", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 322,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "育てたい子どもの姿",
                        rows: 2,
                        value: form.childFocus,
                        onChange: (e)=>handleChange("childFocus", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 329,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 16
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>saveModel(),
                                style: {
                                    ...buttonPrimary,
                                    marginRight: 8
                                },
                                children: "保存"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 337,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>generatePdf({
                                        id: editId,
                                        name: form.name,
                                        philosophy: form.philosophy,
                                        evaluationFocus: form.evaluationFocus,
                                        languageFocus: form.languageFocus,
                                        childFocus: form.childFocus,
                                        updatedAt: new Date().toISOString()
                                    }),
                                style: {
                                    ...buttonPrimary,
                                    marginRight: 8
                                },
                                children: "PDF化"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 340,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>uploadPdfToDrive({
                                        id: editId,
                                        name: form.name,
                                        philosophy: form.philosophy,
                                        evaluationFocus: form.evaluationFocus,
                                        languageFocus: form.languageFocus,
                                        childFocus: form.childFocus,
                                        updatedAt: new Date().toISOString()
                                    }),
                                style: {
                                    ...buttonPrimary,
                                    backgroundColor: "#4285F4",
                                    marginRight: 8
                                },
                                children: "Drive保存"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 354,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: cancelEdit,
                                style: {
                                    ...buttonPrimary,
                                    backgroundColor: "#757575"
                                },
                                children: "キャンセル"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 368,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 336,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 300,
                columnNumber: 9
            }, this),
            sortedModels().length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "まだモデルがありません。"
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 377,
                columnNumber: 9
            }, this) : sortedModels().map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: cardStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                marginTop: 0
                            },
                            children: m.name
                        }, void 0, false, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 381,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "教育観："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 383,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.philosophy
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 382,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "評価観点："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 386,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.evaluationFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 385,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "言語活動："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 389,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.languageFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 388,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "育てたい子ども："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 392,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.childFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 391,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 16
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>startEdit(m),
                                    style: buttonPrimary,
                                    children: "編集"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 395,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleDelete(m.id),
                                    style: {
                                        ...buttonPrimary,
                                        backgroundColor: "#f44336"
                                    },
                                    children: "削除"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 398,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>generatePdf(m),
                                    style: {
                                        ...buttonPrimary,
                                        marginLeft: 8
                                    },
                                    children: "PDF化"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 404,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>uploadPdfToDrive(m),
                                    style: {
                                        ...buttonPrimary,
                                        backgroundColor: "#4285F4",
                                        marginLeft: 8
                                    },
                                    children: "Drive保存"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 407,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 394,
                            columnNumber: 13
                        }, this)
                    ]
                }, m.id, true, {
                    fileName: "[project]/app/models/create/page.tsx",
                    lineNumber: 380,
                    columnNumber: 11
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/app/models/create/page.tsx",
        lineNumber: 240,
        columnNumber: 5
    }, this);
}
// --- Styles ---
const navLinkStyle = {
    padding: "0.5rem 1rem",
    backgroundColor: "#1976d2",
    color: "white",
    borderRadius: 6,
    textDecoration: "none",
    fontWeight: "bold",
    whiteSpace: "nowrap"
};
const cardStyle = {
    border: "1px solid #ccc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
};
const inputStyle = {
    width: "100%",
    padding: 8,
    marginBottom: 12,
    fontSize: "1rem",
    borderRadius: 6,
    border: "1px solid #ccc",
    boxSizing: "border-box"
};
const buttonPrimary = {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: 8
};
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__11664b87._.js.map