const db    = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * TASK 7: Hybrid Attendance — QR + Geolocation
 *
 * API 1: POST /api/activities/:id/open-attendance
 *   Admin "Mở điểm danh":
 *   - Nhận lat, lng của hội trường từ request body
 *   - Tạo qr_token mới (UUID v4)
 *   - Lưu vào bảng lichsinhhoat
 *   - Trả về { token, lat, lng, meetingId } để Frontend generate QR
 *
 * API 2: POST /api/activities/:id/close-attendance
 *   Admin "Đóng điểm danh":
 *   - Set diem_danh_open = false, xóa qr_token
 *
 * API 3: GET /api/activities/:id/qr-info
 *   Lấy thông tin QR hiện tại (kiểm tra còn mở không)
 */

// ── API 1: MỞ ĐIỂM DANH ─────────────────────────────────────────────
exports.openAttendance = async (req, res) => {
  const { id } = req.params;                 // ma_lich
  const branchId = req.user.branchId;
  const { lat, lng } = req.body;             // Tọa độ hội trường

  // Kiểm tra meeting có thuộc Chi bộ của Admin không
  const checkRes = await db.query(
    'SELECT ma_lich FROM "lichsinhhoat" WHERE ma_lich = $1 AND ma_chi_bo = $2',
    [id, branchId]
  );
  if (checkRes.rows.length === 0) {
    return res.status(403).json({ message: 'Không có quyền truy cập cuộc họp này' });
  }

  // Tạo UUID mới mỗi lần mở điểm danh (tránh dùng lại token cũ)
  const newToken = uuidv4();

  try {
    await db.query(
      `UPDATE "lichsinhhoat"
       SET lat = $1, lng = $2, qr_token = $3, diem_danh_open = true
       WHERE ma_lich = $4`,
      [lat || null, lng || null, newToken, id]
    );

    res.json({
      success: true,
      meetingId: parseInt(id),
      token: newToken,
      lat,
      lng,
      message: 'Đã mở điểm danh! Mã QR đã được tạo.'
    });
  } catch (error) {
    console.error('[openAttendance]', error);
    res.status(500).json({ message: 'Lỗi mở điểm danh' });
  }
};

// ── API 2: ĐÓNG ĐIỂM DANH ───────────────────────────────────────────
exports.closeAttendance = async (req, res) => {
  const { id } = req.params;
  const branchId = req.user.branchId;

  try {
    await db.query(
      `UPDATE "lichsinhhoat"
       SET diem_danh_open = false, qr_token = NULL
       WHERE ma_lich = $1 AND ma_chi_bo = $2`,
      [id, branchId]
    );
    res.json({ success: true, message: 'Đã đóng điểm danh.' });
  } catch (error) {
    console.error('[closeAttendance]', error);
    res.status(500).json({ message: 'Lỗi đóng điểm danh' });
  }
};

// ── API 3: LẤY THÔNG TIN QR HIỆN TẠI ──────────────────────────────
exports.getQrInfo = async (req, res) => {
  const { id } = req.params;
  const branchId = req.user.branchId;

  try {
    const result = await db.query(
      `SELECT ma_lich, tieu_de, thoi_gian, lat, lng, qr_token, diem_danh_open
       FROM "lichsinhhoat"
       WHERE ma_lich = $1 AND ma_chi_bo = $2`,
      [id, branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc họp' });
    }

    const meeting = result.rows[0];
    res.json({
      meetingId: meeting.ma_lich,
      tieu_de: meeting.tieu_de,
      thoi_gian: meeting.thoi_gian,
      lat: meeting.lat,
      lng: meeting.lng,
      isOpen: meeting.diem_danh_open,
      token: meeting.diem_danh_open ? meeting.qr_token : null,
    });
  } catch (error) {
    console.error('[getQrInfo]', error);
    res.status(500).json({ message: 'Lỗi lấy thông tin QR' });
  }
};

// ── API 4: SUBMIT ĐIỂM DANH (USER) ──────────────────────────────────
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Bán kính trái đất bằng mét
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

exports.submitHybridAttendance = async (req, res) => {
  const { ma_lich, qr_token, lat, lng } = req.body;
  
  // Lấy ID người dùng từ token phân quyền
  // Tùy cấu trúc jwt mà authMiddleware lưu: user.userId hoặc user.id, ở đây ta lấy phổ biến
  const userId = req.user.id || req.user.userId;

  if (!ma_lich || !qr_token) {
    return res.status(400).json({ message: 'Thiếu thông tin điểm danh' });
  }

  try {
    // 1. Kiểm tra QR token có tồn tại và cuộc họp có đang mở không
    const meetingRes = await db.query(
      `SELECT ma_lich, lat, lng, qr_token, diem_danh_open 
       FROM "lichsinhhoat" 
       WHERE ma_lich = $1 AND diem_danh_open = true`,
      [ma_lich]
    );

    if (meetingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Cuộc họp không được tìm thấy hoặc điểm danh đã đóng' });
    }

    const meeting = meetingRes.rows[0];

    // 2. Xác minh token
    if (meeting.qr_token !== qr_token) {
      return res.status(400).json({ message: 'Mã QR không hợp lệ hoặc đã hết hạn' });
    }

    // 3. So sánh khoảng cách nếu Admin có cấp tọa độ
    if (meeting.lat && meeting.lng && lat && lng) {
      const distance = getDistanceFromLatLonInM(lat, lng, meeting.lat, meeting.lng);
      console.log(`Khoảng cách user đến điểm cầu: ${distance.toFixed(2)} m`);
      
      if (distance > 50) { // Bán kính 50 mét
         return res.status(400).json({ message: `Vị trí của bạn quá xa (${distance.toFixed(0)}m). Vui lòng đến gần hội trường.` });
      }
    }

    // 4. Update Database
    // Cập nhật trạng thái "Co mat"
    const updateRes = await db.query(
      `UPDATE "diemdanh" 
       SET trang_thai_tham_gia = 'Co mat' 
       WHERE ma_lich = $1 AND ma_dang_vien = $2 RETURNING *`,
      [ma_lich, userId]
    );

    if (updateRes.rows.length === 0) {
       // Nếu chưa có record điểm danh trong bảng, có thể insert mới tùy cơ chế của bài
       await db.query(
          `INSERT INTO "diemdanh" (ma_lich, ma_dang_vien, trang_thai_tham_gia)
           VALUES ($1, $2, 'Co mat')`,
          [ma_lich, userId]
       );
    }

    res.json({ success: true, message: 'Điểm danh thành công' });

  } catch (error) {
    console.error('[submitHybridAttendance]', error);
    res.status(500).json({ message: 'Lỗi trong quá trình điểm danh' });
  }
};

