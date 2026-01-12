// lib/fineTune/jsonl.ts
function safeString(v: unknown) {
  if (typeof v === "string") return v;
  return JSON.stringify(v ?? "");
}

export function toJsonlLines(target: "lesson" | "practice", rows: any[]) {
  // ★例：messages形式。実際はあなたの学習設計（system/user/assistant）に合わせて調整。
  return rows.map((r) => {
    const input =
      target === "lesson"
        ? safeString(r.result ?? r.lessonPlan ?? "")
        : [
            `【教材】${r.unitName ?? ""}`,
            `【学年】${r.grade ?? ""}`,
            `【ジャンル】${r.genre ?? ""}`,
            `【振り返り】${r.reflection ?? ""}`,
          ].join("\n");

    const line = {
      messages: [
        { role: "system", content: "あなたは国語授業案作成と実践振り返り支援のアシスタントです。" },
        { role: "user", content: input },
      ],
      metadata: {
        docId: r.id,
        collection: r.coll,
        fineTuneOptIn: !!r.fineTuneOptIn,
      },
    };

    return JSON.stringify(line);
  });
}
