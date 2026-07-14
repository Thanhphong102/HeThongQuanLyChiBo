const db = require('../config/db');
const { createNotification } = require('../services/sharedNotificationService');

// --- USER API ---
// Tạo yêu cầu chuyển đảng mới
exports.createTransferRequest = async (req, res) => {
    // Lưu ý: User (Đảng viên) sẽ truyền ma_dang_vien hoặc lấy từ req.user
    const { loai_chuyen, noi_chuyen_den, documents } = req.body;
    const ma_dang_vien = req.user.id;

    if (!loai_chuyen || !noi_chuyen_den) {
        return res.status(400).json({ message: 'Vui lòng nhập loại chuyển và nơi chuyển đến' });
    }

    try {
        await db.query('BEGIN'); // Bắt đầu transaction

        // 1. Tạo request
        const insertReq = await db.query(
            `INSERT INTO "TransferRequests" (ma_dang_vien, loai_chuyen, noi_chuyen_den, trang_thai) 
             VALUES ($1, $2, $3, 'Da_Gui') RETURNING id`,
            [ma_dang_vien, loai_chuyen, noi_chuyen_den]
        );
        const requestId = insertReq.rows[0].id;

        // 2. Thêm hồ sơ đính kèm (nếu có)
        if (documents && Array.isArray(documents) && documents.length > 0) {
            for (let doc of documents) {
                await db.query(
                    `INSERT INTO "TransferDocuments" (request_id, ten_tai_lieu, file_url) VALUES ($1, $2, $3)`,
                    [requestId, doc.ten_tai_lieu, doc.file_url]
                );
            }
        }

        // 3. Ghi log lưu vết
        await db.query(
            `INSERT INTO "TransferLogs" (request_id, nguoi_thuc_hien_id, hanh_dong, chi_tiet) 
             VALUES ($1, $2, 'TAO_MOI', 'Đảng viên tạo mới yêu cầu chuyển sinh hoạt Đảng')`,
            [requestId, ma_dang_vien]
        );

        await db.query('COMMIT');
        
        // Gửi thông báo cho Admin
        const userCheck = await db.query('SELECT ma_chi_bo, ho_ten FROM dangvien WHERE ma_dang_vien = $1', [ma_dang_vien]);
        if (userCheck.rows.length > 0) {
            const { ma_chi_bo, ho_ten } = userCheck.rows[0];
            await createNotification(ma_chi_bo, 'Admin', 'Yêu cầu chuyển Đảng mới', `Đảng viên ${ho_ten} vừa tạo một yêu cầu chuyển sinh hoạt Đảng.`, `TRANSFER_${requestId}`);
        }

        res.status(201).json({ message: 'Đã gửi yêu cầu chuyển Đảng thành công', request_id: requestId });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu' });
    }
};

