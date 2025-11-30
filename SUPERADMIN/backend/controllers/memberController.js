const db = require('../config/db');

// API: GET /api/members - Lấy danh sách đảng viên (kèm tên chi bộ)
exports.getAllMembers = async (req, res) => {
    try {
        const sql = `
            SELECT 
                d.ma_dang_vien, 
                d.ho_ten, 
                d.ten_dang_nhap,
                d.chuc_vu_dang,
                d.cap_quyen,
                d.trang_thai_dang_vien,
                c.ten_chi_bo
            FROM "dangvien" d
            LEFT JOIN "chibo" c ON d.ma_chi_bo = c.ma_chi_bo
            ORDER BY d.ma_dang_vien DESC
        `;
        
        const result = await db.query(sql);

        // Trả về format { data: [...] } để khớp với Frontend (AccountManager.js)
        res.json({
            message: 'Lấy danh sách thành công',
            data: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách thành viên' });
    }
};