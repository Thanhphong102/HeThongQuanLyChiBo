const db = require('./config/db');

async function checkUser() {
    try {
        const result = await db.query('SELECT ten_dang_nhap, cap_quyen FROM "dangvien" WHERE ten_dang_nhap = $1', ['superadminctut']);
        console.log(result.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
checkUser();
