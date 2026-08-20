/**
 * Script nâng cấp bảng bieumau_folder để hỗ trợ thư mục đa cấp
 * Chạy: node upgrade_folder_nested.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Bắt đầu nâng cấp bảng bieumau_folder...');

    // Thêm cột parent_folder_id (self-referencing) để hỗ trợ thư mục đa cấp
    await client.query(`
      ALTER TABLE bieumau_folder
        ADD COLUMN IF NOT EXISTS parent_folder_id INTEGER REFERENCES bieumau_folder(ma_folder) ON DELETE CASCADE;
    `);
    console.log('✅ Đã thêm cột parent_folder_id vào bieumau_folder');

    // Tạo index để tăng tốc query theo parent
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bieumau_folder_parent ON bieumau_folder(parent_folder_id);
    `);
    console.log('✅ Đã tạo index idx_bieumau_folder_parent');

    // Tạo index cho ma_chi_bo để tăng tốc query
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bieumau_folder_chibo ON bieumau_folder(ma_chi_bo);
    `);
    console.log('✅ Đã tạo index idx_bieumau_folder_chibo');

    console.log('🎉 Hoàn tất! Hệ thống thư mục đa cấp đã sẵn sàng.');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
