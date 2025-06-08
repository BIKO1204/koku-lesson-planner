"use client";

// app/lesson/[id]/page.tsx

import FirebaseSaveButton from "../../../components/FirebaseSaveButton";
import SaveButtons         from "../../../components/SaveButtons";

export default function LessonPage({ params }: { params: { id: string } }) {
  const lessonData = {
    id: params.id,
    title: "サンプルレッスン",
    content: "ここに本文…",
    // 必要に応じて他のフィールドを追加
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        レッスン編集: {lessonData.title}
      </h1>

      {/* 他のフォームや編集箇所 */}
      {/* … */}

      {/* 保存ボタンを横並びで配置 */}
      <div className="mt-8 flex">
        <FirebaseSaveButton data={lessonData} />
        <SaveButtons        data={lessonData} />
      </div>
    </div>
  );
}
