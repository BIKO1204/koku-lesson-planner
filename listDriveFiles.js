const { google } = require('googleapis');
const path = require('path');

async function listFiles() {
  const KEYFILEPATH = path.join(__dirname, 'serviceAccount.json');
  const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];

  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (files && files.length > 0) {
      console.log('ファイル一覧:');
      files.forEach((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('ファイルが見つかりませんでした。');
    }
  } catch (error) {
    console.error('APIエラー:', error);
  }
}

listFiles();
