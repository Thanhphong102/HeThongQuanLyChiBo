const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// ─── HELPER ──────────────────────────────────────────────────────────────────

// Lấy toàn bộ subfolder IDs đệ quy (để xóa cả cây thư mục con)
async function getAllDescendantFolderIds(folderId) {
    const ids = [];
    const queue = [folderId];
    while (queue.length > 0) {
        const current = queue.shift();
        ids.push(current);
        const children = await db.query(
            'SELECT ma_folder FROM bieumau_folder WHERE parent_folder_id = $1',
            [current]
        );
        for (const c of children.rows) queue.push(c.ma_folder);
    }
    return ids;
}

// ─── FOLDER APIs ─────────────────────────────────────────────────────────────

/**
 * GET /branch-forms/folders?parent_id=<id>
 * Lấy danh sách thư mục con trong 1 thư mục cha (hoặc root nếu không có parent_id)
 */
exports.getFolders = async (req, res) => {
    const branchId = req.user.branchId;
    const parentId = req.query.parent_id ? parseInt(req.query.parent_id) : null;

    try {
        const sql = `
            SELECT f.*,
                   d.ho_ten      AS ten_nguoi_tao,
                   COUNT(DISTINCT b.ma_bieu_mau)::int AS so_luong_file,
                   COUNT(DISTINCT sub.ma_folder)::int  AS so_luong_thu_muc_con,
                   MAX(b.ngay_tao) AS lan_cap_nhat_cuoi
            FROM   bieumau_folder f
            LEFT JOIN bieumau       b   ON b.ma_folder = f.ma_folder
            LEFT JOIN bieumau_folder sub ON sub.parent_folder_id = f.ma_folder
            LEFT JOIN dangvien      d   ON d.ma_dang_vien = f.nguoi_tao
            WHERE  f.ma_chi_bo = $1
              AND  (${parentId === null ? 'f.parent_folder_id IS NULL' : 'f.parent_folder_id = $2'})
            GROUP  BY f.ma_folder, d.ho_ten
            ORDER  BY f.ngay_tao DESC
        `;
        const params = parentId === null ? [branchId] : [branchId, parentId];
        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách thư mục' });
    }
};

/**
 * GET /branch-forms/folders/:id/info
 * Lấy thông tin 1 thư mục (để render breadcrumb)
 */
exports.getFolderInfo = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    try {
        const result = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: 'Thư mục không tồn tại' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy thông tin thư mục' });
    }
};

/**
 * GET /branch-forms/folders/:id/breadcrumb
 * Trả về đường dẫn từ root đến thư mục hiện tại
 */
