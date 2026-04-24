const db = require('../config/db');

// Lấy danh sách nhân sự - Sơ đồ tổ chức (Public)
// Lấy danh sách nhân sự - Sơ đồ tổ chức (Public)
exports.getOrgChart = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "sodotochuc" ORDER BY thu_tu ASC, ma_so_do ASC');
        res.json(result.rows);
    } catch (error) { 
        console.error('getOrgChart ERROR:', error.message);
        res.status(500).json({ message: 'Lỗi lấy sơ đồ' }); 
    }
};

// Lấy danh sách Quy trình làm việc (Public)
exports.getProcesses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "quytrinhdang" ORDER BY thu_tu ASC');
        res.json(result.rows);
    } catch (error) { 
        res.status(500).json({ message: 'Lỗi lấy quy trình' }); 
    }
};
