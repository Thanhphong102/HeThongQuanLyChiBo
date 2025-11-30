const db = require('../config/db');

// 1. Lấy danh sách chỉ tiêu (Kèm tên Chi bộ)
exports.getTargets = async (req, res) => {
    try {
        const sql = `
            SELECT t.*, c.ten_chi_bo 
            FROM "chitieu" t
            JOIN "chibo" c ON t.ma_chi_bo = c.ma_chi_bo
            ORDER BY t.nam_hoc DESC, t.ma_chi_tieu DESC
        `;
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách chỉ tiêu' });
    }
};

// 2. Tạo chỉ tiêu mới
exports.createTarget = async (req, res) => {
    const { ten_chi_tieu, nam_hoc, so_luong_muc_tieu, ma_chi_bo } = req.body;
    try {
        const sql = `
            INSERT INTO "chitieu" (ten_chi_tieu, nam_hoc, so_luong_muc_tieu, so_luong_dat_duoc, ma_chi_bo, trang_thai)
            VALUES ($1, $2, $3, 0, $4, 'Dang thuc hien')
            RETURNING *
        `;
        const result = await db.query(sql, [ten_chi_tieu, nam_hoc, so_luong_muc_tieu, ma_chi_bo]);
        res.status(201).json({ message: 'Giao chỉ tiêu thành công', target: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo chỉ tiêu' });
    }
};

// 3. Xóa chỉ tiêu
exports.deleteTarget = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM "chitieu" WHERE ma_chi_tieu = $1', [id]);
        res.json({ message: 'Đã xóa chỉ tiêu' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa chỉ tiêu' });
    }
};