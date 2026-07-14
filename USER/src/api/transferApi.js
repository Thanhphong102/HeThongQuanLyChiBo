import axiosClient from './axiosClient';

const transferApi = {
  // Lấy danh sách yêu cầu của tôi
  getMyRequests: () => {
    return axiosClient.get('/transfer-requests/my-requests');
  },
  
  // Lấy hướng dẫn theo loại chuyển
  getGuideline: (loai_chuyen) => {
    return axiosClient.get(`/transfer-requests/guideline?loai_chuyen=${loai_chuyen}`);
  },
  
  // Tạo yêu cầu mới
  createRequest: (data) => {
    return axiosClient.post('/transfer-requests', data);
  },

  // Bổ sung hồ sơ
  addDocuments: (id, data) => {
    return axiosClient.put(`/transfer-requests/${id}/documents`, data);
  },

  // Sửa yêu cầu
  updateRequest: (id, data) => {
    return axiosClient.put(`/transfer-requests/${id}`, data);
  },

  // Xóa tài liệu
  deleteDocument: (reqId, docId) => {
    return axiosClient.delete(`/transfer-requests/${reqId}/documents/${docId}`);
  },
  
  // (Dành cho Admin) Lấy toàn bộ yêu cầu
  getAllRequests: () => {
    return axiosClient.get('/transfer-requests');
  },

  // Lấy chi tiết yêu cầu
  getRequestDetail: (id) => {
    return axiosClient.get(`/transfer-requests/${id}`);
  },

  // (Dành cho Admin) Cập nhật trạng thái
  updateRequestStatus: (id, data) => {
    return axiosClient.put(`/transfer-requests/${id}/status`, data);
  },

  // (Dành cho Admin) Đánh giá tài liệu
  reviewDocument: (docId, data) => {
    return axiosClient.put(`/transfer-requests/documents/${docId}/review`, data);
  }
};

export default transferApi;
