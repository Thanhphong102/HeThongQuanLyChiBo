const db = require('../config/db');

// 1. Lấy danh sách chỉ tiêu (Kèm tên Chi bộ)
exports.getTargets = async (req, res) => {
    try {
        const { search, branch, status } = req.query;
        let sql = `
            SELECT t.*, c.ten_chi_bo 
            FROM "chitieu" t
            JOIN "chibo" c ON t.ma_chi_bo = c.ma_chi_bo
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND t.ten_chi_tieu ILIKE $${params.length}`;
        }
        if (branch) {
            params.push(branch);
            sql += ` AND t.ma_chi_bo = $${params.length}`;
        }
        if (status) {
            if (status === 'completed') {
                sql += ` AND t.trang_thai = 'Hoàn thành'`;
            } else if (status === 'active') {
                sql += ` AND t.trang_thai != 'Hoàn thành'`;
            }
        }

        sql += ` ORDER BY t.nam_hoc DESC, t.ma_chi_tieu DESC`;

        const result = await db.query(sql, params);
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
        const newTarget = result.rows[0];

        // --- Task 9 & 10: Tự động đẩy thông báo cho Chi bộ ---
        const notifySql = `
            INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await db.query(notifySql, [
            ma_chi_bo,
            'Admin',
            'Có chỉ tiêu công tác mới',
            `Bạn có chỉ tiêu mới: "${ten_chi_tieu}" cho năm học ${nam_hoc}. Vui lòng kiểm tra và thực hiện.`,
            'TARGET'
        ]);

        res.status(201).json({ message: 'Giao chỉ tiêu thành công', target: newTarget });
    } catch (error) {
        console.error('[createTarget Error]:', error);
        res.status(500).json({ message: 'Lỗi tạo chỉ tiêu' });
    }
};

// 3. Xóa chỉ tiêu
exports.deleteTarget = async (req, res) => {
    const { id } = req.params;
    try {
        const check = await db.query('SELECT ten_chi_tieu, ma_chi_bo FROM "chitieu" WHERE ma_chi_tieu = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy chỉ tiêu' });
        const target = check.rows[0];

        await db.query('DELETE FROM "chitieu" WHERE ma_chi_tieu = $1', [id]);

        // --- Gửi Thông báo Xóa ---
        try {
            await db.query(
                `INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'Admin', $2, $3, 'TARGET')`,
                [target.ma_chi_bo, `❌ Hủy chỉ tiêu: ${target.ten_chi_tieu}`, `Chỉ tiêu "${target.ten_chi_tieu}" đã bị ban giám hiệu rút/hủy bỏ khỏi hệ thống.`]
            );
        } catch(e) { console.error(e); }

        res.json({ message: 'Đã xóa chỉ tiêu' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa chỉ tiêu' });
    }
};

// 4. Cập nhật chỉ tiêu (bao gồm trạng thái)
exports.updateTarget = async (req, res) => {
    const { id } = req.params;
    const { ten_chi_tieu, nam_hoc, so_luong_muc_tieu, ma_chi_bo, trang_thai } = req.body;
    try {
        const sql = `
            UPDATE "chitieu" 
            SET ten_chi_tieu = COALESCE($1, ten_chi_tieu), 
                nam_hoc = COALESCE($2, nam_hoc), 
                so_luong_muc_tieu = COALESCE($3, so_luong_muc_tieu), 
                ma_chi_bo = COALESCE($4, ma_chi_bo), 
                trang_thai = COALESCE($5, trang_thai)
            WHERE ma_chi_tieu = $6
            RETURNING *
        `;
        const result = await db.query(sql, [ten_chi_tieu, nam_hoc, so_luong_muc_tieu, ma_chi_bo, trang_thai, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Chỉ tiêu không tồn tại' });
        }
        
        const target = result.rows[0];

        // --- Gửi Thông báo Cập nhật ---
        try {
            await db.query(
                `INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'Admin', $2, $3, 'TARGET')`,
                [target.ma_chi_bo, `🎯 Chỉ tiêu cập nhật: ${target.ten_chi_tieu}`, `Chỉ tiêu "${target.ten_chi_tieu}" vừa có thay đổi về thông tin. Tình trạng: ${target.trang_thai}.`]
            );
        } catch(e) { console.error(e); }

        res.json({ message: 'Cập nhật chỉ tiêu thành công', target });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật chỉ tiêu' });
    }
};