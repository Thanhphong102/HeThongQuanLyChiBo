// src/api/authApi.js
import axiosClient from './axiosClient';

const authApi = {
  login: (data) => {
    return axiosClient.post('/auth/login', data);
  },
  // Gọi sau khi đăng nhập với mật khẩu tạm → đổi sang mật khẩu cá nhân
  changePasswordForced: (data) => {
    return axiosClient.post('/auth/change-password-forced', data);
  },
  // Yêu cầu cấp lại mật khẩu mới
  forgotPassword: (data) => {
    return axiosClient.post('/auth/forgot-password', data);
  },
};

export default authApi;