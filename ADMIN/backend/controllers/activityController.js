const db = require('../config/db');
const { uploadFileToDrive } = require('../services/driveService');

// 1. GET: Lấy danh sách (CÓ LỌC theo khoảng thời gian + loại hình + AUTO-STATUS)
exports.getActivities = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id || req.user.userId;
    const { from_date, to_date, loai_hinh } = req.query;

    try {
        let sql = `
            SELECT l.*,
            CASE
                WHEN l.thoi_gian > NOW() THEN 'Sap dien ra'
                WHEN l.thoi_gian <= NOW()
                     AND NOW() < COALESCE(l.thoi_gian_ket_thuc, l.thoi_gian + INTERVAL '2 hours')
                     THEN 'Dang dien ra'
                ELSE 'Da ket thuc'
            END AS auto_status,
            dd.trang_thai_tham_gia as my_status,
            dd.nguon_diem_danh as my_source
            FROM "lichsinhhoat" l
            LEFT JOIN "diemdanh" dd ON l.ma_lich = dd.ma_lich AND dd.ma_dang_vien = $2
            WHERE l.ma_chi_bo = $1
        `;
        let params = [branchId, userId];

        // Lọc theo khoảng thời gian bắt đầu
        if (from_date) {
            params.push(from_date);
            sql += ` AND l.thoi_gian >= $${params.length}`;
        }
        if (to_date) {
            params.push(to_date);
            sql += ` AND l.thoi_gian <= $${params.length}`;
        }

        // Lọc theo loại hình
        if (loai_hinh) {
            params.push(loai_hinh);
            sql += ` AND l.loai_hinh = $${params.length}`;
        }

        sql += ' ORDER BY l.thoi_gian DESC';

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách sinh hoạt' });
    }
};


