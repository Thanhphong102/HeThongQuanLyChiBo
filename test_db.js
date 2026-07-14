require('dotenv').config({ path: './ADMIN/backend/.env' });
const db = require('./ADMIN/backend/config/db');

async function run() {
  try {
    const res = await db.query("UPDATE dangvien SET buoc_doi_mat_khau = true WHERE ma_dang_vien > 2;");
    console.log('Updated rows:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
