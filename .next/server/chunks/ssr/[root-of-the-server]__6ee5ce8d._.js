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
"[project]/app/models/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$firebaseConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/firebaseConfig.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function ModelListPage() {
    const [models, setModels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [editId, setEditId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        philosophy: "",
        evaluationFocus: "",
        languageFocus: "",
        childFocus: "",
        note: ""
    });
    const [sortOrder, setSortOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("newest");
    // 読み込み：localStorage＋Firestore 両方、Firestore優先でマージ
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function loadAll() {
            // 1) localStorage
            const localModels = JSON.parse(localStorage.getItem("styleModels") || "[]");
            const localHistory = JSON.parse(localStorage.getItem("educationStylesHistory") || "[]");
            // 2) Firestore
            let fsModels = [];
            let fsHistory = [];
            try {
                const mSnap = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$firebaseConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"].collection("styleModels").orderBy("updatedAt", "desc").get();
                fsModels = mSnap.docs.map((d)=>({
                        ...d.data(),
                        id: d.id
                    }));
            } catch (e) {
                console.error("Firestore(styleModels)読み込みエラー", e);
            }
            try {
                const hSnap = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$firebaseConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"].collection("educationStylesHistory").orderBy("updatedAt", "desc").get();
                fsHistory = hSnap.docs.map((d)=>({
                        ...d.data(),
                        id: d.id
                    }));
            } catch (e) {
                console.error("Firestore(educationStylesHistory)読み込みエラー", e);
            }
            // マージ＆重複排除 (Firestore優先)
            const modelMap = new Map();
            fsModels.concat(localModels).forEach((m)=>modelMap.set(m.id, m));
            setModels(Array.from(modelMap.values()));
            const histMap = new Map();
            fsHistory.concat(localHistory).forEach((h)=>histMap.set(h.id, h));
            setHistory(Array.from(histMap.values()));
        }
        loadAll();
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
            childFocus: m.childFocus,
            note: ""
        });
    };
    const cancelEdit = ()=>{
        setEditId(null);
        setForm({
            name: "",
            philosophy: "",
            evaluationFocus: "",
            languageFocus: "",
            childFocus: "",
            note: ""
        });
    };
    const handleSave = async ()=>{
        if (!form.name.trim() || !form.philosophy.trim() || !form.evaluationFocus.trim() || !form.languageFocus.trim() || !form.childFocus.trim()) {
            alert("必須項目を入力してください。");
            return;
        }
        const now = new Date().toISOString();
        let updatedModels;
        let id = editId;
        if (editId) {
            // 更新
            id = editId;
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$firebaseConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"].collection("styleModels").doc(id).update({
                    ...form,
                    updatedAt: now
                });
            } catch (e) {
                console.error("Firestoreスタイル更新エラー", e);
            }
            updatedModels = models.map((m)=>m.id === id ? {
                    id,
                    ...form,
                    updatedAt: now
                } : m);
        } else {
            // 新規
            id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
            const newModel = {
                id,
                name: form.name.trim(),
                philosophy: form.philosophy.trim(),
                evaluationFocus: form.evaluationFocus.trim(),
                languageFocus: form.languageFocus.trim(),
                childFocus: form.childFocus.trim(),
                updatedAt: now
            };
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$firebaseConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"].collection("styleModels").doc(id).set(newModel);
            } catch (e) {
                console.error("Firestoreスタイル保存エラー", e);
            }
            updatedModels = [
                newModel,
                ...models
            ];
        }
        setModels(updatedModels);
        localStorage.setItem("styleModels", JSON.stringify(updatedModels));
        // 履歴追加
        const newHistoryEntry = {
            id,
            updatedAt: now,
            name: form.name.trim(),
            philosophy: form.philosophy.trim(),
            evaluationFocus: form.evaluationFocus.trim(),
            languageFocus: form.languageFocus.trim(),
            childFocus: form.childFocus.trim(),
            note: form.note.trim() || "（メモなし）"
        };
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$firebaseConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"].collection("educationStylesHistory").add(newHistoryEntry);
        } catch (e) {
            console.error("Firestore履歴保存エラー", e);
        }
        const updatedHistory = [
            newHistoryEntry,
            ...history
        ];
        setHistory(updatedHistory);
        localStorage.setItem("educationStylesHistory", JSON.stringify(updatedHistory));
        cancelEdit();
    };
    const handleDelete = async (id)=>{
        if (!confirm("このモデルを削除しますか？")) return;
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$firebaseConfig$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["db"].collection("styleModels").doc(id).delete();
        } catch (e) {
            console.error("Firestoreモデル削除エラー", e);
        }
        const remaining = models.filter((m)=>m.id !== id);
        setModels(remaining);
        localStorage.setItem("styleModels", JSON.stringify(remaining));
    };
    const sortedModels = ()=>{
        const copy = [
            ...models
        ];
        if (sortOrder === "newest") {
            return copy.sort((a, b)=>new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        return copy.sort((a, b)=>a.name.localeCompare(b.name));
    };
    // スタイル省略...
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
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 221,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/plan",
                        style: navLinkStyle,
                        children: "📋 授業作成"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 222,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/plan/history",
                        style: navLinkStyle,
                        children: "📖 計画履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 223,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/practice/history",
                        style: navLinkStyle,
                        children: "📷 実践履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 224,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models/create",
                        style: navLinkStyle,
                        children: "✏️ 教育観作成"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 225,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models",
                        style: navLinkStyle,
                        children: "📚 教育観一覧"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 226,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models/history",
                        style: navLinkStyle,
                        children: "🕒 教育観履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 220,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                style: {
                    fontSize: 24,
                    marginBottom: 16
                },
                children: "教育観モデル一覧・編集"
            }, void 0, false, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 230,
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
                                fileName: "[project]/app/models/page.tsx",
                                lineNumber: 240,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "nameAsc",
                                children: "名前順"
                            }, void 0, false, {
                                fileName: "[project]/app/models/page.tsx",
                                lineNumber: 241,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 235,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 233,
                columnNumber: 7
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
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 248,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        placeholder: "モデル名",
                        value: form.name,
                        onChange: (e)=>handleChange("name", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 249,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "教育観",
                        rows: 2,
                        value: form.philosophy,
                        onChange: (e)=>handleChange("philosophy", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 255,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "評価観点の重視点",
                        rows: 2,
                        value: form.evaluationFocus,
                        onChange: (e)=>handleChange("evaluationFocus", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 262,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "言語活動の重視点",
                        rows: 2,
                        value: form.languageFocus,
                        onChange: (e)=>handleChange("languageFocus", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 269,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "育てたい子どもの姿",
                        rows: 2,
                        value: form.childFocus,
                        onChange: (e)=>handleChange("childFocus", e.target.value),
                        style: inputStyle
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 276,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "更新メモ",
                        rows: 2,
                        value: form.note,
                        onChange: (e)=>handleChange("note", e.target.value),
                        style: {
                            ...inputStyle,
                            fontStyle: "italic"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 283,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 16
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleSave,
                                style: buttonPrimary,
                                children: "保存"
                            }, void 0, false, {
                                fileName: "[project]/app/models/page.tsx",
                                lineNumber: 291,
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
                                fileName: "[project]/app/models/page.tsx",
                                lineNumber: 294,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 290,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 247,
                columnNumber: 9
            }, this),
            sortedModels().length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "まだモデルがありません。"
            }, void 0, false, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 303,
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
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 307,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "教育観："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 308,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.philosophy
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 308,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "評価観点："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 309,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.evaluationFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 309,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "言語活動："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 310,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.languageFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 310,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "育てたい子ども："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 311,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.childFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 311,
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
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 313,
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
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 316,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 312,
                            columnNumber: 13
                        }, this)
                    ]
                }, m.id, true, {
                    fileName: "[project]/app/models/page.tsx",
                    lineNumber: 306,
                    columnNumber: 11
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/app/models/page.tsx",
        lineNumber: 218,
        columnNumber: 5
    }, this);
}
// --- スタイル定義 ---
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

//# sourceMappingURL=%5Broot-of-the-server%5D__6ee5ce8d._.js.map