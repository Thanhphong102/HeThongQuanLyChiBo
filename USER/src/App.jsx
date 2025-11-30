// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Auth/LoginPage';

// --- IMPORT CÁC TRANG THẬT ---
import HomePage from './pages/Home/HomePage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import MediaPage from './pages/Media/MediaPage';
import LookupPage from './pages/Lookup/LookupPage';

// Component bảo vệ tuyến đường (Private Route)
const PrivateRoute = () => {
  const isAuthenticated = localStorage.getItem('access_token');
  // Nếu có token thì cho vào MainLayout, không thì đá về Login
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* 1. Tuyến đường công khai */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* 2. Tuyến đường bảo mật (Đã đăng nhập) */}
      <Route element={<PrivateRoute />}>
        {/* Trang chủ */}
        <Route path="/home" element={<HomePage />} />
        
        {/* Dashboard cá nhân */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Kho tài liệu */}
        <Route path="/documents" element={<DocumentsPage />} />
        
        {/* Thư viện ảnh */}
        <Route path="/media" element={<MediaPage />} />
        
        {/* Tra cứu (Đóng phí / Điểm danh) */}
        <Route path="/lookup" element={<LookupPage />} />

        {/* Mặc định vào Home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Route>
      
      {/* Các đường dẫn lạ thì đẩy về Home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;