// 2. POST: Tạo buổi sinh hoạt mới
exports.createActivity = async (req, res) => {
    const branchId = req.user.branchId;
    const { tieu_de, noi_dung_du_kien, thoi_gian, thoi_gian_ket_thuc, dia_diem, loai_hinh, hinh_thuc_diem_danh } = req.body;

    if (!tieu_de || !thoi_gian) {
        return res.status(400).json({ message: 'Tiêu đề và thời gian là bắt buộc' });
    }

    try {
        const sql = `
            INSERT INTO "lichsinhhoat" (ma_chi_bo, tieu_de, noi_dung_du_kien, thoi_gian, thoi_gian_ket_thuc, dia_diem, loai_hinh, hinh_thuc_diem_danh, trang_thai_buoi_hop, nguoi_tao)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Sap dien ra', $9)
            RETURNING *
        `;
        const result = await db.query(sql, [branchId, tieu_de, noi_dung_du_kien, thoi_gian, thoi_gian_ket_thuc, dia_diem, loai_hinh, hinh_thuc_diem_danh || 'Offline', req.user.id]);
        
        // --- Task 10: Tự động đẩy thông báo Lịch họp/Sinh hoạt ---
        const { createNotification } = require('../services/sharedNotificationService');
        
        const loaiHinhMap = {
            'Thuong ky': 'sinh hoạt thường kỳ',
            'Chuyen de': 'sinh hoạt chuyên đề',
            'Hop Chi uy': 'họp Chi ủy'
        };
        const displayLoaiHinh = loaiHinhMap[loai_hinh] || loai_hinh.toLowerCase();

        await createNotification(
            branchId, 
            'User', 
            `Lịch ${displayLoaiHinh} mới`, 
            `Có lịch họp: "${tieu_de}". Thời gian: ${new Date(thoi_gian).toLocaleString('vi-VN')}. Địa điểm: ${dia_diem}.`, 
            'MEETING'
        );

        res.status(201).json({ message: 'Tạo lịch họp thành công', activity: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo lịch họp' });
    }
};

// [MỚI] 7. PUT: Cập nhật thông tin lịch họp
exports.updateActivity = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const { tieu_de, noi_dung_du_kien, thoi_gian, thoi_gian_ket_thuc, dia_diem, loai_hinh, hinh_thuc_diem_danh } = req.body;

    try {
        // Kiểm tra quyền (chỉ sửa lịch của chi bộ mình)
        const check = await db.query('SELECT * FROM "lichsinhhoat" WHERE ma_lich = $1 AND ma_chi_bo = $2', [id, branchId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Lịch họp không tồn tại' });

        const sql = `
            UPDATE "lichsinhhoat" 
            SET tieu_de = $1, noi_dung_du_kien = $2, thoi_gian = $3, thoi_gian_ket_thuc = $4, dia_diem = $5, loai_hinh = $6, hinh_thuc_diem_danh = $7, nguoi_cap_nhat = $8
            WHERE ma_lich = $9
        `;
        await db.query(sql, [tieu_de, noi_dung_du_kien, thoi_gian, thoi_gian_ket_thuc, dia_diem, loai_hinh, hinh_thuc_diem_danh || 'Offline', req.user.id, id]);

        // --- Gửi Thông báo Cập nhật ---
        const { createNotification } = require('../services/sharedNotificationService');
        await createNotification(
            branchId, 
            'User', 
            `📅 Lịch sinh hoạt thay đổi: ${tieu_de}`, 
            `Lịch họp "${tieu_de}" vừa được cập nhật thời gian hoặc địa điểm. Vui lòng kiểm tra lại.`, 
            'MEETING'
        );

        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
};

// [MỚI] 8. DELETE: Hủy/Xóa lịch họp
exports.deleteActivity = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        const check = await db.query('SELECT * FROM "lichsinhhoat" WHERE ma_lich = $1 AND ma_chi_bo = $2', [id, branchId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Lịch họp không tồn tại' });
        const meetingTitle = check.rows[0].tieu_de;

        // Xóa (Cascade sẽ tự xóa dữ liệu điểm danh liên quan nếu DB đã cấu hình)
        // Hoặc xóa tay bảng diemdanh trước nếu cần
        await db.query('DELETE FROM "diemdanh" WHERE ma_lich = $1', [id]);
        await db.query('DELETE FROM "lichsinhhoat" WHERE ma_lich = $1', [id]);

        // --- Gửi Thông báo Hủy ---
        const { createNotification } = require('../services/sharedNotificationService');
        await createNotification(
            branchId, 
            'User', 
            `❌ Hủy lịch họp: ${meetingTitle}`, 
            `Lịch họp "${meetingTitle}" đã bị quản trị viên hủy bỏ.`, 
            'MEETING'
        );

        res.json({ message: 'Đã hủy lịch họp' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa lịch họp' });
    }
};

// ... (Giữ nguyên các hàm getAttendanceList, saveAttendance, uploadMinutes, getMyAttendance như cũ)
exports.getAttendanceList = async (req, res) => {
    const { id } = req.params; 
    const branchId = req.user.branchId;
    try {
        const sql = `
            SELECT 
                d.ma_dang_vien, d.ho_ten, d.chuc_vu_dang,
                dd.trang_thai_tham_gia, dd.ghi_chu, dd.nguon_diem_danh
            FROM "dangvien" d
            LEFT JOIN "diemdanh" dd ON d.ma_dang_vien = dd.ma_dang_vien AND dd.ma_lich = $1
            WHERE d.ma_chi_bo = $2 AND d.hoat_dong = true
            ORDER BY d.ten_dang_nhap ASC
        `;
        const result = await db.query(sql, [id, branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách điểm danh' });
    }
};

exports.saveAttendance = async (req, res) => {
    const { id } = req.params; 
    const { attendanceData } = req.body; 
    try {
        await db.query('BEGIN');
        for (const item of attendanceData) {
            const sql = `
                INSERT INTO "diemdanh" (ma_lich, ma_dang_vien, trang_thai_tham_gia, ghi_chu)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (ma_lich, ma_dang_vien) 
                DO UPDATE SET trang_thai_tham_gia = EXCLUDED.trang_thai_tham_gia, ghi_chu = EXCLUDED.ghi_chu
            `;
            await db.query(sql, [id, item.ma_dang_vien, item.status, item.note]);
        }
        await db.query(`UPDATE "lichsinhhoat" SET trang_thai_buoi_hop = 'Da ket thuc' WHERE ma_lich = $1`, [id]);
        await db.query('COMMIT');
        res.json({ message: 'Lưu điểm danh thành công' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Lỗi lưu điểm danh' });
    }
};

exports.uploadMinutes = async (req, res) => {
    const { id } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Vui lòng chọn file biên bản' });
    try {
        const driveData = await uploadFileToDrive(file);
        const fileUrl = driveData.webViewLink;
        const sql = `UPDATE "lichsinhhoat" SET file_dinh_kem = $1, noi_dung_bien_ban = 'Da upload' WHERE ma_lich = $2`;
        await db.query(sql, [fileUrl, id]);
        res.json({ message: 'Upload biên bản thành công', fileUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload biên bản' });
    }
};

exports.getMyAttendance = async (req, res) => {
    const userId = req.user.id; 
    try {
        const sql = `
            SELECT dd.trang_thai_tham_gia, dd.ghi_chu,
                   lsh.tieu_de, lsh.thoi_gian, lsh.dia_diem
            FROM "diemdanh" dd
            JOIN "lichsinhhoat" lsh ON dd.ma_lich = lsh.ma_lich
            WHERE dd.ma_dang_vien = $1
            ORDER BY lsh.thoi_gian DESC
        `;
        const result = await db.query(sql, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy lịch sử điểm danh' });
    }
};