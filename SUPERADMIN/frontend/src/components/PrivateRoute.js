import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  // Lấy user từ localStorage và parse ra object
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Kiểm tra đăng nhập (Phải có token và user)
  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // 2. Kiểm tra quyền (SỬA LỖI TẠI ĐÂY)
  // Backend trả về 'cap_quyen', không phải 'role'
  if (user.cap_quyen !== 1) {
    // Dùng alert của trình duyệt hoặc message của Antd nếu muốn đẹp hơn
    alert('Bạn không có quyền truy cập trang này!'); 
    // Xóa token để bắt đăng nhập lại tài khoản đúng quyền
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  // Nếu thỏa mãn, cho phép đi tiếp vào trong (Dashboard...)
  return <Outlet />;
};

export default PrivateRoute;