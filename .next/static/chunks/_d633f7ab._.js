(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/models/create/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>PracticeAddPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function PracticeAddPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const [practiceDate, setPracticeDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [reflection, setReflection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [boardImages, setBoardImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [uploading, setUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // 過去記録があればロード
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PracticeAddPage.useEffect": ()=>{
            const recordsJson = localStorage.getItem("practiceRecords") || "[]";
            try {
                const records = JSON.parse(recordsJson);
                const rec = records.find({
                    "PracticeAddPage.useEffect.rec": (r)=>r.lessonId === id
                }["PracticeAddPage.useEffect.rec"]);
                if (rec) {
                    setPracticeDate(rec.practiceDate);
                    setReflection(rec.reflection);
                    setBoardImages(rec.boardImages);
                }
            } catch  {
            // ignore
            }
        }
    }["PracticeAddPage.useEffect"], [
        id
    ]);
    // 画像選択 → ローカルURLでプレビュー用にセット
    const handleFileChange = (e)=>{
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        const newImages = files.map((file)=>({
                name: file.name,
                src: URL.createObjectURL(file)
            }));
        setBoardImages((prev)=>[
                ...prev,
                ...newImages
            ]);
        e.target.value = "";
    };
    // 画像削除
    const handleRemoveImage = (index)=>{
        setBoardImages((prev)=>prev.filter((_, i)=>i !== index));
    };
    // ローカルストレージに保存
    const saveToLocal = ()=>{
        const recordsJson = localStorage.getItem("practiceRecords") || "[]";
        let records = [];
        try {
            records = JSON.parse(recordsJson);
        } catch  {
        // ignore
        }
        const record = {
            lessonId: id,
            practiceDate,
            reflection,
            boardImages
        };
        const idx = records.findIndex((r)=>r.lessonId === id);
        if (idx >= 0) records[idx] = record;
        else records.push(record);
        localStorage.setItem("practiceRecords", JSON.stringify(records));
    };
    // Google Driveアップロード（PDF blobをアップロード）
    const uploadPdfToDrive = async (blob)=>{
        const accessToken = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_GOOGLE_DRIVE_ACCESS_TOKEN;
        if (!accessToken) throw new Error("Google Driveアクセストークンが設定されていません");
        const metadata = {
            name: `practice_record_${id}.pdf`,
            mimeType: "application/pdf"
        };
        const formData = new FormData();
        formData.append("metadata", new Blob([
            JSON.stringify(metadata)
        ], {
            type: "application/json"
        }));
        formData.append("file", blob);
        const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            body: formData
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Google Driveアップロード失敗: ${text}`);
        }
        return res.json();
    };
    // 保存ボタン押下処理
    const handleSave = async (e)=>{
        e.preventDefault();
        if (!practiceDate.trim()) {
            alert("実施日を入力してください");
            return;
        }
        if (!reflection.trim()) {
            alert("振り返りを入力してください");
            return;
        }
        saveToLocal();
        try {
            const { default: html2pdf } = await __turbopack_context__.r("[project]/node_modules/html2pdf.js/dist/html2pdf.js [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
            const el = document.getElementById("practice-preview");
            if (!el) {
                alert("プレビューが見つかりません");
                return;
            }
            const pdfBlob = await html2pdf().from(el).outputPdf("blob");
            await uploadPdfToDrive(pdfBlob);
            alert("ローカル保存とGoogle Drive保存が完了しました！");
            router.push("/practice/history");
        } catch (error) {
            alert("Google Driveへの保存に失敗しました。");
            console.error(error);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            padding: 24,
            maxWidth: 800,
            margin: "auto",
            fontFamily: "sans-serif"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "実践記録作成・編集"
            }, void 0, false, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSave,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12
                        },
                        children: [
                            "実施日：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: practiceDate,
                                onChange: (e)=>setPracticeDate(e.target.value),
                                required: true,
                                style: {
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 145,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12
                        },
                        children: [
                            "振り返り：",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                value: reflection,
                                onChange: (e)=>setReflection(e.target.value),
                                required: true,
                                rows: 6,
                                style: {
                                    width: "100%",
                                    padding: 8,
                                    marginTop: 4
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 156,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: 12,
                            padding: 8,
                            backgroundColor: "#1976d2",
                            color: "#fff",
                            borderRadius: 6,
                            textAlign: "center",
                            cursor: "pointer"
                        },
                        children: [
                            "📷 板書写真をアップロード",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                multiple: true,
                                accept: "image/*",
                                onChange: handleFileChange,
                                style: {
                                    display: "none"
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 178,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 165,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 16
                        },
                        children: boardImages.map((img, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    position: "relative",
                                    marginBottom: 12
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: img.src,
                                        alt: img.name,
                                        style: {
                                            width: "100%",
                                            borderRadius: 8,
                                            border: "1px solid #ccc"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/models/create/page.tsx",
                                        lineNumber: 193,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        "aria-label": "画像を削除",
                                        onClick: ()=>handleRemoveImage(i),
                                        style: {
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            backgroundColor: "rgba(229, 57, 53, 0.85)",
                                            border: "none",
                                            borderRadius: "50%",
                                            color: "white",
                                            width: 28,
                                            height: 28,
                                            cursor: "pointer",
                                            fontWeight: "bold"
                                        },
                                        children: "×"
                                    }, void 0, false, {
                                        fileName: "[project]/app/models/create/page.tsx",
                                        lineNumber: 198,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, `${img.name}-${i}`, true, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 189,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        id: "practice-preview",
                        style: {
                            padding: 16,
                            border: "1px solid #ccc",
                            borderRadius: 6,
                            backgroundColor: "#fff",
                            fontSize: 14,
                            lineHeight: 1.6,
                            marginBottom: 16
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: [
                                    "実施日: ",
                                    practiceDate
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 235,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "振り返り"
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 236,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: reflection
                            }, void 0, false, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 237,
                                columnNumber: 11
                            }, this),
                            boardImages.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 12
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "板書写真"
                                    }, void 0, false, {
                                        fileName: "[project]/app/models/create/page.tsx",
                                        lineNumber: 241,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: 8,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 12
                                        },
                                        children: boardImages.map((img, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: img.src,
                                                alt: img.name,
                                                style: {
                                                    width: "100%",
                                                    borderRadius: 8,
                                                    border: "1px solid #ccc"
                                                }
                                            }, `${img.name}-${i}-preview`, false, {
                                                fileName: "[project]/app/models/create/page.tsx",
                                                lineNumber: 244,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/models/create/page.tsx",
                                        lineNumber: 242,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/models/create/page.tsx",
                                lineNumber: 240,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 223,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        style: {
                            padding: 12,
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            width: "100%",
                            cursor: "pointer"
                        },
                        children: "💾 保存（ローカル＋Drive）"
                    }, void 0, false, {
                        fileName: "[project]/app/models/create/page.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/models/create/page.tsx",
                lineNumber: 142,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/models/create/page.tsx",
        lineNumber: 139,
        columnNumber: 5
    }, this);
}
_s(PracticeAddPage, "JEdXGmPQ9Rg1aexWcem7apE8evM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"]
    ];
});
_c = PracticeAddPage;
var _c;
__turbopack_context__.k.register(_c, "PracticeAddPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=_d633f7ab._.js.map