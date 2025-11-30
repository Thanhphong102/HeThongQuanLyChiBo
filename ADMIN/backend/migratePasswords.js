// migratePasswords.js
const db = require('./config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

const migrate = async () => {
    try {
        console.log("--> Bắt đầu chuyển đổi mật khẩu sang mã hóa...");
        
        // 1. Lấy tất cả user có mật khẩu chưa được mã hóa (Mật khẩu ngắn < 20 ký tự thường là chưa mã hóa)
        const res = await db.query('SELECT ma_dang_vien, mat_khau FROM "dangvien" WHERE LENGTH(mat_khau) < 20');
        const users = res.rows;

        console.log(`--> Tìm thấy ${users.length} tài khoản cần cập nhật.`);

        for (const user of users) {
            // Mã hóa mật khẩu hiện tại
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(user.mat_khau, salt);

            // Cập nhật lại vào DB
            await db.query('UPDATE "dangvien" SET mat_khau = $1 WHERE ma_dang_vien = $2', [hashed, user.ma_dang_vien]);
            console.log(`✅ Đã mã hóa User ID: ${user.ma_dang_vien}`);
        }

        console.log("--> HOÀN TẤT CHUYỂN ĐỔI!");
        process.exit();
    } catch (error) {
        console.error("Lỗi:", error);
        process.exit(1);
    }
};

migrate();