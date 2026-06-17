const db = require('../config/db');
const { deleteFileFromDrive } = require('../services/driveService');

exports.getAlbums = async (req, res) => {
    const branchId = req.user.branchId;
    try {
        const sql = `
            SELECT a.*, 
                   COUNT(h.ma_hinh_anh) as so_luong_anh,
                   MIN(h.duong_dan) as anh_bia
            FROM "album" a
            LEFT JOIN "thuvienanh" h ON a.ma_album = h.ma_album AND h.loai_hinh_anh = 'IMAGE'
            WHERE a.ma_chi_bo = $1
            GROUP BY a.ma_album
            ORDER BY a.ngay_tao DESC
        `;
        const result = await db.query(sql, [branchId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy danh sách album' });
    }
};

exports.getAlbumById = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    try {
        const albumSql = `SELECT * FROM "album" WHERE ma_album = $1 AND ma_chi_bo = $2`;
        const albumRes = await db.query(albumSql, [id, branchId]);
        
        if (albumRes.rows.length === 0) {
            return res.status(404).json({ message: 'Album không tồn tại' });
        }

        const imagesSql = `SELECT * FROM "thuvienanh" WHERE ma_album = $1 ORDER BY ngay_tao DESC`;
        const imagesRes = await db.query(imagesSql, [id]);

        res.json({
            album: albumRes.rows[0],
            images: imagesRes.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy chi tiết album' });
    }
};

exports.createAlbum = async (req, res) => {
    const branchId = req.user.branchId;
    const userId = req.user.id;
    const { ten_album } = req.body;

    if (!ten_album) return res.status(400).json({ message: 'Tên album không được trống' });

    try {
        const sql = `
            INSERT INTO "album" (ten_album, ma_chi_bo, nguoi_tao) 
            VALUES ($1, $2, $3) RETURNING *
        `;
        const result = await db.query(sql, [ten_album, branchId, userId]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo album' });
    }
};

exports.updateAlbum = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;
    const { ten_album } = req.body;

    if (!ten_album) return res.status(400).json({ message: 'Tên album không được trống' });

    try {
        const sql = `
            UPDATE "album" 
            SET ten_album = $1 
            WHERE ma_album = $2 AND ma_chi_bo = $3 RETURNING *
        `;
        const result = await db.query(sql, [ten_album, id, branchId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy album' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật album' });
    }
};

exports.deleteAlbum = async (req, res) => {
    const { id } = req.params;
    const branchId = req.user.branchId;

    try {
        // Kiểm tra album
        const check = await db.query('SELECT * FROM "album" WHERE ma_album = $1 AND ma_chi_bo = $2', [id, branchId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy album' });

        // Lấy danh sách ảnh để xóa trên Drive
        const images = await db.query('SELECT ma_file_drive FROM "thuvienanh" WHERE ma_album = $1 AND ma_file_drive IS NOT NULL', [id]);
        
        for (let img of images.rows) {
            try {
                await deleteFileFromDrive(img.ma_file_drive);
            } catch(e) { console.error('Lỗi xóa Drive file', img.ma_file_drive) }
        }

        // Nhờ ON DELETE CASCADE ở DB, ta chỉ cần xóa album là ảnh trong DB tự mất
        await db.query('DELETE FROM "album" WHERE ma_album = $1', [id]);
        
        res.json({ message: 'Đã xóa album và toàn bộ ảnh bên trong' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa album' });
    }
};