exports.getFolderBreadcrumb = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    try {
        // Recursive CTE để lấy đường dẫn
        const sql = `
            WITH RECURSIVE path AS (
                SELECT ma_folder, ten_folder, parent_folder_id, 1 AS depth
                FROM bieumau_folder
                WHERE ma_folder = $1 AND ma_chi_bo = $2
                UNION ALL
                SELECT f.ma_folder, f.ten_folder, f.parent_folder_id, p.depth + 1
                FROM bieumau_folder f
                JOIN path p ON f.ma_folder = p.parent_folder_id
            )
            SELECT * FROM path ORDER BY depth DESC
        `;
        const result = await db.query(sql, [id, branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy breadcrumb' });
    }
};

/**
 * POST /branch-forms/folders
 * Tạo thư mục mới (có thể là con của folder khác qua parent_folder_id)
 */
exports.createFolder = async (req, res) => {
    const branchId = req.user.branchId;
    const userId   = req.user.id;
    const { ten_folder, mo_ta, parent_folder_id } = req.body;

    if (!ten_folder?.trim()) {
        return res.status(400).json({ message: 'Tên thư mục không được để trống' });
    }

    // Kiểm tra folder cha thuộc chi bộ (nếu có)
    if (parent_folder_id) {
        const check = await db.query(
            'SELECT ma_folder FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [parent_folder_id, branchId]
        );
        if (check.rows.length === 0)
            return res.status(404).json({ message: 'Thư mục cha không tồn tại' });
    }

    try {
        const result = await db.query(
            `INSERT INTO bieumau_folder (ten_folder, mo_ta, ma_chi_bo, nguoi_tao, parent_folder_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [ten_folder.trim(), mo_ta || null, branchId, userId, parent_folder_id || null]
        );
        res.status(201).json({ message: 'Tạo thư mục thành công', folder: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo thư mục' });
    }
};

/**
 * PUT /branch-forms/folders/:id
 * Đổi tên / mô tả thư mục
 */
exports.updateFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const { ten_folder, mo_ta } = req.body;

    try {
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0)
            return res.status(404).json({ message: 'Thư mục không tồn tại' });

        const result = await db.query(
            `UPDATE bieumau_folder SET ten_folder = $1, mo_ta = $2, ngay_cap_nhat = NOW()
             WHERE ma_folder = $3 RETURNING *`,
            [ten_folder?.trim() || check.rows[0].ten_folder, mo_ta ?? check.rows[0].mo_ta, id]
        );
        res.json({ message: 'Cập nhật thành công', folder: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật thư mục' });
    }
};

/**
 * DELETE /branch-forms/folders/:id
 * Xóa thư mục và TOÀN BỘ nội dung bên trong (đệ quy)
 */
exports.deleteFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0)
            return res.status(404).json({ message: 'Thư mục không tồn tại' });

        // Lấy tất cả folder con (đệ quy) để xóa file trên Drive
        const allFolderIds = await getAllDescendantFolderIds(parseInt(id));

        // Xóa file trên Google Drive
        for (const fid of allFolderIds) {
            const files = await db.query('SELECT * FROM bieumau WHERE ma_folder = $1', [fid]);
            for (const f of files.rows) {
                if (f.ma_file_drive) {
                    try { await deleteFileFromDrive(f.ma_file_drive); } catch (_) {}
                }
            }
        }

        // Xóa thư mục gốc — nhờ ON DELETE CASCADE, tất cả folder con và file sẽ tự xóa
        await db.query('DELETE FROM bieumau_folder WHERE ma_folder = $1', [id]);

        res.json({ message: 'Đã xóa thư mục và toàn bộ nội dung bên trong' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa thư mục' });
    }
};

/**
 * GET /branch-forms/folders/:id/files
 * Lấy danh sách file TRỰC TIẾP trong thư mục (không bao gồm file trong subfolder)
 */
exports.getFilesInFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0)
            return res.status(404).json({ message: 'Thư mục không tồn tại' });

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
        res.status(500).json({ message: 'Lỗi lấy file' });
    }
};

/**
 * POST /branch-forms/folders/:id/upload
 * Upload nhiều file vào thư mục
 */
exports.uploadFilesToFolder = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const userId   = req.user.id;
    const files    = req.files;

    if (!files || files.length === 0)
        return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 file' });

    try {
        const check = await db.query(
            'SELECT * FROM bieumau_folder WHERE ma_folder = $1 AND ma_chi_bo = $2',
            [id, branchId]
        );
        if (check.rows.length === 0)
            return res.status(404).json({ message: 'Thư mục không tồn tại' });

        const uploaded = [];
        const errors   = [];

        for (const file of files) {
            try {
                const driveData = await uploadFileToDrive(file);
                const tieu_de   = file.originalname;
                const result = await db.query(
                    `INSERT INTO bieumau (tieu_de, duong_dan_file, ma_file_drive, ma_chi_bo, nguoi_tai_len, ma_folder)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [tieu_de, driveData.webViewLink, driveData.id, branchId, userId, id]
                );
                uploaded.push(result.rows[0]);
            } catch (err) {
                console.error(`Lỗi upload ${file.originalname}:`, err);
                errors.push(file.originalname);
            }
        }

        await db.query('UPDATE bieumau_folder SET ngay_cap_nhat = NOW() WHERE ma_folder = $1', [id]);

        res.status(201).json({
            message: `Tải lên ${uploaded.length} file thành công${errors.length > 0 ? `, ${errors.length} thất bại` : ''}`,
            uploaded, errors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload file' });
    }
};

// ─── FILE APIs (giữ nguyên) ───────────────────────────────────────────────────

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

exports.uploadForm = async (req, res) => {
    const branchId = req.user.branchId;
    const userId   = req.user.id;
    const { tieu_de } = req.body;
    const file = req.file;

    if (!tieu_de || !file)
        return res.status(400).json({ message: 'Vui lòng nhập tên và chọn file' });

    try {
        const driveData = await uploadFileToDrive(file);
        const result = await db.query(
            `INSERT INTO "bieumau" (tieu_de, duong_dan_file, ma_file_drive, ma_chi_bo, nguoi_tai_len)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [tieu_de, driveData.webViewLink, driveData.id, branchId, userId]
        );
        res.status(201).json({ message: 'Tải lên thành công', form: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload' });
    }
};

exports.deleteForm = async (req, res) => {
    const { id: ma_bieu_mau } = req.params;
    const branchId = req.user.branchId;

    try {
        const check = await db.query(
            'SELECT * FROM "bieumau" WHERE ma_bieu_mau = $1 AND ma_chi_bo = $2',
            [ma_bieu_mau, branchId]
        );
        if (check.rows.length === 0)
            return res.status(404).json({ message: 'Biểu mẫu không tồn tại' });

        const file = check.rows[0];
        if (file.ma_file_drive) {
            try { await deleteFileFromDrive(file.ma_file_drive); } catch (_) {}
        }
        await db.query('DELETE FROM "bieumau" WHERE ma_bieu_mau = $1', [ma_bieu_mau]);
        if (file.ma_folder) {
            await db.query('UPDATE bieumau_folder SET ngay_cap_nhat = NOW() WHERE ma_folder = $1', [file.ma_folder]);
        }
        res.json({ message: 'Đã xóa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa' });
    }
};

// PUBLIC: Lấy toàn bộ cây thư mục + file của 1 chi bộ (dành cho USER side)
exports.getPublicFolderTree = async (req, res) => {
    const { branchId } = req.params;
    try {
        const folders = await db.query(
            `SELECT f.*, COUNT(b.ma_bieu_mau)::int AS so_luong_file,
                    COUNT(sub.ma_folder)::int AS so_luong_thu_muc_con
             FROM bieumau_folder f
             LEFT JOIN bieumau b ON b.ma_folder = f.ma_folder
             LEFT JOIN bieumau_folder sub ON sub.parent_folder_id = f.ma_folder
             WHERE f.ma_chi_bo = $1
             GROUP BY f.ma_folder
             ORDER BY f.ngay_tao DESC`,
            [branchId]
        );
        res.json(folders.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy cây thư mục' });
    }
};

// PUBLIC: Lấy file trong 1 thư mục (dành cho USER side)
exports.getPublicFilesInFolder = async (req, res) => {
    const { folderId } = req.params;
    try {
        const files = await db.query(
            `SELECT b.*, d.ho_ten AS nguoi_dang
             FROM bieumau b
             LEFT JOIN dangvien d ON d.ma_dang_vien = b.nguoi_tai_len
             WHERE b.ma_folder = $1
             ORDER BY b.ngay_tao DESC`,
            [folderId]
        );
        const subfolders = await db.query(
            `SELECT f.*, COUNT(b.ma_bieu_mau)::int AS so_luong_file,
                    COUNT(sub.ma_folder)::int AS so_luong_thu_muc_con
             FROM bieumau_folder f
             LEFT JOIN bieumau b ON b.ma_folder = f.ma_folder
             LEFT JOIN bieumau_folder sub ON sub.parent_folder_id = f.ma_folder
             WHERE f.parent_folder_id = $1
             GROUP BY f.ma_folder
             ORDER BY f.ngay_tao DESC`,
            [folderId]
        );
        res.json({ files: files.rows, subfolders: subfolders.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy nội dung thư mục' });
    }
};