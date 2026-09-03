const db = require('../config/db');
const { uploadFileToDrive, deleteFileFromDrive } = require('../services/driveService');

const isAdmin = (req) => Number(req.user.role) === 2;

const notifyUsers = async (userIds, title, content, type) => {
  const ids = [...new Set(userIds.map(Number).filter(Number.isInteger))];
  if (!ids.length) return;
  await db.query(`
    INSERT INTO thongbao (ma_nguoi_nhan, quyen_nguoi_nhan, tieu_de, noi_dung, loai_thong_bao)
    SELECT dv.ma_dang_vien, 'User', $2, $3, $4
    FROM dangvien dv
    WHERE dv.ma_dang_vien = ANY($1::int[])
      AND dv.hoat_dong = true
      AND COALESCE(dv.da_xoa, false) = false
  `, [ids, title, content, type]);
};

exports.listAdmin = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  try {
    const result = await db.query(`
      SELECT nv.*,
        COUNT(dv.ma_dang_vien)::int AS tong_nguoi_nhan,
        COUNT(*) FILTER (WHERE dv.ma_dang_vien IS NOT NULL AND nn.trang_thai IN ('Da_nop','Nop_tre','Can_bo_sung','Da_duyet','Khong_dat'))::int AS da_nop,
        COUNT(*) FILTER (WHERE dv.ma_dang_vien IS NOT NULL AND nn.trang_thai IN ('Chua_xem','Chua_nop'))::int AS chua_nop,
        COUNT(*) FILTER (WHERE dv.ma_dang_vien IS NOT NULL AND nn.trang_thai = 'Da_duyet')::int AS da_duyet
      FROM nhiemvu nv
      LEFT JOIN nhiemvu_nguoinhan nn ON nn.ma_nhiem_vu = nv.ma_nhiem_vu
      LEFT JOIN dangvien dv ON dv.ma_dang_vien = nn.ma_dang_vien
        AND dv.hoat_dong = true
        AND COALESCE(dv.da_xoa, false) = false
      WHERE nv.ma_chi_bo = $1
      GROUP BY nv.ma_nhiem_vu
      ORDER BY nv.thoi_gian_tao DESC
    `, [req.user.branchId]);
    res.json(result.rows);
  } catch (error) {
    console.error('[tasks.listAdmin]', error);
    res.status(500).json({ message: 'Lỗi tải danh sách nhiệm vụ' });
  }
};

exports.create = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  const { tieu_de, mo_ta, loai_nhiem_vu, thoi_gian_bat_dau, han_nop, bat_buoc, link_huong_dan, trang_thai, assign_all, recipient_ids } = req.body;
  if (!tieu_de?.trim()) return res.status(400).json({ message: 'Vui lòng nhập tiêu đề nhiệm vụ' });
  try {
    let ids = Array.isArray(recipient_ids) ? recipient_ids.map(Number).filter(Number.isInteger) : [];
    if (assign_all) {
      const members = await db.query(`
        SELECT ma_dang_vien FROM dangvien
        WHERE ma_chi_bo = $1
          AND hoat_dong = true
          AND COALESCE(da_xoa, false) = false
          AND cap_quyen IN (2, 3)
      `, [req.user.branchId]);
      ids = members.rows.map(row => row.ma_dang_vien);
    } else if (ids.length) {
      const valid = await db.query(`
        SELECT ma_dang_vien FROM dangvien
        WHERE ma_chi_bo = $1
          AND hoat_dong = true
          AND COALESCE(da_xoa, false) = false
          AND cap_quyen IN (2, 3)
          AND ma_dang_vien = ANY($2::int[])
      `, [req.user.branchId, ids]);
      ids = valid.rows.map(row => row.ma_dang_vien);
    }
    if (!ids.length) return res.status(400).json({ message: 'Vui lòng chọn ít nhất một Đảng viên nhận nhiệm vụ' });

    const task = await db.query(`
      INSERT INTO nhiemvu (ma_chi_bo,tieu_de,mo_ta,loai_nhiem_vu,thoi_gian_bat_dau,han_nop,bat_buoc,link_huong_dan,trang_thai,nguoi_tao,nguoi_cap_nhat)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *
    `, [req.user.branchId, tieu_de.trim(), mo_ta || null, loai_nhiem_vu || 'Khac', thoi_gian_bat_dau || new Date(), han_nop || null, bat_buoc !== false, link_huong_dan || null, trang_thai || 'Dang_mo', req.user.id]);
    try {
      await db.query(`INSERT INTO nhiemvu_nguoinhan (ma_nhiem_vu, ma_dang_vien) SELECT $1, id FROM unnest($2::int[]) AS id`, [task.rows[0].ma_nhiem_vu, ids]);
    } catch (error) {
      await db.query('DELETE FROM nhiemvu WHERE ma_nhiem_vu = $1', [task.rows[0].ma_nhiem_vu]);
      throw error;
    }
    if ((trang_thai || 'Dang_mo') === 'Dang_mo') await notifyUsers(ids, 'Nhiệm vụ mới', tieu_de.trim(), `TASK_${task.rows[0].ma_nhiem_vu}`);
    res.status(201).json(task.rows[0]);
  } catch (error) {
    console.error('[tasks.create]', error);
    res.status(500).json({ message: 'Lỗi tạo nhiệm vụ' });
  }
};

