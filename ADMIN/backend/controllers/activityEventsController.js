const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

/**
 * TASK 8: Quản lý Hoạt động (Activity Management)
 * Bảng chính: hoat_dong
 * Bảng phụ: dangkyhoatdong (đăng ký + minh chứng)
 */

// Hàm Helper Tự động chạy logic cập nhật trạng thái
const autoUpdateActivityStates = async (branchId) => {
  try {
    // 0. Tạo chuỗi thời gian hiện tại theo local time để so sánh chính xác với DB
    const dayjs = require('dayjs');
    const nowLocalStr = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 1. Nếu quá thời gian kết thúc -> Đã kết thúc
    await db.query(`
      UPDATE "hoatdong"
      SET trang_thai = 'Da ket thuc'
      WHERE trang_thai NOT IN ('Da ket thuc', 'Huy')
        AND thoi_gian_ket_thuc < $2
        AND ma_chi_bo = $1
    `, [branchId, nowLocalStr]);

    // 2. Nếu đủ số lượng tối đa -> Đã đóng đăng ký
    await db.query(`
      UPDATE "hoatdong" hd
      SET trang_thai = 'Da dong'
      WHERE hd.trang_thai = 'Dang mo' 
        AND hd.so_luong_toi_da > 0
        AND hd.ma_chi_bo = $1
        AND (SELECT COUNT(ma_dang_ky) FROM "dangkyhoatdong" dk WHERE dk.ma_hoat_dong = hd.id) >= hd.so_luong_toi_da
    `, [branchId]);
  } catch (err) {
    console.error('Lỗi tự động cập nhật trạng thái hoạt động:', err.message);
  }
};

