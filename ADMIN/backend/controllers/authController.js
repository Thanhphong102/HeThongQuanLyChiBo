const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // <--- IMPORT BCRYPT

// 1. Login
exports.login = async (req, res) => {
    const { ten_dang_nhap, mat_khau } = req.body;

    if (!ten_dang_nhap || !mat_khau) {
        return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' });
    }

    try {
        const usernameClean = ten_dang_nhap.trim();

        const result = await db.query(`
            SELECT d.*, c.ten_chi_bo 
            FROM "dangvien" d
            LEFT JOIN "chibo" c ON d.ma_chi_bo = c.ma_chi_bo
            WHERE d.ten_dang_nhap = $1
        `, [usernameClean]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Tài khoản không tồn tại' });
        }
        
        const user = result.rows[0];

        if (user.hoat_dong === false) {
            return res.status(403).json({ message: 'Tài khoản này đã bị khóa/ẩn!' });
        }

        // --- [SỬA ĐỔI QUAN TRỌNG] SO SÁNH MẬT KHẨU MÃ HÓA ---
        // bcrypt.compare(mật_khau_nhập, mật_khau_trong_db_đã_mã_hóa)
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu sai' });
        }

        if (user.cap_quyen !== 2 && user.cap_quyen !== 3) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập hệ thống này!' });
        }

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
        
        res.json({ 
            message: 'Đăng nhập thành công', 
            token, 
            user: {
                ...user,
                ten_chi_bo: user.ten_chi_bo || 'Chưa xác định'
            }
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 2. Register (Admin tạo user cấp 2)
exports.register = async (req, res) => {
    const { ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen } = req.body;

    if (!ho_ten || !ten_dang_nhap || !mat_khau || !ma_chi_bo) {
        return res.status(400).json({ message: 'Vui lòng điền đủ thông tin!' });
    }

    try {
        const check = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [ten_dang_nhap]);
        if (check.rows.length > 0) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
        }

        // --- [SỬA ĐỔI] MÃ HÓA MẬT KHẨU TRƯỚC KHI LƯU ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

        const sql = `
            INSERT INTO "dangvien" (ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen, ngay_vao_dang, hoat_dong)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, true)
        `;
        await db.query(sql, [ho_ten, ten_dang_nhap, hashedPassword, ma_chi_bo, cap_quyen || 3]); // Lưu hashedPassword
        
        res.status(201).json({ message: 'Cấp tài khoản thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo tài khoản' });
    }
};

// 3. Reset Password (Tự đổi mật khẩu)
exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới' });
    }

    try {
        // --- [SỬA ĐỔI] MÃ HÓA MẬT KHẨU MỚI ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [hashedPassword, id]);
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật mật khẩu' });
    }
};

// 4. Toggle Status (Giữ nguyên)
exports.toggleStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db.query('SELECT hoat_dong FROM "dangvien" WHERE ma_dang_vien = $1', [id]);
        
        if (user.rows.length === 0) return res.status(404).json({ message: 'User không tồn tại' });

        const currentStatus = user.rows[0].hoat_dong === false ? false : true;
        const newStatus = !currentStatus;
        
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


// const db = require('../config/db');
// const jwt = require('jsonwebtoken');

// // 1. Login (Dành cho Bí thư Chi bộ VÀ Đảng viên)
// exports.login = async (req, res) => {
//     // SỬA 1: Nhận đúng tên biến từ Frontend gửi lên (ten_dang_nhap, mat_khau)
//     const { ten_dang_nhap, mat_khau } = req.body;

//     // Kiểm tra dữ liệu đầu vào
//     if (!ten_dang_nhap || !mat_khau) {
//         return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' });
//     }

//     try {
//         // Xử lý khoảng trắng (trim) để tránh lỗi nhập liệu
//         const usernameClean = ten_dang_nhap.trim();

//         // Thực hiện JOIN để lấy luôn tên chi bộ hiển thị lên giao diện
//         const result = await db.query(`
//             SELECT d.*, c.ten_chi_bo 
//             FROM "dangvien" d
//             LEFT JOIN "chibo" c ON d.ma_chi_bo = c.ma_chi_bo
//             WHERE d.ten_dang_nhap = $1
//         `, [usernameClean]);
        