exports.getAdminDetail = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  try {
    const task = await db.query('SELECT * FROM nhiemvu WHERE ma_nhiem_vu = $1 AND ma_chi_bo = $2', [req.params.id, req.user.branchId]);
    if (!task.rows.length) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });
    const recipients = await db.query(`
      SELECT nn.*, dv.ho_ten, dv.ma_so_sinh_vien, dv.email,
        COALESCE(json_agg(json_build_object('ma_minh_chung',mc.ma_minh_chung,'ten_file',mc.ten_file,'file_url',mc.file_url,'mime_type',mc.mime_type,'kich_thuoc',mc.kich_thuoc)) FILTER (WHERE mc.ma_minh_chung IS NOT NULL), '[]') AS minh_chung
      FROM nhiemvu_nguoinhan nn
      JOIN dangvien dv ON dv.ma_dang_vien = nn.ma_dang_vien
        AND dv.hoat_dong = true
        AND COALESCE(dv.da_xoa, false) = false
      LEFT JOIN nhiemvu_minhchung mc ON mc.ma_nguoi_nhan = nn.ma_nguoi_nhan
      WHERE nn.ma_nhiem_vu = $1
      GROUP BY nn.ma_nguoi_nhan, dv.ma_dang_vien
      ORDER BY dv.ho_ten
    `, [req.params.id]);
    res.json({ task: task.rows[0], recipients: recipients.rows });
  } catch (error) {
    console.error('[tasks.getAdminDetail]', error);
    res.status(500).json({ message: 'Lỗi tải chi tiết nhiệm vụ' });
  }
};

exports.update = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  const { tieu_de, mo_ta, loai_nhiem_vu, thoi_gian_bat_dau, han_nop, bat_buoc, link_huong_dan } = req.body;
  if (!tieu_de?.trim()) return res.status(400).json({ message: 'Vui lòng nhập tiêu đề nhiệm vụ' });
  try {
    const result = await db.query(`
      UPDATE nhiemvu SET tieu_de=$1,mo_ta=$2,loai_nhiem_vu=$3,thoi_gian_bat_dau=$4,han_nop=$5,bat_buoc=$6,link_huong_dan=$7,nguoi_cap_nhat=$8,thoi_gian_cap_nhat=NOW()
      WHERE ma_nhiem_vu=$9 AND ma_chi_bo=$10 RETURNING *
    `, [tieu_de.trim(),mo_ta||null,loai_nhiem_vu||'Khac',thoi_gian_bat_dau||new Date(),han_nop||null,bat_buoc!==false,link_huong_dan||null,req.user.id,req.params.id,req.user.branchId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[tasks.update]', error);
    res.status(500).json({ message: 'Lỗi cập nhật nhiệm vụ' });
  }
};

exports.updateStatus = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  const allowed = ['Nhap','Dang_mo','Da_dong','Da_huy'];
  if (!allowed.includes(req.body.trang_thai)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    const result = await db.query(`UPDATE nhiemvu SET trang_thai=$1,nguoi_cap_nhat=$2,thoi_gian_cap_nhat=NOW() WHERE ma_nhiem_vu=$3 AND ma_chi_bo=$4 RETURNING *`, [req.body.trang_thai, req.user.id, req.params.id, req.user.branchId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });
    if (req.body.trang_thai === 'Dang_mo') {
      const users = await db.query(`
        SELECT nn.ma_dang_vien
        FROM nhiemvu_nguoinhan nn
        JOIN dangvien dv ON dv.ma_dang_vien = nn.ma_dang_vien
        WHERE nn.ma_nhiem_vu = $1
          AND dv.hoat_dong = true
          AND COALESCE(dv.da_xoa, false) = false
      `, [req.params.id]);
      await notifyUsers(users.rows.map(row => row.ma_dang_vien), 'Nhiệm vụ được mở', result.rows[0].tieu_de, `TASK_${req.params.id}`);
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[tasks.updateStatus]', error);
    res.status(500).json({ message: 'Lỗi cập nhật nhiệm vụ' });
  }
};

exports.remove = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  try {
    const files = await db.query(`SELECT mc.ma_file_drive FROM nhiemvu_minhchung mc JOIN nhiemvu_nguoinhan nn ON nn.ma_nguoi_nhan=mc.ma_nguoi_nhan JOIN nhiemvu nv ON nv.ma_nhiem_vu=nn.ma_nhiem_vu WHERE nv.ma_nhiem_vu=$1 AND nv.ma_chi_bo=$2`, [req.params.id, req.user.branchId]);
    const deleted = await db.query('DELETE FROM nhiemvu WHERE ma_nhiem_vu=$1 AND ma_chi_bo=$2 RETURNING ma_nhiem_vu', [req.params.id, req.user.branchId]);
    if (!deleted.rows.length) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });
    await Promise.all(files.rows.map(file => deleteFileFromDrive(file.ma_file_drive)));
    res.json({ message: 'Đã xóa nhiệm vụ' });
  } catch (error) {
    console.error('[tasks.remove]', error);
    res.status(500).json({ message: 'Lỗi xóa nhiệm vụ' });
  }
};

