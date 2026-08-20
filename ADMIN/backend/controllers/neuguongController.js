const db = require('../config/db');
const { createNotification } = require('../services/sharedNotificationService');

// ============================================================
// ADMIN (CHI ỦY) APIs
// ============================================================

// [ADMIN] Lấy tất cả đợt nêu gương của chi bộ (kèm số lượng hồ sơ)
exports.getAllDots = async (req, res) => {
    const ma_chi_bo = req.user.branchId;
    try {
        const result = await db.query(`
            SELECT d.*,
                   COUNT(h.ma_ho_so) AS tong_ho_so,
                   COUNT(CASE WHEN h.trang_thai = 'Cho_Duyet' THEN 1 END) AS so_cho_duyet,
                   COUNT(CASE WHEN h.trang_thai = 'Duoc_Cong_Nhan' THEN 1 END) AS so_cong_nhan
            FROM dotneuguong d
            LEFT JOIN hosoneuguong h ON h.ma_dot = d.ma_dot
            WHERE d.ma_chi_bo = $1
            GROUP BY d.ma_dot
            ORDER BY d.nam DESC, d.thang DESC
        `, [ma_chi_bo]);
        res.json(result.rows);
    } catch (err) {
        console.error('[getAllDots]', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách đợt nêu gương' });
    }
};

// [ADMIN] Tạo đợt nêu gương mới
exports.createDot = async (req, res) => {
    const ma_chi_bo = req.user.branchId;
    const nguoi_tao = req.user.id;
    const { ten_dot, thang, nam, mo_ta, file_mau_bao_cao } = req.body;

    if (!ten_dot || !thang || !nam) {
        return res.status(400).json({ message: 'Vui lòng nhập tên đợt, tháng và năm' });
    }
    try {
        // Kiểm tra đã có đợt Mở chưa
        const existing = await db.query(
            `SELECT ma_dot FROM dotneuguong WHERE ma_chi_bo = $1 AND trang_thai = 'Mo'`,
            [ma_chi_bo]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Chi bộ đang có một đợt nêu gương đang Mở. Vui lòng đóng đợt cũ trước khi tạo mới.' });
        }

        const result = await db.query(`
            INSERT INTO dotneuguong (ten_dot, thang, nam, mo_ta, file_mau_bao_cao, ma_chi_bo, nguoi_tao, trang_thai)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Mo')
            RETURNING *
        `, [ten_dot, thang, nam, mo_ta || null, file_mau_bao_cao || null, ma_chi_bo, nguoi_tao]);

        res.status(201).json({ message: 'Tạo đợt nêu gương thành công', data: result.rows[0] });
    } catch (err) {
        console.error('[createDot]', err);
        res.status(500).json({ message: 'Lỗi tạo đợt nêu gương' });
    }
};

// [ADMIN] Cập nhật đợt (đóng/mở, sửa thông tin)
exports.updateDot = async (req, res) => {
    const { id } = req.params;
    const ma_chi_bo = req.user.branchId;
    const { trang_thai, ten_dot, mo_ta, file_mau_bao_cao } = req.body;

    try {
        const result = await db.query(`
            UPDATE dotneuguong
            SET trang_thai = COALESCE($1, trang_thai),
                ten_dot = COALESCE($2, ten_dot),
                mo_ta = COALESCE($3, mo_ta),
                file_mau_bao_cao = COALESCE($4, file_mau_bao_cao),
                thoi_gian_cap_nhat = CURRENT_TIMESTAMP
            WHERE ma_dot = $5 AND ma_chi_bo = $6
            RETURNING *
        `, [trang_thai || null, ten_dot || null, mo_ta || null, file_mau_bao_cao || null, id, ma_chi_bo]);

        if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy đợt' });
        res.json({ message: 'Cập nhật thành công', data: result.rows[0] });
    } catch (err) {
        console.error('[updateDot]', err);
        res.status(500).json({ message: 'Lỗi cập nhật đợt' });
    }
};

// [ADMIN] Xóa đợt nêu gương (chỉ khi chưa có hồ sơ)
exports.deleteDot = async (req, res) => {
    const { id } = req.params;
    const ma_chi_bo = req.user.branchId;
    try {
        const countCheck = await db.query(`SELECT COUNT(*) FROM hosoneuguong WHERE ma_dot = $1`, [id]);
        if (parseInt(countCheck.rows[0].count) > 0) {
            return res.status(400).json({ message: 'Không thể xóa đợt đã có hồ sơ đăng ký' });
        }
        await db.query(`DELETE FROM dotneuguong WHERE ma_dot = $1 AND ma_chi_bo = $2`, [id, ma_chi_bo]);
        res.json({ message: 'Xóa đợt thành công' });
    } catch (err) {
        console.error('[deleteDot]', err);
        res.status(500).json({ message: 'Lỗi xóa đợt' });
    }
};

// [ADMIN] Lấy danh sách hồ sơ trong 1 đợt (kèm thông tin đảng viên)
exports.getHoSoByDot = async (req, res) => {
    const { dot_id } = req.params;
    try {
        const result = await db.query(`
            SELECT h.*,
                   dv.ho_ten, dv.ma_so_sinh_vien, dv.ma_can_bo, dv.doi_tuong, dv.lop, dv.nganh_hoc,
                   (SELECT json_agg(hd ORDER BY hd.thu_tu)
                    FROM hoatdongneuguong hd WHERE hd.ma_ho_so = h.ma_ho_so) AS danh_sach_hoat_dong
            FROM hosoneuguong h
            JOIN dangvien dv ON dv.ma_dang_vien = h.ma_dang_vien
            WHERE h.ma_dot = $1
            ORDER BY h.ngay_nop DESC
        `, [dot_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('[getHoSoByDot]', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách hồ sơ' });
    }
};

// [ADMIN] Duyệt hồ sơ lần 1 → chuyển trạng thái → gửi thông báo + link file mẫu
exports.duyetHoSo = async (req, res) => {
    const { id } = req.params; // ma_ho_so
    const { ghi_chu_admin } = req.body;
    try {
        // Lấy thông tin hồ sơ & đợt
        const hoSo = await db.query(`
            SELECT h.*, d.file_mau_bao_cao, d.ten_dot, dv.ho_ten, dv.ma_chi_bo
            FROM hosoneuguong h
            JOIN dotneuguong d ON d.ma_dot = h.ma_dot
            JOIN dangvien dv ON dv.ma_dang_vien = h.ma_dang_vien
            WHERE h.ma_ho_so = $1
        `, [id]);

        if (hoSo.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
        const hs = hoSo.rows[0];

        if (hs.trang_thai !== 'Cho_Duyet') {
            return res.status(400).json({ message: `Hồ sơ đang ở trạng thái "${hs.trang_thai}", không thể duyệt lại` });
        }

        await db.query(`
            UPDATE hosoneuguong
            SET trang_thai = 'Cho_Nop_Bao_Cao',
                ghi_chu_admin = $1,
                ngay_duyet = CURRENT_TIMESTAMP,
                thoi_gian_cap_nhat = CURRENT_TIMESTAMP
            WHERE ma_ho_so = $2
        `, [ghi_chu_admin || null, id]);

        // Gửi thông báo cho User
        const noiDung = `Hồ sơ nêu gương của bạn tại đợt "${hs.ten_dot}" đã được Chi ủy duyệt. Vui lòng tải file mẫu báo cáo${hs.file_mau_bao_cao ? ' tại: ' + hs.file_mau_bao_cao : ''} và nộp lại.`;
        await createNotification(hs.ma_dang_vien, 'User', '✅ Hồ sơ Nêu gương được duyệt', noiDung, 'NEU_GUONG');

        res.json({ message: 'Đã duyệt hồ sơ. Thông báo đã gửi cho Đảng viên.' });
    } catch (err) {
        console.error('[duyetHoSo]', err);
        res.status(500).json({ message: 'Lỗi duyệt hồ sơ' });
    }
};

// [ADMIN] Từ chối hồ sơ
exports.tuChoiHoSo = async (req, res) => {
    const { id } = req.params;
    const { ghi_chu_admin } = req.body;
    try {
        const hoSo = await db.query(`
            SELECT h.ma_dang_vien, d.ten_dot, dv.ma_chi_bo
            FROM hosoneuguong h
            JOIN dotneuguong d ON d.ma_dot = h.ma_dot
            JOIN dangvien dv ON dv.ma_dang_vien = h.ma_dang_vien
            WHERE h.ma_ho_so = $1
        `, [id]);

        if (hoSo.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
        const hs = hoSo.rows[0];

        await db.query(`
            UPDATE hosoneuguong
            SET trang_thai = 'Bi_Tu_Choi',
                ghi_chu_admin = $1,
                thoi_gian_cap_nhat = CURRENT_TIMESTAMP
            WHERE ma_ho_so = $2
        `, [ghi_chu_admin || 'Chi ủy không phê duyệt', id]);

        await createNotification(hs.ma_dang_vien, 'User', '❌ Hồ sơ Nêu gương bị từ chối', `Hồ sơ nêu gương tại đợt "${hs.ten_dot}" của bạn không được phê duyệt. Lý do: ${ghi_chu_admin || 'Không đáp ứng tiêu chí'}`, 'NEU_GUONG');

        res.json({ message: 'Đã từ chối hồ sơ' });
    } catch (err) {
        console.error('[tuChoiHoSo]', err);
        res.status(500).json({ message: 'Lỗi từ chối hồ sơ' });
    }
};

// [ADMIN] Công nhận nêu gương (sau khi Đảng viên nộp báo cáo)
exports.congNhanHoSo = async (req, res) => {
    const { id } = req.params;
    const { ghi_chu_admin } = req.body;
    try {
        const hoSo = await db.query(`
            SELECT h.ma_dang_vien, d.ten_dot, dv.ma_chi_bo
            FROM hosoneuguong h
            JOIN dotneuguong d ON d.ma_dot = h.ma_dot
            JOIN dangvien dv ON dv.ma_dang_vien = h.ma_dang_vien
            WHERE h.ma_ho_so = $1
        `, [id]);

        if (hoSo.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
        const hs = hoSo.rows[0];

        await db.query(`
            UPDATE hosoneuguong
            SET trang_thai = 'Duoc_Cong_Nhan',
                ghi_chu_admin = COALESCE($1, ghi_chu_admin),
                ngay_cong_nhan = CURRENT_TIMESTAMP,
                thoi_gian_cap_nhat = CURRENT_TIMESTAMP
            WHERE ma_ho_so = $2
        `, [ghi_chu_admin || null, id]);

        await createNotification(hs.ma_dang_vien, 'User', '🏆 Được công nhận Nêu gương!', `Chúc mừng! Hồ sơ nêu gương tại đợt "${hs.ten_dot}" của bạn đã được Chi ủy chính thức công nhận.`, 'NEU_GUONG');

        res.json({ message: 'Đã công nhận nêu gương. Thông báo đã gửi cho Đảng viên.' });
    } catch (err) {
        console.error('[congNhanHoSo]', err);
        res.status(500).json({ message: 'Lỗi công nhận hồ sơ' });
    }
};

// ============================================================
// USER (ĐẢNG VIÊN) APIs
// ============================================================

// [USER] Lấy đợt nêu gương đang Mở của chi bộ mình
exports.getDotDangMo = async (req, res) => {
    const ma_dang_vien = req.user.id;
    try {
        // Lấy ma_chi_bo từ đảng viên
        const dvInfo = await db.query(`SELECT ma_chi_bo FROM dangvien WHERE ma_dang_vien = $1`, [ma_dang_vien]);
        if (dvInfo.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy thông tin Đảng viên' });

        const ma_chi_bo = dvInfo.rows[0].ma_chi_bo;
        const result = await db.query(`
            SELECT d.*,
                   h.ma_ho_so, h.trang_thai AS trang_thai_ho_so, h.ngay_nop, h.file_bao_cao, h.ghi_chu_admin,
                   h.ngay_duyet, h.ngay_cong_nhan
            FROM dotneuguong d
            LEFT JOIN hosoneuguong h ON h.ma_dot = d.ma_dot AND h.ma_dang_vien = $1
            WHERE d.ma_chi_bo = $2
            ORDER BY d.nam DESC, d.thang DESC
            LIMIT 5
        `, [ma_dang_vien, ma_chi_bo]);

        res.json(result.rows);
    } catch (err) {
        console.error('[getDotDangMo]', err);
        res.status(500).json({ message: 'Lỗi lấy đợt nêu gương' });
    }
};

// [USER] Nộp hồ sơ đề xuất nêu gương (kèm danh sách hoạt động)
exports.nopHoSo = async (req, res) => {
    const ma_dang_vien = req.user.id;
    const { ma_dot, danh_sach_hoat_dong } = req.body;
    // danh_sach_hoat_dong = [{ ten_hoat_dong, file_minh_chung, ghi_chu }]

    if (!ma_dot) return res.status(400).json({ message: 'Thiếu thông tin đợt nêu gương' });
    if (!danh_sach_hoat_dong || !Array.isArray(danh_sach_hoat_dong) || danh_sach_hoat_dong.length === 0) {
        return res.status(400).json({ message: 'Vui lòng nhập ít nhất 1 hoạt động' });
    }

    try {
        // Kiểm tra đợt còn Mở không
        const dotCheck = await db.query(`SELECT trang_thai FROM dotneuguong WHERE ma_dot = $1`, [ma_dot]);
        if (dotCheck.rows.length === 0 || dotCheck.rows[0].trang_thai !== 'Mo') {
            return res.status(400).json({ message: 'Đợt nêu gương này đã đóng hoặc không tồn tại' });
        }

        // Kiểm tra đã nộp chưa
        const existing = await db.query(`SELECT ma_ho_so FROM hosoneuguong WHERE ma_dot = $1 AND ma_dang_vien = $2`, [ma_dot, ma_dang_vien]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Bạn đã nộp hồ sơ cho đợt này rồi' });
        }

        await db.query('BEGIN');

        // Tạo hồ sơ
        const hoSoResult = await db.query(`
            INSERT INTO hosoneuguong (ma_dot, ma_dang_vien, trang_thai)
            VALUES ($1, $2, 'Cho_Duyet')
            RETURNING ma_ho_so
        `, [ma_dot, ma_dang_vien]);
        const ma_ho_so = hoSoResult.rows[0].ma_ho_so;

        // Thêm các hoạt động
        for (let i = 0; i < danh_sach_hoat_dong.length; i++) {
            const hd = danh_sach_hoat_dong[i];
            await db.query(`
                INSERT INTO hoatdongneuguong (ma_ho_so, ten_hoat_dong, file_minh_chung, ghi_chu, thu_tu)
                VALUES ($1, $2, $3, $4, $5)
            `, [ma_ho_so, hd.ten_hoat_dong, hd.file_minh_chung || null, hd.ghi_chu || null, i + 1]);
        }

        await db.query('COMMIT');

        // Thông báo cho Admin
        const dvInfo = await db.query(`SELECT ho_ten, ma_chi_bo FROM dangvien WHERE ma_dang_vien = $1`, [ma_dang_vien]);
        if (dvInfo.rows.length > 0) {
            const { ho_ten, ma_chi_bo } = dvInfo.rows[0];
            await createNotification(ma_chi_bo, 'Admin', '📋 Hồ sơ Nêu gương mới', `Đảng viên ${ho_ten} vừa nộp hồ sơ đề xuất nêu gương.`, 'NEU_GUONG');
        }

        res.status(201).json({ message: 'Nộp hồ sơ thành công! Chi ủy sẽ xem xét và phản hồi sớm.', ma_ho_so });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('[nopHoSo]', err);
        res.status(500).json({ message: 'Lỗi nộp hồ sơ' });
    }
};

// [USER] Nộp file báo cáo (sau khi được Admin duyệt lần 1)
exports.nopBaoCao = async (req, res) => {
    const ma_dang_vien = req.user.id;
    const { ma_ho_so, file_bao_cao } = req.body;

    if (!ma_ho_so || !file_bao_cao) {
        return res.status(400).json({ message: 'Thiếu mã hồ sơ hoặc file báo cáo' });
    }
    try {
        const result = await db.query(`
            UPDATE hosoneuguong
            SET trang_thai = 'Dang_Xu_Ly',
                file_bao_cao = $1,
                thoi_gian_cap_nhat = CURRENT_TIMESTAMP
            WHERE ma_ho_so = $2 AND ma_dang_vien = $3 AND trang_thai = 'Cho_Nop_Bao_Cao'
            RETURNING *
        `, [file_bao_cao, ma_ho_so, ma_dang_vien]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy hồ sơ hoặc hồ sơ chưa được duyệt lần 1' });
        }

        // Thông báo cho Admin
        const dvInfo = await db.query(`SELECT ho_ten, ma_chi_bo FROM dangvien WHERE ma_dang_vien = $1`, [ma_dang_vien]);
        if (dvInfo.rows.length > 0) {
            const { ho_ten, ma_chi_bo } = dvInfo.rows[0];
            await createNotification(ma_chi_bo, 'Admin', '📄 Báo cáo Nêu gương đã nộp', `Đảng viên ${ho_ten} đã nộp Báo cáo Học tập và làm theo lời Bác. Vui lòng xem xét và công nhận.`, 'NEU_GUONG');
        }

        res.json({ message: 'Nộp báo cáo thành công! Hồ sơ đang được xử lý.' });
    } catch (err) {
        console.error('[nopBaoCao]', err);
        res.status(500).json({ message: 'Lỗi nộp báo cáo' });
    }
};

// [USER] Xem chi tiết hồ sơ của mình (kèm hoạt động)
exports.getMyHoSo = async (req, res) => {
    const ma_dang_vien = req.user.id;
    const { ma_ho_so } = req.params;
    try {
        const result = await db.query(`
            SELECT h.*,
                   d.ten_dot, d.thang, d.nam, d.file_mau_bao_cao,
                   (SELECT json_agg(hd ORDER BY hd.thu_tu)
                    FROM hoatdongneuguong hd WHERE hd.ma_ho_so = h.ma_ho_so) AS danh_sach_hoat_dong
            FROM hosoneuguong h
            JOIN dotneuguong d ON d.ma_dot = h.ma_dot
            WHERE h.ma_ho_so = $1 AND h.ma_dang_vien = $2
        `, [ma_ho_so, ma_dang_vien]);

        if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[getMyHoSo]', err);
        res.status(500).json({ message: 'Lỗi lấy chi tiết hồ sơ' });
    }
};
