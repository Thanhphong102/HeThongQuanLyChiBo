// src/layouts/MainLayout.jsx

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Drawer, Row, Col, Divider } from 'antd';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  DashboardOutlined, 
  FileTextOutlined, 
  PictureOutlined, 
  DollarOutlined, 
  LogoutOutlined, 
  UserOutlined,
  DownOutlined,
  MenuOutlined,
  EnvironmentOutlined,
  MailOutlined
} from '@ant-design/icons';

// 👇 THAY THẾ LINK NGOÀI BẰNG IMPORT FILE LOCAL (Vite sẽ xử lý)
// ❗ Đảm bảo 2 file này nằm trong thư mục src/assets
import QuocKyImg from '../assets/co-to-quoc.png'; 
import DangKyImg from '../assets/co-dang.png'; 


const { Header, Content, Footer } = Layout;

// Định nghĩa Menu
const menuItems = [
  { key: '/home', icon: <HomeOutlined />, label: 'TRANG CHỦ' },
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'DASHBOARD' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'KHO TÀI LIỆU' },
  { key: '/media', icon: <PictureOutlined />, label: 'THƯ VIỆN ẢNH' },
  { key: '/lookup', icon: <DollarOutlined />, label: 'TRA CỨU' },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});
  const [visibleMobileMenu, setVisibleMobileMenu] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user_info'));
    setUser(userInfo || { ho_ten: 'Đảng viên', ten_chi_bo: 'Chi bộ Sinh viên' });
  }, []);

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setVisibleMobileMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout className="min-h-screen font-sans">
      {/* --- PHẦN 1: HEADER TRÊN (MÀU VÀNG KEM #fff1aa) --- */}
      <Header 
        className="px-4 md:px-8 h-auto flex justify-between items-center py-2 shadow-sm"
        style={{ backgroundColor: '#fff1aa', borderBottom: '1px solid #e5e5e5' }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {/* 👇 SỬ DỤNG IMPORT LOCAL (Dùng biến đã import) */}
            <img 
              src={QuocKyImg} 
              alt="Cờ Tổ quốc" 
              className="h-10 w-14 object-cover shadow-sm border border-red-600/20"
            />
            <img 
              src={DangKyImg} 
              alt="Cờ Đảng" 
              className="h-10 w-14 object-cover shadow-sm border border-red-600/20"
            />
          </div>
          
          <div className="hidden md:block">
            <h1 className="font-bold text-lg leading-tight uppercase m-0" style={{ color: '#a91f23' }}>
              ĐẢNG CỘNG SẢN VIỆT NAM
            </h1>
            <div className="text-sm font-semibold opacity-90" style={{ color: '#a91f23' }}>
              {user.ten_chi_bo ? user.ten_chi_bo.toUpperCase() : 'CHI BỘ ...'}
            </div>
          </div>
        </div>

        <div className="flex items-center">
            <Button 
                type="text" 
                icon={<MenuOutlined style={{ color: '#a91f23', fontSize: '20px' }} />} 
                className="md:hidden mr-2"
                onClick={() => setVisibleMobileMenu(true)}
            />

            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
                <div className="flex items-center cursor-pointer hover:bg-yellow-200/50 p-2 rounded transition-colors">
                    <div className="text-right mr-3 hidden md:block">
                        <div className="font-bold text-sm" style={{ color: '#a91f23' }}>{user.ho_ten}</div>
                    </div>
                    <Avatar 
                        size="large" 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: '#a91f23', color: '#fff1aa' }}
                    />
                    <DownOutlined className="ml-2 text-xs hidden md:block" style={{ color: '#a91f23' }} />
                </div>
            </Dropdown>
        </div>
      </Header>

      {/* --- PHẦN 2: MENU BAR (MÀU ĐỎ ĐẬM #a91f23) --- */}
      <div className="hidden md:block shadow-md sticky top-0 z-50" style={{ backgroundColor: '#a91f23' }}>
        <div className="px-8">
            <Menu
                mode="horizontal"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                className="custom-party-menu bg-transparent border-none font-medium text-base"
                style={{ lineHeight: '46px' }}
            />
        </div>
      </div>

      <Drawer
        title={<span style={{ color: '#a91f23', fontWeight: 'bold' }}>MENU ĐIỀU HƯỚNG</span>}
        placement="left"
        onClose={() => setVisibleMobileMenu(false)}
        open={visibleMobileMenu}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ backgroundColor: '#fff1aa' }}
      >
        <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="text-base"
            style={{ color: '#a91f23' }}
        />
      </Drawer>

      {/* --- PHẦN 3: CONTENT --- */}
      <Content className="p-4 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto min-h-[80vh]">
            <Outlet /> 
        </div>
      </Content>

      {/* --- PHẦN 4: FOOTER --- */}
      <Footer style={{ backgroundColor: '#a91f23', color: '#fff1aa', padding: '40px 50px' }}>
        <div className="max-w-7xl mx-auto">
            <Row gutter={[32, 16]} align="middle">
                {/* Cột 1: Thông tin Đảng bộ */}
                <Col xs={24} md={14}>
                    <h3 className="text-lg font-bold uppercase mb-2" style={{ color: '#ffffff' }}>
                        ĐẢNG BỘ TRƯỜNG ĐẠI HỌC KỸ THUẬT - CÔNG NGHỆ CẦN THƠ
                    </h3>
                    <div className="text-base font-semibold mb-2" style={{ color: '#fff1aa' }}>
                        {user.ten_chi_bo ? user.ten_chi_bo.toUpperCase() : 'CHI BỘ ...'}
                    </div>
                    <div className="w-16 h-1 bg-yellow-400 mb-4"></div>
                </Col>

                {/* Cột 2: Thông tin Liên hệ */}
                <Col xs={24} md={10} className="text-sm opacity-90">
                    <p className="mb-2 flex items-start">
                        <EnvironmentOutlined className="mr-2 mt-1" />
                        <span>Địa chỉ: 256 Nguyễn Văn Cừ, phường Cái Khế, Thành phố Cần Thơ</span>
                    </p>
                    <p className="mb-2 flex items-center">
                        <MailOutlined className="mr-2" />
                        <span>Email: dangbotruong@ctut.edu.vn</span>
                    </p>
                </Col>
            </Row>

            <Divider style={{ borderColor: 'rgba(255, 241, 170, 0.3)', margin: '20px 0' }} />

            <div className="text-center text-sm">
                © {new Date().getFullYear()} Bản quyền thuộc về <span className="font-bold">Đảng bộ trường Đại học Kỹ thuật - Công nghệ Cần Thơ</span>
            </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;