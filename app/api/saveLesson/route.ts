import { NextResponse, NextRequest } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { google } from "googleapis";
import type { JWTInput } from "google-auth-library";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

// 環境変数からサービスアカウント情報を取得
const serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

// 環境変数チェック
const bucketName    = process.env.FIREBASE_STORAGE_BUCKET!;
const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
if (!bucketName)    throw new Error("Missing env: FIREBASE_STORAGE_BUCKET");
if (!driveFolderId) throw new Error("Missing env: GOOGLE_DRIVE_FOLDER_ID");

// Firebase Admin SDK 初期化
const adminApp = !getApps().length
  ? initializeApp({ credential: cert(serviceAccountJson), storageBucket: bucketName })
  : getApps()[0];
const bucket = getStorage(adminApp).bucket();

// Google Drive API 初期化
const auth  = new google.auth.GoogleAuth({
  credentials: serviceAccountJson as unknown as JWTInput,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as {
      unit: string;
      unitGoal: string;
      evaluationPoints: { knowledge: string[]; thinking: string[]; attitude: string[] };
      childVision: string;
      lessonPlanList: string[];
      languageActivities: string;
    };

    const filename = `lesson-${Date.now()}.pdf`;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    let page = pdfDoc.addPage([595.28, 841.89]);
    const fontPath = path.join(process.cwd(), "fonts", "NotoSerifCJKjp-Regular.otf");
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font not found: ${fontPath}`);
    }
    const fontBytes = fs.readFileSync(fontPath);
    const font      = await pdfDoc.embedFont(fontBytes);

    const margin      = 40;
    const lineGap     = 4;
    const titleSize   = 20;
    const headingSize = 14;
    const textSize    = 12;
    const maxWidth    = page.getWidth() - margin * 2;
    let y             = page.getHeight() - margin;

    const drawWrapped = (text: string) => {
      let line = "";
      for (const ch of text) {
        const test = line + ch;
        if (font.widthOfTextAtSize(test, textSize) > maxWidth) {
          page.drawText(line, { x: margin + 10, y, size: textSize, font });
          y -= textSize + lineGap;
          line = ch;
          if (y < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y    = page.getHeight() - margin;
          }
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x: margin + 10, y, size: textSize, font });
        y -= textSize + lineGap;
      }
    };

    page.drawText("レッスンプラン", { x: margin, y, size: titleSize, font });
    y -= titleSize + 16;

    const sections: [string, string][] = [
      ["■ 単元名",               data.unit],
      ["■ 単元の目標",           data.unitGoal],
      ["① 知識・技能",          data.evaluationPoints.knowledge.join("、 ")],
      ["② 思考・判断・表現",     data.evaluationPoints.thinking.join("、 ")],
      ["③ 態度",                data.evaluationPoints.attitude.join("、 ")],
      ["■ 育てたい子どもの姿",   data.childVision],
      ["■ 授業の展開",          data.lessonPlanList.map((t,i)=>`${i+1}時間目：${t}`).join("\n")],
      ["■ 言語活動の工夫",       data.languageActivities],
    ];

    for (const [label, content] of sections) {
      page.drawText(label, { x: margin, y, size: headingSize, font });
      y -= headingSize + 6;
      drawWrapped(content);
      y -= 8;
    }

    const pdfBytes  = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    await bucket.file(`lessons/${filename}`).save(pdfBuffer, {
      contentType: "application/pdf",
    });

    const stream = Readable.from(pdfBuffer);
    const driveRes = await drive.files.create({
      requestBody: { name: filename, mimeType: "application/pdf", parents: [driveFolderId] },
      media:       { mimeType: "application/pdf", body: stream },
      fields:      "id",
    });

    const fileId    = driveRes.data.id!;
    const driveLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

    return NextResponse.json({ driveLink });

  } catch (err: any) {
    console.error("save-lesson error:", err);
    return NextResponse.json(
      { error: err.message || "保存に失敗しました" },
      { status: 500 }
    );
  }
}
