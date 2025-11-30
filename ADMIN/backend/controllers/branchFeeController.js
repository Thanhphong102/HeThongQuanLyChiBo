const db = require('../config/db');

// 1. GET: Lấy dữ liệu tài chính (Tự động phân quyền Admin/User)
exports.getFeeData = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;   // ID của người đang đăng nhập
    const userRole = req.user.role; // Quyền hạn (2: Admin, 3: User)
    const year = req.query.year || new Date().getFullYear();

    try {
        // --- TRƯỜNG HỢP 1: LÀ USER (Đảng viên - Cấp 3) ---
        // Chỉ lấy lịch sử đóng tiền/chi tiêu của CHÍNH MÌNH
        if (userRole === 3) {
            const sql = `
                SELECT * FROM "taichinh" 
                WHERE ma_dang_vien = $1 
                ORDER BY ngay_giao_dich DESC
            `;
            const result = await db.query(sql, [userId]);
            
            // Trả về mảng danh sách giao dịch ngay lập tức
            return res.json(result.rows);
        }

        // --- TRƯỜNG HỢP 2: LÀ ADMIN (Bí thư - Cấp 2) ---
        // Giữ nguyên logic cũ để vẽ bảng Matrix quản lý
        
        // 1. Lấy danh sách đảng viên
        const members = await db.query(
            `SELECT ma_dang_vien, ho_ten, muc_dong_phi FROM "dangvien" 
             WHERE ma_chi_bo = $1 AND hoat_dong = true 
             ORDER BY ten_dang_nhap ASC`,
            [branchId]
        );

        // 2. Lấy giao dịch Thu
        const incomeTrans = await db.query(
            `SELECT ma_dang_vien, EXTRACT(MONTH FROM ngay_giao_dich) as thang, so_tien 
             FROM "taichinh" 
             WHERE ma_chi_bo = $1 AND loai_giao_dich = 'Thu' AND EXTRACT(YEAR FROM ngay_giao_dich) = $2`,
            [branchId, year]
        );

        // Xử lý Matrix (Logic cũ của bạn)
        const monthlyTotal = Array(13).fill(0);
        const paidMap = {};
        let totalIncomeYear = 0;

        incomeTrans.rows.forEach(t => {
            const amount = parseFloat(t.so_tien);
            paidMap[`${t.ma_dang_vien}-${t.thang}`] = true;
            monthlyTotal[t.thang] += amount;
            totalIncomeYear += amount;
        });

        const matrix = members.rows.map(m => {
            const monthsStatus = {};
            for (let i = 1; i <= 12; i++) {
                monthsStatus[i] = !!paidMap[`${m.ma_dang_vien}-${i}`];
            }
            return { ...m, months: monthsStatus };
        });

        // 3. Lấy giao dịch Chi
        const expenseTrans = await db.query(
            `SELECT * FROM "taichinh" 
             WHERE ma_chi_bo = $1 AND loai_giao_dich = 'Chi' AND EXTRACT(YEAR FROM ngay_giao_dich) = $2
             ORDER BY ngay_giao_dich DESC`,
            [branchId, year]
        );
        
        const totalExpenseYear = expenseTrans.rows.reduce((sum, item) => sum + parseFloat(item.so_tien), 0);

        res.json({
            matrix,
            monthlyTotal,
            expenses: expenseTrans.rows,
            summary: {
                totalIncome: totalIncomeYear,
                totalExpense: totalExpenseYear,
                balance: totalIncomeYear - totalExpenseYear
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy dữ liệu tài chính' });
    }
};

// ... (Giữ nguyên các hàm togglePayment, updateFeeLevel, createExpense... bên dưới của bạn)
// 2. POST: Toggle Thu Phí
exports.togglePayment = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;
    const { ma_dang_vien, month, year } = req.body;

    try {
        const member = await db.query('SELECT muc_dong_phi FROM "dangvien" WHERE ma_dang_vien = $1', [ma_dang_vien]);
        const amount = member.rows[0]?.muc_dong_phi || 50000;

        const check = await db.query(
            `SELECT ma_giao_dich FROM "taichinh" 
             WHERE ma_dang_vien = $1 AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
               AND EXTRACT(YEAR FROM ngay_giao_dich) = $3 AND loai_giao_dich = 'Thu'`,
            [ma_dang_vien, month, year]
        );

        if (check.rows.length > 0) {
            await db.query('DELETE FROM "taichinh" WHERE ma_giao_dich = $1', [check.rows[0].ma_giao_dich]);
            return res.json({ status: false, message: `Hủy đóng T${month}` });
        } else {
            const date = new Date(year, month - 1, 15);
            await db.query(
                `INSERT INTO "taichinh" (ma_chi_bo, ma_dang_vien, loai_giao_dich, so_tien, noi_dung_giao_dich, ngay_giao_dich, nguoi_tao)
                 VALUES ($1, $2, 'Thu', $3, $4, $5, $6)`,
                [branchId, ma_dang_vien, amount, `Đảng phí T${month}/${year}`, date, userId]
            );
            return res.json({ status: true, message: `Đã thu T${month}` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
};

// 3. PUT: Cập nhật mức đóng phí
exports.updateFeeLevel = async (req, res) => {
    const { ma_dang_vien, muc_dong_phi } = req.body;
    try {
        await db.query('UPDATE "dangvien" SET muc_dong_phi = $1 WHERE ma_dang_vien = $2', [muc_dong_phi, ma_dang_vien]);
        res.json({ message: 'Đã cập nhật mức đóng phí' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật mức phí' });
    }
};

// 4. POST: Tạo phiếu Chi
exports.createExpense = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;
    const { so_tien, noi_dung_giao_dich, ngay_giao_dich } = req.body;

    try {
        await db.query(
            `INSERT INTO "taichinh" (ma_chi_bo, loai_giao_dich, so_tien, noi_dung_giao_dich, ngay_giao_dich, nguoi_tao)
             VALUES ($1, 'Chi', $2, $3, $4, $5)`,
            [branchId, so_tien, noi_dung_giao_dich, ngay_giao_dich, userId]
        );
        res.json({ message: 'Đã tạo phiếu chi' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo phiếu chi' });
    }
};

// 5. DELETE: Xóa phiếu chi
exports.deleteExpense = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM \"taichinh\" WHERE ma_giao_dich = $1 AND loai_giao_dich = 'Chi'", [id]);
        res.json({ message: 'Đã xóa phiếu chi' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa' });
    }
};

// 6. PUT: Sửa phiếu chi
exports.updateExpense = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const { so_tien, noi_dung_giao_dich, ngay_giao_dich } = req.body;

    try {
        const check = await db.query(
            `SELECT * FROM "taichinh" WHERE ma_giao_dich = $1 AND ma_chi_bo = $2 AND loai_giao_dich = 'Chi'`,
            [id, branchId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Phiếu chi không tồn tại hoặc không có quyền' });
        }

        await db.query(
            `UPDATE "taichinh" 
             SET so_tien = $1, noi_dung_giao_dich = $2, ngay_giao_dich = $3 
             WHERE ma_giao_dich = $4`,
            [so_tien, noi_dung_giao_dich, ngay_giao_dich, id]
        );

        res.json({ message: 'Cập nhật phiếu chi thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật phiếu chi' });
    }
};

// const db = require('../config/db');

// // 1. GET: Lấy dữ liệu tài chính tổng hợp (Thu + Chi + Thống kê)
// exports.getFeeData = async (req, res) => {
//     const branchId = req.user.branchId;
//     const year = req.query.year || new Date().getFullYear();

//     try {
//         // --- PHẦN 1: THU (ĐẢNG PHÍ) ---
        
//         // Lấy danh sách đảng viên + mức đóng
//         const members = await db.query(
//             `SELECT ma_dang_vien, ho_ten, muc_dong_phi FROM "dangvien" 
//              WHERE ma_chi_bo = $1 AND hoat_dong = true 
//              ORDER BY ten_dang_nhap ASC`,
//             [branchId]
//         );

//         // Lấy giao dịch Thu trong năm
//         const incomeTrans = await db.query(
//             `SELECT ma_dang_vien, EXTRACT(MONTH FROM ngay_giao_dich) as thang, so_tien 
//              FROM "taichinh" 
//              WHERE ma_chi_bo = $1 AND loai_giao_dich = 'Thu' AND EXTRACT(YEAR FROM ngay_giao_dich) = $2`,
//             [branchId, year]
//         );

//         // Tính toán Ma trận & Tổng thu từng tháng
//         const monthlyTotal = Array(13).fill(0); // Index 1-12 tương ứng tháng
//         const paidMap = {};
//         let totalIncomeYear = 0;

//         incomeTrans.rows.forEach(t => {
//             const amount = parseFloat(t.so_tien);
//             paidMap[`${t.ma_dang_vien}-${t.thang}`] = true;
//             monthlyTotal[t.thang] += amount; // Cộng dồn tiền tháng đó
//             totalIncomeYear += amount;      // Cộng dồn tổng năm
//         });

//         const matrix = members.rows.map(m => {
//             const monthsStatus = {};
//             for (let i = 1; i <= 12; i++) {
//                 monthsStatus[i] = !!paidMap[`${m.ma_dang_vien}-${i}`];
//             }
//             return {
//                 ...m,
//                 months: monthsStatus
//             };
//         });

//         // --- PHẦN 2: CHI (EXPENSE) ---
//         const expenseTrans = await db.query(
//             `SELECT * FROM "taichinh" 
//              WHERE ma_chi_bo = $1 AND loai_giao_dich = 'Chi' AND EXTRACT(YEAR FROM ngay_giao_dich) = $2
//              ORDER BY ngay_giao_dich DESC`,
//             [branchId, year]
//         );
        
//         const totalExpenseYear = expenseTrans.rows.reduce((sum, item) => sum + parseFloat(item.so_tien), 0);

//         // --- TRẢ VỀ KẾT QUẢ (Cấu trúc này khớp với Frontend) ---
//         res.json({
//             matrix,
//             monthlyTotal, // Mảng tổng tiền [0, T1, T2..., T12]
//             expenses: expenseTrans.rows,
//             summary: {
//                 totalIncome: totalIncomeYear,
//                 totalExpense: totalExpenseYear,
//                 balance: totalIncomeYear - totalExpenseYear
//             }
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi lấy dữ liệu tài chính' });
//     }
// };

// // 2. POST: Toggle Thu Phí (Sử dụng mức đóng riêng)
// exports.togglePayment = async (req, res) => {
//     const branchId = req.user.branchId;
//     const userId = req.user.id;
//     const { ma_dang_vien, month, year } = req.body;

//     try {
//         // Lấy mức đóng hiện tại của đảng viên đó
//         const member = await db.query('SELECT muc_dong_phi FROM "dangvien" WHERE ma_dang_vien = $1', [ma_dang_vien]);
//         const amount = member.rows[0]?.muc_dong_phi || 50000; // Mặc định 50k nếu lỗi

//         const check = await db.query(
//             `SELECT ma_giao_dich FROM "taichinh" 
//              WHERE ma_dang_vien = $1 AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
//                AND EXTRACT(YEAR FROM ngay_giao_dich) = $3 AND loai_giao_dich = 'Thu'`,
//             [ma_dang_vien, month, year]
//         );

//         if (check.rows.length > 0) {
//             // Hủy đóng -> Xóa giao dịch
//             await db.query('DELETE FROM "taichinh" WHERE ma_giao_dich = $1', [check.rows[0].ma_giao_dich]);
//             return res.json({ status: false, message: `Hủy đóng T${month}` });
//         } else {
//             // Đóng tiền -> Thêm giao dịch (Số tiền = Mức đóng riêng)
//             const date = new Date(year, month - 1, 15);
//             await db.query(
//                 `INSERT INTO "taichinh" (ma_chi_bo, ma_dang_vien, loai_giao_dich, so_tien, noi_dung_giao_dich, ngay_giao_dich, nguoi_tao)
//                  VALUES ($1, $2, 'Thu', $3, $4, $5, $6)`,
//                 [branchId, ma_dang_vien, amount, `Đảng phí T${month}/${year}`, date, userId]
//             );
//             return res.json({ status: true, message: `Đã thu T${month}` });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi cập nhật' });
//     }
// };

// // 3. PUT: Cập nhật mức đóng phí cho đảng viên
// exports.updateFeeLevel = async (req, res) => {
//     const { ma_dang_vien, muc_dong_phi } = req.body;
//     try {
//         await db.query('UPDATE "dangvien" SET muc_dong_phi = $1 WHERE ma_dang_vien = $2', [muc_dong_phi, ma_dang_vien]);
//         res.json({ message: 'Đã cập nhật mức đóng phí' });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi cập nhật mức phí' });
//     }
// };

// // 4. POST: Tạo phiếu Chi
// exports.createExpense = async (req, res) => {
//     const branchId = req.user.branchId;
//     const userId = req.user.id;
//     const { so_tien, noi_dung_giao_dich, ngay_giao_dich } = req.body;

//     try {
//         await db.query(
//             `INSERT INTO "taichinh" (ma_chi_bo, loai_giao_dich, so_tien, noi_dung_giao_dich, ngay_giao_dich, nguoi_tao)
//              VALUES ($1, 'Chi', $2, $3, $4, $5)`,
//             [branchId, so_tien, noi_dung_giao_dich, ngay_giao_dich, userId]
//         );
//         res.json({ message: 'Đã tạo phiếu chi' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi tạo phiếu chi' });
//     }
// };

// // 5. DELETE: Xóa phiếu chi
// exports.deleteExpense = async (req, res) => {
//     const { id } = req.params;
//     try {
//         await db.query("DELETE FROM \"taichinh\" WHERE ma_giao_dich = $1 AND loai_giao_dich = 'Chi'", [id]);
//         res.json({ message: 'Đã xóa phiếu chi' });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi xóa' });
//     }
// };

// // 6. PUT: Sửa phiếu chi (MỚI)
// exports.updateExpense = async (req, res) => {
//     const { id } = req.params; // ma_giao_dich
//     const branchId = req.user.branchId;
//     const { so_tien, noi_dung_giao_dich, ngay_giao_dich } = req.body;

//     try {
//         // Kiểm tra xem phiếu chi này có thuộc chi bộ không
//         const check = await db.query(
//             `SELECT * FROM "taichinh" WHERE ma_giao_dich = $1 AND ma_chi_bo = $2 AND loai_giao_dich = 'Chi'`,
//             [id, branchId]
//         );

//         if (check.rows.length === 0) {
//             return res.status(404).json({ message: 'Phiếu chi không tồn tại hoặc không có quyền' });
//         }

//         await db.query(
//             `UPDATE "taichinh" 
//              SET so_tien = $1, noi_dung_giao_dich = $2, ngay_giao_dich = $3 
//              WHERE ma_giao_dich = $4`,
//             [so_tien, noi_dung_giao_dich, ngay_giao_dich, id]
//         );

//         res.json({ message: 'Cập nhật phiếu chi thành công' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi cập nhật phiếu chi' });
//     }
// };