const cron = require('node-cron');
const db = require('../config/db');

const sendTaskReminders = async () => {
  try {
    const due = await db.query(`
      SELECT nn.ma_nguoi_nhan,nn.ma_dang_vien,nv.ma_nhiem_vu,nv.tieu_de,nv.han_nop
      FROM nhiemvu_nguoinhan nn
      JOIN nhiemvu nv ON nv.ma_nhiem_vu=nn.ma_nhiem_vu
      WHERE nv.trang_thai='Dang_mo'
        AND nv.han_nop BETWEEN NOW() AND NOW()+INTERVAL '24 hours'
        AND nn.trang_thai IN ('Chua_xem','Chua_nop','Can_bo_sung')
        AND (nn.nhac_han_luc IS NULL OR nn.nhac_han_luc < NOW()-INTERVAL '20 hours')
    `);
    for (const row of due.rows) {
      await db.query(`INSERT INTO thongbao (ma_nguoi_nhan,quyen_nguoi_nhan,tieu_de,noi_dung,loai_thong_bao) VALUES ($1,'User','Nhiệm vụ sắp hết hạn',$2,$3)`, [row.ma_dang_vien,`${row.tieu_de} · hạn ${new Date(row.han_nop).toLocaleString('vi-VN')}`,`TASK_${row.ma_nhiem_vu}`]);
      await db.query('UPDATE nhiemvu_nguoinhan SET nhac_han_luc=NOW() WHERE ma_nguoi_nhan=$1', [row.ma_nguoi_nhan]);
    }
    if (due.rows.length) console.log(`[Task reminder] Đã nhắc ${due.rows.length} lượt nhiệm vụ`);
  } catch (error) {
    // Cho phép backend chạy trước khi người dùng áp dụng migration.
    if (error.code !== '42P01' && error.code !== '42703') console.error('[Task reminder]', error);
  }
};

cron.schedule('0 7 * * *', sendTaskReminders, { timezone: 'Asia/Ho_Chi_Minh' });
module.exports = { sendTaskReminders };
