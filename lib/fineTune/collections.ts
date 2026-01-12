// lib/fineTune/collections.ts
export type FineTuneTarget = "plan" | "practice" | "model";

export function normalizeFineTuneTarget(raw: string | null | undefined): FineTuneTarget | null {
  const v = String(raw || "").toLowerCase();
  if (v === "practice") return "practice";
  if (v === "model") return "model";
  // 互換：lesson -> plan
  if (v === "plan" || v === "lesson") return "plan";
  return null;
}

// ★ export / summary / query で使う「対象コレクション群」をここに集約
export const collectionsByTarget: Record<FineTuneTarget, string[]> = {
  plan: [
    "lesson_plans_reading",
    "lesson_plans_writing",
    "lesson_plans_discussion",
    "lesson_plans_language_activity",
  ],
  practice: [
    "practiceRecords_reading",
    "practiceRecords_writing",
    "practiceRecords_discussion",
    "practiceRecords_language_activity",
  ],
  model: [
    "educationModels", // ← あなたの実体に合わせて
    // "educationModelsHistory" などを含めるならここへ
  ],
};
