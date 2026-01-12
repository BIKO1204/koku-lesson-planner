// lib/fineTune/collections.ts
export const LESSON_PLAN_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_writing",
  "lesson_plans_discussion",
  "lesson_plans_language_activity",
] as const;

export const PRACTICE_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_writing",
  "practiceRecords_discussion",
  "practiceRecords_language_activity",
] as const;

export type FineTuneTarget = "lesson" | "practice";

export function collectionsByTarget(target: FineTuneTarget) {
  return target === "lesson" ? [...LESSON_PLAN_COLLECTIONS] : [...PRACTICE_COLLECTIONS];
}
