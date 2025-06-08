// ファイル：app/api/drive-upload/route.ts

import { NextResponse, NextRequest } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream"; // 追記：Buffer をストリームに変換するために使う

type RequestBody = {
  fileBase64: string; // クライアント側で Base64 変換されたバイナリ
  filename: string;   // 例: "スイミー_授業案.pdf"
  mimeType: string;   // 例: "application/pdf"
};

export async function POST(request: NextRequest) {
  // 1. リクエストボディを JSON としてパース
  let body: RequestBody;
  try {
    body = await request.json();
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid JSON body", detail: e.message },
      { status: 400 }
    );
  }

  const { fileBase64, filename, mimeType } = body;

  // 2. 必須パラメータチェック
  if (!fileBase64 || !filename || !mimeType) {
    return NextResponse.json(
      { error: "fileBase64, filename, mimeType をすべて指定してください" },
      { status: 400 }
    );
  }

  // 3. 環境変数からフォルダIDを取得
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json(
      { error: "Server: GOOGLE_DRIVE_FOLDER_ID が未設定です" },
      { status: 500 }
    );
  }

  // 4. サービスアカウント JSON を環境変数からパース
  const saJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!saJsonString) {
    return NextResponse.json(
      { error: "Server: GOOGLE_APPLICATION_CREDENTIALS_JSON が未設定です" },
      { status: 500 }
    );
  }

  let authClient;
  try {
    const saJson = JSON.parse(saJsonString as string);
    authClient = new google.auth.GoogleAuth({
      credentials: saJson,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
  } catch (e: any) {
    console.error("サービスアカウント認証エラー:", e);
    return NextResponse.json(
      { error: "Server: サービスアカウント JSON のパースに失敗しました", detail: e.message },
      { status: 500 }
    );
  }

  // 5. Drive クライアント初期化
  const drive = google.drive({
    version: "v3",
    auth: authClient,
  });

  // 6. Base64 を Buffer に変換
  let buffer: Buffer;
  try {
    buffer = Buffer.from(fileBase64, "base64");
  } catch (e: any) {
    return NextResponse.json(
      { error: "Base64→Buffer 変換に失敗しました", detail: e.message },
      { status: 400 }
    );
  }

  // 7. Buffer を Readable ストリームに変換
  const stream = Readable.from(buffer);

  // 8. Drive API でファイルをアップロード
  try {
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType: mimeType,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: stream, // ← Buffer の代わりに Readable ストリームを渡す
      },
      fields: "id, name, webViewLink",
    });

    return NextResponse.json({
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
    });
  } catch (e: any) {
    console.error("Drive アップロードエラー:", e);
    return NextResponse.json(
      { error: "Drive アップロードに失敗しました", detail: e.message },
      { status: 500 }
    );
  }
}
