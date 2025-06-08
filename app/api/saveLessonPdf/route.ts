// app/api/saveLessonPdf/route.ts

import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { google } from "googleapis";
import type { JWTInput } from "google-auth-library";
import { Readable } from "stream";

// 環境変数からサービスアカウントを取得
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

const bucketName    = process.env.FIREBASE_STORAGE_BUCKET!;
const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
if (!bucketName)    throw new Error("Missing env: FIREBASE_STORAGE_BUCKET");
if (!driveFolderId) throw new Error("Missing env: GOOGLE_DRIVE_FOLDER_ID");

const adminApp = !getApps().length
  ? initializeApp({ credential: cert(serviceAccount), storageBucket: bucketName })
  : getApps()[0];
const bucket = getStorage(adminApp).bucket();

const auth  = new google.auth.GoogleAuth({
  credentials: serviceAccount as unknown as JWTInput,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

export async function POST(req: Request) {
  try {
    // 1) FormData を取得
    const formData = await req.formData();
    const fileBlob = formData.get("file");
    if (!(fileBlob instanceof Blob)) {
      throw new Error("file フィールドが見つかりません");
    }

    // 2) Blob → Buffer
    const arrayBuf = await fileBlob.arrayBuffer();
    const buffer   = Buffer.from(arrayBuf);

    // 3) ファイル名を決定
    const filename = fileBlob instanceof File
      ? fileBlob.name
      : `lessonPdf-${Date.now()}.pdf`;

    // 4) Firebase Storage に保存
    await bucket.file(`lessons/${filename}`).save(buffer, {
      contentType: "application/pdf",
    });

    // 5) Google Drive にアップロード
    const stream   = Readable.from(buffer);
    const driveRes = await drive.files.create({
      requestBody: {
        name:     filename,
        mimeType: "application/pdf",
        parents:  [driveFolderId],
      },
      media: {
        mimeType: "application/pdf",
        body:     stream,
      },
      fields: "id",
    });

    const fileId    = driveRes.data.id!;
    const driveLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    return NextResponse.json({ driveLink });
  } catch (err: any) {
    console.error("saveLessonPdf error:", err);
    return NextResponse.json(
      { error: err.message || "PDF保存に失敗しました" },
      { status: 500 }
    );
  }
}
