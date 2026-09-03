const db = require('../config/db');

// API: GET /api/members - Lấy danh sách đảng viên (kèm tên chi bộ)
exports.getAllMembers = async (req, res) => {
    try {
        const { search, branch, permission, status, archived = 'false' } = req.query;
        let sql = `
            SELECT 
                d.ma_dang_vien, 
                d.ho_ten, 
                d.email,
                d.ten_dang_nhap,
                d.ma_chi_bo,
                d.chuc_vu_dang,
                d.cap_quyen,
                d.trang_thai_dang_vien,
                d.hoat_dong,
                d.da_xoa,
                c.ten_chi_bo
            FROM "dangvien" d
            LEFT JOIN "chibo" c ON d.ma_chi_bo = c.ma_chi_bo
            WHERE 1=1
        `;
        let params = [];
        let paramIndex = 1;

        if (String(archived).toLowerCase() === 'true') {
            sql += ' AND d.da_xoa = true';
        } else if (String(archived).toLowerCase() !== 'all') {
            sql += ' AND COALESCE(d.da_xoa, false) = false';
        }

        if (search) {
            sql += ` AND (f_unaccent(d.ho_ten) ILIKE f_unaccent($${paramIndex}) OR f_unaccent(d.ho_ten) % f_unaccent($${paramIndex + 1}))`;
            params.push(`%${search}%`, search);
            paramIndex += 2;
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
            sql += ` AND d.hoat_dong = $${paramIndex++}`;
            // hoat_dong là trạng thái khóa/mở tài khoản.
            params.push(status === 'true');
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

exports.setArchived = async (req, res) => {
    const actorId = Number(req.user.id);
    const archived = req.body.archived !== false;
    const memberIds = [...new Set(
        (Array.isArray(req.body.memberIds) ? req.body.memberIds : [])
            .map(Number)
            .filter(id => Number.isInteger(id) && id > 0)
    )];

    if (!memberIds.length) {
        return res.status(400).json({ message: 'Vui lòng chọn ít nhất một tài khoản.' });
    }

    try {
        const result = await db.query(
            `UPDATE "dangvien"
             SET da_xoa = $1, nguoi_cap_nhat = $2, thoi_gian_cap_nhat = NOW()
             WHERE ma_dang_vien = ANY($3::int[])
               AND cap_quyen IN (2, 3)
               AND ma_dang_vien <> $2
             RETURNING ma_dang_vien`,
            [archived, actorId, memberIds]
        );

        res.json({
            message: archived ? 'Đã lưu trữ tài khoản được chọn.' : 'Đã khôi phục tài khoản được chọn.',
            updatedCount: result.rowCount,
            skippedCount: memberIds.length - result.rowCount
        });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái lưu trữ:', error);
        res.status(500).json({ message: 'Không thể cập nhật trạng thái lưu trữ tài khoản.' });
    }
};
