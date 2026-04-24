import axios from 'axios';

const axiosClient = axios.create({
  // Backend chạy port 5001 và có prefix /api
//   baseURL: 'http://localhost:5001/api', 
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bổ sung cực kì quan trọng để gọi API qua Ngrok
  },
});

// Interceptor để gắn Token vào mỗi request (sau khi đăng nhập)
axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;