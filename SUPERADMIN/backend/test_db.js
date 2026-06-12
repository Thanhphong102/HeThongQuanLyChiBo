const db = require('./config/db');
async function test() {
    try {
        const sql = `
            SELECT t.*, c.ten_chi_bo 
            FROM "chitieu" t
            JOIN "chibo" c ON t.ma_chi_bo = c.ma_chi_bo
            WHERE 1=1 ORDER BY t.nam_hoc DESC, t.ma_chi_tieu DESC
        `;
        const res = await db.query(sql, []);
        console.log("Success", res.rows.length);
    } catch(e) {
        console.error("ERROR DB", e);
    }
    process.exit(0);
}
test();
