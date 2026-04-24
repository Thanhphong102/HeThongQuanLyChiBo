const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // <--- 1. Import bcrypt

// 1. Login
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'Tài khoản không tồn tại' });
        
        const user = result.rows[0];

        // KIỂM TRA TRẠNG THÁI HOẠT ĐỘNG
        if (user.hoat_dong === false) {
            return res.status(403).json({ message: 'Tài khoản này đã bị khóa/ẩn!' });
        }

        // --- 2. CẬP NHẬT: So sánh mật khẩu bằng bcrypt ---
        // Hỗ trợ song song mật khẩu mã hóa mới và mật khẩu cũ (text thường)
        let isMatch = false;
        if (user.mat_khau.startsWith('$2b$') || user.mat_khau.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(password, user.mat_khau);
        } else {
            isMatch = (password === user.mat_khau);
        }
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu sai' });
        }

        // --- THÊM branchId VÀO TOKEN ---
        const token = jwt.sign(
            { 
                id: user.ma_dang_vien, 
                role: user.cap_quyen, 
                name: user.ho_ten,
                branchId: user.ma_chi_bo 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        res.json({ message: 'Đăng nhập thành công', token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 2. Register (Cấp tài khoản mới - Cần mã hóa mật khẩu)
exports.register = async (req, res) => {
    const { ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen } = req.body;
    if (!ho_ten || !ten_dang_nhap || !mat_khau || !ma_chi_bo) {
        return res.status(400).json({ message: 'Vui lòng điền đủ thông tin!' });
    }
    try {
        const check = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [ten_dang_nhap]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });

        // --- 3. CẬP NHẬT: Mã hóa mật khẩu trước khi lưu ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

        const sql = `
            INSERT INTO "dangvien" (ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen, ngay_vao_dang, hoat_dong)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, true)
        `;
        // Lưu hashedPassword thay vì mat_khau gốc
        await db.query(sql, [ho_ten, ten_dang_nhap, hashedPassword, ma_chi_bo, cap_quyen || 3]);
        
        res.status(201).json({ message: 'Cấp tài khoản thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo tài khoản' });
    }
};

// 3. Reset Password (Cần mã hóa mật khẩu mới)
exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) return res.status(400).json({ message: 'Mật khẩu mới không được để trống' });

    try {
        // --- 4. CẬP NHẬT: Mã hóa mật khẩu mới ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [hashedPassword, id]);
        res.json({ message: 'Đã cập nhật mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật mật khẩu' });
    }
};

// 4. Toggle Status - Khóa/Mở khóa (Giữ nguyên)
exports.toggleStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.query('SELECT hoat_dong FROM "dangvien" WHERE ma_dang_vien = $1', [id]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User không tồn tại' });
        }

        const currentStatus = user.rows[0].hoat_dong; 
        const newStatus = currentStatus === false ? true : false;
        
        await db.query('UPDATE "dangvien" SET hoat_dong = $1 WHERE ma_dang_vien = $2', [newStatus, id]);
        
        res.json({ 
            message: newStatus ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa/ẩn tài khoản thành công',
            status: newStatus
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
    }
};

// 5. Update Role - Cập nhật quyền & chức vụ
exports.updateRole = async (req, res) => {
    const { id } = req.params;
    const { cap_quyen, chuc_vu_dang } = req.body;

    if (!cap_quyen) return res.status(400).json({ message: 'Thiếu thông tin quyền' });

    // Nếu đổi về cấp 3, tự động reset chức vụ về Đảng viên
    const finalChucVu = (parseInt(cap_quyen) === 3) ? 'Dang vien' : (chuc_vu_dang || 'Dang vien');

    try {
        await db.query(
            'UPDATE "dangvien" SET cap_quyen = $1, chuc_vu_dang = $2 WHERE ma_dang_vien = $3',
            [parseInt(cap_quyen), finalChucVu, id]
        );
        res.json({ message: 'Cập nhật quyền thành công', cap_quyen: parseInt(cap_quyen), chuc_vu_dang: finalChucVu });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật quyền' });
    }
};

// const db = require('../config/db');
// const jwt = require('jsonwebtoken');

// // 1. Login
// exports.login = async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const result = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [username]);
//         if (result.rows.length === 0) return res.status(401).json({ message: 'Tài khoản không tồn tại' });
        
//         const user = result.rows[0];

//         // KIỂM TRA TRẠNG THÁI HOẠT ĐỘNG
//         if (user.hoat_dong === false) {
//             return res.status(403).json({ message: 'Tài khoản này đã bị khóa/ẩn!' });
//         }

//         if (user.mat_khau !== password) return res.status(401).json({ message: 'Mật khẩu sai' });

//         // --- CẬP NHẬT: THÊM branchId VÀO TOKEN ---
//         const token = jwt.sign(
//             { 
//                 id: user.ma_dang_vien, 
//                 role: user.cap_quyen, 
//                 name: user.ho_ten,
//                 branchId: user.ma_chi_bo // <--- QUAN TRỌNG: Lưu mã chi bộ vào Token để phân quyền dữ liệu
//             }, 
//             process.env.JWT_SECRET, 
//             { expiresIn: '1d' }
//         );
        
//         res.json({ message: 'Đăng nhập thành công', token, user });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi server' });
//     }
// };

// // 2. Register (Cấp tài khoản)
// exports.register = async (req, res) => {
//     const { ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen } = req.body;
//     if (!ho_ten || !ten_dang_nhap || !mat_khau || !ma_chi_bo) {
//         return res.status(400).json({ message: 'Vui lòng điền đủ thông tin!' });
//     }
//     try {
//         const check = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [ten_dang_nhap]);
//         if (check.rows.length > 0) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });

//         const sql = `
//             INSERT INTO "dangvien" (ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen, ngay_vao_dang, hoat_dong)
//             VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, true)
//         `;
//         await db.query(sql, [ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen || 3]);
//         res.status(201).json({ message: 'Cấp tài khoản thành công!' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi tạo tài khoản' });
//     }
// };

// // 3. Reset Password
// exports.resetPassword = async (req, res) => {
//     const { id } = req.params;
//     const { new_password } = req.body;

//     if (!new_password) return res.status(400).json({ message: 'Mật khẩu mới không được để trống' });

//     try {
//         await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [new_password, id]);
//         res.json({ message: 'Đã cập nhật mật khẩu thành công' });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi cập nhật mật khẩu' });
//     }
// };

// // 4. Toggle Status - Khóa/Mở khóa
// exports.toggleStatus = async (req, res) => {
//     const { id } = req.params;
//     try {
//         const user = await db.query('SELECT hoat_dong FROM "dangvien" WHERE ma_dang_vien = $1', [id]);
        
//         if (user.rows.length === 0) {
//             return res.status(404).json({ message: 'User không tồn tại' });
//         }

//         const currentStatus = user.rows[0].hoat_dong; 
//         // Logic: Nếu false -> True. Nếu True/Null -> False.
//         const newStatus = currentStatus === false ? true : false;
        
//         await db.query('UPDATE "dangvien" SET hoat_dong = $1 WHERE ma_dang_vien = $2', [newStatus, id]);
        
//         res.json({ 
//             message: newStatus ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa/ẩn tài khoản thành công',
//             status: newStatus
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
//     }
// };