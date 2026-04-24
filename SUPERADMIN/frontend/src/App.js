import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentManager from './pages/DocumentManager';
import BranchManager from './pages/BranchManager';
import AccountManager from './pages/AccountManager';
import TargetManager from './pages/TargetManager';
import NewsManager from './pages/NewsManager'; // <--- Import trang Mới
import LandingManager from './pages/LandingManager';

// Import Layout & Auth
import MainLayout from './layouts/MainLayout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Private Routes (Yêu cầu đăng nhập & Role 1) */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Module Quản lý Tin tức */}
            <Route path="/quan-ly-tin-tuc" element={<NewsManager />} /> {/* <--- Route Mới */}

            {/* Các module khác */}
            <Route path="/quan-ly-chi-bo" element={<BranchManager />} />
            <Route path="/quan-ly-tai-khoan" element={<AccountManager />} />
            <Route path="/chi-tieu" element={<TargetManager />} />
            <Route path="/tai-lieu" element={<DocumentManager />} />
            <Route path="/quan-ly-landing" element={<LandingManager />} />
            
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;