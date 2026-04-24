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
                SELECT * FROM "thuvienanh" 
                WHERE ma_chi_bo = $1 AND loai_hinh_anh = $2 
                ORDER BY ngay_tao DESC
            `;
            params = [branchId, type];
        } else {
            // Nếu KHÔNG có type -> Lấy tất cả (Cả ảnh và video)
            sql = `
                SELECT * FROM "thuvienanh" 
                WHERE ma_chi_bo = $1
                ORDER BY ngay_tao DESC
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
    const { loai_hinh_anh, tieu_de, video_duong_dan } = req.body;
    const file = req.file;

    if (!tieu_de || !loai_hinh_anh) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    try {
        let finalUrl = '';
        let driveFileId = null;

        // CASE 1: IMAGE (Upload lên Drive)
        if (loai_hinh_anh === 'IMAGE') {
            if (!file) return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
            
            const driveData = await uploadFileToDrive(file);
            finalUrl = driveData.webViewLink; 
            driveFileId = driveData.ma_hinh_anh;
        } 
        // CASE 2: VIDEO (Lưu link Youtube)
        else if (loai_hinh_anh === 'VIDEO') {
            if (!video_duong_dan) return res.status(400).json({ message: 'Vui lòng nhập link Video' });
            finalUrl = video_duong_dan;
        }

        const sql = `
            INSERT INTO "thuvienanh" (ma_chi_bo, loai_hinh_anh, tieu_de, duong_dan, ma_file_drive)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await db.query(sql, [branchId, loai_hinh_anh, tieu_de, finalUrl, driveFileId]);

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
        const check = await db.query('SELECT * FROM "thuvienanh" WHERE ma_hinh_anh = $1 AND ma_chi_bo = $2', [id, branchId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy file' });

        const media = check.rows[0];

        if (media.loai_hinh_anh === 'IMAGE' && media.ma_file_drive) {
            await deleteFileFromDrive(media.ma_file_drive);
        }

        await db.query('DELETE FROM "thuvienanh" WHERE ma_hinh_anh = $1', [id]);
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
    const { tieu_de } = req.body;

    if (!tieu_de) {
        return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    }

    try {
        const check = await db.query('SELECT * FROM "thuvienanh" WHERE ma_hinh_anh = $1 AND ma_chi_bo = $2', [id, branchId]);
        
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'File không tồn tại hoặc không có quyền sửa' });
        }

        const sql = `
            UPDATE "thuvienanh" 
            SET tieu_de = $1
            WHERE ma_hinh_anh = $2
            RETURNING *
        `;
        const result = await db.query(sql, [tieu_de, id]);

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
//             SELECT * FROM "thuvienanh" 
//             WHERE ma_chi_bo = $1 AND loai_hinh_anh = $2 
//             ORDER BY ngay_tao DESC
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
//     const { loai_hinh_anh, tieu_de, video_duong_dan } = req.body;
//     const file = req.file;

//     if (!tieu_de || !loai_hinh_anh) {
//         return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
//     }

//     try {
//         let finalUrl = '';
//         let driveFileId = null;

//         // CASE 1: IMAGE (Upload lên Drive)
//         if (loai_hinh_anh === 'IMAGE') {
//             if (!file) return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
            
//             const driveData = await uploadFileToDrive(file);
//             // Dùng link thumbnail cho nhẹ web hoặc webViewLink
//             finalUrl = driveData.webViewLink; 
//             driveFileId = driveData.ma_hinh_anh;
//         } 
//         // CASE 2: VIDEO (Lưu link Youtube)
//         else if (loai_hinh_anh === 'VIDEO') {
//             if (!video_duong_dan) return res.status(400).json({ message: 'Vui lòng nhập link Video' });
//             finalUrl = video_duong_dan;
//         }

//         // Lưu vào DB
//         const sql = `
//             INSERT INTO "thuvienanh" (ma_chi_bo, loai_hinh_anh, tieu_de, duong_dan, ma_file_drive)
//             VALUES ($1, $2, $3, $4, $5)
//             RETURNING *
//         `;
//         const result = await db.query(sql, [branchId, loai_hinh_anh, tieu_de, finalUrl, driveFileId]);

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
//         const check = await db.query('SELECT * FROM "thuvienanh" WHERE ma_hinh_anh = $1 AND ma_chi_bo = $2', [id, branchId]);
//         if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy file' });

//         const media = check.rows[0];

//         // Nếu là Ảnh -> Xóa trên Drive
//         if (media.loai_hinh_anh === 'IMAGE' && media.ma_file_drive) {
//             await deleteFileFromDrive(media.ma_file_drive);
//         }

//         // Xóa DB
//         await db.query('DELETE FROM "thuvienanh" WHERE ma_hinh_anh = $1', [id]);
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
//     const { tieu_de } = req.body;

//     if (!tieu_de) {
//         return res.status(400).json({ message: 'Tiêu đề không được để trống' });
//     }

//     try {
//         // Kiểm tra quyền sở hữu trước khi sửa
//         const check = await db.query('SELECT * FROM "thuvienanh" WHERE ma_hinh_anh = $1 AND ma_chi_bo = $2', [id, branchId]);
        
//         if (check.rows.length === 0) {
//             return res.status(404).json({ message: 'File không tồn tại hoặc không có quyền sửa' });
//         }

//         const sql = `
//             UPDATE "thuvienanh" 
//             SET tieu_de = $1
//             WHERE ma_hinh_anh = $2
//             RETURNING *
//         `;
//         const result = await db.query(sql, [tieu_de, id]);

//         res.json({ message: 'Cập nhật thành công', media: result.rows[0] });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Lỗi cập nhật media' });
//     }
// };