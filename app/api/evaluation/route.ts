import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade");
  const genre = searchParams.get("genre");

  if (!grade || !genre) {
    return NextResponse.json({ error: "grade and genre required" }, { status: 400 });
  }

  const filePath = path.resolve(process.cwd(), "public", "templates.csv");
  const csvData = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(csvData, { header: true });
  const data = parsed.data as any[];

  const filtered = data.filter(
    (r) =>
      r.教科 === "国語" &&
      r.学年 === grade &&
      r.ジャンル === genre
  );

  const grouped = {
    knowledge: filtered.filter((r) => r.観点 === "knowledge").map((r) => r.内容),
    thinking: filtered.filter((r) => r.観点 === "thinking").map((r) => r.内容),
    attitude: filtered.filter((r) => r.観点 === "attitude").map((r) => r.内容),
  };

  return NextResponse.json(grouped);
}
