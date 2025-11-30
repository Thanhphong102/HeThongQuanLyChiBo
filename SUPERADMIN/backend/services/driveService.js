const { google } = require('googleapis');
const stream = require('stream');
require('dotenv').config();

// 1. Khởi tạo OAuth2 Client từ thông tin trong .env
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// 2. Thiết lập Credentials (quan trọng nhất là Refresh Token)
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// 3. Khởi tạo Google Drive với auth là oauth2Client
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

/**
 * Upload file lên Google Drive (Sử dụng OAuth2)
 */
const uploadFileToDrive = async (fileObject) => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);

  try {
    const response = await drive.files.create({
      media: {
        mimeType: fileObject.mimetype,
        body: bufferStream,
      },
      requestBody: {
        name: fileObject.originalname,
        // Parents: ID thư mục đích (Lấy từ .env)
        parents: [process.env.DRIVE_FOLDER_ID],
      },
      fields: 'id, name, webViewLink, webContentLink',
    });

    // Cấp quyền Public (Reader - Anyone)
    // Lưu ý: Với OAuth2 (tài khoản cá nhân), quyền này hoạt động ổn định hơn Service Account
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Lỗi upload Drive:', error.message);
    throw error;
  }
};

/**
 * Xóa file trên Google Drive
 * @param {string} fileId - ID của file trên Drive
 */
const deleteFileFromDrive = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    console.log(`Đã xóa file ${fileId} trên Drive`);
  } catch (error) {
    console.error('Lỗi xóa file trên Drive:', error.message);
    // Không ném lỗi (throw) để code vẫn chạy tiếp xuống phần xóa DB
    // Nếu file trên Drive đã mất từ trước thì vẫn cho phép xóa trong DB
  }
};

module.exports = { uploadFileToDrive };
module.exports = { uploadFileToDrive, deleteFileFromDrive };