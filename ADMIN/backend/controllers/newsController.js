const db = require('../config/db');

// GET: Lấy danh sách tin tức mới nhất (Public cho cả User xem)
exports.getNews = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "tintuc" ORDER BY ngay_tao DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy tin tức' });
    }
};

// GET: Lấy chi tiết 1 tin tức
exports.getNewsDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM "tintuc" WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Tin không tồn tại' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy chi tiết tin' });
    }
};