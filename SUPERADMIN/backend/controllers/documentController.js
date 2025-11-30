const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// 1. API: GET /api/documents (Lấy danh sách tài liệu)
exports.getDocuments = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "tailieu" ORDER BY ngay_tai_len DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách tài liệu' });
    }
};

// 2. API: POST /api/documents (Upload tài liệu)
exports.uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const { ten_tai_lieu, loai_tai_lieu, ma_chi_bo } = req.body;
        const userId = req.user.id;

        if (!file) {
            return res.status(400).json({ message: 'Vui lòng chọn file' });
        }

        // Upload lên Drive
        const driveData = await uploadFileToDrive(file);

        // Lưu vào DB
        const sql = `
            INSERT INTO "tailieu" (ten_tai_lieu, loai_tai_lieu, duong_dan, nguoi_tai_len, ma_chi_bo)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const values = [ten_tai_lieu, loai_tai_lieu, driveData.webViewLink, userId, ma_chi_bo || null];
        const newDoc = await db.query(sql, values);

        res.status(201).json({
            message: 'Upload thành công',
            document: newDoc.rows[0],
            driveId: driveData.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload tài liệu' });
    }
};

// 3. API: DELETE /api/documents/:id (Xóa tài liệu)
exports.deleteDocument = async (req, res) => {
    const { id } = req.params;

    try {
        // Lấy thông tin tài liệu để lấy link
        const result = await db.query('SELECT * FROM "tailieu" WHERE ma_tai_lieu = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tài liệu không tồn tại' });
        }

        const document = result.rows[0];
        const driveLink = document.duong_dan;

        // Trích xuất File ID từ Link (Regex)
        const fileIdMatch = driveLink.match(/\/d\/(.*?)\//);
        
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            // Xóa trên Drive
            await deleteFileFromDrive(fileId);
        }

        // Xóa trong DB
        await db.query('DELETE FROM "tailieu" WHERE ma_tai_lieu = $1', [id]);

        res.json({ message: 'Đã xóa tài liệu thành công' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa tài liệu' });
    }
};