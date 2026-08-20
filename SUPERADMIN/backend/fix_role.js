const db = require('./config/db');

async function fixRole() {
    try {
        await db.query('UPDATE "dangvien" SET cap_quyen = 1 WHERE ten_dang_nhap = $1', ['superadminctut']);
        console.log('Fixed role to 1');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
fixRole();
