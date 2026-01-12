// /lib/collections.ts
export type FineTuneTarget = "plan" | "practice";

/** 授業案（lesson_plans_*） */
export const LESSON_PLAN_COLLECTIONS = [
  "lesson_plans_reading",
  "lesson_plans_writing",
  "lesson_plans_discussion",
  "lesson_plans_language_activity",
] as const;

export type LessonPlanCollection = (typeof LESSON_PLAN_COLLECTIONS)[number];

/** 実践記録（practiceRecords_*） */
export const PRACTICE_RECORD_COLLECTIONS = [
  "practiceRecords_reading",
  "practiceRecords_writing",
  "practiceRecords_discussion",
  "practiceRecords_language_activity",
] as const;

export type PracticeRecordCollection = (typeof PRACTICE_RECORD_COLLECTIONS)[number];

/** 実践下書き（クラウド） */
export const PRACTICE_DRAFT_COLLECTION = "practice_record_drafts" as const;

/** lesson_plans_* → practiceRecords_* */
export const toPracticeFromLesson = (lessonModelType: string): PracticeRecordCollection | string =>
  lessonModelType.replace("lesson_plans_", "practiceRecords_");

/** practiceRecords_* → lesson_plans_* */
export const toLessonFromPractice = (practiceCollection: string): LessonPlanCollection | string =>
  practiceCollection.replace("practiceRecords_", "lesson_plans_");

/** URLクエリ等の "reading" / "writing" を正規化して practiceRecords_* に寄せる */
export function normalizeToPracticeCollection(param?: string | null): PracticeRecordCollection | undefined {
  if (!param) return undefined;

  if (param.startsWith("practiceRecords_")) return param as PracticeRecordCollection;
  if (param.startsWith("lesson_plans_")) return param.replace("lesson_plans_", "practiceRecords_") as PracticeRecordCollection;

  const short = param.replace(/^(\?|#).*/, "");
  if (["reading", "writing", "discussion", "language_activity"].includes(short)) {
    return `practiceRecords_${short}` as PracticeRecordCollection;
  }
  return undefined;
}

/** fine-tune 用：target から対象コレクション配列を返す */
export function getTargetCollections(target: FineTuneTarget) {
  return target === "plan" ? [...LESSON_PLAN_COLLECTIONS] : [...PRACTICE_RECORD_COLLECTIONS];
}
