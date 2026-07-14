const cron = require('node-cron');
const db = require('../config/db');
const { createNotification } = require('./sharedNotificationService');
const { sendTransferReminderEmail } = require('./emailService');

const runTransferCron = async () => {
    console.log('[CRON] Đang kiểm tra hồ sơ chuyển Đảng quá hạn...');
    try {
        // Tìm các hồ sơ (Đã gửi, Đang thẩm định) mà đã quá 3 ngày chưa cập nhật
        const query = `
            SELECT tr.*, dv.ho_ten, dv.ma_chi_bo 
            FROM "TransferRequests" tr
            JOIN "dangvien" dv ON tr.ma_dang_vien = dv.ma_dang_vien
            WHERE tr.trang_thai IN ('Da_Gui', 'Dang_Tham_Dinh')
            AND tr.ngay_cap_nhat < NOW() - INTERVAL '3 days'
        `;
        const res = await db.query(query);
        
        if (res.rows.length > 0) {
            console.log(`[CRON] Cảnh báo: Có ${res.rows.length} hồ sơ quá hạn xử lý!`);
            // Tại đây có thể tích hợp code gửi Email hoặc tạo Notification cho Admin
            for (let req of res.rows) {
                console.log(`- Yêu cầu #${req.id} của Đảng viên ${req.ho_ten} (Chi bộ: ${req.ma_chi_bo})`);
                // Ví dụ logic tạo thông báo (nếu có bảng Notification):
                // await db.query('INSERT INTO "Notifications" ...');
            }
        } else {
            console.log('[CRON] Tuyệt vời! Không có hồ sơ nào quá hạn.');
        }
    } catch (error) {
        console.error('[CRON] Lỗi khi kiểm tra hồ sơ quá hạn:', error);
    }

    console.log('[CRON] Đang kiểm tra Đảng viên đến hạn chuyển Đảng chính thức (11 tháng)...');
    try {
        // Tìm Đảng viên đã kết nạp >= 11 tháng nhưng chưa có ngày chính thức
        // Cần đảm bảo họ chưa gửi yêu cầu Chuyển chính thức nào (hoặc yêu cầu đó đã bị hủy).
        const query11Months = `
            SELECT dv.ma_dang_vien, dv.ho_ten, dv.email, dv.ma_chi_bo
            FROM dangvien dv
            WHERE dv.ngay_chinh_thuc IS NULL 
              AND dv.ngay_vao_dang IS NOT NULL
              AND EXTRACT(MONTH FROM AGE(CURRENT_DATE, dv.ngay_vao_dang)) + EXTRACT(YEAR FROM AGE(CURRENT_DATE, dv.ngay_vao_dang)) * 12 >= 11
              AND dv.hoat_dong = true
              AND NOT EXISTS (
                  SELECT 1 FROM "TransferRequests" tr 
                  WHERE tr.ma_dang_vien = dv.ma_dang_vien 
                    AND tr.loai_chuyen = 'Chuyển chính thức' 
                    AND tr.trang_thai != 'Da_Huy'
              )
        `;
        const res11Months = await db.query(query11Months);
        
        if (res11Months.rows.length > 0) {
            console.log(`[CRON] Có ${res11Months.rows.length} Đảng viên đến hạn chuyển Đảng chính thức!`);
            for (let dv of res11Months.rows) {
                // 1. Gửi Email nhắc nhở
                if (dv.email) {
                    await sendTransferReminderEmail(dv.email, dv.ho_ten);
                }
                
                // 2. Tạo thông báo trong hệ thống cho Đảng viên
                await createNotification(
                    dv.ma_dang_vien, 
                    'User', 
                    'Nhắc nhở làm hồ sơ chuyển Đảng chính thức', 
                    `Đồng chí đã sắp đến hạn 12 tháng dự bị. Vui lòng vào mục "Chuyển sinh hoạt" để tạo yêu cầu "Chuyển chính thức".`, 
                    'TRANSFER_NEW'
                );

                // 3. Tạo thông báo cho Admin (Chi ủy) để đôn đốc
                await createNotification(
                    dv.ma_chi_bo,
                    'Admin',
                    'Đảng viên đến hạn chuyển Đảng chính thức',
                    `Đảng viên ${dv.ho_ten} đã đến hạn 11 tháng dự bị. Hệ thống đã gửi email nhắc nhở đảng viên làm hồ sơ.`,
                    'TRANSFER_REMINDER'
                );
            }
        } else {
            console.log('[CRON] Không có Đảng viên nào cần nhắc nhở hôm nay.');
        }
    } catch (error) {
        console.error('[CRON] Lỗi khi kiểm tra 11 tháng:', error);
    }
};

// Chạy vào 8:00 sáng mỗi ngày: '0 8 * * *'
// (Để test, bạn có thể đổi thành '* * * * *' chạy mỗi phút)
cron.schedule('0 8 * * *', runTransferCron);

console.log('Cronjob nhắc việc chuyển Đảng đã được khởi tạo!');

module.exports = { runTransferCron };
