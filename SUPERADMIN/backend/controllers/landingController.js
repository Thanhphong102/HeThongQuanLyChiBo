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
    const { ho_ten, chuc_vu, ma_so_do_cha, thu_tu, email, nhiem_vu } = req.body;
    let anh_the = null;
    try {
        if (req.file) {
            const driveData = await uploadFileToDrive(req.file);
            anh_the = driveData.webViewLink;
        }
        const sql = `INSERT INTO "sodotochuc" (ho_ten, chuc_vu, anh_the, ma_so_do_cha, thu_tu, email, nhiem_vu) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const result = await db.query(sql, [ho_ten, chuc_vu, anh_the, ma_so_do_cha || null, thu_tu || 0, email || null, nhiem_vu || null]);
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

exports.updateOrgMember = async (req, res) => {
    const { id } = req.params;
    const { ho_ten, chuc_vu, ma_so_do_cha, thu_tu, email, nhiem_vu } = req.body;
    let anh_the = null;

    try {
        if (req.file) {
            const driveData = await uploadFileToDrive(req.file);
            anh_the = driveData.webViewLink;
        }

        let sql, params;
        if (anh_the) {
            sql = `UPDATE "sodotochuc" SET ho_ten = $1, chuc_vu = $2, anh_the = $3, ma_so_do_cha = $4, thu_tu = $5, email = $6, nhiem_vu = $7 WHERE ma_so_do = $8 RETURNING *`;
            params = [ho_ten, chuc_vu, anh_the, ma_so_do_cha || null, thu_tu || 0, email || null, nhiem_vu || null, id];
        } else {
            sql = `UPDATE "sodotochuc" SET ho_ten = $1, chuc_vu = $2, ma_so_do_cha = $3, thu_tu = $4, email = $5, nhiem_vu = $6 WHERE ma_so_do = $7 RETURNING *`;
            params = [ho_ten, chuc_vu, ma_so_do_cha || null, thu_tu || 0, email || null, nhiem_vu || null, id];
        }

        const result = await db.query(sql, params);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Lỗi updateOrgMember:', error);
        res.status(500).json({ message: 'Lỗi cập nhật hồ sơ', error: error.message });
    }
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
    try {
        let fileLinks = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const driveData = await uploadFileToDrive(file);
                const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                fileLinks.push({ name: decodedName, url: driveData.webViewLink });
            }
        }
        
        // Convert to JSON string
        const filesJson = JSON.stringify(fileLinks);

        const sql = `INSERT INTO "quytrinhdang" (tieu_de, mo_ta, duong_dan_file, thu_tu) VALUES ($1, $2, $3, $4) RETURNING *`;
        const result = await db.query(sql, [tieu_de, mo_ta, filesJson, thu_tu || 0]);
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

exports.updateProcess = async (req, res) => {
    const { id } = req.params;
    const { tieu_de, mo_ta, thu_tu } = req.body;
    try {
        let fileLinks = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const driveData = await uploadFileToDrive(file);
                const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                fileLinks.push({ name: decodedName, url: driveData.webViewLink });
            }
        }
        
        let sql, params;
        if (req.files && req.files.length > 0) {
            const filesJson = JSON.stringify(fileLinks);
            sql = `UPDATE "quytrinhdang" SET tieu_de = $1, mo_ta = $2, duong_dan_file = $3, thu_tu = $4 WHERE ma_quy_trinh = $5 RETURNING *`;
            params = [tieu_de, mo_ta, filesJson, thu_tu || 0, id];
        } else {
            sql = `UPDATE "quytrinhdang" SET tieu_de = $1, mo_ta = $2, thu_tu = $3 WHERE ma_quy_trinh = $4 RETURNING *`;
            params = [tieu_de, mo_ta, thu_tu || 0, id];
        }

        const result = await db.query(sql, params);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy quy trình' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Lỗi updateProcess:', error);
        res.status(500).json({ message: 'Lỗi cập nhật quy trình', error: error.message });
    }
};
