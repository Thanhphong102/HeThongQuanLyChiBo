const db = require('../config/db');

// 1. API: GET /api/branches - Lấy danh sách chi bộ
exports.getBranches = async (req, res) => {
    try {
        const { search, status } = req.query;
        let sql = 'SELECT * FROM "chibo" WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (search) {
            sql += ` AND ten_chi_bo ILIKE $${paramIndex++}`;
            params.push(`%${search}%`);
        }
        if (status !== undefined && status !== '') {
            sql += ` AND trang_thai = $${paramIndex++}`;
            params.push(status === 'true');
        }

        sql += ' ORDER BY trang_thai DESC, ma_chi_bo ASC';
        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách chi bộ' });
    }
};

// 2. API: POST /api/branches - Thêm chi bộ mới
exports.createBranch = async (req, res) => {
    const { ten_chi_bo, mo_ta, ngay_thanh_lap } = req.body;
    
    if (!ten_chi_bo) {
        return res.status(400).json({ message: 'Tên chi bộ là bắt buộc' });
    }

    try {
        const sql = `
            INSERT INTO "chibo" (ten_chi_bo, mo_ta, ngay_thanh_lap, trang_thai)
            VALUES ($1, $2, COALESCE($3, CURRENT_DATE), true)
            RETURNING *
        `;
        const newBranch = await db.query(sql, [ten_chi_bo, mo_ta, ngay_thanh_lap || null]);
        
        res.status(201).json({ 
            message: 'Tạo chi bộ thành công', 
            branch: newBranch.rows[0] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo chi bộ' });
    }
};

// 3. API: PUT /api/branches/:id - Sửa thông tin chi bộ
exports.updateBranch = async (req, res) => {
    const { id } = req.params;
    const { ten_chi_bo, mo_ta } = req.body;

    try {
        const sql = `
            UPDATE "chibo" 
            SET ten_chi_bo = $1, mo_ta = $2 
            WHERE ma_chi_bo = $3
            RETURNING *
        `;
        const result = await db.query(sql, [ten_chi_bo, mo_ta, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Chi bộ không tồn tại' });
        }

        res.json({ 
            message: 'Cập nhật thông tin thành công', 
            branch: result.rows[0] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật chi bộ' });
    }
};

// 4. API: PUT /api/branches/:id/archive - Ẩn/Giải thể chi bộ (Soft Delete)
exports.archiveBranch = async (req, res) => {
    const { id } = req.params;
    try {
        // Chỉ chuyển trạng thái thành false, không xóa dòng dữ liệu
        const sql = `
            UPDATE "chibo" 
            SET "trang_thai" = false 
            WHERE "ma_chi_bo" = $1
            RETURNING *
        `;
        
        const result = await db.query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Chi bộ không tồn tại' });
        }

        res.json({ 
            message: 'Đã giải thể chi bộ thành công',
            branch: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi giải thể chi bộ' });
    }
};