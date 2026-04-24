const db = require('./config/db');

async function fixDb() {
  try {
    // 1. Thêm cột lat, lng, qr_token vào lichsinhhoat
    await db.query(`
      ALTER TABLE lichsinhhoat 
      ADD COLUMN IF NOT EXISTS lat NUMERIC,
      ADD COLUMN IF NOT EXISTS lng NUMERIC,
      ADD COLUMN IF NOT EXISTS qr_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS diem_danh_open BOOLEAN DEFAULT false;
    `);
    console.log('Thêm cột vào lichsinhhoat thành công');

    // 2. Kiểm tra bảng hoat_dong
    await db.query(`
      ALTER TABLE hoat_dong
      ADD COLUMN IF NOT EXISTS ma_chi_bo VARCHAR(50);
    `);
    console.log('Thêm cột ma_chi_bo vào hoatdong thành công');

  } catch (error) {
    console.error('Lỗi fix DB:', error);
  } finally {
    process.exit(0);
  }
}

fixDb();
