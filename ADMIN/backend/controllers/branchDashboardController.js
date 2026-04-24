const db = require('../config/db');

exports.getStats = async (req, res) => {
    // Lấy branchId từ Token (được giải mã ở middleware authMiddleware)
    const branchId = req.user.branchId;

    if (!branchId) {
        return res.status(400).json({ message: 'Không xác định được Chi bộ của bạn' });
    }

    try {
        // 1. Tổng số đảng viên của chi bộ này
        const totalMembers = await db.query(
            'SELECT COUNT(*) FROM "dangvien" WHERE ma_chi_bo = $1 AND hoat_dong = true', 
            [branchId]
        );

        // 2. Số đảng viên Dự bị (Để vẽ biểu đồ)
        const reserveMembers = await db.query(
            'SELECT COUNT(*) FROM "dangvien" WHERE ma_chi_bo = $1 AND trang_thai_dang_vien = $2 AND hoat_dong = true',
            [branchId, 'Du bi'] 
        );

        // 3. Cuộc họp sắp tới (Lấy bản ghi mới nhất trong tương lai)
        const nextMeeting = await db.query(
            'SELECT * FROM "lichsinhhoat" WHERE ma_chi_bo = $1 AND thoi_gian > NOW() ORDER BY thoi_gian ASC LIMIT 1',
            [branchId]
        );

        // 4. Văn bản mới từ cấp trên (Lấy 5 văn bản mới nhất từ bảng tailieu)
        const recentDocs = await db.query(
            'SELECT * FROM "tailieu" ORDER BY ngay_tai_len DESC LIMIT 5'
        );

        // 5. [MỚI] Tổng quỹ Chi bộ: Tính tổng Thu - Tổng Chi
        const fundQuery = await db.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN loai_giao_dich = 'Thu' THEN so_tien ELSE 0 END), 0) AS tong_thu,
                COALESCE(SUM(CASE WHEN loai_giao_dich = 'Chi' THEN so_tien ELSE 0 END), 0) AS tong_chi
             FROM "taichinh" WHERE ma_chi_bo = $1`,
            [branchId]
        );

        // 6. [MỚI] Thống kê theo Giới tính
        const genderStats = await db.query(
            `SELECT gioi_tinh, COUNT(*) as so_luong 
             FROM "dangvien" 
             WHERE ma_chi_bo = $1 AND hoat_dong = true AND gioi_tinh IS NOT NULL
             GROUP BY gioi_tinh`,
            [branchId]
        );

        // 7. [MỚI] Thống kê theo Quê quán (Tỉnh/Thành)
        const hometownStats = await db.query(
            `SELECT que_quan, COUNT(*) as so_luong 
             FROM "dangvien" 
             WHERE ma_chi_bo = $1 AND hoat_dong = true AND que_quan IS NOT NULL AND que_quan != ''
             GROUP BY que_quan
             ORDER BY so_luong DESC
             LIMIT 10`,
            [branchId]
        );

        // 8. [MỚI] Phân bố độ tuổi
        const ageStatsQuery = await db.query(
            `SELECT 
               SUM(CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ngay_sinh)) < 22 THEN 1 ELSE 0 END) as "duoi_22",
               SUM(CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ngay_sinh)) BETWEEN 22 AND 25 THEN 1 ELSE 0 END) as "t22_25",
               SUM(CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ngay_sinh)) BETWEEN 26 AND 30 THEN 1 ELSE 0 END) as "t26_30",
               SUM(CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ngay_sinh)) > 30 THEN 1 ELSE 0 END) as "tren_30",
               SUM(CASE WHEN ngay_sinh IS NULL THEN 1 ELSE 0 END) as "chua_cap_nhat"
             FROM "dangvien" 
             WHERE ma_chi_bo = $1 AND hoat_dong = true`,
            [branchId]
        );

        // 9. Tính toán số liệu
        const total = parseInt(totalMembers.rows[0].count);
        const reserve = parseInt(reserveMembers.rows[0].count);
        const tongThu = parseFloat(fundQuery.rows[0].tong_thu) || 0;
        const tongChi = parseFloat(fundQuery.rows[0].tong_chi) || 0;
        const tongQuy = tongThu - tongChi;

        res.json({
            totalMembers: total,
            reserveMembers: reserve,
            officialMembers: total - reserve,
            nextMeeting: nextMeeting.rows[0] || null,
            // [ĐÃ THAY] unpaidFeeCount -> tongQuy
            tongQuy: tongQuy,
            tongThu: tongThu,
            tongChi: tongChi,
            recentDocs: recentDocs.rows,
            // [MỚI]
            genderStats: genderStats.rows,
            hometownStats: hometownStats.rows,
            ageStats: ageStatsQuery.rows[0],
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: 'Lỗi lấy thống kê Dashboard' });
    }
};