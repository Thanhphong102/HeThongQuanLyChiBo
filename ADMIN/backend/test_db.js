const db = require('./config/db');
const bcrypt = require('bcrypt');

(async () => {
    try {
        const matKhauTam = '123456';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(matKhauTam, salt);
        const reqUserId = 2; // Giả lập admin
        const id = 2; // Giả lập user cần đổi pass

        await db.query(
            `UPDATE "dangvien" 
             SET mat_khau = $1, buoc_doi_mat_khau = true, nguoi_cap_nhat = $2 
             WHERE ma_dang_vien = $3`,
            [hashedPassword, reqUserId, id]
        );
        console.log("Thành công update!");
    } catch (e) {
        console.error("LỖI DB:", e.message);
    } finally {
        process.exit();
    }
})();
