const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// 1. GET: Lấy danh sách Media (ĐÃ SỬA: Cho phép lấy tất cả nếu không truyền type)
exports.getMedia = async (req, res) => {
    const branchId = req.user.branchId;
    const { type } = req.query; // 'IMAGE' hoặc 'VIDEO' (Có thể null)

    try {
        let sql = '';
        let params = [];

        if (type) {
            // Nếu có type -> Lọc theo type
            sql = `
                SELECT * FROM "media_library" 
                WHERE party_cell_id = $1 AND media_type = $2 
                ORDER BY created_at DESC
            `;
            params = [branchId, type];
        } else {
            // Nếu KHÔNG có type -> Lấy tất cả (Cả ảnh và video)
            sql = `
                SELECT * FROM "media_library" 
                WHERE party_cell_id = $1
                ORDER BY created_at DESC
            `;
            params = [branchId];
        }

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy dữ liệu media' });
    }
};

// ... (Giữ nguyên các hàm createMedia, deleteMedia, updateMedia bên dưới của bạn)
// 2. POST: Thêm mới Media
exports.createMedia = async (req, res) => {
    const branchId = req.user.branchId;
    const { media_type, title, video_url } = req.body;
    const file = req.file;

    if (!title || !media_type) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        let finalUrl = '';
        let driveFileId = null;

        // CASE 1: IMAGE (Upload lên Drive)
        if (media_type === 'IMAGE') {
            if (!file) return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
            
            const driveData = await uploadFileToDrive(file);
            finalUrl = driveData.webViewLink; 
            driveFileId = driveData.id;
        } 
        // CASE 2: VIDEO (Lưu link Youtube)
        else if (media_type === 'VIDEO') {
            if (!video_url) return res.status(400).json({ message: 'Vui lòng nhập link Video' });
            finalUrl = video_url;
        }

        const sql = `
            INSERT INTO "media_library" (party_cell_id, media_type, title, url, drive_file_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(sql, [branchId, media_type, title, finalUrl, driveFileId]);

        res.status(201).json({ message: 'Thêm thành công', media: result.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi thêm media' });
    }
};

// 3. DELETE: Xóa Media
exports.deleteMedia = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        const check = await db.query('SELECT * FROM "media_library" WHERE id = $1 AND party_cell_id = $2', [id, branchId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy file' });

        const media = check.rows[0];

        if (media.media_type === 'IMAGE' && media.drive_file_id) {
            await deleteFileFromDrive(media.drive_file_id);
        }

        await db.query('DELETE FROM "media_library" WHERE id = $1', [id]);
        res.json({ message: 'Đã xóa thành công' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa media' });
    }
};

// 4. PUT: Cập nhật thông tin Media
exports.updateMedia = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    }

    try {
        const check = await db.query('SELECT * FROM "media_library" WHERE id = $1 AND party_cell_id = $2', [id, branchId]);
        
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'File không tồn tại hoặc không có quyền sửa' });
        }

        const sql = `
            UPDATE "media_library" 
            SET title = $1
            WHERE id = $2
            RETURNING *
        `;
        const result = await db.query(sql, [title, id]);

        res.json({ message: 'Cập nhật thành công', media: result.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật media' });
    }
};

// const db = require('../config/db');
// const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// // 1. GET: Lấy danh sách Media (Lọc theo Type)
// exports.getMedia = async (req, res) => {
//     const branchId = req.user.branchId;
//     const { type } = req.query; // 'IMAGE' hoặc 'VIDEO'

//     try {
//         const sql = `
//             SELECT * FROM "media_library" 
//             WHERE party_cell_id = $1 AND media_type = $2 
//             ORDER BY created_at DESC
//         `;
//         const result = await db.query(sql, [branchId, type]);
//         res.json(result.rows);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi lấy dữ liệu media' });
//     }
// };

// // 2. POST: Thêm mới Media (Xử lý rẽ nhánh Ảnh/Video)
// exports.createMedia = async (req, res) => {
//     const branchId = req.user.branchId;
//     const { media_type, title, video_url } = req.body;
//     const file = req.file;

//     if (!title || !media_type) {
//         return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
//     }

//     try {
//         let finalUrl = '';
//         let driveFileId = null;

//         // CASE 1: IMAGE (Upload lên Drive)
//         if (media_type === 'IMAGE') {
//             if (!file) return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
            
//             const driveData = await uploadFileToDrive(file);
//             // Dùng link thumbnail cho nhẹ web hoặc webViewLink
//             finalUrl = driveData.webViewLink; 
//             driveFileId = driveData.id;
//         } 
//         // CASE 2: VIDEO (Lưu link Youtube)
//         else if (media_type === 'VIDEO') {
//             if (!video_url) return res.status(400).json({ message: 'Vui lòng nhập link Video' });
//             finalUrl = video_url;
//         }

//         // Lưu vào DB
//         const sql = `
//             INSERT INTO "media_library" (party_cell_id, media_type, title, url, drive_file_id)
//             VALUES ($1, $2, $3, $4, $5)
//             RETURNING *
//         `;
//         const result = await db.query(sql, [branchId, media_type, title, finalUrl, driveFileId]);

//         res.status(201).json({ message: 'Thêm thành công', media: result.rows[0] });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi thêm media' });
//     }
// };

// // 3. DELETE: Xóa Media
// exports.deleteMedia = async (req, res) => {
//     const { id } = req.params;
//     const branchId = req.user.branchId;

//     try {
//         const check = await db.query('SELECT * FROM "media_library" WHERE id = $1 AND party_cell_id = $2', [id, branchId]);
//         if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy file' });

//         const media = check.rows[0];

//         // Nếu là Ảnh -> Xóa trên Drive
//         if (media.media_type === 'IMAGE' && media.drive_file_id) {
//             await deleteFileFromDrive(media.drive_file_id);
//         }

//         // Xóa DB
//         await db.query('DELETE FROM "media_library" WHERE id = $1', [id]);
//         res.json({ message: 'Đã xóa thành công' });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi xóa media' });
//     }
// };

// // 4. PUT: Cập nhật thông tin Media (Sửa tên)
// exports.updateMedia = async (req, res) => {
//     const { id } = req.params;
//     const branchId = req.user.branchId;
//     const { title } = req.body;

//     if (!title) {
//         return res.status(400).json({ message: 'Tiêu đề không được để trống' });
//     }

//     try {
//         // Kiểm tra quyền sở hữu trước khi sửa
//         const check = await db.query('SELECT * FROM "media_library" WHERE id = $1 AND party_cell_id = $2', [id, branchId]);
        
//         if (check.rows.length === 0) {
//             return res.status(404).json({ message: 'File không tồn tại hoặc không có quyền sửa' });
//         }

//         const sql = `
//             UPDATE "media_library" 
//             SET title = $1
//             WHERE id = $2
//             RETURNING *
//         `;
//         const result = await db.query(sql, [title, id]);

//         res.json({ message: 'Cập nhật thành công', media: result.rows[0] });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi cập nhật media' });
//     }
// };