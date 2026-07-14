require('dotenv').config();
const db = require('./config/db');

async function run() {
  try {
    console.log("Creating TransferRequests table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS "TransferRequests" (
          "id" SERIAL PRIMARY KEY,
          "ma_dang_vien" INTEGER NOT NULL REFERENCES "dangvien"("ma_dang_vien") ON DELETE CASCADE,
          "loai_chuyen" VARCHAR(100) NOT NULL,
          "noi_chuyen_den" TEXT NOT NULL,
          "trang_thai" VARCHAR(50) DEFAULT 'Da_Gui',
          "ghi_chu_chi_uy" TEXT,
          "ngay_tao" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "ngay_cap_nhat" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating TransferDocuments table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS "TransferDocuments" (
          "id" SERIAL PRIMARY KEY,
          "request_id" INTEGER NOT NULL REFERENCES "TransferRequests"("id") ON DELETE CASCADE,
          "ten_tai_lieu" VARCHAR(255) NOT NULL,
          "file_url" TEXT,
          "trang_thai_tai_lieu" VARCHAR(50) DEFAULT 'Cho_Duyet',
          "ghi_chu" TEXT,
          "ngay_tao" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating TransferLogs table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS "TransferLogs" (
          "id" SERIAL PRIMARY KEY,
          "request_id" INTEGER NOT NULL REFERENCES "TransferRequests"("id") ON DELETE CASCADE,
          "nguoi_thuc_hien_id" INTEGER NOT NULL,
          "hanh_dong" VARCHAR(100) NOT NULL,
          "chi_tiet" TEXT,
          "thoi_gian" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Done!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
