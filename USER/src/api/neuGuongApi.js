import axiosClient from './axiosClient';

const neuGuongApi = {
  // ==================== USER APIs ====================

  // Lấy danh sách đợt nêu gương + trạng thái hồ sơ của mình
  getMyDots: () => {
    return axiosClient.get('/neu-guong/my-dots');
  },

  // Nộp hồ sơ đề xuất nêu gương
  // data = { ma_dot, danh_sach_hoat_dong: [{ ten_hoat_dong, file_minh_chung, ghi_chu }] }
  nopHoSo: (data) => {
    return axiosClient.post('/neu-guong/nop-ho-so', data);
  },

  // Nộp file báo cáo (Bước 2 — sau khi được Admin duyệt lần 1)
  // data = { ma_ho_so, file_bao_cao }
  nopBaoCao: (data) => {
    return axiosClient.post('/neu-guong/nop-bao-cao', data);
  },

  // Xem chi tiết hồ sơ của mình
  getMyHoSo: (ma_ho_so) => {
    return axiosClient.get(`/neu-guong/my-ho-so/${ma_ho_so}`);
  },

  // ==================== ADMIN APIs ====================

  // Lấy danh sách đợt nêu gương (Admin)
  getAllDots: () => {
    return axiosClient.get('/neu-guong/dots');
  },

  // Tạo đợt mới
  // data = { ten_dot, thang, nam, mo_ta?, file_mau_bao_cao? }
  createDot: (data) => {
    return axiosClient.post('/neu-guong/dots', data);
  },

  // Cập nhật đợt (đóng/mở, chỉnh sửa)
  updateDot: (id, data) => {
    return axiosClient.put(`/neu-guong/dots/${id}`, data);
  },

  // Xóa đợt (chỉ khi chưa có hồ sơ)
  deleteDot: (id) => {
    return axiosClient.delete(`/neu-guong/dots/${id}`);
  },

  // Lấy danh sách hồ sơ theo đợt
  getHoSoByDot: (dot_id) => {
    return axiosClient.get(`/neu-guong/dots/${dot_id}/ho-so`);
  },

  // Duyệt hồ sơ lần 1
  duyetHoSo: (ma_ho_so, ghi_chu_admin) => {
    return axiosClient.put(`/neu-guong/ho-so/${ma_ho_so}/duyet`, { ghi_chu_admin });
  },

  // Từ chối hồ sơ
  tuChoiHoSo: (ma_ho_so, ghi_chu_admin) => {
    return axiosClient.put(`/neu-guong/ho-so/${ma_ho_so}/tu-choi`, { ghi_chu_admin });
  },

  // Công nhận nêu gương
  congNhanHoSo: (ma_ho_so, ghi_chu_admin) => {
    return axiosClient.put(`/neu-guong/ho-so/${ma_ho_so}/cong-nhan`, { ghi_chu_admin });
  },
};

export default neuGuongApi;