// ── 1. GET ALL: Lấy danh sách hoạt động của Chi bộ ─────────────────
exports.getActivities = async (req, res) => {
  const branchId = req.user.branchId;
  const { keyword, trang_thai } = req.query;

  try {
    // Gọi hàm Auto-Update trước khi fetch
    await autoUpdateActivityStates(branchId);

    let sql = `
      SELECT
        hd.*,
        COUNT(DISTINCT dk.ma_dang_ky) AS so_luong_dang_ky,
        COUNT(DISTINCT CASE WHEN dk.xac_nhan_admin = true THEN dk.ma_dang_ky END) AS so_luong_xac_nhan
      FROM "hoatdong" hd
      LEFT JOIN "dangkyhoatdong" dk ON hd.id = dk.ma_hoat_dong
      WHERE hd.ma_chi_bo = $1
    `;
    const params = [branchId];
    let idx = 2;

    if (keyword) {
      sql += ` AND LOWER(hd.ten_hoat_dong) LIKE $${idx}`;
      params.push(`%${keyword.toLowerCase()}%`);
      idx++;
    }
    if (trang_thai) {
      sql += ` AND hd.trang_thai = $${idx}`;
      params.push(trang_thai);
      idx++;
    }

    sql += ' GROUP BY hd.id ORDER BY hd.thoi_gian_bat_dau DESC';

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('[getActivities]', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách hoạt động' });
  }
};

// ── 2. CREATE: Tạo hoạt động mới ────────────────────────────────────
exports.createActivity = async (req, res) => {
  const branchId = req.user.branchId;
  const { ten_hoat_dong, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc, dia_diem, so_luong_toi_da } = req.body;

  if (!ten_hoat_dong || !thoi_gian_bat_dau) {
    return res.status(400).json({ message: 'Tên hoạt động và thời gian bắt đầu là bắt buộc' });
  }

  try {
    const result = await db.query(
      `INSERT INTO "hoatdong"
        (ten_hoat_dong, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc, dia_diem, so_luong_toi_da, trang_thai, ma_chi_bo)
       VALUES ($1, $2, $3, $4, $5, $6, 'Dang mo', $7)
       RETURNING *`,
      [ten_hoat_dong, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc, dia_diem, so_luong_toi_da || null, branchId]
    );

    // --- Task 10: Thông báo cho toàn bộ User trong Chi bộ ---
    const { createNotification } = require('../services/sharedNotificationService');
    await createNotification(
      branchId, 
      'User', 
      'Hoạt động ngoại khóa mới', 
      `Chi bộ vừa mở đăng ký hoạt động: "${ten_hoat_dong}". Thời gian: ${new Date(thoi_gian_bat_dau).toLocaleString('vi-VN')}.`, 
      'ACTIVITY'
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[createActivity]', error);
    res.status(500).json({ message: 'Lỗi tạo hoạt động' });
  }
};

// ── 3. UPDATE: Cập nhật thông tin hoạt động ─────────────────────────
exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const branchId = req.user.branchId;
  const { ten_hoat_dong, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc, dia_diem, so_luong_toi_da, trang_thai } = req.body;

  try {
    const result = await db.query(
      `UPDATE "hoatdong"
       SET ten_hoat_dong = $1, mo_ta = $2, thoi_gian_bat_dau = $3,
           thoi_gian_ket_thuc = $4, dia_diem = $5, so_luong_toi_da = $6, trang_thai = $7
       WHERE id = $8 AND ma_chi_bo = $9
       RETURNING *`,
      [ten_hoat_dong, mo_ta, thoi_gian_bat_dau, thoi_gian_ket_thuc, dia_diem, so_luong_toi_da, trang_thai, id, branchId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
    
    // --- Gửi Thông báo Cập nhật ---
    const { createNotification } = require('../services/sharedNotificationService');
    await createNotification(
      branchId, 
      'User', 
      `⭐ Hoạt động cập nhật: ${ten_hoat_dong}`, 
      `Hoạt động ngoại khóa "${ten_hoat_dong}" vừa có sự thay đổi thông tin (lịch trình/địa điểm). Vui lòng kiểm tra lại.`, 
      'ACTIVITY'
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[updateActivity]', error);
    res.status(500).json({ message: 'Lỗi cập nhật hoạt động' });
  }
};

// ── 4. DELETE: Xóa hoạt động ────────────────────────────────────────
exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  const branchId = req.user.branchId;

  try {
    // Lấy tên hoạt động trước khi xóa
    const check = await db.query('SELECT ten_hoat_dong FROM "hoatdong" WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
    const hoatDongName = check.rows[0].ten_hoat_dong;

    // Xóa đăng ký trước (tránh lỗi FK constraint)
    await db.query('DELETE FROM "dangkyhoatdong" WHERE ma_hoat_dong = $1', [id]);
    const result = await db.query(
      'DELETE FROM "hoatdong" WHERE id = $1 AND ma_chi_bo = $2 RETURNING id',
      [id, branchId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
    
    // --- Gửi Thông báo Xóa ---
    const { createNotification } = require('../services/sharedNotificationService');
    await createNotification(
      branchId, 
      'User', 
      `❌ Hủy hoạt động: ${hoatDongName}`, 
      `Hoạt động ngoại khóa "${hoatDongName}" đã bị hủy hoặc gỡ bỏ khỏi hệ thống.`, 
      'ACTIVITY'
    );

    res.json({ success: true, message: 'Đã xóa hoạt động' });
  } catch (error) {
    console.error('[deleteActivity]', error);
    res.status(500).json({ message: 'Lỗi xóa hoạt động' });
  }
};

// ── 5. GET REGISTRATIONS: Danh sách đăng ký của 1 hoạt động ─────────
exports.getRegistrations = async (req, res) => {
  const { id } = req.params;  // ma_hoat_dong

  try {
    const result = await db.query(
      `SELECT
        dk.ma_dang_ky,
        dk.ma_hoat_dong,
        dk.ma_dang_vien,
        dk.thoi_gian_dang_ky,
        dk.trang_thai_tham_gia,
        dk.minh_chung_url,
        dk.xac_nhan_admin,
        dk.ghi_chu,
        dv.ho_ten,
        dv.ma_so_sinh_vien,
        dv.lop,
        dv.so_dien_thoai,
        dv.email
      FROM "dangkyhoatdong" dk
      JOIN "dangvien" dv ON dk.ma_dang_vien = dv.ma_dang_vien
      WHERE dk.ma_hoat_dong = $1
      ORDER BY dk.thoi_gian_dang_ky ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[getRegistrations]', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách đăng ký' });
  }
};

// ── 6. CONFIRM: Admin xác nhận tham gia cho 1 đảng viên ─────────────
exports.confirmRegistration = async (req, res) => {
  const { regId } = req.params;  // dangkyhoatdong.id
  const { ghi_chu } = req.body || {};

  try {
    const result = await db.query(
      `UPDATE "dangkyhoatdong"
       SET xac_nhan_admin = true, trang_thai_tham_gia = true, ghi_chu = $1
       WHERE id = $2
       RETURNING *`,
      [ghi_chu || null, regId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đăng ký' });
    res.json({ success: true, data: result.rows[0], message: 'Đã xác nhận tham gia' });
  } catch (error) {
    console.error('[confirmRegistration]', error);
    res.status(500).json({ message: 'Lỗi xác nhận' });
  }
};

// ── 7. REJECT: Hủy xác nhận (nếu Admin bấm nhầm) ────────────────────
exports.rejectRegistration = async (req, res) => {
  const { regId } = req.params;

  try {
    await db.query(
      `UPDATE "dangkyhoatdong"
       SET xac_nhan_admin = false, trang_thai_tham_gia = false
       WHERE id = $1`,
      [regId]
    );
    res.json({ success: true, message: 'Đã hủy xác nhận' });
  } catch (error) {
    console.error('[rejectRegistration]', error);
    res.status(500).json({ message: 'Lỗi hủy xác nhận' });
  }
};

// =========================================================================
// PHẦN API DÀNH CHO NGƯỜI DÙNG (USER ACTOR)
// =========================================================================

// ── 8. GET USER EVENTS: Lấy danh sách hoạt động & Trạng thái Đăng ký ──
exports.getUserEvents = async (req, res) => {
  const userId = req.user.id;
  const branchId = req.user.branchId;

  try {
    // Gọi hàm Auto-Update trước khi fetch cho User
    await autoUpdateActivityStates(branchId);

    // Left Join với bảng đăng ký để biết User đã Đăng ký chưa
    const sql = `
      SELECT 
        hd.*,
        dk.ma_dang_ky AS registration_id,
        dk.thoi_gian_dang_ky,
        dk.trang_thai_tham_gia,
        dk.minh_chung_url,
        dk.xac_nhan_admin,
        dk.ghi_chu AS reg_ghi_chu
      FROM "hoatdong" hd
      LEFT JOIN "dangkyhoatdong" dk 
        ON hd.id = dk.ma_hoat_dong AND dk.ma_dang_vien = $1
      WHERE hd.ma_chi_bo = $2
      ORDER BY hd.thoi_gian_bat_dau DESC
    `;
    const result = await db.query(sql, [userId, branchId]);
    res.json(result.rows);
  } catch (error) {
    console.error('[getUserEvents]', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách hoạt động' });
  }
};

// ── 9. REGISTER: Sinh viên Đăng ký tham gia một Hoạt động ────────────
exports.registerEvent = async (req, res) => {
  const { id } = req.params; // activity id
  const userId = req.user.id;

  try {
    // Ktra hoạt động còn mở không
    const checkEv = await db.query('SELECT trang_thai FROM hoatdong WHERE id = $1', [id]);
    if (checkEv.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hoạt động' });
    if (checkEv.rows[0].trang_thai !== 'Dang mo') {
      return res.status(400).json({ message: 'Hoạt động này không còn nhận đăng ký' });
    }

    // Ktra đã đăng ký chưa
    const checkReg = await db.query('SELECT * FROM dangkyhoatdong WHERE ma_hoat_dong = $1 AND ma_dang_vien = $2', [id, userId]);
    if (checkReg.rows.length > 0) return res.status(400).json({ message: 'Bạn đã đăng ký hoạt động này rồi' });

    // Tạo bản ghi Đăng ký
    const result = await db.query(`
      INSERT INTO "dangkyhoatdong" (ma_hoat_dong, user_id, trang_thai_tham_gia)
      VALUES ($1, $2, false)
      RETURNING *
    `, [id, userId]);

    res.status(201).json({ message: 'Đăng ký thành công!', data: result.rows[0] });
  } catch (error) {
    console.error('[registerEvent]', error);
    res.status(500).json({ message: 'Lỗi đăng ký hoạt động' });
  }
};

// ── 10. UPLOAD EVIDENCE: Nộp minh chứng tham gia ─────────────────────
exports.uploadEvidence = async (req, res) => {
  const { regId } = req.params; // Registration ID
  const userId = req.user.id;
  const file = req.file;

  if (!file) return res.status(400).json({ message: 'Vui lòng chọn file minh chứng' });

  try {
    // Kiểm tra quyền sở hữu bản đăng ký và xem sự kiện đã bắt đầu chưa
    const sqlCheck = `
      SELECT dk.*, hd.thoi_gian_bat_dau 
      FROM dangkyhoatdong dk
      JOIN hoatdong hd ON dk.ma_hoat_dong = hd.id
      WHERE dk.ma_dang_ky = $1 AND dk.ma_dang_vien = $2
    `;
    const checkReg = await db.query(sqlCheck, [regId, userId]);
    
    if (checkReg.rows.length === 0) {
        return res.status(404).json({ message: 'Bạn không có quyền hoặc bản ghi không tồn tại' });
    }

    const eventStartTime = new Date(checkReg.rows[0].thoi_gian_bat_dau);
    const now = new Date();
    
    if (now < eventStartTime) {
        return res.status(400).json({ message: 'Sự kiện chưa diễn ra. Chưa thể nộp minh chứng!' });
    }
    
    const oldUrl = checkReg.rows[0].minh_chung_url;
    if (oldUrl && oldUrl.includes('id=')) {
        try {
            const urlObj = new URL(oldUrl);
            const oldFileId = urlObj.searchParams.get('id');
            if (oldFileId) {
                // Xóa file cũ bất đồng bộ, không chờ
                deleteFileFromDrive(oldFileId).catch(e => console.error('Lỗi xóa file cũ:', e));
            }
        } catch(e) {
            console.error('Không thể trích xuất ID file cũ', e);
        }
    }
    
    // Upload file mới lên hệ thống
    const driveData = await uploadFileToDrive(file);
    // Dùng link trực tiếp (uc?export=view&id=) để có thể hiển thị trong thẻ <img>
    const finalUrl = `https://drive.google.com/uc?export=view&id=${driveData.id}`;

    // Cập nhật lại Database
    const result = await db.query(`
      UPDATE "dangkyhoatdong"
      SET minh_chung_url = $1
      WHERE id = $2
      RETURNING *
    `, [finalUrl, regId]);

    res.json({ message: 'Gửi minh chứng thành công', data: result.rows[0] });
  } catch (error) {
    console.error('[uploadEvidence]', error);
    res.status(500).json({ message: 'Lỗi tải tệp minh chứng' });
  }
};
