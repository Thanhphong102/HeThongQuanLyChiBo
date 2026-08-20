// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Auth/LoginPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'; // [NEW] Quên mật khẩu
import LandingPage from './pages/Landing/LandingPage';

// --- IMPORT CÁC TRANG THẬT ---
import HomePage from './pages/Home/HomePage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import MediaPage from './pages/Media/MediaPage';
import LookupPage from './pages/Lookup/LookupPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ActivitiesPage from './pages/Activities/ActivitiesPage';
import ForceChangePasswordPage from './pages/Auth/ForceChangePasswordPage'; // [NEW] Đổi MK bắt buộc
import TransferDashboard from './pages/Transfer/TransferDashboard';
import TransferRequestForm from './pages/Transfer/TransferRequestForm';
import TransferRequestDetail from './pages/Transfer/TransferRequestDetail';
import NeuGuongPage from './pages/NeuGuong/NeuGuongPage'; // [NEW] Nêu gương

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
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
      {/* Route đặc biệt: đổi mật khẩu bắt buộc — chỉ cần có token, không cần vào MainLayout */}
      <Route path="/doi-mat-khau-bat-buoc" element={<ForceChangePasswordPage />} />
      
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
        
        {/* Hồ sơ cá nhân */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Hoạt động Ngoại khóa */}
        <Route path="/activities" element={<ActivitiesPage />} />

        {/* Quản lý chuyển Đảng */}
        <Route path="/transfer-requests" element={<TransferDashboard />} />
        <Route path="/transfer-requests/new" element={<TransferRequestForm />} />
        <Route path="/transfer-requests/:id" element={<TransferRequestDetail />} />

        {/* Đề xuất Nêu gương */}
        <Route path="/neu-guong" element={<NeuGuongPage />} />
      </Route>
      
      {/* Các đường dẫn lạ thì đẩy về Home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;