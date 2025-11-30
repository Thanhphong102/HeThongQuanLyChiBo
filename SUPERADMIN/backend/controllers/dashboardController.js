const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const usersCount = await db.query('SELECT COUNT(*) FROM "dangvien"');
        const branchCount = await db.query('SELECT COUNT(*) FROM "chibo"');
        const totalIncome = await db.query(`SELECT SUM(so_tien) FROM "taichinh" WHERE loai_giao_dich = 'Thu'`);

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            totalBranches: parseInt(branchCount.rows[0].count),
            totalFund: parseInt(totalIncome.rows[0].sum) || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy thống kê' });
    }
};