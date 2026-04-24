const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// 1. API: GET /api/documents (Lấy danh sách tài liệu)
exports.getDocuments = async (req, res) => {
    try {
        const { search, type } = req.query;
        let sql = 'SELECT * FROM "tailieu" WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND ten_tai_lieu ILIKE $${params.length}`;
        }
        if (type) {
            params.push(`%${type}%`);
            sql += ` AND loai_tai_lieu ILIKE $${params.length}`;
        }

        sql += ` ORDER BY ngay_tai_len DESC`;

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách tài liệu' });
    }
};

// 2. API: POST /api/documents (Upload tài liệu)
exports.uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const { ten_tai_lieu, loai_tai_lieu, ma_chi_bo } = req.body;
        const userId = req.user.id;

        if (!file) {
            return res.status(400).json({ message: 'Vui lòng chọn file' });
        }

        // Upload lên Drive (nếu lỗi Drive vẫn cho tiếp tục)
        let driveData = { webViewLink: '', id: null };
        try {
            driveData = await uploadFileToDrive(file);
        } catch (driveError) {
            console.error('[Drive Upload Warning] Không thể upload lên Drive, sẽ lưu DB với link rỗng:', driveError.message);
        }

        // Lưu vào DB
        const sql = `
            INSERT INTO "tailieu" (ten_tai_lieu, loai_tai_lieu, duong_dan, nguoi_tai_len, ma_chi_bo)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const values = [ten_tai_lieu, loai_tai_lieu, driveData.webViewLink, userId, ma_chi_bo || null];
        const newDoc = await db.query(sql, values);

        // --- Task 10: Tự động đẩy thông báo cho Admin & User ---
        try {
            const notifTitle = `📄 Văn bản mới: ${ten_tai_lieu}`;
            const notifContent = `Tài liệu "${ten_tai_lieu}" vừa được tải lên.`;

            if (ma_chi_bo) {
                // Gửi cho Admin của Chi bộ cụ thể
                await db.query(
                    `INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'Admin', $2, $3, 'DOCUMENT')`,
                    [ma_chi_bo, notifTitle, notifContent]
                );
                // Gửi cho toàn bộ Đảng viên trong Chi bộ (User)
                await db.query(
                    `INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'User', $2, $3, 'DOCUMENT')`,
                    [ma_chi_bo, notifTitle, notifContent]
                );
                console.log(`[Notification] Đã gửi thông báo DOCUMENT tới Admin+User của Chi bộ ${ma_chi_bo}`);
            } else {
                // Không chọn chi bộ → Gửi toàn trường (All)
                await db.query(
                    `INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES (NULL, 'All', $1, $2, 'DOCUMENT')`,
                    [notifTitle, notifContent]
                );
                console.log(`[Notification] Đã gửi thông báo DOCUMENT toàn trường`);
            }
        } catch (notifError) {
            console.error('[Notification Error] Lỗi tạo thông báo văn bản:', notifError.message);
        }

        res.status(201).json({
            message: 'Upload thành công',
            document: newDoc.rows[0],
            driveId: driveData.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi upload tài liệu' });
    }
};

// 3. API: DELETE /api/documents/:id (Xóa tài liệu)
exports.deleteDocument = async (req, res) => {
    const { id } = req.params;

    try {
        // Lấy thông tin tài liệu để lấy link
        const result = await db.query('SELECT * FROM "tailieu" WHERE ma_tai_lieu = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tài liệu không tồn tại' });
        }

        const document = result.rows[0];
        const driveLink = document.duong_dan;

        // Trích xuất File ID từ Link (Regex)
        const fileIdMatch = driveLink.match(/\/d\/(.*?)\//);
        
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            // Xóa trên Drive
            await deleteFileFromDrive(fileId);
        }

        // Xóa trong DB
        await db.query('DELETE FROM "tailieu" WHERE ma_tai_lieu = $1', [id]);

        // --- Gửi Thông báo Xóa ---
        try {
            const notifTitle = `❌ Văn bản bị gỡ bỏ: ${document.ten_tai_lieu}`;
            const notifContent = `Tài liệu "${document.ten_tai_lieu}" đã bị quản trị viên xóa khỏi hệ thống.`;
            if (document.ma_chi_bo) {
                await db.query(`INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'Admin', $2, $3, 'DOCUMENT')`, [document.ma_chi_bo, notifTitle, notifContent]);
                await db.query(`INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'User', $2, $3, 'DOCUMENT')`, [document.ma_chi_bo, notifTitle, notifContent]);
            } else {
                await db.query(`INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES (NULL, 'All', $1, $2, 'DOCUMENT')`, [notifTitle, notifContent]);
            }
        } catch(e) { console.error('Lỗi gửi thông báo xóa văn bản:', e.message); }

        res.json({ message: 'Đã xóa tài liệu thành công' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa tài liệu' });
    }
};

// 4. API: PUT /api/documents/:id (Cập nhật thông tin tài liệu)
exports.updateDocument = async (req, res) => {
    const { id } = req.params;
    const { ten_tai_lieu, loai_tai_lieu } = req.body;
    
    try {
        const sql = `
            UPDATE "tailieu"
            SET ten_tai_lieu = $1, loai_tai_lieu = $2
            WHERE ma_tai_lieu = $3
            RETURNING *
        `;
        const result = await db.query(sql, [ten_tai_lieu, loai_tai_lieu, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tài liệu không tồn tại' });
        }
        
        const doc = result.rows[0];
        
        // --- Gửi Thông báo Cập nhật ---
        try {
            const notifTitle = `📝 Văn bản cập nhật: ${ten_tai_lieu}`;
            const notifContent = `Tài liệu "${ten_tai_lieu}" vừa được quản trị viên thay đổi thông tin.`;
            if (doc.ma_chi_bo) {
                await db.query(`INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'Admin', $2, $3, 'DOCUMENT')`, [doc.ma_chi_bo, notifTitle, notifContent]);
                await db.query(`INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES ($1, 'User', $2, $3, 'DOCUMENT')`, [doc.ma_chi_bo, notifTitle, notifContent]);
            } else {
                await db.query(`INSERT INTO "thongbao" (ma_nguoi_nhan, quyen_nguoi_nhan, title, content, type) VALUES (NULL, 'All', $1, $2, 'DOCUMENT')`, [notifTitle, notifContent]);
            }
        } catch(e) { console.error('Lỗi gửi thông báo update văn bản:', e.message); }

        res.json({ message: 'Cập nhật thành công', document: doc });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật tài liệu' });
    }
};