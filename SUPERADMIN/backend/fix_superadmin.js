const bcrypt = require('bcrypt');
const db = require('./config/db');

async function fixSuperadmin() {
    try {
        const username = 'superadminctut';
        const rawPassword = 'superadmin123456';
        
        console.log(`Bắt đầu khôi phục mật khẩu cho: ${username}`);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);
        
        const result = await db.query(
            'UPDATE "dangvien" SET mat_khau = $1 WHERE ten_dang_nhap = $2 RETURNING *',
            [hashedPassword, username]
        );
        
        if (result.rowCount > 0) {
            console.log('Khôi phục mật khẩu thành công!');
        } else {
            console.log('Không tìm thấy tài khoản', username);
        }
    } catch (error) {
        console.error('Lỗi khi khôi phục:', error);
    } finally {
        // Cần kết thúc script (đóng pool nếu db export pool)
        process.exit();
    }
}

fixSuperadmin();
