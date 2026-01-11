// app/api/fine-tune/status/route.ts
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

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    await getAdminAuth().verifyIdToken(token);

    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

    const job = await openai.fineTuning.jobs.retrieve(jobId);

    return NextResponse.json({
      id: job.id,
      status: job.status,
      fine_tuned_model: (job as any).fine_tuned_model ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Status failed" }, { status: 500 });
  }
}
