import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // SỬA: Kiểm tra quyền cấp 2 (Chi ủy)
  if (user.cap_quyen !== 2) {
    alert('Trang này chỉ dành cho Bí thư Chi bộ!');
    localStorage.clear();
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default PrivateRoute;