//         if (result.rows.length === 0) {
//             return res.status(401).json({ message: 'Tài khoản không tồn tại' });
//         }
        
//         const user = result.rows[0];

//         // Kiểm tra trạng thái hoạt động (Nếu false là bị khóa)
//         if (user.hoat_dong === false) {
//             return res.status(403).json({ message: 'Tài khoản này đã bị khóa/ẩn!' });
//         }

//         // SỬA 2: So sánh mật khẩu (backend đang lưu text thường)
//         // Lưu ý: user.mat_khau là trong DB, mat_khau là từ Frontend gửi lên
//         if (user.mat_khau !== mat_khau) {
//             return res.status(401).json({ message: 'Mật khẩu sai' });
//         }

//         // SỬA 3: Mở rộng quyền truy cập
//         // Cho phép Cấp 2 (Bí thư) VÀ Cấp 3 (Đảng viên/User) đăng nhập
//         if (user.cap_quyen !== 2 && user.cap_quyen !== 3) {
//             return res.status(403).json({ message: 'Bạn không có quyền truy cập hệ thống này!' });
//         }

//         // Tạo Token chứa branchId để phân quyền dữ liệu cho các chức năng khác
//         const token = jwt.sign(
//             { 
//                 id: user.ma_dang_vien, 
//                 role: user.cap_quyen, 
//                 name: user.ho_ten,
//                 branchId: user.ma_chi_bo // ID Chi bộ dùng để lọc dữ liệu
//             }, 
//             process.env.JWT_SECRET, 
//             { expiresIn: '1d' }
//         );
        
//         // Trả về thông tin user kèm tên chi bộ
//         res.json({ 
//             message: 'Đăng nhập thành công', 
//             token, 
//             user: {
//                 ...user,
//                 ten_chi_bo: user.ten_chi_bo || 'Chưa xác định'
//             }
//         });
//     } catch (error) {
//         console.error("Lỗi đăng nhập:", error);
//         res.status(500).json({ message: 'Lỗi server' });
//     }
// };

// // 2. Register (Cấp tài khoản - Dành cho Admin tạo user cấp dưới)
// exports.register = async (req, res) => {
//     const { ho_ten, ten_dang_nhap, mat_khau, ma_chi_bo, cap_quyen } = req.body;

//     // Validate cơ bản
//     if (!ho_ten || !ten_dang_nhap || !mat_khau || !ma_chi_bo) {
//         return res.status(400).json({ message: 'Vui lòng điền đủ thông tin!' });
//     }

//     try {
//         // Kiểm tra trùng tên đăng nhập
//         const check = await db.query('SELECT * FROM "dangvien" WHERE ten_dang_nhap = $1', [ten_dang_nhap]);
//         if (check.rows.length > 0) {
//             return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
//         }

//         // Thêm mới vào DB
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

// // 3. Reset Password (Đổi mật khẩu)
// exports.resetPassword = async (req, res) => {
//     const { id } = req.params; // ID người cần đổi
//     const { new_password } = req.body;

//     if (!new_password) {
//         return res.status(400).json({ message: 'Vui lòng nhập mật khẩu mới' });
//     }

//     try {
//         // Cập nhật mật khẩu mới
//         await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [new_password, id]);
//         res.json({ message: 'Đổi mật khẩu thành công' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi cập nhật mật khẩu' });
//     }
// };

// // 4. Toggle Status - Khóa/Mở khóa tài khoản
// exports.toggleStatus = async (req, res) => {
//     const { id } = req.params;
//     try {
//         // Lấy trạng thái hiện tại
//         const user = await db.query('SELECT hoat_dong FROM "dangvien" WHERE ma_dang_vien = $1', [id]);
        
//         if (user.rows.length === 0) {
//             return res.status(404).json({ message: 'User không tồn tại' });
//         }

//         // Logic đảo ngược chuẩn:
//         const currentStatus = user.rows[0].hoat_dong === false ? false : true;
//         const newStatus = !currentStatus;
        
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

