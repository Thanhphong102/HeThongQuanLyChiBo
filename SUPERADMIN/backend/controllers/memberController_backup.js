const db = require('../config/db');

// API: GET /api/members - Lấy danh sách đảng viên (kèm tên chi bộ)
exports.getAllMembers = async (req, res) => {
    try {
        const { search, branch, permission, status } = req.query;
        let sql = `
            SELECT 
                d.ma_dang_vien, 
                d.ho_ten, 
                d.ten_dang_nhap,
                d.chuc_vu_dang,
                d.cap_quyen,
                d.trang_thai_dang_vien,
                d.hoat_dong,
                c.ten_chi_bo
            FROM "dangvien" d
            LEFT JOIN "chibo" c ON d.ma_chi_bo = c.ma_chi_bo
            WHERE 1=1
        `;
        let params = [];
        let paramIndex = 1;

        if (search) {
            sql += ` AND d.ho_ten ILIKE $${paramIndex++}`;
            params.push(`%${search}%`);
        }
        if (branch) {
            sql += ` AND d.ma_chi_bo = $${paramIndex++}`;
            params.push(branch);
        }
        if (permission) {
            sql += ` AND d.cap_quyen = $${paramIndex++}`;
            params.push(permission);
        }
        if (status) {
            sql += ` AND d.trang_thai_dang_vien = $${paramIndex++}`;
            // Mặc định DB lưu trạng thái là varchar (ví dụ 'Du bi', 'Chinh thuc')
            params.push(status);
        }

        sql += ' ORDER BY d.ma_dang_vien DESC';
        const result = await db.query(sql, params);

        res.json({
            message: 'Lấy danh sách thành công',
            data: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách thành viên' });
    }
};