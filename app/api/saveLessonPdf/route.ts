// app/api/saveLessonPdf/route.ts

import { NextResponse, NextRequest } from "next/server";
import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { google } from "googleapis";
import type { JWTInput } from "google-auth-library";
import { Readable } from "stream";

// serviceAccount.jsonをimport（パスは環境に合わせて調整してください）
import serviceAccountJson from "../../../serviceAccount.json";

// ServiceAccount型にキャスト
const serviceAccount = serviceAccountJson as ServiceAccount;

const bucketName    = process.env.FIREBASE_STORAGE_BUCKET!;
const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
if (!bucketName)    throw new Error("Missing env: FIREBASE_STORAGE_BUCKET");
if (!driveFolderId) throw new Error("Missing env: GOOGLE_DRIVE_FOLDER_ID");

const adminApp = !getApps().length
  ? initializeApp({ credential: cert(serviceAccount), storageBucket: bucketName })
  : getApps()[0];

// バケット名を明示的に指定
const bucket = getStorage(adminApp).bucket(bucketName);

const auth  = new google.auth.GoogleAuth({
  credentials: serviceAccount as unknown as JWTInput,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileBlob = formData.get("file");
    if (!(fileBlob instanceof Blob)) {
      throw new Error("file フィールドが見つかりません");
    }

    const arrayBuf = await fileBlob.arrayBuffer();
    const buffer   = Buffer.from(arrayBuf);

    const filename = fileBlob instanceof File
      ? fileBlob.name
      : `lessonPdf-${Date.now()}.pdf`;

    await bucket.file(`lessons/${filename}`).save(buffer, {
      contentType: "application/pdf",
    });

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