exports.review = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  const allowed = ['Can_bo_sung','Da_duyet','Khong_dat'];
  const { trang_thai, phan_hoi_chi_uy, diem_so } = req.body;
  if (!allowed.includes(trang_thai)) return res.status(400).json({ message: 'Trạng thái duyệt không hợp lệ' });
  try {
    const result = await db.query(`
      UPDATE nhiemvu_nguoinhan nn SET trang_thai=$1,phan_hoi_chi_uy=$2,diem_so=$3,ngay_duyet=NOW(),nguoi_duyet=$4,thoi_gian_cap_nhat=NOW()
      FROM nhiemvu nv WHERE nn.ma_nhiem_vu=nv.ma_nhiem_vu AND nn.ma_nguoi_nhan=$5 AND nv.ma_chi_bo=$6
      RETURNING nn.*, nv.tieu_de
    `, [trang_thai, phan_hoi_chi_uy || null, diem_so || null, req.user.id, req.params.recipientId, req.user.branchId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Lượt nộp không tồn tại' });
    const row = result.rows[0];
    await notifyUsers([row.ma_dang_vien], 'Cập nhật nhiệm vụ', `${row.tieu_de}: ${trang_thai.replaceAll('_',' ')}`, `TASK_${row.ma_nhiem_vu}`);
    res.json(row);
  } catch (error) {
    console.error('[tasks.review]', error);
    res.status(500).json({ message: 'Lỗi duyệt minh chứng' });
  }
};

exports.remind = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  try {
    const result = await db.query(`
      SELECT nn.ma_dang_vien,nv.tieu_de
      FROM nhiemvu_nguoinhan nn
      JOIN nhiemvu nv ON nv.ma_nhiem_vu=nn.ma_nhiem_vu
      JOIN dangvien dv ON dv.ma_dang_vien=nn.ma_dang_vien
      WHERE nv.ma_nhiem_vu=$1
        AND nv.ma_chi_bo=$2
        AND nn.trang_thai IN ('Chua_xem','Chua_nop','Can_bo_sung')
        AND dv.hoat_dong = true
        AND COALESCE(dv.da_xoa, false) = false
    `, [req.params.id, req.user.branchId]);
    if (!result.rows.length) return res.json({ message: 'Không có Đảng viên cần nhắc', count: 0 });
    await notifyUsers(result.rows.map(row => row.ma_dang_vien), 'Nhắc hoàn thành nhiệm vụ', result.rows[0].tieu_de, `TASK_${req.params.id}`);
    res.json({ message: `Đã gửi nhắc nhở tới ${result.rows.length} Đảng viên`, count: result.rows.length });
  } catch (error) {
    console.error('[tasks.remind]', error);
    res.status(500).json({ message: 'Lỗi gửi nhắc nhở' });
  }
};

