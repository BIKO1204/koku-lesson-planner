(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/models/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ModelListPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html2pdf.js/dist/html2pdf.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function ModelListPage() {
    _s();
    const { data: session } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"])();
    const [models, setModels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [editId, setEditId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        philosophy: "",
        evaluationFocus: "",
        languageFocus: "",
        childFocus: ""
    });
    const [sortOrder, setSortOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("newest");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ModelListPage.useEffect": ()=>{
            const stored = localStorage.getItem("styleModels");
            if (stored) {
                try {
                    setModels(JSON.parse(stored));
                } catch  {
                    setModels([]);
                }
            }
        }
    }["ModelListPage.useEffect"], []);
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
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
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
    async function generatePdfFromModel(m) {
        const tempDiv = document.createElement("div");
        tempDiv.style.padding = "20px";
        tempDiv.style.fontFamily = "'Yu Gothic', 'YuGothic', 'Meiryo', sans-serif";
        tempDiv.style.backgroundColor = "#fff";
        tempDiv.style.color = "#000";
        tempDiv.style.lineHeight = "1.6";
        tempDiv.innerHTML = `
      <h1 style="border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">${m.name}</h1>
      <h2 style="color: #4CAF50; margin-top: 24px;">1. 教育観</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.philosophy.replace(/\n/g, "<br>")}</p>
      <h2 style="color: #4CAF50; margin-top: 24px;">2. 評価観点の重視点</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.evaluationFocus.replace(/\n/g, "<br>")}</p>
      <h2 style="color: #4CAF50; margin-top: 24px;">3. 言語活動の重視点</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.languageFocus.replace(/\n/g, "<br>")}</p>
      <h2 style="color: #4CAF50; margin-top: 24px;">4. 育てたい子どもの姿</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.childFocus.replace(/\n/g, "<br>")}</p>
      <p style="margin-top: 32px; font-size: 0.9rem; color: #666;">
        更新日時: ${new Date(m.updatedAt).toLocaleString()}
      </p>
    `;
        document.body.appendChild(tempDiv);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])().from(tempDiv).set({
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
            }).save(`${m.name}_${new Date(m.updatedAt).toISOString().replace(/[:.]/g, "-")}.pdf`);
        } catch (e) {
            alert("PDF生成に失敗しました");
            console.error(e);
        } finally{
            document.body.removeChild(tempDiv);
        }
    }
    async function uploadPdfToDrive(blob, filename, accessToken) {
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
        const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: formData
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Google Driveアップロード失敗: ${errorText}`);
        }
        return res.json();
    }
    async function saveAndUploadPdfFromModel(m) {
        const tempDiv = document.createElement("div");
        tempDiv.style.padding = "20px";
        tempDiv.style.fontFamily = "'Yu Gothic', 'YuGothic', 'Meiryo', sans-serif";
        tempDiv.style.backgroundColor = "#fff";
        tempDiv.style.color = "#000";
        tempDiv.style.lineHeight = "1.6";
        tempDiv.innerHTML = `
      <h1 style="border-bottom: 2px solid #4285F4; padding-bottom: 8px;">${m.name}</h1>
      <h2 style="color: #4285F4; margin-top: 24px;">1. 教育観</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.philosophy.replace(/\n/g, "<br>")}</p>
      <h2 style="color: #4285F4; margin-top: 24px;">2. 評価観点の重視点</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.evaluationFocus.replace(/\n/g, "<br>")}</p>
      <h2 style="color: #4285F4; margin-top: 24px;">3. 言語活動の重視点</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.languageFocus.replace(/\n/g, "<br>")}</p>
      <h2 style="color: #4285F4; margin-top: 24px;">4. 育てたい子どもの姿</h2>
      <p style="white-space: pre-wrap; margin-left: 12px;">${m.childFocus.replace(/\n/g, "<br>")}</p>
      <p style="margin-top: 32px; font-size: 0.9rem; color: #666;">
        更新日時: ${new Date(m.updatedAt).toLocaleString()}
      </p>
    `;
        document.body.appendChild(tempDiv);
        try {
            const pdfBlob = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html2pdf$2e$js$2f$dist$2f$html2pdf$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])().from(tempDiv).set({
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
            if (!session || typeof session.accessToken !== "string") {
                alert("Google Driveアップロード用のアクセストークンが取得できません。再ログインしてください。");
                return;
            }
            const filename = `${m.name}_${new Date(m.updatedAt).toISOString().replace(/[:.]/g, "-")}.pdf`;
            await uploadPdfToDrive(pdfBlob, filename, session.accessToken);
            alert(`✅ Google Driveに「${filename}」としてPDFをアップロードしました。`);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            padding: 24,
            fontFamily: "sans-serif",
            maxWidth: 900,
            margin: "0 auto"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        style: navLinkStyle,
                        children: "🏠 ホーム"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 270,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/plan",
                        style: navLinkStyle,
                        children: "📋 授業作成"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 273,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/plan/history",
                        style: navLinkStyle,
                        children: "📖 計画履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 276,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/practice/history",
                        style: navLinkStyle,
                        children: "📷 実践履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models/create",
                        style: navLinkStyle,
                        children: "✏️ 教育観作成"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 282,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models",
                        style: navLinkStyle,
                        children: "📚 教育観一覧"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 285,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/models/history",
                        style: navLinkStyle,
                        children: "🕒 教育観履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 288,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 259,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                style: {
                    fontSize: 24,
                    marginBottom: 16
                },
                children: "教育観モデル一覧・編集"
            }, void 0, false, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 293,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                style: {
                    display: "block",
                    marginBottom: 16
                },
                children: [
                    "並び替え：",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: sortOrder,
                        onChange: (e)=>setSortOrder(e.target.value),
                        style: {
                            marginLeft: 8,
                            padding: 4
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "newest",
                                children: "新着順"
                            }, void 0, false, {
                                fileName: "[project]/app/models/page.tsx",
                                lineNumber: 303,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "nameAsc",
                                children: "名前順"
                            }, void 0, false, {
                                fileName: "[project]/app/models/page.tsx",
                                lineNumber: 304,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/page.tsx",
                        lineNumber: 298,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 296,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    color: "red",
                    marginBottom: 16,
                    fontWeight: "bold"
                },
                children: error
            }, void 0, false, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 310,
                columnNumber: 9
            }, this),
            sortedModels().length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "まだモデルがありません。"
            }, void 0, false, {
                fileName: "[project]/app/models/page.tsx",
                lineNumber: 317,
                columnNumber: 9
            }, this) : sortedModels().map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: cardStyle,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                marginTop: 0
                            },
                            children: m.name
                        }, void 0, false, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 321,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "教育観："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 323,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.philosophy
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 322,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "評価観点："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 326,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.evaluationFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 325,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "言語活動："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 329,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.languageFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 328,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "育てたい子ども："
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 332,
                                    columnNumber: 15
                                }, this),
                                " ",
                                m.childFocus
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 331,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "flex",
                                gap: 8,
                                marginTop: 16
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>startEdit(m),
                                    style: buttonPrimary,
                                    children: "編集"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 335,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleDelete(m.id),
                                    style: {
                                        ...buttonPrimary,
                                        backgroundColor: "#f44336"
                                    },
                                    children: "削除"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 338,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>generatePdfFromModel(m),
                                    style: {
                                        ...buttonPrimary,
                                        backgroundColor: "#FF9800"
                                    },
                                    children: "PDF化"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 344,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>saveAndUploadPdfFromModel(m),
                                    style: {
                                        ...buttonPrimary,
                                        backgroundColor: "#4285F4"
                                    },
                                    children: "Drive保存"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 350,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 334,
                            columnNumber: 13
                        }, this),
                        editId === m.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            style: {
                                ...cardStyle,
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    children: "編集モード"
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 361,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    placeholder: "モデル名",
                                    value: form.name,
                                    onChange: (e)=>handleChange("name", e.target.value),
                                    style: inputStyle
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 362,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    placeholder: "教育観",
                                    rows: 2,
                                    value: form.philosophy,
                                    onChange: (e)=>handleChange("philosophy", e.target.value),
                                    style: inputStyle
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 368,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    placeholder: "評価観点の重視点",
                                    rows: 2,
                                    value: form.evaluationFocus,
                                    onChange: (e)=>handleChange("evaluationFocus", e.target.value),
                                    style: inputStyle
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 375,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    placeholder: "言語活動の重視点",
                                    rows: 2,
                                    value: form.languageFocus,
                                    onChange: (e)=>handleChange("languageFocus", e.target.value),
                                    style: inputStyle
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 382,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    placeholder: "育てたい子どもの姿",
                                    rows: 2,
                                    value: form.childFocus,
                                    onChange: (e)=>handleChange("childFocus", e.target.value),
                                    style: inputStyle
                                }, void 0, false, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 389,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 16
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                if (saveModel()) setError("");
                                            },
                                            style: buttonPrimary,
                                            children: "保存"
                                        }, void 0, false, {
                                            fileName: "[project]/app/models/page.tsx",
                                            lineNumber: 397,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: cancelEdit,
                                            style: {
                                                ...buttonPrimary,
                                                backgroundColor: "#757575",
                                                marginLeft: 8
                                            },
                                            children: "キャンセル"
                                        }, void 0, false, {
                                            fileName: "[project]/app/models/page.tsx",
                                            lineNumber: 400,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/models/page.tsx",
                                    lineNumber: 396,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/models/page.tsx",
                            lineNumber: 360,
                            columnNumber: 15
                        }, this)
                    ]
                }, m.id, true, {
                    fileName: "[project]/app/models/page.tsx",
                    lineNumber: 320,
                    columnNumber: 11
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/app/models/page.tsx",
        lineNumber: 257,
        columnNumber: 5
    }, this);
}
_s(ModelListPage, "wM+lgAfUMXBFjA+d0gD8yxJSyrg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSession"]
    ];
});
_c = ModelListPage;
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
    fontWeight: "bold"
};
var _c;
__turbopack_context__.k.register(_c, "ModelListPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=app_models_page_tsx_541b66f2._.js.map