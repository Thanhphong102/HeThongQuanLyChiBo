const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

// 1. Sơ đồ tổ chức (Org Chart)
exports.getOrgChart = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "sodotochuc" ORDER BY thu_tu ASC, ma_so_do ASC');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy sơ đồ' }); }
};

exports.createOrgMember = async (req, res) => {
    const { ho_ten, chuc_vu, ma_so_do_cha, thu_tu } = req.body;
    let anh_the = null;
    try {
        if (req.file) {
            const driveData = await uploadFileToDrive(req.file);
            anh_the = driveData.webViewLink;
        }
        const sql = `INSERT INTO "sodotochuc" (ho_ten, chuc_vu, anh_the, ma_so_do_cha, thu_tu) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const result = await db.query(sql, [ho_ten, chuc_vu, anh_the, ma_so_do_cha || null, thu_tu || 0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Lỗi createOrgMember:', error);
        res.status(500).json({ message: 'Lỗi tạo hồ sơ', error: error.message });
    }
};

exports.deleteOrgMember = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM "sodotochuc" WHERE ma_so_do = $1', [id]);
        res.json({ message: 'Đã xóa' });
    } catch (error) { res.status(500).json({ message: 'Lỗi xóa hồ sơ' }); }
};

// 2. Quy trình Đảng (Process Flowcharts)
exports.getProcesses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM "quytrinhdang" ORDER BY thu_tu ASC');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy quy trình' }); }
};

exports.createProcess = async (req, res) => {
    const { tieu_de, mo_ta, thu_tu } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Thiếu file quy trình' });
    try {
        const driveData = await uploadFileToDrive(req.file);
        const sql = `INSERT INTO "quytrinhdang" (tieu_de, mo_ta, duong_dan_file, thu_tu) VALUES ($1, $2, $3, $4) RETURNING *`;
        const result = await db.query(sql, [tieu_de, mo_ta, driveData.webViewLink, thu_tu || 0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Lỗi createProcess:', error);
        res.status(500).json({ message: 'Lỗi thiết lập quy trình', error: error.message });
    }
};

exports.deleteProcess = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM "quytrinhdang" WHERE ma_quy_trinh = $1', [id]);
        res.json({ message: 'Xóa thành công' });
    } catch (error) { res.status(500).json({ message: 'Lỗi xóa quy trình' }); }
};
