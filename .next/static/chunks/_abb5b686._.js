(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/practice/add/[id]/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>PracticeAddPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
// 安全に文字列化する補助
function safeRender(value) {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
}
function PracticeAddPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const [practiceDate, setPracticeDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [reflection, setReflection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [boardImages, setBoardImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [lessonTitle, setLessonTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [record, setRecord] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lessonPlan, setLessonPlan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [uploading, setUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // 授業案＆過去記録読み込み（ローカルストレージ）
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PracticeAddPage.useEffect": ()=>{
            const plansJson = localStorage.getItem("lessonPlans") || "[]";
            let plans;
            try {
                plans = JSON.parse(plansJson);
            } catch  {
                plans = [];
            }
            const plan = plans.find({
                "PracticeAddPage.useEffect": (p)=>p.id === id
            }["PracticeAddPage.useEffect"]) || null;
            setLessonPlan(plan);
            if (plan && plan.result) {
                if (typeof plan.result === "string") {
                    const firstLine = plan.result.split("\n")[0].replace(/^【単元名】\s*/, "");
                    setLessonTitle(firstLine);
                } else if (typeof plan.result === "object") {
                    const unitName = plan.result["単元名"];
                    setLessonTitle(typeof unitName === "string" ? unitName : "");
                } else {
                    setLessonTitle("");
                }
            } else {
                setLessonTitle("");
            }
            const recsJson = localStorage.getItem("practiceRecords") || "[]";
            let recs;
            try {
                recs = JSON.parse(recsJson);
            } catch  {
                recs = [];
            }
            const existing = recs.find({
                "PracticeAddPage.useEffect": (r)=>r.lessonId === id
            }["PracticeAddPage.useEffect"]) || null;
            if (existing) {
                setPracticeDate(existing.practiceDate);
                setReflection(existing.reflection);
                setBoardImages(existing.boardImages);
                setRecord({
                    ...existing,
                    lessonTitle: existing.lessonTitle || ""
                });
            }
        }
    }["PracticeAddPage.useEffect"], [
        id
    ]);
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
    // 画像削除ボタン処理
    const handleRemoveImage = (i)=>setBoardImages((prev)=>prev.filter((_, idx)=>idx !== i));
    // プレビュー作成＝recordセット
    const handlePreview = (e)=>{
        e.preventDefault();
        setRecord({
            lessonId: id,
            practiceDate,
            reflection,
            boardImages,
            lessonTitle
        });
    };
    // ローカル保存（プレビュー生成済み必須）
    const handleSaveLocal = ()=>{
        if (!record) {
            alert("プレビューを作成してください");
            return;
        }
        const recsJson = localStorage.getItem("practiceRecords") || "[]";
        let recs;
        try {
            recs = JSON.parse(recsJson);
        } catch  {
            recs = [];
        }
        const idx = recs.findIndex((r)=>r.lessonId === id);
        if (idx >= 0) recs[idx] = record;
        else recs.push(record);
        try {
            localStorage.setItem("practiceRecords", JSON.stringify(recs));
            alert("ローカルに保存しました");
            router.push("/practice/history");
        } catch (e) {
            alert("localStorageへの保存に失敗しました。容量オーバーかもしれません。");
            console.error(e);
        }
    };
    // スタイル
    const containerStyle = {
        padding: 24,
        maxWidth: 800,
        margin: "auto",
        fontFamily: "sans-serif"
    };
    const navBtnStyle = {
        marginRight: 8,
        padding: "8px 12px",
        backgroundColor: "#1976d2",
        color: "#fff",
        borderRadius: 6,
        border: "none",
        cursor: "pointer"
    };
    const sectionStyle = {
        border: "2px solid #1976d2",
        borderRadius: 6,
        padding: 12,
        marginBottom: 16
    };
    const uploadLabelStyle = {
        display: "block",
        marginBottom: 8,
        cursor: "pointer",
        padding: "8px 12px",
        backgroundColor: "#1976d2",
        color: "#fff",
        borderRadius: 6,
        textAlign: "center"
    };
    const boardImageWrapperStyle = {
        marginTop: 12
    };
    const boardImageContainerStyle = {
        width: "100%",
        marginBottom: 12
    };
    const boardImageStyle = {
        width: "100%",
        height: "auto",
        borderRadius: 8,
        border: "1px solid #ccc",
        display: "block",
        maxWidth: "100%"
    };
    const removeBtnStyle = {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: "rgba(229, 57, 53, 0.85)",
        border: "none",
        borderRadius: "50%",
        color: "white",
        width: 24,
        height: 24,
        cursor: "pointer",
        fontWeight: "bold"
    };
    // 教育観情報 一行テキスト
    const infoRowStyle = {
        display: "flex",
        gap: 12,
        flexWrap: "nowrap",
        marginBottom: 16,
        overflowX: "auto"
    };
    const infoItemStyle = {
        whiteSpace: "nowrap",
        fontWeight: "bold",
        backgroundColor: "#1976d2",
        color: "white",
        padding: "6px 12px",
        borderRadius: 6
    };
    const saveBtnStyle = {
        padding: 12,
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        width: "100%",
        cursor: "pointer",
        marginTop: 16
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: containerStyle,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                style: {
                    display: "flex",
                    overflowX: "auto",
                    marginBottom: 24
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push("/"),
                        style: navBtnStyle,
                        children: "🏠 ホーム"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 239,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push("/plan"),
                        style: navBtnStyle,
                        children: "📋 授業作成"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 242,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push("/plan/history"),
                        style: navBtnStyle,
                        children: "📖 計画履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 245,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push("/practice/history"),
                        style: navBtnStyle,
                        children: "📷 実践履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push("/models/create"),
                        style: navBtnStyle,
                        children: "✏️ 教育観作成"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 251,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push("/models"),
                        style: navBtnStyle,
                        children: "📚 教育観一覧"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 254,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.push("/models"),
                        style: navBtnStyle,
                        children: "🕒 教育観履歴"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 257,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/practice/add/[id]/page.tsx",
                lineNumber: 238,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "実践記録作成・編集"
            }, void 0, false, {
                fileName: "[project]/app/practice/add/[id]/page.tsx",
                lineNumber: 262,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handlePreview,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: sectionStyle,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "実施日：",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/app/practice/add/[id]/page.tsx",
                                    lineNumber: 267,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "date",
                                    value: practiceDate,
                                    required: true,
                                    onChange: (e)=>setPracticeDate(e.target.value),
                                    style: {
                                        width: "100%",
                                        padding: 8
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/app/practice/add/[id]/page.tsx",
                                    lineNumber: 268,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/practice/add/[id]/page.tsx",
                            lineNumber: 266,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: sectionStyle,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "振り返り：",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/app/practice/add/[id]/page.tsx",
                                    lineNumber: 280,
                                    columnNumber: 18
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    value: record?.reflection ?? reflection,
                                    required: true,
                                    onChange: (e)=>setReflection(e.target.value),
                                    rows: 6,
                                    style: {
                                        width: "100%",
                                        padding: 8
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/app/practice/add/[id]/page.tsx",
                                    lineNumber: 281,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/practice/add/[id]/page.tsx",
                            lineNumber: 279,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 278,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: uploadLabelStyle,
                        children: [
                            "📷 板書写真をアップロード",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "file",
                                multiple: true,
                                accept: "image/*",
                                onChange: handleFileChange,
                                style: {
                                    display: "none"
                                },
                                disabled: uploading
                            }, void 0, false, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 293,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 291,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: boardImageWrapperStyle,
                        children: boardImages.map((img, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: boardImageContainerStyle,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginBottom: 6,
                                            fontWeight: "bold"
                                        },
                                        children: [
                                            "板書",
                                            i + 1
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 306,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: img.src,
                                        alt: img.name,
                                        style: boardImageStyle
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 307,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        "aria-label": "画像を削除",
                                        onClick: ()=>handleRemoveImage(i),
                                        style: {
                                            ...removeBtnStyle,
                                            position: "relative",
                                            top: "auto",
                                            right: "auto",
                                            marginTop: 4,
                                            width: 24,
                                            height: 24,
                                            borderRadius: 4,
                                            fontWeight: "bold"
                                        },
                                        children: "×"
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 308,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, img.name + i, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 305,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 303,
                        columnNumber: 9
                    }, this),
                    lessonPlan?.result && typeof lessonPlan.result === "object" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: infoRowStyle,
                        children: [
                            "教科書名",
                            "学年",
                            "ジャンル",
                            "単元名",
                            "授業時間数"
                        ].map((key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: infoItemStyle,
                                title: String(lessonPlan.result[key] ?? ""),
                                children: [
                                    key,
                                    ": ",
                                    lessonPlan.result[key] ?? "－"
                                ]
                            }, key, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 334,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 332,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        style: {
                            padding: 12,
                            backgroundColor: "#1976d2",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            width: "100%",
                            marginBottom: 16
                        },
                        disabled: uploading,
                        children: uploading ? "アップロード中..." : "プレビューを生成"
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 345,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/practice/add/[id]/page.tsx",
                lineNumber: 264,
                columnNumber: 7
            }, this),
            record && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                id: "practice-preview",
                style: {
                    marginTop: 24,
                    padding: 24,
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    backgroundColor: "#fff",
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: lessonPlan?.result && typeof lessonPlan.result === "object" ? safeRender(lessonPlan.result["単元名"]) : lessonTitle
                    }, void 0, false, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 378,
                        columnNumber: 11
                    }, this),
                    lessonPlan?.result && typeof lessonPlan.result === "object" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                style: {
                                    marginBottom: 16
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "授業の概要"
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 387,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "教科書名："
                                            }, void 0, false, {
                                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                lineNumber: 389,
                                                columnNumber: 19
                                            }, this),
                                            safeRender(lessonPlan.result["教科書名"])
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 388,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "学年："
                                            }, void 0, false, {
                                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                lineNumber: 393,
                                                columnNumber: 19
                                            }, this),
                                            safeRender(lessonPlan.result["学年"])
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 392,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "ジャンル："
                                            }, void 0, false, {
                                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                lineNumber: 397,
                                                columnNumber: 19
                                            }, this),
                                            safeRender(lessonPlan.result["ジャンル"])
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 396,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "授業時間数："
                                            }, void 0, false, {
                                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                lineNumber: 401,
                                                columnNumber: 19
                                            }, this),
                                            safeRender(lessonPlan.result["授業時間数"]),
                                            "時間"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 400,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "育てたい子どもの姿："
                                            }, void 0, false, {
                                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                lineNumber: 405,
                                                columnNumber: 19
                                            }, this),
                                            safeRender(lessonPlan.result["育てたい子どもの姿"])
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 404,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 386,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                style: {
                                    marginBottom: 16
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "単元の目標"
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 411,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: safeRender(lessonPlan.result["単元の目標"])
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 412,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 410,
                                columnNumber: 15
                            }, this),
                            lessonPlan.result["評価の観点"] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                style: {
                                    marginBottom: 16
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "評価の観点"
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 417,
                                        columnNumber: 19
                                    }, this),
                                    Object.entries(lessonPlan.result["評価の観点"]).map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: k
                                                }, void 0, false, {
                                                    fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                    lineNumber: 420,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    children: (Array.isArray(v) ? v : []).map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: safeRender(item)
                                                        }, i, false, {
                                                            fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                            lineNumber: 423,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                    lineNumber: 421,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, k, true, {
                                            fileName: "[project]/app/practice/add/[id]/page.tsx",
                                            lineNumber: 419,
                                            columnNumber: 21
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 416,
                                columnNumber: 17
                            }, this),
                            lessonPlan.result["言語活動の工夫"] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                style: {
                                    marginBottom: 16
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "言語活動の工夫"
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 433,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: safeRender(lessonPlan.result["言語活動の工夫"])
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 434,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 432,
                                columnNumber: 17
                            }, this),
                            lessonPlan.result["授業の流れ"] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                style: {
                                    marginBottom: 16
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "授業の流れ"
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 440,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        children: Object.entries(lessonPlan.result["授業の流れ"]).map(([key, value])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: [
                                                            key,
                                                            "："
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                        lineNumber: 444,
                                                        columnNumber: 25
                                                    }, this),
                                                    typeof value === "string" ? value : safeRender(value)
                                                ]
                                            }, key, true, {
                                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                lineNumber: 443,
                                                columnNumber: 23
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 441,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 439,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        style: {
                            marginTop: 24
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "実施記録"
                            }, void 0, false, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 455,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "実施日："
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 457,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    record.practiceDate
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 456,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "振り返り："
                                }, void 0, false, {
                                    fileName: "[project]/app/practice/add/[id]/page.tsx",
                                    lineNumber: 460,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 459,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: record.reflection
                            }, void 0, false, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 462,
                                columnNumber: 13
                            }, this),
                            record.boardImages.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 12
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "板書写真："
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 466,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: 8,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 12
                                        },
                                        children: record.boardImages.map((img, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    width: "100%"
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            marginBottom: 6,
                                                            fontWeight: "bold"
                                                        },
                                                        children: [
                                                            "板書",
                                                            i + 1
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                        lineNumber: 477,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: img.src,
                                                        alt: img.name,
                                                        style: {
                                                            width: "100%",
                                                            height: "auto",
                                                            borderRadius: 8,
                                                            border: "1px solid #ccc",
                                                            display: "block",
                                                            maxWidth: "100%"
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                        lineNumber: 480,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, img.name + i, true, {
                                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                                lineNumber: 476,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                                        lineNumber: 467,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/practice/add/[id]/page.tsx",
                                lineNumber: 465,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/practice/add/[id]/page.tsx",
                        lineNumber: 454,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/practice/add/[id]/page.tsx",
                lineNumber: 365,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleSaveLocal,
                style: saveBtnStyle,
                disabled: uploading,
                children: "💾 ローカルに保存して実践履歴へ"
            }, void 0, false, {
                fileName: "[project]/app/practice/add/[id]/page.tsx",
                lineNumber: 502,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/practice/add/[id]/page.tsx",
        lineNumber: 237,
        columnNumber: 5
    }, this);
}
_s(PracticeAddPage, "E5lQbqtT1dbhsimW4Gh+gLz9Rsc=", false, function() {
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

//# sourceMappingURL=_abb5b686._.js.map