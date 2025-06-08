"use client";

import React, { Suspense } from "react";
import ClientPlan from "./ClientPlan";

export default function PlanPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ClientPlan />
    </Suspense>
  );
}
