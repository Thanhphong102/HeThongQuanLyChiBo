// ADMIN/backend/controllers/schoolDocumentController.js
const db = require('../config/db');

// GET: Lấy danh sách văn bản cấp trường
exports.getSchoolDocuments = async (req, res) => {
    try {
        // Log để kiểm tra
        console.log("--> Đang lấy văn bản trường (ma_chi_bo = 1)...");

        // SỬA LẠI SQL: Lấy tài liệu của Chi bộ 1 (Đảng ủy trường) HOẶC là NULL
        const sql = `
            SELECT * FROM "tailieu" 
            WHERE ma_chi_bo = 1 OR ma_chi_bo IS NULL
            ORDER BY ngay_tai_len DESC
        `;

        const result = await db.query(sql);
        
        console.log(`--> Tìm thấy: ${result.rows.length} văn bản.`);
        
        res.json(result.rows);
    } catch (error) {
        console.error("Lỗi lấy văn bản trường:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy tài liệu' });
    }
};