module.exports = {

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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html2pdf.js/dist/html2pdf.js [app-ssr] (ecmascript)");
"use client";
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
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    // localStorageから読み込み
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
    const startEdit = (m)=>{
        setEditId(m.id);
        setForm({
            name: m.name,
            philosophy: m.philosophy,
            evaluationFocus: m.evaluationFocus,
            languageFocus: m.languageFocus,
            childFocus: m.childFocus
        });
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
    const saveEdit = ()=>{
        if (!form.name.trim() || !form.philosophy.trim() || !form.evaluationFocus.trim() || !form.languageFocus.trim() || !form.childFocus.trim()) {
            setError("必須項目をすべて入力してください。");
            return;
        }
        const now = new Date().toISOString();
        let updatedModels;
        if (editId) {
            updatedModels = models.map((m)=>m.id === editId ? {
                    id: editId,
                    ...form,
                    updatedAt: now
                } : m);
        } else {
            // ここは編集専用なので基本使わないはずですが新規もOK
            updatedModels = [
                {
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    ...form,
                    updatedAt: now
                },
                ...models
            ];
        }
        setModels(updatedModels);
        localStorage.setItem("styleModels", JSON.stringify(updatedModels));
        cancelEdit();
    };
    const handleDelete = (id)=>{
        if (!confirm("このモデルを削除しますか？")) return;
        const filtered = models.filter((m)=>m.id !== id);
        setModels(filtered);
        localStorage.setItem("styleModels", JSON.stringify(filtered));
    };
    // PDF生成
    const handlePdf = async (model)=>{
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
      <p>更新日時: ${model.updatedAt}</p>
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
            }).save(`${model.name}_教育観モデル.pdf`);
        } finally{
            document.body.removeChild(tempDiv);
        }
    };
    // Google Driveアップロード
    const handleDriveSave = async (model)=>{
        if (!session || !("accessToken" in session)) {
            alert("Googleアカウントでログインしてください。");
            return;
        }
        const accessToken = session.accessToken;
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
      <p>更新日時: ${model.updatedAt}</p>
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
            const metadata = {
                name: `${model.name}_${new Date().toISOString()}.pdf`,
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
                    Authorization: `Bearer ${accessToken}`
                },
                body: formData
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Google Driveアップロードに失敗しました: ${errorText}`);
            }
            alert("Google Driveに保存しました！");
        } catch (error) {
            alert(`エラーが発生しました: ${error}`);
        } finally{
            document.body.removeChild(tempDiv);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            padding: 24,
            fontFamily: "sans-serif",
            maxWidth: 900,
            margin: "0 auto"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "教育観モデル一覧・編集"
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 201,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    color: "red",
                    marginBottom: 12
                },
                children: error
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 204,
                columnNumber: 9
            }, this),
            editId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    border: "1px solid #ccc",
                    padding: 16,
                    marginBottom: 24,
                    borderRadius: 8
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "編集モード"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 209,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        placeholder: "モデル名",
                        value: form.name,
                        onChange: (e)=>handleChange("name", e.target.value),
                        style: {
                            width: "100%",
                            marginBottom: 8,
                            padding: 8
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 210,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "教育観",
                        rows: 2,
                        value: form.philosophy,
                        onChange: (e)=>handleChange("philosophy", e.target.value),
                        style: {
                            width: "100%",
                            marginBottom: 8,
                            padding: 8
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 216,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "評価観点の重視点",
                        rows: 2,
                        value: form.evaluationFocus,
                        onChange: (e)=>handleChange("evaluationFocus", e.target.value),
                        style: {
                            width: "100%",
                            marginBottom: 8,
                            padding: 8
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "言語活動の重視点",
                        rows: 2,
                        value: form.languageFocus,
                        onChange: (e)=>handleChange("languageFocus", e.target.value),
                        style: {
                            width: "100%",
                            marginBottom: 8,
                            padding: 8
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 230,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        placeholder: "育てたい子どもの姿",
                        rows: 2,
                        value: form.childFocus,
                        onChange: (e)=>handleChange("childFocus", e.target.value),
                        style: {
                            width: "100%",
                            marginBottom: 8,
                            padding: 8
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 237,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: saveEdit,
                                style: {
                                    marginRight: 12
                                },
                                children: "保存"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 245,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: cancelEdit,
                                children: "キャンセル"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 248,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 244,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 208,
                columnNumber: 9
            }, this),
            models.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "モデルがありません"
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 254,
                columnNumber: 9
            }, this) : models.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        border: "1px solid #ccc",
                        padding: 16,
                        marginBottom: 12,
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                margin: 0
                            },
                            children: m.name
                        }, void 0, false, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 269,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "教育観："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 270,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.philosophy
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 270,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "評価観点："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 271,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.evaluationFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 271,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "言語活動："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 272,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.languageFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 272,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "育てたい子ども："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 273,
                                    columnNumber: 16
                                }, this),
                                " ",
                                m.childFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 273,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "flex",
                                gap: 8,
                                marginTop: 8
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>startEdit(m),
                                    style: buttonStyle,
                                    children: "編集"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 276,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleDelete(m.id),
                                    style: {
                                        ...buttonStyle,
                                        backgroundColor: "#f44336"
                                    },
                                    children: "削除"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 279,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handlePdf(m),
                                    style: {
                                        ...buttonStyle,
                                        backgroundColor: "#2196f3"
                                    },
                                    children: "PDF化"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 282,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleDriveSave(m),
                                    style: {
                                        ...buttonStyle,
                                        backgroundColor: "#4285f4"
                                    },
                                    children: "Drive保存"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/create/page.tsx",
                                    lineNumber: 285,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/create/page.tsx",
                            lineNumber: 275,
                            columnNumber: 13
                        }, this)
                    ]
                }, m.id, true, {
                    fileName: "[project]/app/models/create/page.tsx",
                    lineNumber: 257,
                    columnNumber: 11
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/app/models/create/page.tsx",
        lineNumber: 200,
        columnNumber: 5
    }, this);
}
const buttonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#4caf50"
};
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__851db847._.js.map