// lib/fineTune/jsonl.ts
import type { FineTuneTarget } from "@/lib/fineTune/collections";

export function toJsonlLines(target: FineTuneTarget, rows: any[]) {
  // ★ ここはあなたの学習フォーマットに合わせる（messages形式など）
  return rows.map((r) => {
    const payload =
      target === "plan"
        ? buildPlanExample(r)
        : target === "practice"
        ? buildPracticeExample(r)
        : buildModelExample(r);

    return JSON.stringify(payload);
  });
}

function buildPlanExample(r: any) {
  return {
    // 例：授業案の result を text にする等
    id: r.id,
    collection: r.collection,
    input: r.prompt ?? "",
    output: r.result ?? "",
  };
}
function buildPracticeExample(r: any) {
  return {
    id: r.id,
    collection: r.collection,
    input: r.lessonTitle ?? "",
    output: r.reflection ?? "",
  };
}
function buildModelExample(r: any) {
  return {
    id: r.id,
    collection: r.collection,
    input: r.name ?? "",
    output: r.philosophy ?? "",
  };
}
