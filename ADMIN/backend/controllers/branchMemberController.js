const db = require('../config/db');
const bcrypt = require('bcrypt'); // <--- Đảm bảo đã import bcrypt

// 1. GET: Lấy danh sách (Code đầy đủ)
exports.getBranchMembers = async (req, res) => {
    const branchId = req.user.branchId;
    const { page = 1, pageSize = 10, status, search, doi_tuong, gioi_tinh } = req.query;
    const offset = (page - 1) * pageSize;

    try {
        let query = `SELECT * FROM "dangvien" WHERE ma_chi_bo = $1`;
        let countQuery = `SELECT COUNT(*) FROM "dangvien" WHERE ma_chi_bo = $1`;
        
        const params = [branchId];
        let paramIndex = 2;

        if (status) {
            const clause = ` AND trang_thai_dang_vien = $${paramIndex}`;
            query += clause; countQuery += clause;
            params.push(status); paramIndex++;
        }
        if (doi_tuong) {
            const clause = ` AND doi_tuong = $${paramIndex}`;
            query += clause; countQuery += clause;
            params.push(doi_tuong); paramIndex++;
        }
        if (gioi_tinh) {
            const clause = ` AND gioi_tinh = $${paramIndex}`;
            query += clause; countQuery += clause;
            params.push(gioi_tinh); paramIndex++;
        }
        if (search) {
            const clause = ` AND (LOWER(ho_ten) LIKE $${paramIndex} OR LOWER(ten_dang_nhap) LIKE $${paramIndex} OR LOWER(ma_so_sinh_vien) LIKE $${paramIndex})`;
            query += clause; countQuery += clause;
            params.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        query += ` ORDER BY ma_dang_vien DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        
        const [members, total] = await Promise.all([
            db.query(query, [...params, pageSize, offset]),
            db.query(countQuery, params)
        ]);

        res.json({
            data: members.rows,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(pageSize),
                total: parseInt(total.rows[0].count)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách' });
    }
};

// 2. POST: Thêm Hồ sơ Đảng viên (KHÔNG TẠO TK - Username/Pass để NULL)
exports.createMember = async (req, res) => {
    const branchId = req.user.branchId;
    const { 
        ho_ten, so_dien_thoai, email, ngay_sinh, gioi_tinh, que_quan, 
        dia_chi_hien_tai, ngay_vao_dang, doi_tuong, ma_so_sinh_vien, 
        lop, khoa_hoc, nganh_hoc, ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon
    } = req.body;

    if (!ho_ten) {
        return res.status(400).json({ message: 'Họ và tên là bắt buộc' });
    }

    try {
        const sql = `
            INSERT INTO "dangvien" 
            (
                ho_ten, ma_chi_bo, cap_quyen, trang_thai_dang_vien, hoat_dong,
                so_dien_thoai, email, ngay_sinh, gioi_tinh, que_quan, dia_chi_hien_tai, ngay_vao_dang,
                doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
                ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon, chuc_vu_dang
            )
            VALUES (
                $1, $2, 3, 'Du bi', true,
                $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14,
                $15, $16, $17, 'Dang vien'
            )
            RETURNING *
        `;
        
        await db.query(sql, [
            ho_ten, branchId, 
            so_dien_thoai, email, ngay_sinh || null, gioi_tinh, que_quan, dia_chi_hien_tai, ngay_vao_dang || null,
            doi_tuong || 'Sinh vien', ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
            ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon
        ]);

        res.status(201).json({ message: 'Thêm hồ sơ thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi thêm hồ sơ' });
    }
};

// 3. PUT: Cập nhật Hồ sơ
exports.updateMember = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const { 
        ho_ten, so_dien_thoai, email, dia_chi_hien_tai, que_quan, 
        ngay_sinh, gioi_tinh, trang_thai_dang_vien, ngay_chinh_thuc,
        doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
        ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon
    } = req.body;

    try {
        const check = await db.query('SELECT * FROM "dangvien" WHERE ma_dang_vien = $1 AND ma_chi_bo = $2', [id, branchId]);
        if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền sửa hồ sơ này' });

        const sql = `
            UPDATE "dangvien" 
            SET ho_ten = $1, so_dien_thoai = $2, email = $3, dia_chi_hien_tai = $4, 
                que_quan = $5, ngay_sinh = $6, gioi_tinh = $7, 
                trang_thai_dang_vien = $8, ngay_chinh_thuc = $9,
                doi_tuong = $10, ma_so_sinh_vien = $11, lop = $12, khoa_hoc = $13, nganh_hoc = $14,
                ma_can_bo = $15, don_vi_cong_tac = $16, chuc_vu_chuyen_mon = $17
            WHERE ma_dang_vien = $18
        `;
        
        await db.query(sql, [
            ho_ten, so_dien_thoai, email, dia_chi_hien_tai, 
            que_quan, ngay_sinh || null, gioi_tinh, 
            trang_thai_dang_vien, ngay_chinh_thuc || null,
            doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
            ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon,
            id
        ]);

        res.json({ message: 'Cập nhật hồ sơ thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
};

// 4. PUT: Cấp Tài khoản Mới (CÓ MÃ HÓA PASSWORD)
exports.grantAccount = async (req, res) => {
    const { id } = req.params;
    const { ten_dang_nhap, mat_khau } = req.body;

    if (!ten_dang_nhap || !mat_khau) return res.status(400).json({ message: 'Thiếu Username/Password' });

    try {
        const check = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [ten_dang_nhap]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

        await db.query('UPDATE "dangvien" SET ten_dang_nhap = $1, mat_khau = $2, hoat_dong = true WHERE ma_dang_vien = $3', [ten_dang_nhap, hashedPassword, id]);

        res.json({ message: 'Cấp tài khoản thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cấp tài khoản' });
    }
};

// 5. PUT: Khóa/Mở khóa
exports.toggleStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.query('SELECT hoat_dong FROM "dangvien" WHERE ma_dang_vien = $1', [id]);
        if (user.rows.length === 0) return res.status(404).json({ message: 'User không tồn tại' });

        const currentStatus = user.rows[0].hoat_dong === false ? false : true;
        const newStatus = !currentStatus;
        
        await db.query('UPDATE "dangvien" SET hoat_dong = $1 WHERE ma_dang_vien = $2', [newStatus, id]);
        
        res.json({ message: newStatus ? 'Đã mở khóa' : 'Đã khóa', status: newStatus });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
    }
};

// 6. PUT: Cấp lại mật khẩu (CÓ MÃ HÓA)
exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const { new_password } = req.body;
    try {
        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [hashedPassword, id]);
        res.json({ message: 'Đã cấp lại mật khẩu' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cấp lại mật khẩu' });
    }
};

// const db = require('../config/db');

// // 1. GET: Lấy danh sách (Có Lọc & Tìm kiếm)
// exports.getBranchMembers = async (req, res) => {
//     const branchId = req.user.branchId;
//     const { page = 1, pageSize = 10, status, search, doi_tuong, gioi_tinh } = req.query;
//     const offset = (page - 1) * pageSize;

//     try {
//         let query = `SELECT * FROM "dangvien" WHERE ma_chi_bo = $1`;
//         let countQuery = `SELECT COUNT(*) FROM "dangvien" WHERE ma_chi_bo = $1`;
        
//         const params = [branchId];
//         let paramIndex = 2;

//         if (status) {
//             const clause = ` AND trang_thai_dang_vien = $${paramIndex}`;
//             query += clause; countQuery += clause;
//             params.push(status); paramIndex++;
//         }
//         if (doi_tuong) {
//             const clause = ` AND doi_tuong = $${paramIndex}`;
//             query += clause; countQuery += clause;
//             params.push(doi_tuong); paramIndex++;
//         }
//         if (gioi_tinh) {
//             const clause = ` AND gioi_tinh = $${paramIndex}`;
//             query += clause; countQuery += clause;
//             params.push(gioi_tinh); paramIndex++;
//         }
//         if (search) {
//             const clause = ` AND (LOWER(ho_ten) LIKE $${paramIndex} OR LOWER(ten_dang_nhap) LIKE $${paramIndex} OR LOWER(ma_so_sinh_vien) LIKE $${paramIndex})`;
//             query += clause; countQuery += clause;
//             params.push(`%${search.toLowerCase()}%`);
//             paramIndex++;
//         }

//         query += ` ORDER BY ma_dang_vien DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        
//         const [members, total] = await Promise.all([
//             db.query(query, [...params, pageSize, offset]),
//             db.query(countQuery, params)
//         ]);

//         res.json({
//             data: members.rows,
//             pagination: {
//                 current: parseInt(page),
//                 pageSize: parseInt(pageSize),
//                 total: parseInt(total.rows[0].count)
//             }
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi lấy danh sách' });
//     }
// };

// // 2. POST: Thêm Hồ sơ Đảng viên (CHỈ THÔNG TIN CÁ NHÂN - KHÔNG TẠO TK)
// exports.createMember = async (req, res) => {
//     const branchId = req.user.branchId;
//     // Không nhận username/password ở đây nữa
//     const { 
//         ho_ten, so_dien_thoai, email, ngay_sinh, gioi_tinh, que_quan, 
//         dia_chi_hien_tai, ngay_vao_dang, doi_tuong, ma_so_sinh_vien, 
//         lop, khoa_hoc, nganh_hoc, ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon
//     } = req.body;

//     if (!ho_ten) {
//         return res.status(400).json({ message: 'Họ và tên là bắt buộc' });
//     }

//     try {
//         // Insert với username, password để NULL (hoặc mặc định)
//         // hoat_dong = true để hiển thị trong danh sách, nhưng chưa đăng nhập được
//         const sql = `
//             INSERT INTO "dangvien" 
//             (
//                 ho_ten, ma_chi_bo, cap_quyen, trang_thai_dang_vien, hoat_dong,
//                 so_dien_thoai, email, ngay_sinh, gioi_tinh, que_quan, dia_chi_hien_tai, ngay_vao_dang,
//                 doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
//                 ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon, chuc_vu_dang
//             )
//             VALUES (
//                 $1, $2, 3, 'Du bi', true,
//                 $3, $4, $5, $6, $7, $8, $9,
//                 $10, $11, $12, $13, $14,
//                 $15, $16, $17, 'Dang vien'
//             )
//             RETURNING *
//         `;
        
//         await db.query(sql, [
//             ho_ten, branchId, 
//             so_dien_thoai, email, ngay_sinh || null, gioi_tinh, que_quan, dia_chi_hien_tai, ngay_vao_dang || null,
//             doi_tuong || 'Sinh vien', ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
//             ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon
//         ]);

//         res.status(201).json({ message: 'Thêm hồ sơ thành công' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi thêm hồ sơ' });
//     }
// };

// // 3. PUT: Cập nhật Hồ sơ (SỬA FULL THÔNG TIN CÁ NHÂN)
// exports.updateMember = async (req, res) => {
//     const { id } = req.params;
//     const branchId = req.user.branchId;
//     const { 
//         ho_ten, so_dien_thoai, email, dia_chi_hien_tai, que_quan, 
//         ngay_sinh, gioi_tinh, trang_thai_dang_vien, ngay_chinh_thuc,
//         doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
//         ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon
//     } = req.body;

//     try {
//         const check = await db.query('SELECT * FROM "dangvien" WHERE ma_dang_vien = $1 AND ma_chi_bo = $2', [id, branchId]);
//         if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền sửa hồ sơ này' });

//         const sql = `
//             UPDATE "dangvien" 
//             SET ho_ten = $1, so_dien_thoai = $2, email = $3, dia_chi_hien_tai = $4, 
//                 que_quan = $5, ngay_sinh = $6, gioi_tinh = $7, 
//                 trang_thai_dang_vien = $8, ngay_chinh_thuc = $9,
//                 doi_tuong = $10, ma_so_sinh_vien = $11, lop = $12, khoa_hoc = $13, nganh_hoc = $14,
//                 ma_can_bo = $15, don_vi_cong_tac = $16, chuc_vu_chuyen_mon = $17
//             WHERE ma_dang_vien = $18
//         `;
        
//         await db.query(sql, [
//             ho_ten, so_dien_thoai, email, dia_chi_hien_tai, 
//             que_quan, ngay_sinh || null, gioi_tinh, 
//             trang_thai_dang_vien, ngay_chinh_thuc || null,
//             doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
//             ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon,
//             id
//         ]);

//         res.json({ message: 'Cập nhật hồ sơ thành công' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi cập nhật' });
//     }
// };

// // 4. PUT: Cấp Tài khoản Mới (HÀM MỚI - Dùng cho trang AccountManager)
// exports.grantAccount = async (req, res) => {
//     const { id } = req.params;
//     const { ten_dang_nhap, mat_khau } = req.body;

//     if (!ten_dang_nhap || !mat_khau) return res.status(400).json({ message: 'Thiếu Username/Password' });

//     try {
//         // Check trùng username
//         const check = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [ten_dang_nhap]);
//         if (check.rows.length > 0) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });

//         // Update username/pass vào hồ sơ đã có
//         await db.query('UPDATE "dangvien" SET ten_dang_nhap = $1, mat_khau = $2, hoat_dong = true WHERE ma_dang_vien = $3', [ten_dang_nhap, mat_khau, id]);

//         res.json({ message: 'Cấp tài khoản thành công' });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi cấp tài khoản' });
//     }
// };

// // 5. PUT: Khóa/Mở khóa
// exports.toggleStatus = async (req, res) => {
//     const { id } = req.params;
//     try {
//         const user = await db.query('SELECT hoat_dong FROM "dangvien" WHERE ma_dang_vien = $1', [id]);
//         if (user.rows.length === 0) return res.status(404).json({ message: 'User không tồn tại' });

//         // Logic đảo ngược chuẩn (Null -> True, True -> False, False -> True)
//         const currentStatus = user.rows[0].hoat_dong === false ? false : true;
//         const newStatus = !currentStatus;
        
//         await db.query('UPDATE "dangvien" SET hoat_dong = $1 WHERE ma_dang_vien = $2', [newStatus, id]);
        
//         res.json({ message: newStatus ? 'Đã mở khóa' : 'Đã khóa', status: newStatus });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
//     }
// };

// // 6. PUT: Cấp lại mật khẩu
// exports.resetPassword = async (req, res) => {
//     const { id } = req.params;
//     const { new_password } = req.body;
//     try {
//         await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [new_password, id]);
//         res.json({ message: 'Đã cấp lại mật khẩu' });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi cấp lại mật khẩu' });
//     }
// };

