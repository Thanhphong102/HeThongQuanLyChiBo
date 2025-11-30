const db = require('../config/db');

// 1. API: GET /api/branches - Lấy danh sách chi bộ
exports.getBranches = async (req, res) => {
    try {
        // Lấy tất cả, sắp xếp chi bộ đang hoạt động lên trên, giải thể xuống dưới, sau đó theo ID
        const result = await db.query('SELECT * FROM "chibo" ORDER BY trang_thai DESC, ma_chi_bo ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách chi bộ' });
    }
};

// 2. API: POST /api/branches - Thêm chi bộ mới
exports.createBranch = async (req, res) => {
    const { ten_chi_bo, mo_ta } = req.body;
    
    // Validate dữ liệu đầu vào cơ bản
    if (!ten_chi_bo) {
        return res.status(400).json({ message: 'Tên chi bộ là bắt buộc' });
    }

    try {
        const sql = `
            INSERT INTO "chibo" (ten_chi_bo, mo_ta, ngay_thanh_lap, trang_thai)
            VALUES ($1, $2, CURRENT_DATE, true)
            RETURNING *
        `;
        const newBranch = await db.query(sql, [ten_chi_bo, mo_ta]);
        
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