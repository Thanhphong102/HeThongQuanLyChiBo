const db = require('../config/db');
const { createNotification } = require('../services/sharedNotificationService');

exports.getNotifications = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;
    const userRole = req.user.role; // 2: Chi ủy (Admin), khác: Đảng viên (User)
    
    // Convert logic role
    const roleString = userRole === 2 ? 'Admin' : 'User';

    try {
        // --- LOGIC ĐẢNG PHÍ (Dành cho User) ---
        if (roleString === 'User') {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            
            // Theo yêu cầu: Chỉ check và tạo vào đầu tháng. 
            // Giả lập logic: Nếu lấy danh sách thông báo mà chưa đóng thì tạo (nếu chưa có).
            // Nếu đã đóng thì xóa/ẩn thông báo Đảng phí của tháng đó.

            const feeQuery = `
                SELECT ma_giao_dich 
                FROM "taichinh"
                WHERE ma_dang_vien = $1 AND loai_giao_dich = 'Thu' 
                  AND EXTRACT(MONTH FROM ngay_giao_dich) = $2 
                  AND EXTRACT(YEAR FROM ngay_giao_dich) = $3
            `;
            const feeRes = await db.query(feeQuery, [userId, currentMonth, currentYear]);
            
            if (feeRes.rows.length === 0) {
                // Chưa đóng -> Kiểm tra xem đã tạo thông báo nhắc nhở chưa
                const checkNotifySql = `
                    SELECT ma_thong_bao FROM thongbao 
                    WHERE ma_nguoi_nhan = $1 AND quyen_nguoi_nhan = 'User' AND loai_thong_bao = 'FEE' AND da_xoa = false
                `;
                const checkNotifyRes = await db.query(checkNotifySql, [userId]);
                if (checkNotifyRes.rows.length === 0) {
                    await createNotification(
                        userId, 
                        'User', 
                        'Nhắc nhở Đảng phí', 
                        `Bạn chưa đóng Đảng phí tháng ${currentMonth}/${currentYear}. Vui lòng hoàn thành sớm.`, 
                        'FEE'
                    );
                }
            } else {
                // Đã đóng -> Cập nhật thông báo FEE thành da_xoa
                await db.query(`
                    UPDATE "thongbao" SET da_xoa = true 
                    WHERE ma_nguoi_nhan = $1 AND quyen_nguoi_nhan = 'User' AND loai_thong_bao = 'FEE'
                `, [userId]);
            }
        }

        // --- LẤY TẤT CẢ THÔNG BÁO TỪ BẢNG thongbao ---
        let dbNotifyQuery = `
            SELECT * FROM "thongbao"
            WHERE da_xoa = false AND (
                (quyen_nguoi_nhan = 'All') OR
                (quyen_nguoi_nhan = 'Admin' AND ma_nguoi_nhan = $1 AND $2 = 2) OR
                (quyen_nguoi_nhan = 'Admin' AND ma_nguoi_nhan IS NULL AND $2 = 2) OR
                (quyen_nguoi_nhan = 'User' AND ma_nguoi_nhan = $3 AND $2 <> 2) OR
                (quyen_nguoi_nhan = 'User' AND ma_nguoi_nhan::text = $4::text AND $2 <> 2)
            )
            ORDER BY ngay_tao DESC LIMIT 50
        `;
        const dbNotifyRes = await db.query(dbNotifyQuery, [branchId, userRole, userId, branchId]);

        const notifications = dbNotifyRes.rows.map(n => ({
            id: n.ma_thong_bao || n.id,   // hỗ trợ cả 2 tên cột
            type: n.loai_thong_bao || 'general',
            title: n.tieu_de,
            message: n.noi_dung,
            date: n.ngay_tao,
            isUnread: !n.da_doc
        }));

        res.json(notifications);

    } catch (error) {
        console.error('[getNotifications Error]: ', error);
        res.status(500).json({ message: 'Lỗi tải trung tâm thông báo' });
    }
};

// Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE "thongbao" SET da_doc = true WHERE ma_thong_bao = $1', [id]);
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        console.error('[markAsRead Error]:', error);
        res.status(500).json({ message: 'Lỗi cập nhật thông báo' });
    }
};

// Đánh dấu thông báo chưa đọc
exports.markAsUnread = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE "thongbao" SET da_doc = false WHERE ma_thong_bao = $1', [id]);
        res.json({ message: 'Đã đánh dấu chưa đọc' });
    } catch (error) {
        console.error('[markAsUnread Error]:', error);
        res.status(500).json({ message: 'Lỗi cập nhật thông báo' });
    }
};

// Đánh dấu TẤT CẢ thông báo là đã đọc (dùng cùng điều kiện lọc như getNotifications)
exports.markAllAsRead = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        // Dùng cùng bộ lọc như getNotifications để đảm bảo đánh dấu đúng TẤT CẢ thông báo
        // mà user này được nhìn thấy (bao gồm cả loại 'All', 'Admin', 'User')
        const updateSql = `
            UPDATE "thongbao" SET da_doc = true
            WHERE da_xoa = false AND da_doc = false AND (
                (quyen_nguoi_nhan = 'All') OR
                (quyen_nguoi_nhan = 'Admin' AND ma_nguoi_nhan = $1 AND $2 = 2) OR
                (quyen_nguoi_nhan = 'Admin' AND ma_nguoi_nhan IS NULL AND $2 = 2) OR
                (quyen_nguoi_nhan = 'User' AND ma_nguoi_nhan = $3 AND $2 <> 2) OR
                (quyen_nguoi_nhan = 'User' AND ma_nguoi_nhan::text = $4::text AND $2 <> 2)
            )
        `;
        await db.query(updateSql, [branchId, userRole, userId, branchId]);
        res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (error) {
        console.error('[markAllAsRead Error]:', error);
        res.status(500).json({ message: 'Lỗi cập nhật thông báo' });
    }
};

// Xóa (Soft delete) một thông báo
exports.deleteNotification = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE "thongbao" SET da_xoa = true WHERE ma_thong_bao = $1', [id]);
        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        console.error('[deleteNotification Error]:', error);
        res.status(500).json({ message: 'Lỗi xóa thông báo' });
    }
};

// Xóa (Soft delete) tất cả thông báo
exports.deleteAllNotifications = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;
    const userRole = req.user.role; 

    try {
        if (userRole === 2) {
            await db.query('UPDATE "thongbao" SET da_xoa = true WHERE quyen_nguoi_nhan = $1 AND ma_nguoi_nhan = $2', ['Admin', branchId]);
        } else {
            await db.query('UPDATE "thongbao" SET da_xoa = true WHERE quyen_nguoi_nhan = $1 AND ma_nguoi_nhan = $2', ['User', userId]);
        }
        res.json({ message: 'Đã xóa tất cả thông báo' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa tất cả thông báo' });
    }
};
