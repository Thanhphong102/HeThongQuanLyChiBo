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
        'Content-Type': undefined,
      },
    });
  },

  // Lấy danh sách thông báo
  getNotifications: () => {
    return axiosClient.get('/notifications?app=user');
  },
  
  markNotificationRead: (id) => {
    return axiosClient.put(`/notifications/${id}/read`);
  },

  markNotificationUnread: (id) => {
    return axiosClient.put(`/notifications/${id}/unread`);
  },

  // [NEW] Đánh dấu tất cả đã đọc
  markAllNotificationsRead: () => {
    return axiosClient.put('/notifications/read-all?app=user');
  },

  deleteNotification: (id) => {
    return axiosClient.delete(`/notifications/${id}`);
  },

  deleteAllNotifications: () => {
    return axiosClient.delete('/notifications/all?app=user');
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
        'Content-Type': undefined,
      },
    });
  },

  // --- 3. NHÓM TIN TỨC ---
  getAlbums: () => axiosClient.get('/albums'),
  getAlbumById: (id) => axiosClient.get(`/albums/${id}`),

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
  // Lấy biểu mẫu của chi bộ (legacy)
  getForms: (ma_chi_bo) => {
    return axiosClient.get(`/branch-forms`, { params: { ma_chi_bo } });
  },

  // Lấy cây thư mục gốc của chi bộ (hỗ trợ nested folders)
  getFolderTree: (branchId) => {
    return axiosClient.get(`/branch-forms/public/${branchId}/folders`);
  },

  // Lấy subfolder + file trong 1 thư mục
  getFolderContents: (folderId) => {
    return axiosClient.get(`/branch-forms/public/folder/${folderId}/contents`);
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
  },

  // --- 8. CHATBOT AI ---
  chatWithBot: (message) => {
    return axiosClient.post('/ai/chat', { message });
  },

  // --- 9. NHIỆM VỤ & MINH CHỨNG ---
  getMyTasks: () => axiosClient.get('/tasks/mine'),
  getMyTask: (id) => axiosClient.get(`/tasks/mine/${id}`),
  submitTaskEvidence: (recipientId, formData) => axiosClient.post(`/tasks/recipients/${recipientId}/submit`, formData, {
    headers: { 'Content-Type': undefined },
  }),

  // --- 10. LIÊN HỆ & GÓP Ý ---
  getBranchContact: () => axiosClient.get('/support/contact'),
  getMyFeedback: () => axiosClient.get('/support/feedback'),
  createFeedback: (data) => axiosClient.post('/support/feedback', data),
  getFeedback: (id) => axiosClient.get(`/support/feedback/${id}`),
  replyFeedback: (id, noi_dung) => axiosClient.post(`/support/feedback/${id}/replies`, { noi_dung }),
};

export default userApi;
