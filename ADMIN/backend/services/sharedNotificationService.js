const db = require('../config/db');

/**
 * Tạo một thông báo mới trong cơ sở dữ liệu
 * @param {number|null} ma_nguoi_nhan - ID người nhận (ma_chi_bo hoặc ID đảng viên), null nếu gửi tất cả
 * @param {string} quyen_nguoi_nhan - 'Admin' (Chi bộ) hoặc 'User' (Đảng viên) hoặc 'All'
 * @param {string} title - Tiêu đề thông báo
 * @param {string} content - Nội dung chi tiết
 * @param {string} type - 'TARGET', 'DOCUMENT', 'ACTIVITY', 'MEETING', 'FEE'
 */
exports.createNotification = async (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) => {
    try {
        const sql = `
            INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type)
            VALUES ($1, $2, $3, $4, $5)
        `;
        await db.query(sql, [ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type]);
    } catch (error) {
        console.error('[createNotification Error]:', error);
    }
};
