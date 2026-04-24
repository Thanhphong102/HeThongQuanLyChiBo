const db = require('./config/db');

async function checkAdmin() {
  try {
    // Xem các tài khoản Admin (cap_quyen = 2)
    const adminResult = await db.query(`
      SELECT ma_dang_vien, ho_ten, ten_dang_nhap, cap_quyen, ma_chi_bo, hoat_dong
      FROM dangvien WHERE cap_quyen = 2 LIMIT 10
    `);
    console.log('Admin accounts (cap_quyen=2):');
    adminResult.rows.forEach(r => console.log(r));

    // Xem thông báo với ma_nguoi_nhan = 1 (đang test)
    const notifResult = await db.query(`
      SELECT id, ma_nguoi_nhan, quyen_nguoi_nhan, title, type
      FROM thongbao WHERE da_xoa = false ORDER BY created_at DESC LIMIT 10
    `);
    console.log('\nAll active notifications:');
    notifResult.rows.forEach(r => console.log(r));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

checkAdmin();
