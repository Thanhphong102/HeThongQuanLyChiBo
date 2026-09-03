import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import EventsManager from './pages/EventsManager';   // Task 8: Quản lý Hoạt động
import TargetReceiver from './pages/TargetReceiver'; // Task 9: Nhận chỉ tiêu
import TransferManagement from './pages/Transfer/TransferManagement'; // Quản lý chuyển đảng
import GuidelineConfig from './pages/Transfer/GuidelineConfig'; // Cấu hình hướng dẫn chuyển đảng
import NeuGuongManager from './pages/NeuGuong/NeuGuongManager'; // [NEW] Nêu gương
import TaskManager from './pages/TaskManager';
import ContactManager from './pages/ContactManager';
import FeedbackManager from './pages/FeedbackManager';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            <Route path="/hoat-dong" element={<EventsManager />} /> {/* Task 8 */}
            <Route path="/nhan-chi-tieu" element={<TargetReceiver />} /> {/* Task 9 */}
            <Route path="/chuyen-dang" element={<TransferManagement />} />
            <Route path="/chuyen-dang/huong-dan" element={<GuidelineConfig />} />
            <Route path="/neu-guong" element={<NeuGuongManager />} /> {/* [NEW] Nêu gương */}
            <Route path="/nhiem-vu" element={<TaskManager />} />
            <Route path="/lien-he" element={<ContactManager />} />
            <Route path="/gop-y" element={<FeedbackManager />} />
            <Route path="/lien-he-gop-y" element={<Navigate to="/lien-he" replace />} />
          </Route>
        </Route>

        {/* Mặc định về Login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
