const db = require('./config/db');
async function test() {
    try {
        const sql = `
            SELECT t.*, c.ten_chi_bo 
            FROM "chitieu" t
            JOIN "chibo" c ON t.ma_chi_bo = c.ma_chi_bo
            WHERE 1=1 AND (f_unaccent(t.ten_chi_tieu) ILIKE f_unaccent($1) OR f_unaccent(t.ten_chi_tieu) % f_unaccent($2))
            ORDER BY t.nam_hoc DESC, t.ma_chi_tieu DESC
        `;
        const res = await db.query(sql, ['%a%', 'a']);
        console.log("Success", res.rows.length);
    } catch(e) {
        console.error("ERROR DB", e);
    }
    process.exit(0);
}
test();
