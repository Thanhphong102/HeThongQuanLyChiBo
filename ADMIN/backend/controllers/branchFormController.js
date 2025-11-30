const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// 1. GET: Lấy danh sách biểu mẫu (Chỉ lấy của chi bộ mình)
exports.getForms = async (req, res) => {
    const branchId = req.user.branchId;

    try {
        const sql = `
            SELECT f.*, d.ho_ten as nguoi_dang
            FROM "forms" f
            LEFT JOIN "dangvien" d ON f.uploaded_by = d.ma_dang_vien
            WHERE f.party_cell_id = $1
            ORDER BY f.created_at DESC
        `;
        const result = await db.query(sql, [branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách biểu mẫu' });
    }
};

// 2. POST: Upload biểu mẫu mới
exports.uploadForm = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
        return res.status(400).json({ message: 'Vui lòng nhập tên và chọn file' });
    }

    try {
        // Upload lên Google Drive (Dùng chung service cũ)
        const driveData = await uploadFileToDrive(file);
        
        const sql = `
            INSERT INTO "forms" (title, file_url, drive_file_id, party_cell_id, uploaded_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const result = await db.query(sql, [
            title, 
            driveData.webViewLink, 
            driveData.id, 
            branchId, 
            userId
        ]);

        res.status(201).json({ 
            message: 'Tải lên biểu mẫu thành công', 
            form: result.rows[0] 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload biểu mẫu' });
    }
};

// 3. DELETE: Xóa biểu mẫu
exports.deleteForm = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        // Kiểm tra quyền sở hữu (Chỉ xóa nếu thuộc chi bộ mình)
        const check = await db.query('SELECT * FROM "forms" WHERE id = $1 AND party_cell_id = $2', [id, branchId]);
        
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Biểu mẫu không tồn tại hoặc không có quyền xóa' });
        }

        const file = check.rows[0];

        // Xóa trên Drive trước
        if (file.drive_file_id) {
            await deleteFileFromDrive(file.drive_file_id);
        }

        // Xóa trong DB
        await db.query('DELETE FROM "forms" WHERE id = $1', [id]);

        res.json({ message: 'Đã xóa biểu mẫu' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa biểu mẫu' });
    }
};  