exports.listMine = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT nv.*,nn.ma_nguoi_nhan,nn.trang_thai AS trang_thai_nop,nn.ngay_nop,nn.diem_so,nn.phan_hoi_chi_uy,
        COUNT(mc.ma_minh_chung)::int AS so_minh_chung
      FROM nhiemvu_nguoinhan nn JOIN nhiemvu nv ON nv.ma_nhiem_vu=nn.ma_nhiem_vu
      LEFT JOIN nhiemvu_minhchung mc ON mc.ma_nguoi_nhan=nn.ma_nguoi_nhan
      WHERE nn.ma_dang_vien=$1 AND nv.ma_chi_bo=$2 AND nv.trang_thai <> 'Nhap'
      GROUP BY nv.ma_nhiem_vu,nn.ma_nguoi_nhan ORDER BY nv.han_nop NULLS LAST,nv.thoi_gian_tao DESC
    `, [req.user.id, req.user.branchId]);
    res.json(result.rows);
  } catch (error) {
    console.error('[tasks.listMine]', error);
    res.status(500).json({ message: 'Lỗi tải nhiệm vụ của bạn' });
  }
};

exports.getMine = async (req, res) => {
  try {
    const result = await db.query(`SELECT nv.*,nn.ma_nguoi_nhan,nn.trang_thai AS trang_thai_nop,nn.ngay_nop,nn.ket_qua,nn.diem_so,nn.ghi_chu_dang_vien,nn.phan_hoi_chi_uy FROM nhiemvu_nguoinhan nn JOIN nhiemvu nv ON nv.ma_nhiem_vu=nn.ma_nhiem_vu WHERE nv.ma_nhiem_vu=$1 AND nn.ma_dang_vien=$2 AND nv.ma_chi_bo=$3`, [req.params.id, req.user.id, req.user.branchId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });
    const row = result.rows[0];
    const files = await db.query('SELECT * FROM nhiemvu_minhchung WHERE ma_nguoi_nhan=$1 ORDER BY thoi_gian_tao', [row.ma_nguoi_nhan]);
    if (row.trang_thai_nop === 'Chua_xem') await db.query(`UPDATE nhiemvu_nguoinhan SET trang_thai='Chua_nop',da_xem_luc=NOW(),thoi_gian_cap_nhat=NOW() WHERE ma_nguoi_nhan=$1`, [row.ma_nguoi_nhan]);
    res.json({ task: row, evidence: files.rows });
  } catch (error) {
    console.error('[tasks.getMine]', error);
    res.status(500).json({ message: 'Lỗi tải chi tiết nhiệm vụ' });
  }
};

exports.submit = async (req, res) => {
  const files = req.files || [];
  const { ket_qua, ghi_chu_dang_vien } = req.body;
  if (!files.length && !ket_qua?.trim()) return res.status(400).json({ message: 'Vui lòng nhập kết quả hoặc chọn minh chứng' });
  try {
    const check = await db.query(`SELECT nn.*,nv.han_nop,nv.trang_thai,nv.ma_chi_bo,nv.tieu_de FROM nhiemvu_nguoinhan nn JOIN nhiemvu nv ON nv.ma_nhiem_vu=nn.ma_nhiem_vu WHERE nn.ma_nguoi_nhan=$1 AND nn.ma_dang_vien=$2 AND nv.ma_chi_bo=$3`, [req.params.recipientId, req.user.id, req.user.branchId]);
    if (!check.rows.length) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });
    const recipient = check.rows[0];
    if (recipient.trang_thai !== 'Dang_mo') return res.status(400).json({ message: 'Nhiệm vụ hiện không nhận bài nộp' });
    const uploaded = [];
    try {
      for (const file of files) uploaded.push({ file, drive: await uploadFileToDrive(file) });
      for (const item of uploaded) await db.query(`INSERT INTO nhiemvu_minhchung (ma_nguoi_nhan,ten_file,file_url,ma_file_drive,mime_type,kich_thuoc) VALUES ($1,$2,$3,$4,$5,$6)`, [recipient.ma_nguoi_nhan,item.file.originalname,item.drive.webViewLink,item.drive.id,item.file.mimetype,item.file.size]);
    } catch (error) {
      await Promise.all(uploaded.map(item => deleteFileFromDrive(item.drive.id)));
      throw error;
    }
    const late = recipient.han_nop && new Date() > new Date(recipient.han_nop);
    const result = await db.query(`UPDATE nhiemvu_nguoinhan SET trang_thai=$1,ngay_nop=NOW(),ket_qua=$2,ghi_chu_dang_vien=$3,thoi_gian_cap_nhat=NOW() WHERE ma_nguoi_nhan=$4 RETURNING *`, [late ? 'Nop_tre' : 'Da_nop', ket_qua || null, ghi_chu_dang_vien || null, recipient.ma_nguoi_nhan]);
    await db.query(`INSERT INTO thongbao (ma_nguoi_nhan,quyen_nguoi_nhan,tieu_de,noi_dung,loai_thong_bao) VALUES ($1,'Admin','Có bài nộp nhiệm vụ',$2,$3)`, [req.user.branchId, recipient.tieu_de, `TASK_${recipient.ma_nhiem_vu}`]);
    res.json({ message: 'Đã nộp minh chứng', submission: result.rows[0] });
  } catch (error) {
    console.error('[tasks.submit]', error);
    res.status(500).json({ message: 'Lỗi nộp minh chứng' });
  }
};
