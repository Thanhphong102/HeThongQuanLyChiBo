import axios from './axiosConfig';

const notificationService = {
  // 1. Lấy danh sách thông báo
  getNotifications: async () => {
    const response = await axios.get('/notifications');
    return response.data;
  },

  // 2. Đánh dấu đã đọc
  markAsRead: async (id) => {
    const response = await axios.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAsUnread: async (id) => {
    const response = await axios.put(`/notifications/${id}/unread`);
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await axios.delete(`/notifications/${id}`);
    return response.data;
  },

  deleteAllNotifications: async () => {
    const response = await axios.delete(`/notifications/all`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axios.put(`/notifications/read-all`);
    return response.data;
  }
};

export default notificationService;
