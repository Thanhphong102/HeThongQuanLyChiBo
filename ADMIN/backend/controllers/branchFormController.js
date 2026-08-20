const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// ─── FOLDER APIs ─────────────────────────────────────────────────────────────

// GET /branch-forms/folders — Lấy danh sách thư mục của chi bộ
exports.getFolders = async (req, res) => {
    const branchId = req.user.branchId;
    try {
        const sql = `
            SELECT f.*,
                   d.ho_ten      AS ten_nguoi_tao,
                   COUNT(b.ma_bieu_mau)::int AS so_luong_file,
                   MAX(b.ngay_tao) AS lan_cap_nhat_cuoi
            FROM   bieumau_folder f
            LEFT JOIN bieumau b ON b.ma_folder = f.ma_folder
            LEFT JOIN dangvien d ON d.ma_dang_vien = f.nguoi_tao
            WHERE  f.ma_chi_bo = $1
            GROUP  BY f.ma_folder, d.ho_ten
            ORDER  BY f.ngay_tao DESC
        `;
        const result = await db.query(sql, [branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách thư mục' });
    }
};

// POST /branch-forms/folders — Tạo thư mục mới
exports.createFolder = async (req, res) => {
    const branchId = req.user.branchId;
    const userId   = req.user.id;
    const { ten_folder, mo_ta } = req.body;

    if (!ten_folder?.trim()) {
        return res.status(400).json({ message: 'Tên thư mục không được để trống' });
    }

    try {
        const result = await db.query(
            `INSERT INTO bieumau_folder (ten_folder, mo_ta, ma_chi_bo, nguoi_tao)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [ten_folder.trim(), mo_ta || null, branchId, userId]
        );
        res.status(201).json({ message: 'Tạo thư mục thành công', folder: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo thư mục' });
    }
};

// PUT /branch-forms/folders/:id — Đổi tên thư mục
exports.updateFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const { ten_folder, mo_ta } = req.body;

    try {
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Thư mục không tồn tại hoặc không có quyền sửa' });
        }

        const result = await db.query(
            `UPDATE bieumau_folder SET ten_folder = $1, mo_ta = $2, ngay_cap_nhat = NOW()
             WHERE ma_folder = $3 RETURNING *`,
            [ten_folder?.trim() || check.rows[0].ten_folder, mo_ta ?? check.rows[0].mo_ta, id]
        );
        res.json({ message: 'Cập nhật thư mục thành công', folder: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật thư mục' });
    }
};

// DELETE /branch-forms/folders/:id — Xóa thư mục (và tất cả file bên trong)
exports.deleteFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Thư mục không tồn tại hoặc không có quyền xóa' });
        }

        // Lấy tất cả file trong thư mục để xóa trên Drive
        const files = await db.query(
            'SELECT * FROM bieumau WHERE ma_folder = $1',
            [id]
        );

        // Xóa từng file trên Google Drive
        for (const file of files.rows) {
            if (file.ma_file_drive) {
                try { await deleteFileFromDrive(file.ma_file_drive); } catch (_) {}
            }
        }

        // Xóa record file trong DB
        await db.query('DELETE FROM bieumau WHERE ma_folder = $1', [id]);

        // Xóa thư mục
        await db.query('DELETE FROM bieumau_folder WHERE ma_folder = $1', [id]);

        res.json({ message: 'Đã xóa thư mục và tất cả file bên trong' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa thư mục' });
    }
};

// GET /branch-forms/folders/:id/files — Lấy danh sách file trong thư mục
exports.getFilesInFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        // Kiểm tra thư mục thuộc chi bộ
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Thư mục không tồn tại' });
        }

        const sql = `
            SELECT b.*, d.ho_ten AS nguoi_dang
            FROM   bieumau b
            LEFT JOIN dangvien d ON d.ma_dang_vien = b.nguoi_tai_len
            WHERE  b.ma_folder = $1
            ORDER  BY b.ngay_tao DESC
        `;
        const result = await db.query(sql, [id]);
        res.json({ folder: check.rows[0], files: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách file' });
    }
};

// POST /branch-forms/folders/:id/upload — Upload nhiều file vào thư mục
exports.uploadFilesToFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const userId   = req.user.id;
    const files    = req.files; // multer array

    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 file' });
    }

    try {
        // Kiểm tra thư mục thuộc chi bộ
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Thư mục không tồn tại hoặc không có quyền' });
        }

        const uploaded = [];
        const errors   = [];

        for (const file of files) {
            try {
                const driveData = await uploadFileToDrive(file);
                const tieu_de   = req.body[`tieu_de_${file.originalname}`] || file.originalname;

                const result = await db.query(
                    `INSERT INTO bieumau (tieu_de, duong_dan_file, ma_file_drive, ma_chi_bo, nguoi_tai_len, ma_folder)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [tieu_de, driveData.webViewLink, driveData.id, branchId, userId, id]
                );
                uploaded.push(result.rows[0]);
            } catch (err) {
                console.error(`Lỗi upload file ${file.originalname}:`, err);
                errors.push(file.originalname);
            }
        }

        // Cập nhật ngày cap nhật thư mục
        await db.query(
            'UPDATE bieumau_folder SET ngay_cap_nhat = NOW() WHERE ma_folder = $1',
            [id]
        );

        res.status(201).json({
            message: `Đã tải lên ${uploaded.length} file thành công${errors.length > 0 ? `, ${errors.length} file thất bại` : ''}`,
            uploaded,
            errors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload file' });
    }
};

// ─── FILE APIs (giữ nguyên) ───────────────────────────────────────────────────

// GET /branch-forms — Lấy toàn bộ biểu mẫu (không có folder) của chi bộ
exports.getForms = async (req, res) => {
    const branchId = req.user.branchId;
    try {
        const sql = `
            SELECT f.*, d.ho_ten as nguoi_dang
            FROM   "bieumau" f
            LEFT JOIN "dangvien" d ON f.nguoi_tai_len = d.ma_dang_vien
            WHERE  f.ma_chi_bo = $1 AND (f.ma_folder IS NULL)
            ORDER  BY f.ngay_tao DESC
        `;
        const result = await db.query(sql, [branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách biểu mẫu' });
    }
};

// POST /branch-forms — Upload biểu mẫu lẻ (không trong folder)
exports.uploadForm = async (req, res) => {
    const branchId = req.user.branchId;
    const userId   = req.user.id;
    const { tieu_de } = req.body;
    const file = req.file;

    if (!tieu_de || !file) {
        return res.status(400).json({ message: 'Vui lòng nhập tên và chọn file' });
    }

    try {
        const driveData = await uploadFileToDrive(file);
        const sql = `
            INSERT INTO "bieumau" (tieu_de, duong_dan_file, ma_file_drive, ma_chi_bo, nguoi_tai_len)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const result = await db.query(sql, [
            tieu_de, driveData.webViewLink, driveData.id, branchId, userId
        ]);
        res.status(201).json({ message: 'Tải lên biểu mẫu thành công', form: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload biểu mẫu' });
    }
};

// DELETE /branch-forms/:id — Xóa 1 file biểu mẫu
exports.deleteForm = async (req, res) => {
    const { id: ma_bieu_mau } = req.params;
    const branchId = req.user.branchId;

    try {
        const check = await db.query(
            'SELECT * FROM "bieumau" WHERE ma_bieu_mau = $1 AND ma_chi_bo = $2',
            [ma_bieu_mau, branchId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Biểu mẫu không tồn tại hoặc không có quyền xóa' });
        }

        const file = check.rows[0];
        if (file.ma_file_drive) {
            try { await deleteFileFromDrive(file.ma_file_drive); } catch (_) {}
        }
        await db.query('DELETE FROM "bieumau" WHERE ma_bieu_mau = $1', [ma_bieu_mau]);

        // Cập nhật ngày thư mục nếu file thuộc folder
        if (file.ma_folder) {
            await db.query('UPDATE bieumau_folder SET ngay_cap_nhat = NOW() WHERE ma_folder = $1', [file.ma_folder]);
        }

        res.json({ message: 'Đã xóa biểu mẫu' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa biểu mẫu' });
    }
};