// Lấy danh sách yêu cầu của bản thân
exports.getMyTransferRequests = async (req, res) => {
    const ma_dang_vien = req.user.id;
    try {
        const result = await db.query(
            `SELECT * FROM "TransferRequests" WHERE ma_dang_vien = $1 ORDER BY ngay_tao DESC`,
            [ma_dang_vien]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách yêu cầu' });
    }
};

// Nộp bổ sung hồ sơ
exports.addDocuments = async (req, res) => {
    const { id } = req.params; // request_id
    const { documents } = req.body;
    const ma_dang_vien = req.user.id;

    try {
        await db.query('BEGIN');
        
        // Cập nhật lại ngày cập nhật của request
        await db.query('UPDATE "TransferRequests" SET ngay_cap_nhat = CURRENT_TIMESTAMP WHERE id = $1', [id]);

        if (documents && Array.isArray(documents)) {
            for (let doc of documents) {
                await db.query(
                    `INSERT INTO "TransferDocuments" (request_id, ten_tai_lieu, file_url) VALUES ($1, $2, $3)`,
                    [id, doc.ten_tai_lieu, doc.file_url]
                );
            }
        }

        // Ghi log
        await db.query(
            `INSERT INTO "TransferLogs" (request_id, nguoi_thuc_hien_id, hanh_dong, chi_tiet) 
             VALUES ($1, $2, 'NOP_BO_SUNG_HO_SO', 'Đảng viên nộp bổ sung hồ sơ')`,
            [id, ma_dang_vien]
        );

        await db.query('COMMIT');
        
        const userCheck = await db.query('SELECT ma_chi_bo, ho_ten FROM dangvien WHERE ma_dang_vien = $1', [ma_dang_vien]);
        if (userCheck.rows.length > 0) {
            const { ma_chi_bo, ho_ten } = userCheck.rows[0];
            await createNotification(ma_chi_bo, 'Admin', 'Hồ sơ chuyển Đảng được cập nhật', `Đảng viên ${ho_ten} vừa nộp bổ sung hồ sơ.`, `TRANSFER_${id}`);
        }

        res.json({ message: 'Đã bổ sung hồ sơ thành công' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Lỗi bổ sung hồ sơ' });
    }
};

// Cập nhật thông tin yêu cầu (Chỉ khi Đã gửi)
exports.updateTransferRequest = async (req, res) => {
    const { id } = req.params;
    const { loai_chuyen, noi_chuyen_den } = req.body;
    const ma_dang_vien = req.user.id;

    try {
        const check = await db.query('SELECT trang_thai, ma_dang_vien FROM "TransferRequests" WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
        if (check.rows[0].ma_dang_vien !== ma_dang_vien) return res.status(403).json({ message: 'Không có quyền' });
        if (check.rows[0].trang_thai !== 'Da_Gui') return res.status(400).json({ message: 'Chỉ được sửa khi hồ sơ mới gửi' });

        await db.query(
            'UPDATE "TransferRequests" SET loai_chuyen = $1, noi_chuyen_den = $2, ngay_cap_nhat = CURRENT_TIMESTAMP WHERE id = $3',
            [loai_chuyen, noi_chuyen_den, id]
        );
        
        await db.query(
            `INSERT INTO "TransferLogs" (request_id, nguoi_thuc_hien_id, hanh_dong, chi_tiet) 
             VALUES ($1, $2, 'CAP_NHAT_THONG_TIN', 'Đảng viên đã chỉnh sửa thông tin yêu cầu')`,
            [id, ma_dang_vien]
        );

        const userCheck = await db.query('SELECT ma_chi_bo, ho_ten FROM dangvien WHERE ma_dang_vien = $1', [ma_dang_vien]);
        if (userCheck.rows.length > 0) {
            const { ma_chi_bo, ho_ten } = userCheck.rows[0];
            await createNotification(ma_chi_bo, 'Admin', 'Hồ sơ chuyển Đảng được cập nhật', `Đảng viên ${ho_ten} vừa sửa thông tin yêu cầu.`, `TRANSFER_${id}`);
        }

        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật yêu cầu' });
    }
};

// Xóa 1 tài liệu (Chỉ khi Đã gửi)
exports.deleteDocument = async (req, res) => {
    const { req_id, doc_id } = req.params;
    const ma_dang_vien = req.user.id;

    try {
        const check = await db.query('SELECT trang_thai, ma_dang_vien FROM "TransferRequests" WHERE id = $1', [req_id]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
        if (check.rows[0].ma_dang_vien !== ma_dang_vien) return res.status(403).json({ message: 'Không có quyền' });
        if (check.rows[0].trang_thai !== 'Da_Gui' && check.rows[0].trang_thai !== 'Can_Bo_Sung') return res.status(400).json({ message: 'Không thể xóa tài liệu ở trạng thái này' });

        await db.query('DELETE FROM "TransferDocuments" WHERE id = $1 AND request_id = $2', [doc_id, req_id]);
        const userCheck = await db.query('SELECT ma_chi_bo, ho_ten FROM dangvien WHERE ma_dang_vien = $1', [ma_dang_vien]);
        if (userCheck.rows.length > 0) {
            const { ma_chi_bo, ho_ten } = userCheck.rows[0];
            await createNotification(ma_chi_bo, 'Admin', 'Hồ sơ chuyển Đảng được cập nhật', `Đảng viên ${ho_ten} vừa xóa một tài liệu.`, `TRANSFER_${req_id}`);
        }

        res.json({ message: 'Đã xóa tài liệu' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa tài liệu' });
    }
};

// --- CHI ỦY / ADMIN API ---
// Lấy danh sách toàn bộ yêu cầu (Admin)
exports.getAllTransferRequests = async (req, res) => {
    // Admin lấy tất cả yêu cầu của các đảng viên thuộc chi bộ mình quản lý
    const branchId = req.user.branchId; 
    
    try {
        const query = `
            SELECT tr.*, dv.ho_ten, dv.so_the_dang_vien
            FROM "TransferRequests" tr
            JOIN "dangvien" dv ON tr.ma_dang_vien = dv.ma_dang_vien
            WHERE dv.ma_chi_bo = $1
            ORDER BY tr.ngay_cap_nhat DESC
        `;
        const result = await db.query(query, [branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách yêu cầu chuyển Đảng' });
    }
};

// Lấy chi tiết yêu cầu (có Kèm docs và logs)
exports.getTransferRequestDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const requestRes = await db.query(
            `SELECT tr.*, dv.ho_ten, dv.email, dv.so_dien_thoai
            FROM "TransferRequests" tr
            JOIN "dangvien" dv ON tr.ma_dang_vien = dv.ma_dang_vien
            WHERE tr.id = $1`, [id]
        );
        if (requestRes.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });

        const request = requestRes.rows[0];

        const docsRes = await db.query('SELECT * FROM "TransferDocuments" WHERE request_id = $1 ORDER BY id ASC', [id]);
        
        // Kết nối bảng "dangvien" để lấy tên người thực hiện (có thể là admin hoặc user)
        const logsRes = await db.query(
            `SELECT tl.*, dv.ho_ten as ten_nguoi_thuc_hien
             FROM "TransferLogs" tl
             LEFT JOIN "dangvien" dv ON tl.nguoi_thuc_hien_id = dv.ma_dang_vien
             WHERE tl.request_id = $1 
             ORDER BY tl.thoi_gian ASC`, [id]
        );

        res.json({
            ...request,
            documents: docsRes.rows,
            logs: logsRes.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy chi tiết yêu cầu' });
    }
};

// Chạy cronjob thủ công (Để test)
exports.triggerCron = async (req, res) => {
    try {
        const { runTransferCron } = require('../services/transferCron');
        await runTransferCron();
        res.json({ message: 'Đã chạy ngầm logic nhắc nhở chuyển Đảng thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi gọi cronjob' });
    }
};

// Đổi trạng thái yêu cầu (Duyệt)
exports.updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { trang_thai, ghi_chu_chi_uy } = req.body;
    const adminId = req.user.id;

    try {
        await db.query('BEGIN');
        
        await db.query(
            'UPDATE "TransferRequests" SET trang_thai = $1, ghi_chu_chi_uy = $2, ngay_cap_nhat = CURRENT_TIMESTAMP WHERE id = $3',
            [trang_thai, ghi_chu_chi_uy, id]
        );

        // Ghi log
        const logDetail = ghi_chu_chi_uy ? `Chi ủy chuyển trạng thái thành ${trang_thai} (Lý do: ${ghi_chu_chi_uy})` : `Chi ủy chuyển trạng thái thành ${trang_thai}`;
        await db.query(
            `INSERT INTO "TransferLogs" (request_id, nguoi_thuc_hien_id, hanh_dong, chi_tiet) 
             VALUES ($1, $2, 'CAP_NHAT_TRANG_THAI', $3)`,
            [id, adminId, logDetail]
        );

        await db.query('COMMIT');

        // Gửi thông báo cho User
        const reqCheck = await db.query('SELECT ma_dang_vien FROM "TransferRequests" WHERE id = $1', [id]);
        if (reqCheck.rows.length > 0) {
            const statusMap = {
                'Da_Gui': 'Đã gửi',
                'Dang_Tham_Dinh': 'Đang thẩm định',
                'Can_Bo_Sung': 'Cần bổ sung',
                'Cho_Ky_Giay': 'Chờ ký giấy',
                'Hoan_Tat': 'Hoàn tất',
                'Da_Huy': 'Đã hủy'
            };
            const mappedStatus = statusMap[trang_thai] || trang_thai;
            await createNotification(reqCheck.rows[0].ma_dang_vien, 'User', 'Cập nhật trạng thái hồ sơ', `Yêu cầu chuyển Đảng của bạn đã được Chi ủy chuyển sang trạng thái: ${mappedStatus}`, `TRANSFER_${id}`);
        }

        res.json({ message: 'Đã cập nhật trạng thái thành công' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
};

// Đánh giá trạng thái 1 tài liệu đính kèm
exports.reviewDocument = async (req, res) => {
    const { doc_id } = req.params;
    const { trang_thai_tai_lieu, ghi_chu } = req.body;
    
    try {
        await db.query(
            'UPDATE "TransferDocuments" SET trang_thai_tai_lieu = $1, ghi_chu = $2 WHERE id = $3',
            [trang_thai_tai_lieu, ghi_chu, doc_id]
        );
        res.json({ message: 'Đã cập nhật trạng thái tài liệu' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật tài liệu' });
    }
};

// --- GUIDELINE APIs ---
exports.getGuideline = async (req, res) => {
    const { loai_chuyen } = req.query;
    const ma_dang_vien = req.user.id;
    try {
        const userCheck = await db.query('SELECT ma_chi_bo FROM dangvien WHERE ma_dang_vien = $1', [ma_dang_vien]);
        if (userCheck.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        const ma_chi_bo = userCheck.rows[0].ma_chi_bo;

        const guideline = await db.query(
            `SELECT * FROM "TransferGuidelines" WHERE ma_chi_bo = $1 AND loai_chuyen = $2`,
            [ma_chi_bo, loai_chuyen]
        );
        if (guideline.rows.length > 0) {
            res.json(guideline.rows[0]);
        } else {
            res.json({ noi_dung: '', documents: [] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.saveGuideline = async (req, res) => {
    const { loai_chuyen, noi_dung, documents } = req.body;
    const ma_dang_vien = req.user.id;
    try {
        const userCheck = await db.query('SELECT ma_chi_bo FROM dangvien WHERE ma_dang_vien = $1', [ma_dang_vien]);
        if (userCheck.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        const ma_chi_bo = userCheck.rows[0].ma_chi_bo;

        await db.query(
            `INSERT INTO "TransferGuidelines" (ma_chi_bo, loai_chuyen, noi_dung, documents)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (ma_chi_bo, loai_chuyen) 
             DO UPDATE SET noi_dung = EXCLUDED.noi_dung, documents = EXCLUDED.documents`,
            [ma_chi_bo, loai_chuyen, noi_dung, JSON.stringify(documents || [])]
        );
        res.json({ message: 'Lưu hướng dẫn thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
