const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// 1. GET: Lấy danh sách tin tức
exports.getNews = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        let sql = 'SELECT * FROM "tintuc" WHERE 1=1';
        let params = [];
        let paramIndex = 1;

        if (search) {
            sql += ` AND tieu_de ILIKE $${paramIndex++}`;
            params.push(`%${search}%`);
        }
        if (startDate && endDate) {
            sql += ` AND ngay_tao >= $${paramIndex++}::timestamp AND ngay_tao <= $${paramIndex++}::timestamp`;
            params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
        }

        sql += ' ORDER BY ngay_tao DESC';
        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách tin tức' });
    }
};

// 2. POST: Thêm tin tức mới (Upload ảnh)
exports.createNews = async (req, res) => {
    const { tieu_de, noi_dung } = req.body;
    const file = req.file;

    if (!tieu_de) return res.status(400).json({ message: 'Tiêu đề không được để trống' });

    try {
        let imageUrl = null;
        let driveFileId = null;

        // Nếu có file ảnh, upload lên Drive
        if (file) {
            const driveData = await uploadFileToDrive(file);
            imageUrl = driveData.webViewLink;
            driveFileId = driveData.id;
        }

        const sql = `
            INSERT INTO "tintuc" (tieu_de, noi_dung, duong_dan_anh, ma_file_drive)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(sql, [tieu_de, noi_dung, imageUrl, driveFileId]);

        res.status(201).json({ message: 'Đăng tin thành công', news: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi đăng tin tức' });
    }
};

// 3. PUT: Cập nhật tin tức
exports.updateNews = async (req, res) => {
    const { id } = req.params;
    const { tieu_de, noi_dung } = req.body;
    const file = req.file; // File ảnh mới (nếu có)

    try {
        // Lấy thông tin cũ để xử lý ảnh cũ
        const oldNews = await db.query('SELECT * FROM "tintuc" WHERE ma_tin_tuc = $1', [id]);
        if (oldNews.rows.length === 0) return res.status(404).json({ message: 'Tin tức không tồn tại' });

        let imageUrl = oldNews.rows[0].duong_dan_anh;
        let driveFileId = oldNews.rows[0].ma_file_drive;

        // Nếu người dùng upload ảnh mới
        if (file) {
            // 1. Xóa ảnh cũ trên Drive (nếu có)
            if (driveFileId) {
                await deleteFileFromDrive(driveFileId);
            }
            // 2. Upload ảnh mới
            const driveData = await uploadFileToDrive(file);
            imageUrl = driveData.webViewLink;
            driveFileId = driveData.id;
        }

        const sql = `
            UPDATE "tintuc" 
            SET tieu_de = $1, noi_dung = $2, duong_dan_anh = $3, ma_file_drive = $4
            WHERE ma_tin_tuc = $5
            RETURNING *
        `;
        const result = await db.query(sql, [tieu_de, noi_dung, imageUrl, driveFileId, id]);

        res.json({ message: 'Cập nhật thành công', news: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật tin tức' });
    }
};

// 4. DELETE: Xóa tin tức
exports.deleteNews = async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy ID ảnh để xóa trên Drive trước
        const oldNews = await db.query('SELECT ma_file_drive FROM "tintuc" WHERE ma_tin_tuc = $1', [id]);
        
        if (oldNews.rows.length > 0 && oldNews.rows[0].ma_file_drive) {
            await deleteFileFromDrive(oldNews.rows[0].ma_file_drive);
        }

        await db.query('DELETE FROM "tintuc" WHERE ma_tin_tuc = $1', [id]);
        res.json({ message: 'Đã xóa tin tức' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa tin tức' });
    }
};