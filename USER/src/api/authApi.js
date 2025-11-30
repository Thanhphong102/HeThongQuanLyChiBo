// src/api/authApi.js
import axiosClient from './axiosClient';

const authApi = {
  login: (data) => {
    // SỬA DÒNG NÀY: Thêm /auth vào
    return axiosClient.post('/auth/login', data); 
  },
};

export default authApi;