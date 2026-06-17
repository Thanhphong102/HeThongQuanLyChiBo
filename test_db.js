const { Pool } = require('pg');
require('dotenv').config({ path: 'd:\\NCKHSV\\ADMIN\\backend\\.env' });
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nckhsv',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});
pool.query('SELECT ma_dang_vien, ho_ten, thoi_gian_tao FROM "dangvien" LIMIT 5', (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
