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
            'SELECT COUNT(*) FROM "dangvien" WHERE ma_chi_bo = $1', 
            [branchId]
        );

        // 2. Số đảng viên Dự bị (Để vẽ biểu đồ)
        // Giả sử trạng thái dự bị lưu là 'Du bi' hoặc boolean (tùy DB của bạn)
        // Ở đây giả định text 'Du bi'
        const reserveMembers = await db.query(
            'SELECT COUNT(*) FROM "dangvien" WHERE ma_chi_bo = $1 AND trang_thai_dang_vien = $2',
            [branchId, 'Du bi'] 
        );

        // 3. Cuộc họp sắp tới (Lấy bản ghi mới nhất trong tương lai)
        const nextMeeting = await db.query(
            'SELECT * FROM "lichsinhhoat" WHERE ma_chi_bo = $1 AND thoi_gian > NOW() ORDER BY thoi_gian ASC LIMIT 1',
            [branchId]
        );

        // 4. Văn bản mới từ cấp trên (Lấy 5 văn bản mới nhất từ bảng tailieu)
        // tailieu là bảng chung, chi bộ nào cũng thấy được
        const recentDocs = await db.query(
            'SELECT * FROM "tailieu" ORDER BY ngay_tai_len DESC LIMIT 5'
        );

        // 5. Tính toán số liệu
        const total = parseInt(totalMembers.rows[0].count);
        const reserve = parseInt(reserveMembers.rows[0].count);
        
        // Demo số liệu tài chính (sẽ làm thật sau)
        const unpaidCount = 0; 

        res.json({
            totalMembers: total,
            reserveMembers: reserve,
            officialMembers: total - reserve,
            nextMeeting: nextMeeting.rows[0] || null,
            unpaidFeeCount: unpaidCount,
            recentDocs: recentDocs.rows
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: 'Lỗi lấy thống kê Dashboard' });
    }
};