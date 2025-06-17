import { getSession } from "next-auth/react";

/**
 * Googleドライブのマイドライブ直下にファイルをアップロードする関数
 * 
 * @param blob - アップロードするファイルのBlobデータ
 * @param filename - 保存するファイル名
 * @param mimeType - ファイルのMIMEタイプ
 * @returns アップロードしたファイルのID
 */
export async function uploadToDrive(
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<string> {
  const session = await getSession();
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) {
    throw new Error("Drive 用のアクセストークンが取得できませんでした");
  }

  const metadata = {
    name: filename,
    mimeType,
    // parents指定なし＝マイドライブ直下に保存
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", blob);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Driveアップロード失敗:", errorText);
    throw new Error("Drive へのファイルアップロードに失敗しました");
  }

  const { id } = await res.json();
  return id;
}
