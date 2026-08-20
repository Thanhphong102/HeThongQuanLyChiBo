require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const hash = await bcrypt.hash('Admin@123', 10);
  const result = await p.query(
    `UPDATE dangvien SET mat_khau=$1, buoc_doi_mat_khau=false 
     WHERE ten_dang_nhap=$2 
     RETURNING ten_dang_nhap, cap_quyen, hoat_dong`,
    [hash, 'xuanphong100204@gmail.com']
  );
  console.log('✅ Đã đặt lại mật khẩu thành công:');
  console.log(result.rows[0]);
  p.end();
}

run().catch(e => { console.error(e.message); p.end(); });
