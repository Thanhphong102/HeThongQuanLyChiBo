const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const usersCount = await db.query('SELECT COUNT(*) FROM "dangvien"');
        const branchCount = await db.query('SELECT COUNT(*) FROM "chibo"');
        const totalIncome = await db.query(`SELECT SUM(so_tien) FROM "taichinh" WHERE loai_giao_dich = 'Thu'`);
        const chiinhThucCount = await db.query(`SELECT COUNT(*) FROM "dangvien" WHERE trang_thai_dang_vien = 'Chinh thuc'`);
        const duBiCount = await db.query(`SELECT COUNT(*) FROM "dangvien" WHERE trang_thai_dang_vien = 'Du bi'`);

        // Chart 1: Số Đảng viên theo từng Chi bộ (trừ Đảng ủy Trường)
        const chart1Query = `
            SELECT cb.ma_chi_bo as id, cb.ten_chi_bo AS "name", COUNT(dv.ma_dang_vien) AS "value"
            FROM chibo cb
            LEFT JOIN dangvien dv ON cb.ma_chi_bo = dv.ma_chi_bo
            WHERE cb.trang_thai = true AND cb.ten_chi_bo != 'ĐẢNG ỦY TRƯỜNG'
            GROUP BY cb.ma_chi_bo, cb.ten_chi_bo
            ORDER BY "value" DESC
        `;
        const chart1Data = await db.query(chart1Query);

        // Chart 2: Tỷ lệ giới tính theo Chi bộ (hoặc tổng thể nếu branchId = null)
        const chart2Query = `
            SELECT cb.ma_chi_bo as branch_id, cb.ten_chi_bo as branch_name,
                   SUM(CASE WHEN dv.gioi_tinh = 'Nam' THEN 1 ELSE 0 END) as nam,
                   SUM(CASE WHEN dv.gioi_tinh = 'Nu' OR dv.gioi_tinh = 'Nữ' THEN 1 ELSE 0 END) as nu,
                   COUNT(dv.ma_dang_vien) as tong
            FROM chibo cb
            LEFT JOIN dangvien dv ON cb.ma_chi_bo = dv.ma_chi_bo
            WHERE cb.trang_thai = true AND cb.ten_chi_bo != 'ĐẢNG ỦY TRƯỜNG'
            GROUP BY cb.ma_chi_bo, cb.ten_chi_bo
            ORDER BY cb.ten_chi_bo
        `;
        const chart2Data = await db.query(chart2Query);

        // Chart 3: Tỷ lệ Chính thức vs Dự bị theo Chi bộ
        const chart3Query = `
            SELECT cb.ma_chi_bo as branch_id, cb.ten_chi_bo as branch_name,
                   SUM(CASE WHEN dv.trang_thai_dang_vien = 'Chinh thuc' THEN 1 ELSE 0 END) as chinh_thuc,
                   SUM(CASE WHEN dv.trang_thai_dang_vien = 'Du bi' THEN 1 ELSE 0 END) as du_bi,
                   COUNT(dv.ma_dang_vien) as tong
            FROM chibo cb
            LEFT JOIN dangvien dv ON cb.ma_chi_bo = dv.ma_chi_bo
            WHERE cb.trang_thai = true AND cb.ten_chi_bo != 'ĐẢNG ỦY TRƯỜNG'
            GROUP BY cb.ma_chi_bo, cb.ten_chi_bo
            ORDER BY cb.ten_chi_bo
        `;
        const chart3Data = await db.query(chart3Query);

        // Chart 4: Phân bố độ tuổi theo Chi bộ
        const chart4Query = `
            SELECT cb.ma_chi_bo as branch_id, cb.ten_chi_bo as branch_name,
                   SUM(CASE WHEN EXTRACT(YEAR FROM AGE(dv.ngay_sinh)) < 22 THEN 1 ELSE 0 END) as "duoi_22",
                   SUM(CASE WHEN EXTRACT(YEAR FROM AGE(dv.ngay_sinh)) BETWEEN 22 AND 25 THEN 1 ELSE 0 END) as "22_25",
                   SUM(CASE WHEN EXTRACT(YEAR FROM AGE(dv.ngay_sinh)) BETWEEN 26 AND 30 THEN 1 ELSE 0 END) as "26_30",
                   SUM(CASE WHEN EXTRACT(YEAR FROM AGE(dv.ngay_sinh)) > 30 THEN 1 ELSE 0 END) as "tren_30",
                   SUM(CASE WHEN dv.ngay_sinh IS NULL THEN 1 ELSE 0 END) as "chua_cap_nhat"
            FROM chibo cb
            LEFT JOIN dangvien dv ON cb.ma_chi_bo = dv.ma_chi_bo
            WHERE cb.trang_thai = true AND cb.ten_chi_bo != 'ĐẢNG ỦY TRƯỜNG'
            GROUP BY cb.ma_chi_bo, cb.ten_chi_bo
            ORDER BY cb.ten_chi_bo
        `;
        const chart4Data = await db.query(chart4Query);

        // Danh sách các chi bộ (để filter)
        const branchListQuery = `SELECT ma_chi_bo as id, ten_chi_bo as name FROM chibo WHERE trang_thai = true AND ten_chi_bo != 'ĐẢNG ỦY TRƯỜNG' ORDER BY ten_chi_bo`;
        const branchList = await db.query(branchListQuery);

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            totalBranches: parseInt(branchCount.rows[0].count),
            totalFund: parseInt(totalIncome.rows[0].sum) || 0,
            totalChinhThuc: parseInt(chiinhThucCount.rows[0].count) || 0,
            totalDuBi: parseInt(duBiCount.rows[0].count) || 0,
            chart1: chart1Data.rows.map(row => ({
                id: row.id,
                name: row.name,
                value: parseInt(row.value) || 0
            })),
            chart2: chart2Data.rows.map(row => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                nam: parseInt(row.nam) || 0,
                nu: parseInt(row.nu) || 0,
                tong: parseInt(row.tong) || 0
            })),
            chart3: chart3Data.rows.map(row => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                chinh_thuc: parseInt(row.chinh_thuc) || 0,
                du_bi: parseInt(row.du_bi) || 0,
                tong: parseInt(row.tong) || 0
            })),
            chart4: chart4Data.rows.map(row => ({
                branch_id: row.branch_id,
                branch_name: row.branch_name,
                duoi_22: parseInt(row.duoi_22) || 0,
                t22_25: parseInt(row['22_25']) || 0,
                t26_30: parseInt(row['26_30']) || 0,
                tren_30: parseInt(row.tren_30) || 0,
                chua_cap_nhat: parseInt(row.chua_cap_nhat) || 0
            })),
            branchList: branchList.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi lấy thống kê' });
    }
};