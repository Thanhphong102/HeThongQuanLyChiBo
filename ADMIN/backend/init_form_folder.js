/**
 * Script khởi tạo cơ sở dữ liệu cho tính năng Thư mục Biểu mẫu
 * Chạy: node init_form_folder.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Bắt đầu khởi tạo bảng thư mục biểu mẫu...');

    // 1. Tạo bảng thư mục
    await client.query(`
      CREATE TABLE IF NOT EXISTS bieumau_folder (
        ma_folder   SERIAL PRIMARY KEY,
        ten_folder  TEXT NOT NULL,
        mo_ta       TEXT,
        ma_chi_bo   INTEGER,
        nguoi_tao   INTEGER,
        ngay_tao    TIMESTAMP DEFAULT NOW(),
        ngay_cap_nhat TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Đã tạo bảng bieumau_folder');

    // 2. Thêm cột ma_folder vào bảng bieumau (nếu chưa có)
    await client.query(`
      ALTER TABLE bieumau
        ADD COLUMN IF NOT EXISTS ma_folder INTEGER REFERENCES bieumau_folder(ma_folder) ON DELETE SET NULL;
    `);
    console.log('✅ Đã thêm cột ma_folder vào bảng bieumau');

    console.log('🎉 Hoàn tất! Hệ thống thư mục biểu mẫu sẵn sàng.');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
