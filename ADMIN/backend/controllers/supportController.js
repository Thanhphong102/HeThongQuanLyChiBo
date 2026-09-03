const db = require('../config/db');

const isAdmin = req => Number(req.user.role) === 2;

exports.getContact = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT cb.ma_chi_bo, cb.ten_chi_bo, cl.ma_lien_he, cl.dau_moi, cl.cong_khai
      FROM chibo cb LEFT JOIN chibo_lienhe cl ON cl.ma_chi_bo=cb.ma_chi_bo
      WHERE cb.ma_chi_bo=$1
    `, [req.user.branchId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Chi bộ không tồn tại' });
    const contact = result.rows[0];
    if (!isAdmin(req) && contact.cong_khai === false) contact.dau_moi = [];
    res.json({ ...contact, dau_moi: contact.dau_moi || [], cong_khai: contact.cong_khai !== false });
  } catch (error) {
    console.error('[support.getContact]', error);
    res.status(500).json({ message: 'Lỗi tải thông tin liên hệ' });
  }
};

exports.updateContact = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  const { dau_moi,cong_khai } = req.body;
  if (dau_moi && !Array.isArray(dau_moi)) return res.status(400).json({ message: 'Danh sách đầu mối không hợp lệ' });
  const allowedRoles = ['Bí thư','Phó bí thư','Chi ủy viên'];
  const contacts = (dau_moi || []).filter(item => item?.ho_ten?.trim()).map(item => ({
    ho_ten: item.ho_ten.trim(),
    chuc_vu: allowedRoles.includes(item.chuc_vu) ? item.chuc_vu : 'Chi ủy viên',
    so_dien_thoai: item.so_dien_thoai?.trim() || '',
    email: item.email?.trim() || ''
  }));
  try {
    const result = await db.query(`
      INSERT INTO chibo_lienhe (ma_chi_bo,dau_moi,cong_khai,nguoi_cap_nhat)
      VALUES ($1,$2::jsonb,$3,$4)
      ON CONFLICT (ma_chi_bo) DO UPDATE SET dau_moi=EXCLUDED.dau_moi,cong_khai=EXCLUDED.cong_khai,nguoi_cap_nhat=EXCLUDED.nguoi_cap_nhat,thoi_gian_cap_nhat=NOW()
      RETURNING *
    `, [req.user.branchId,JSON.stringify(contacts),cong_khai!==false,req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[support.updateContact]', error);
    res.status(500).json({ message: 'Lỗi cập nhật thông tin liên hệ' });
  }
};

exports.createFeedback = async (req, res) => {
  const { tieu_de, noi_dung, chu_de, an_danh } = req.body;
  if (!tieu_de?.trim() || !noi_dung?.trim()) return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và nội dung' });
  try {
    const result = await db.query(`INSERT INTO gopy (ma_chi_bo,ma_dang_vien,tieu_de,noi_dung,chu_de,an_danh) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [req.user.branchId,req.user.id,tieu_de.trim(),noi_dung.trim(),chu_de||'Khac',Boolean(an_danh)]);
    await db.query(`INSERT INTO thongbao (ma_nguoi_nhan,quyen_nguoi_nhan,tieu_de,noi_dung,loai_thong_bao) VALUES ($1,'Admin','Góp ý mới',$2,$3)`, [req.user.branchId,tieu_de.trim(),`FEEDBACK_${result.rows[0].ma_gop_y}`]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[support.createFeedback]', error);
    res.status(500).json({ message: 'Lỗi gửi góp ý' });
  }
};

