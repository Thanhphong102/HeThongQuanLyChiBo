const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
pool.query(`
    SELECT ma_lich, tieu_de, thoi_gian, ma_chi_bo, trang_thai_buoi_hop
    FROM "lichsinhhoat"
    ORDER BY thoi_gian DESC
`, (err, res) => {
  if (err) console.error(err);
  else console.table(res.rows);
  pool.end();
});
