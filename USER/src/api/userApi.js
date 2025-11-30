// src/api/userApi.js
import axiosClient from './axiosClient';

const userApi = {
  // --- 1. NHÓM TÀI KHOẢN ---
  // Lấy thông tin cá nhân (Nếu backend chưa có route này thì dùng tạm localStorage)
  getProfile: () => {
    return axiosClient.get('/auth/profile'); 
  },

  // --- 2. NHÓM HOẠT ĐỘNG (LỊCH HỌP) ---
  // Lấy danh sách lịch họp (Quan trọng cho Dashboard)
  // Route bên backend: /api/activities
  getActivities: () => {
    return axiosClient.get('/activities');
  },

  // Lấy chi tiết điểm danh của bản thân (Nếu backend hỗ trợ lọc)
  // Nếu backend chưa có route riêng, ta gọi getActivities rồi tự lọc ở frontend
// Sửa lại hàm này:
  getMyAttendance: () => {
    return axiosClient.get('/activities/my-attendance');
  },

  // --- 3. NHÓM TIN TỨC ---
  // Lấy danh sách tin tức
  getNews: () => {
    return axiosClient.get('/news');
  },
  
  // Lấy chi tiết 1 tin tức (để hiển thị trang đọc bài)
  getNewsDetail: (id) => {
    return axiosClient.get(`/news/${id}`);
  },

  // --- 4. NHÓM TÀI LIỆU & BIỂU MẪU ---
  // Lấy biểu mẫu của chi bộ
  getForms: (ma_chi_bo) => {
    // Truyền params để backend biết lọc theo chi bộ nào (nếu cần)
    return axiosClient.get(`/branch-forms`, { params: { ma_chi_bo } });
  },

  // 1. Lấy Văn bản cấp Trường (SuperAdmin up)
  // Route: /api/documents
  getSchoolDocuments: () => {
    return axiosClient.get('/school-documents');
  },

  // --- 5. NHÓM THƯ VIỆN ẢNH ---
  getMedia: (ma_chi_bo) => {
    return axiosClient.get(`/media`, { params: { ma_chi_bo } });
  },

  // --- 6. NHÓM TÀI CHÍNH (ĐẢNG PHÍ) ---
  // Lấy lịch sử đóng phí
  // Backend route: /api/fees (GET)
  // Lưu ý: Controller backend cần lọc theo ID người dùng từ token
  getMyFees: () => {
    return axiosClient.get('/fees');
  },

  // --- 7. BỔ SUNG KHÁC ---
  // Lấy danh sách đảng viên trong chi bộ (để xem danh sách đồng chí)
  // Backend route: /api/branch-members (GET)
  getBranchMembers: () => {
    return axiosClient.get('/branch-members');
  }
};

export default userApi;