exports.listFeedback = async (req, res) => {
  try {
    const admin = isAdmin(req);
    const params = admin ? [req.user.branchId] : [req.user.branchId,req.user.id];
    const result = await db.query(`
      SELECT gy.*, CASE WHEN gy.an_danh AND $${admin ? 2 : 3}::boolean THEN 'Ẩn danh' ELSE dv.ho_ten END AS ho_ten,
        (SELECT COUNT(*)::int FROM gopy_phanhoi ph WHERE ph.ma_gop_y=gy.ma_gop_y) AS so_phan_hoi
      FROM gopy gy JOIN dangvien dv ON dv.ma_dang_vien=gy.ma_dang_vien
      WHERE gy.ma_chi_bo=$1 ${admin ? '' : 'AND gy.ma_dang_vien=$2'}
      ORDER BY gy.thoi_gian_cap_nhat DESC
    `, [...params, admin]);
    res.json(result.rows);
  } catch (error) {
    console.error('[support.listFeedback]', error);
    res.status(500).json({ message: 'Lỗi tải danh sách góp ý' });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const params = isAdmin(req) ? [req.params.id,req.user.branchId] : [req.params.id,req.user.branchId,req.user.id];
    const result = await db.query(`SELECT gy.*,CASE WHEN gy.an_danh AND $${isAdmin(req) ? 3 : 4}::boolean THEN 'Ẩn danh' ELSE dv.ho_ten END AS ho_ten FROM gopy gy JOIN dangvien dv ON dv.ma_dang_vien=gy.ma_dang_vien WHERE gy.ma_gop_y=$1 AND gy.ma_chi_bo=$2 ${isAdmin(req) ? '' : 'AND gy.ma_dang_vien=$3'}`, [...params,isAdmin(req)]);
    if (!result.rows.length) return res.status(404).json({ message: 'Góp ý không tồn tại' });
    // Trạng thái được hệ thống tự ghi nhận: mở lần đầu = đã tiếp nhận.
    if (isAdmin(req) && result.rows[0].trang_thai === 'Moi') {
      await db.query(`UPDATE gopy SET trang_thai='Da_tiep_nhan',nguoi_xu_ly=$1,thoi_gian_cap_nhat=NOW() WHERE ma_gop_y=$2`, [req.user.id, req.params.id]);
      result.rows[0].trang_thai = 'Da_tiep_nhan';
    }
    const replies = await db.query(`SELECT ph.*,dv.ho_ten FROM gopy_phanhoi ph JOIN dangvien dv ON dv.ma_dang_vien=ph.nguoi_gui WHERE ph.ma_gop_y=$1 ORDER BY ph.thoi_gian_tao`, [req.params.id]);
    res.json({ feedback: result.rows[0], replies: replies.rows });
  } catch (error) {
    console.error('[support.getFeedback]', error);
    res.status(500).json({ message: 'Lỗi tải nội dung góp ý' });
  }
};

exports.reply = async (req, res) => {
  const noiDung = req.body.noi_dung?.trim();
  if (!noiDung) return res.status(400).json({ message: 'Vui lòng nhập nội dung phản hồi' });
  try {
    const params = isAdmin(req) ? [req.params.id,req.user.branchId] : [req.params.id,req.user.branchId,req.user.id];
    const check = await db.query(`SELECT * FROM gopy WHERE ma_gop_y=$1 AND ma_chi_bo=$2 ${isAdmin(req) ? '' : 'AND ma_dang_vien=$3'}`, params);
    if (!check.rows.length) return res.status(404).json({ message: 'Góp ý không tồn tại' });
    const role = isAdmin(req) ? 'Admin' : 'User';
    const reply = await db.query(`INSERT INTO gopy_phanhoi (ma_gop_y,nguoi_gui,vai_tro,noi_dung) VALUES ($1,$2,$3,$4) RETURNING *`, [req.params.id,req.user.id,role,noiDung]);
    await db.query(`UPDATE gopy SET trang_thai=$1,nguoi_xu_ly=CASE WHEN $2='Admin' THEN $3 ELSE nguoi_xu_ly END,thoi_gian_cap_nhat=NOW() WHERE ma_gop_y=$4`, [role==='Admin'?'Da_phan_hoi':'Dang_xu_ly',role,req.user.id,req.params.id]);
    if (role === 'Admin') {
      await db.query(`INSERT INTO thongbao (ma_nguoi_nhan,quyen_nguoi_nhan,tieu_de,noi_dung,loai_thong_bao) VALUES ($1,'User','Chi ủy đã phản hồi góp ý',$2,$3)`, [check.rows[0].ma_dang_vien,check.rows[0].tieu_de,`FEEDBACK_${req.params.id}`]);
    } else {
      await db.query(`INSERT INTO thongbao (ma_nguoi_nhan,quyen_nguoi_nhan,tieu_de,noi_dung,loai_thong_bao) VALUES ($1,'Admin','Đảng viên phản hồi góp ý',$2,$3)`, [req.user.branchId,check.rows[0].tieu_de,`FEEDBACK_${req.params.id}`]);
    }
    res.status(201).json(reply.rows[0]);
  } catch (error) {
    console.error('[support.reply]', error);
    res.status(500).json({ message: 'Lỗi gửi phản hồi' });
  }
};

exports.updateFeedbackStatus = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Yêu cầu quyền Chi ủy' });
  const allowed = ['Moi','Da_tiep_nhan','Dang_xu_ly','Da_phan_hoi','Da_dong'];
  if (!allowed.includes(req.body.trang_thai)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    const result = await db.query(`UPDATE gopy SET trang_thai=$1,nguoi_xu_ly=$2,thoi_gian_cap_nhat=NOW() WHERE ma_gop_y=$3 AND ma_chi_bo=$4 RETURNING *`, [req.body.trang_thai,req.user.id,req.params.id,req.user.branchId]);
    if (!result.rows.length) return res.status(404).json({ message: 'Góp ý không tồn tại' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[support.updateFeedbackStatus]', error);
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái góp ý' });
  }
};
