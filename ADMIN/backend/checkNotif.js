const db = require('./config/db');

async function checkSchema() {
  try {
    // Kiểm tra kiểu cột ma_nguoi_nhan trong thongbao
    const colResult = await db.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'thongbao' AND column_name = 'ma_nguoi_nhan'
    `);
    console.log('Column ma_nguoi_nhan schema:', colResult.rows);

    // Xem vài dòng thông báo DOCUMENT gần nhất
    const rowResult = await db.query(`
      SELECT id, ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type, created_at
      FROM thongbao
      WHERE type = 'DOCUMENT'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log('DOCUMENT notifications:', rowResult.rows);

    // Xem các giá trị branchId hay ma_chi_bo có trong hệ thống
    const branchResult = await db.query(`SELECT ma_chi_bo, ten_chi_bo FROM chibo LIMIT 5`);
    console.log('Chi bo list:', branchResult.rows);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

checkSchema();
