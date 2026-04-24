const db = require('../config/db');

// 1. GET: Lấy danh sách chỉ tiêu được giao cho Chi bộ
exports.getAssignedTargets = async (req, res) => {
    const branchId = req.user.branchId;
    try {
        const sql = `
            SELECT * FROM chitieu 
            WHERE ma_chi_bo = $1 
            ORDER BY ma_chi_tieu DESC
        `;
        const result = await db.query(sql, [branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error('[getAssignedTargets Error]:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách chỉ tiêu' });
    }
};

// 2. PUT: Cập nhật tiến độ chỉ tiêu
exports.updateTargetProgress = async (req, res) => {
    const branchId = req.user.branchId;
    const { id } = req.params; // ma_chi_tieu
    const { so_luong_dat_duoc, trang_thai, minh_chung_url } = req.body;

    try {
        // Kiểm tra xem chỉ tiêu có thuộc chi bộ này không
        const checkSql = 'SELECT * FROM chitieu WHERE ma_chi_tieu = $1 AND ma_chi_bo = $2';
        const checkRes = await db.query(checkSql, [id, branchId]);

        if (checkRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy chỉ tiêu hoặc bạn không có quyền cập nhật' });
        }

        const updateSql = `
            UPDATE chitieu 
            SET so_luong_dat_duoc = $1, 
                trang_thai = $2, 
                minh_chung_url = $3
            WHERE ma_chi_tieu = $4 AND ma_chi_bo = $5
            RETURNING *
        `;
        const result = await db.query(updateSql, [
            so_luong_dat_duoc, 
            trang_thai, 
            minh_chung_url, 
            id, 
            branchId
        ]);

        res.json({ message: 'Cập nhật tiến độ thành công', target: result.rows[0] });
    } catch (error) {
        console.error('[updateTargetProgress Error]:', error);
        res.status(500).json({ message: 'Lỗi cập nhật tiến độ' });
    }
};
