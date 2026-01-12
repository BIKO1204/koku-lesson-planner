export type FineTuneTarget = "lesson" | "practice";
export type FineTuneScope = "all" | "mine";

export type FineTuneRow = {
  id: string;
  coll: string;
  ownerUid?: string;
  fineTuneOptIn?: boolean;

  // lesson/practice共通で使いやすい最小メタ
  grade?: string;
  genre?: string;
  unitName?: string;

  // 学習に使う本文（最低限でOK）
  lessonResult?: unknown;     // lesson の result
  reflection?: string;        // practice の reflection
  createdAt?: any;
};
