const db = require('../config/db');
const { createNotification } = require('../services/sharedNotificationService');

exports.getNotifications = async (req, res) => {
    const branchId = Number(req.user.branchId);
    const userId = Number(req.user.id);
    let userRole = Number(req.user.role); // 2: Chi ủy (Admin), khác: Đảng viên (User)
    
    // Nếu gọi từ trang USER (?app=user), ép role thành User (để lấy thông báo của Đảng viên)
    if (req.query.app === 'user') {
        userRole = 1;
    }

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
        if (!Number.isInteger(userId) || !Number.isInteger(branchId)) {
            return res.status(401).json({ message: 'Token thiếu thông tin người dùng hoặc chi bộ' });
        }

        // Tách truy vấn theo vai trò để các tham số luôn cùng kiểu integer với ma_nguoi_nhan.
        const recipientSql = roleString === 'Admin'
            ? `(quyen_nguoi_nhan = 'Admin' AND (ma_nguoi_nhan = $1 OR ma_nguoi_nhan IS NULL))`
            : `(quyen_nguoi_nhan = 'User' AND ma_nguoi_nhan IN ($1, $2))`;
        const recipientParams = roleString === 'Admin' ? [branchId] : [userId, branchId];
        const dbNotifyQuery = `
            SELECT * FROM "thongbao"
            WHERE da_xoa = false
              AND (quyen_nguoi_nhan = 'All' OR ${recipientSql})
            ORDER BY ngay_tao DESC
            LIMIT 50
        `;
        const dbNotifyRes = await db.query(dbNotifyQuery, recipientParams);

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
    const branchId = Number(req.user.branchId);
    const userId = Number(req.user.id);
    const userRole = Number(req.user.role);
    try {
        // Dùng cùng bộ lọc như getNotifications để đảm bảo đánh dấu đúng TẤT CẢ thông báo
        // mà user này được nhìn thấy (bao gồm cả loại 'All', 'Admin', 'User')
        if (!Number.isInteger(userId) || !Number.isInteger(branchId)) {
            return res.status(401).json({ message: 'Token thiếu thông tin người dùng hoặc chi bộ' });
        }
        const recipientSql = userRole === 2
            ? `(quyen_nguoi_nhan = 'Admin' AND (ma_nguoi_nhan = $1 OR ma_nguoi_nhan IS NULL))`
            : `(quyen_nguoi_nhan = 'User' AND ma_nguoi_nhan IN ($1, $2))`;
        const recipientParams = userRole === 2 ? [branchId] : [userId, branchId];
        const updateSql = `
            UPDATE "thongbao" SET da_doc = true
            WHERE da_xoa = false AND da_doc = false AND (
                (quyen_nguoi_nhan = 'All') OR
                ${recipientSql}
            )
        `;
        await db.query(updateSql, recipientParams);
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
