import axios from './axiosConfig';

const targetService = {
  // 1. Lấy danh sách chỉ tiêu được giao
  getAssignedTargets: async () => {
    const response = await axios.get('/targets');
    return response.data;
  },

  // 2. Cập nhật tiến độ chỉ tiêu
  updateProgress: async (id, data) => {
    const response = await axios.put(`/targets/${id}/progress`, data);
    return response.data;
  }
};

export default targetService;
