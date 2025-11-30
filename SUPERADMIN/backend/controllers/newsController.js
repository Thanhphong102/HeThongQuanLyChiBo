const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// 1. GET: Lấy danh sách tin tức
exports.getNews = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "news" ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách tin tức' });
    }
};

// 2. POST: Thêm tin tức mới (Upload ảnh)
exports.createNews = async (req, res) => {
    const { title, content } = req.body;
    const file = req.file;

    if (!title) return res.status(400).json({ message: 'Tiêu đề không được để trống' });

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
            INSERT INTO "news" (title, content, image_url, drive_file_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(sql, [title, content, imageUrl, driveFileId]);

        res.status(201).json({ message: 'Đăng tin thành công', news: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi đăng tin tức' });
    }
};

// 3. PUT: Cập nhật tin tức
exports.updateNews = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const file = req.file; // File ảnh mới (nếu có)

    try {
        // Lấy thông tin cũ để xử lý ảnh cũ
        const oldNews = await db.query('SELECT * FROM "news" WHERE id = $1', [id]);
        if (oldNews.rows.length === 0) return res.status(404).json({ message: 'Tin tức không tồn tại' });

        let imageUrl = oldNews.rows[0].image_url;
        let driveFileId = oldNews.rows[0].drive_file_id;

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
            UPDATE "news" 
            SET title = $1, content = $2, image_url = $3, drive_file_id = $4
            WHERE id = $5
            RETURNING *
        `;
        const result = await db.query(sql, [title, content, imageUrl, driveFileId, id]);

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
        const oldNews = await db.query('SELECT drive_file_id FROM "news" WHERE id = $1', [id]);
        
        if (oldNews.rows.length > 0 && oldNews.rows[0].drive_file_id) {
            await deleteFileFromDrive(oldNews.rows[0].drive_file_id);
        }

        await db.query('DELETE FROM "news" WHERE id = $1', [id]);
        res.json({ message: 'Đã xóa tin tức' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa tin tức' });
    }
};