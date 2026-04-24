// src/api/userApi.js
import axiosClient from './axiosClient';

const userApi = {
  // --- 1. NHÓM TÀI KHOẢN ---
  // Lấy thông tin cá nhân
  getProfile: () => {
    return axiosClient.get('/auth/profile'); 
  },

  // Cập nhật thông tin cá nhân
  updateProfile: (data) => {
    return axiosClient.patch('/auth/profile', data);
  },

  // Đổi mật khẩu
  resetPassword: (id, new_password) => {
    return axiosClient.put(`/auth/reset-password/${id}`, { new_password });
  },

  // Upload Avatar
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Lấy danh sách thông báo
  getNotifications: () => {
    return axiosClient.get('/notifications');
  },
  
  markNotificationRead: (id) => {
    return axiosClient.put(`/notifications/${id}/read`);
  },

  markNotificationUnread: (id) => {
    return axiosClient.put(`/notifications/${id}/unread`);
  },

  // [NEW] Đánh dấu tất cả đã đọc
  markAllNotificationsRead: () => {
    return axiosClient.put('/notifications/read-all');
  },

  deleteNotification: (id) => {
    return axiosClient.delete(`/notifications/${id}`);
  },

  deleteAllNotifications: () => {
    return axiosClient.delete(`/notifications/all`);
  },

  // --- 2. NHÓM HOẠT ĐỘNG (LỊCH HỌP) ---
  // Lấy danh sách lịch họp (Quan trọng cho Dashboard)
  // Route bên backend: /api/activities
  getActivities: () => {
    return axiosClient.get('/activities');
  },

  // Lấy chi tiết điểm danh của bản thân (Nếu backend hỗ trợ lọc)
  getMyAttendance: () => {
    return axiosClient.get('/activities/my-attendance');
  },

  // Submit tọa độ và token QR để điểm danh hybrid
  submitAttendance: (id, data) => {
    return axiosClient.post(`/hybrid-attendance/submit`, { ma_lich: id, ...data });
  },

  // --- HOẠT ĐỘNG NGOẠI KHÓA (SỰ KIỆN) ---
  // Lấy danh sách kèm trạng thái đăng ký của User hiện tại
  getEvents: () => {
    return axiosClient.get('/events/user-list');
  },
  
  // Nút đăng ký tham gia hoạt động
  registerEvent: (eventId) => {
    return axiosClient.post(`/events/${eventId}/register`);
  },

  // Upload tệp minh chứng
  submitEvidence: (regId, formData) => {
    return axiosClient.post(`/events/registrations/${regId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  // --- 4. LANDING PAGE CONTENT (PUBLIC) ---
  getPublicOrgChart: () => {
    return axiosClient.get('/public/landing/org-chart');
  },
  
  getPublicProcesses: () => {
    return axiosClient.get('/public/landing/process');
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
    // Thêm params mode=personal để ép backend trả về danh sách cá nhân
    return axiosClient.get('/fees', { params: { mode: 'personal' } });
  },

  // --- 7. BỔ SUNG KHÁC ---
  // Lấy danh sách đảng viên trong chi bộ (để xem danh sách đồng chí)
  // Backend route: /api/branch-members (GET)
  getBranchMembers: () => {
    return axiosClient.get('/branch-members');
  }
};

export default userApi;