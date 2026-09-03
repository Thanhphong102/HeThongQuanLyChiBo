const db = require('../config/db');
const bcrypt = require('bcrypt'); // <--- Đảm bảo đã import bcrypt

// 1. GET: Lấy danh sách (Code đầy đủ)
exports.getBranchMembers = async (req, res) => {
    const branchId = req.user.branchId;
    const { page = 1, pageSize = 10, status, search, doi_tuong, gioi_tinh, archived = 'false' } = req.query;
    const offset = (page - 1) * pageSize;

    try {
        let query = `SELECT * FROM "dangvien" WHERE ma_chi_bo = $1`;
        let countQuery = `SELECT COUNT(*) FROM "dangvien" WHERE ma_chi_bo = $1`;
        
        const params = [branchId];
        let paramIndex = 2;

        if (String(archived).toLowerCase() === 'true') {
            query += ' AND da_xoa = true';
            countQuery += ' AND da_xoa = true';
        } else if (String(archived).toLowerCase() !== 'all') {
            query += ' AND COALESCE(da_xoa, false) = false';
            countQuery += ' AND COALESCE(da_xoa, false) = false';
        }

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
            const clause = ` AND (f_unaccent(ho_ten) ILIKE f_unaccent($${paramIndex}) OR f_unaccent(ho_ten) % f_unaccent($${paramIndex + 1}) OR LOWER(ten_dang_nhap) LIKE $${paramIndex} OR LOWER(ma_so_sinh_vien) LIKE $${paramIndex})`;
            query += clause; countQuery += clause;
            params.push(`%${search.toLowerCase()}%`, search);
            paramIndex += 2;
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

exports.setArchived = async (req, res) => {
    const branchId = Number(req.user.branchId);
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
               AND ma_chi_bo = $4
               AND cap_quyen = 3
               AND ma_dang_vien <> $2
             RETURNING ma_dang_vien`,
            [archived, actorId, memberIds, branchId]
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

const emailService = require('../services/emailService');

// Helper function: Tạo viết tắt từ tên chi bộ (VD: "Chi bộ Khoa Công nghệ thông tin" -> "cbkcntt")
const getBranchAbbreviation = (branchName) => {
    return branchName
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .split(' ')
        .map(word => word.charAt(0))
        .join('');
};

// 2. POST: Thêm Hồ sơ Đảng viên (ĐỒNG THỜI TẠO TÀI KHOẢN & GỬI EMAIL)
exports.createMember = async (req, res) => {
    const branchId = req.user.branchId;
    const { 
        ho_ten, so_dien_thoai, email, ngay_sinh, gioi_tinh, que_quan, 
        dia_chi_thuong_tru, dia_chi_tam_tru, dia_chi_chi_bo_lien_he, ngay_vao_dang, doi_tuong, ma_so_sinh_vien, 
        lop, khoa_hoc, nganh_hoc, ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon, so_dinh_danh, so_the_dang_vien
    } = req.body;

    if (!ho_ten || !email) {
        return res.status(400).json({ message: 'Họ tên và Email là bắt buộc' });
    }

    try {
        // Kiểm tra xem email đã được dùng làm tên đăng nhập chưa
        const check = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [email]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Email này đã được sử dụng!' });

        // Lấy tên chi bộ để sinh mật khẩu
        const branchRes = await db.query('SELECT ten_chi_bo FROM "chibo" WHERE ma_chi_bo = $1', [branchId]);
        if (branchRes.rows.length === 0) return res.status(404).json({ message: 'Chi bộ không tồn tại' });
        const branchName = branchRes.rows[0].ten_chi_bo;

        // Sinh mật khẩu tự động: viet_tat_chi_bo + @ctut
        const abbreviation = getBranchAbbreviation(branchName);
        const autoPassword = `${abbreviation}@ctut`;

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(autoPassword, salt);

        const sql = `
            INSERT INTO "dangvien" 
            (
                ho_ten, ma_chi_bo, cap_quyen, trang_thai_dang_vien, hoat_dong,
                so_dien_thoai, email, ngay_sinh, gioi_tinh, que_quan, dia_chi_thuong_tru, dia_chi_tam_tru, dia_chi_chi_bo_lien_he, ngay_vao_dang,
                doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
                ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon, chuc_vu_dang, nguoi_tao,
                ten_dang_nhap, mat_khau, so_dinh_danh, so_the_dang_vien, buoc_doi_mat_khau
            )
            VALUES (
                $1, $2, 3, 'Du bi', true,
                $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16,
                $17, $18, $19, 'Dang vien', $20,
                $21, $22, $23, $24, true
            )
            RETURNING *
        `;
        
        await db.query(sql, [
            ho_ten, branchId, 
            so_dien_thoai, email, ngay_sinh || null, gioi_tinh, que_quan, dia_chi_thuong_tru, dia_chi_tam_tru, dia_chi_chi_bo_lien_he, ngay_vao_dang || null,
            doi_tuong || 'Sinh vien', ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
            ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon, req.user.id,
            email, hashedPassword, so_dinh_danh, so_the_dang_vien
        ]);

        // Gửi email thông báo
        await emailService.sendAccountCreationEmail(email, ho_ten, email, autoPassword);

        res.status(201).json({ message: 'Thêm hồ sơ và cấp tài khoản thành công! Đã gửi email.' });
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
        ho_ten, so_dien_thoai, email, dia_chi_thuong_tru, dia_chi_tam_tru, dia_chi_chi_bo_lien_he, que_quan, 
        ngay_sinh, gioi_tinh, trang_thai_dang_vien, ngay_chinh_thuc, ngay_vao_dang,
        doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
        ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon, so_dinh_danh, so_the_dang_vien
    } = req.body;

    try {
        const check = await db.query('SELECT * FROM "dangvien" WHERE ma_dang_vien = $1 AND ma_chi_bo = $2', [id, branchId]);
        if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền sửa hồ sơ này' });

        const sql = `
            UPDATE "dangvien" 
            SET ho_ten = $1, so_dien_thoai = $2, email = $3, dia_chi_thuong_tru = $4, dia_chi_tam_tru = $5, dia_chi_chi_bo_lien_he = $6,
                que_quan = $7, ngay_sinh = $8, gioi_tinh = $9, 
                trang_thai_dang_vien = $10, ngay_chinh_thuc = $11, ngay_vao_dang = $12,
                doi_tuong = $13, ma_so_sinh_vien = $14, lop = $15, khoa_hoc = $16, nganh_hoc = $17,
                ma_can_bo = $18, don_vi_cong_tac = $19, chuc_vu_chuyen_mon = $20,
                so_dinh_danh = $21, so_the_dang_vien = $22,
                nguoi_cap_nhat = $23
            WHERE ma_dang_vien = $24
        `;
        
        await db.query(sql, [
            ho_ten, so_dien_thoai, email, dia_chi_thuong_tru, dia_chi_tam_tru, dia_chi_chi_bo_lien_he,
            que_quan, ngay_sinh || null, gioi_tinh, 
            trang_thai_dang_vien, ngay_chinh_thuc || null, ngay_vao_dang || null,
            doi_tuong, ma_so_sinh_vien, lop, khoa_hoc, nganh_hoc,
            ma_can_bo, don_vi_cong_tac, chuc_vu_chuyen_mon,
            so_dinh_danh, so_the_dang_vien,
            req.user.id, id
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

        await db.query('UPDATE "dangvien" SET ten_dang_nhap = $1, mat_khau = $2, hoat_dong = true, buoc_doi_mat_khau = true, nguoi_cap_nhat = $3 WHERE ma_dang_vien = $4', [ten_dang_nhap, hashedPassword, req.user.id, id]);

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
        
        await db.query('UPDATE "dangvien" SET hoat_dong = $1, nguoi_cap_nhat = $2 WHERE ma_dang_vien = $3', [newStatus, req.user.id, id]);
        
        res.json({ message: newStatus ? 'Đã mở khóa' : 'Đã khóa', status: newStatus });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
    }
};

// 6. PUT: Cấp lại mật khẩu — TỰ SINH + GỬI EMAIL + ĐẶT CỜ ĐỔI MẬT KHẨU
exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Lấy thông tin Đảng viên (email, tên, tên đăng nhập)
        const memberRes = await db.query(
            'SELECT ho_ten, email, ten_dang_nhap FROM "dangvien" WHERE ma_dang_vien = $1',
            [id]
        );
        if (memberRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy Đảng viên' });
        }
        const member = memberRes.rows[0];

        if (!member.ten_dang_nhap) {
            return res.status(400).json({ message: 'Đảng viên này chưa được cấp tài khoản' });
        }

        // 2. Tự sinh mật khẩu ngẫu nhiên 10 ký tự (chữ + số + ký tự đặc biệt)
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
        let matKhauTam = '';
        for (let i = 0; i < 10; i++) {
            matKhauTam += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // 3. Băm mật khẩu và cập nhật DB, bật cờ buoc_doi_mat_khau
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(matKhauTam, salt);

        await db.query(
            `UPDATE "dangvien" 
             SET mat_khau = $1, buoc_doi_mat_khau = true, nguoi_cap_nhat = $2 
             WHERE ma_dang_vien = $3`,
            [hashedPassword, req.user.id, id]
        );

        // 4. Gửi email nếu Đảng viên có địa chỉ email
        let emailSent = false;
        if (member.email) {
            try {
                const { sendPasswordResetEmail } = require('../services/emailService');
                await sendPasswordResetEmail(member.email, member.ho_ten, member.ten_dang_nhap, matKhauTam);
                emailSent = true;
            } catch (emailErr) {
                console.error('[resetPassword] Lỗi gửi email:', emailErr.message);
                // Không ném lỗi — vẫn trả về thành công kèm cảnh báo
            }
        }

        res.json({
            message: 'Đã cấp lại mật khẩu thành công',
            matKhauTam,
            emailSent,
            emailAddress: member.email || null,
            note: emailSent
                ? `Mật khẩu tạm đã được gửi tới ${member.email}`
                : member.email 
                    ? 'Lỗi hệ thống khi gửi email (Kiểm tra lại cấu hình App Password) — vui lòng thông báo mật khẩu thủ công'
                    : 'Đảng viên chưa có email — vui lòng thông báo mật khẩu thủ công',
        });
    } catch (error) {
        console.error(error);
        try {
            require('fs').writeFileSync('d:/NCKHSV/ADMIN/backend/error_log.txt', error.stack || error.message);
        } catch (e) {}
        res.status(500).json({ message: 'Lỗi cấp lại mật khẩu: ' + error.message });
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

