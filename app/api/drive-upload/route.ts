import { NextResponse, NextRequest } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

type RequestBody = {
  fileBase64: string; // Base64エンコード済みファイルデータ
  filename: string;   // 例: "lesson_plan.pdf"
  mimeType: string;   // 例: "application/pdf"
  accessToken: string; // NextAuthから受け取るユーザーのアクセストークン
};

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid JSON body", detail: e.message },
      { status: 400 }
    );
  }

  const { fileBase64, filename, mimeType, accessToken } = body;

  if (!fileBase64 || !filename || !mimeType || !accessToken) {
    return NextResponse.json(
      {
        error: "fileBase64, filename, mimeType, accessToken をすべて指定してください",
      },
      { status: 400 }
    );
  }

  // OAuth2クライアントをアクセストークンで初期化
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Base64 → Buffer に変換
  let buffer: Buffer;
  try {
    buffer = Buffer.from(fileBase64, "base64");
  } catch (e: any) {
    return NextResponse.json(
      { error: "Base64→Buffer変換に失敗しました", detail: e.message },
      { status: 400 }
    );
  }

  try {
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType,
        // parentsを指定しなければマイドライブ直下に保存されます
      },
      media: {
        mimeType,
        body: bufferToStream(buffer),
      },
      fields: "id, name, webViewLink",
    });

    return NextResponse.json({
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Driveアップロード失敗", detail: e.message },
      { status: 500 }
    );
  }
}
