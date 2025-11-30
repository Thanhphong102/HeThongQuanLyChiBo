import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Layout & Auth
import MainLayout from './layouts/MainLayout';
import PrivateRoute from './components/PrivateRoute';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Các trang chức năng
import MemberManager from './pages/MemberManager';             // Quản lý Hồ sơ
import MemberAccountManager from './pages/MemberAccountManager'; // Quản lý Tài khoản (MỚI)
import ActivityManager from './pages/ActivityManager'; 
import FeeManager from './pages/FeeManager';           
import FormManager from './pages/FormManager';     
import MediaManager from './pages/MediaManager';    

function App() {
  return (
    <Router>
      <Routes>
        {/* Route Public */}
        <Route path="/login" element={<Login />} />

        {/* Route Private (Yêu cầu đăng nhập & Role 2) */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Quản lý Hồ sơ Đảng viên */}
            <Route path="/dang-vien" element={<MemberManager />} />

            {/* Quản lý Tài khoản Đảng viên (Route Mới) */}
            <Route path="/tai-khoan-dang-vien" element={<MemberAccountManager />} />

            {/* Các trang khác */}
            <Route path="/sinh-hoat" element={<ActivityManager />} />
            <Route path="/dang-phi" element={<FeeManager />} />
            <Route path="/bieu-mau" element={<FormManager />} />
            <Route path="/thu-vien" element={<MediaManager />} />
          </Route>
        </Route>

        {/* Mặc định về Login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;