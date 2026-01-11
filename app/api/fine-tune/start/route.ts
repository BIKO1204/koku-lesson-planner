// app/api/fine-tune/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function getBearerToken(req: NextRequest) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    // 本人確認
    await getAdminAuth().verifyIdToken(token);

    const body = await req.json().catch(() => null);
    const jsonlText = typeof body?.jsonlText === "string" ? body.jsonlText : "";
    if (!jsonlText.trim()) {
      return NextResponse.json({ error: "jsonlText is required" }, { status: 400 });
    }

    const baseModel = process.env.FT_BASE_MODEL || "gpt-4o-mini-2024-07-18";

    // Node.js (Next route) は File が使える前提（Nextのruntime=nodejs）
    const file = new File([jsonlText], "train.jsonl", { type: "application/jsonl" });

    const uploaded = await openai.files.create({
      file,
      purpose: "fine-tune",
    });

    const job = await openai.fineTuning.jobs.create({
      model: baseModel,
      training_file: uploaded.id,
    });

    return NextResponse.json({
      training_file: uploaded.id,
      job_id: job.id,
      status: job.status,
      base_model: baseModel,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Start failed" }, { status: 500 });
  }
}
