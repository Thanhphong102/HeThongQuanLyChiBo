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
  MailOutlined,
  ThunderboltOutlined,
  SwapOutlined,
  TrophyOutlined,
  FileDoneOutlined,
  CustomerServiceOutlined,
  MessageOutlined
} from '@ant-design/icons';

import userApi from '../api/userApi'; // [NEW] Import API
// 👇 THAY THẾ LINK NGOÀI BẰNG IMPORT FILE LOCAL (Vite sẽ xử lý)
// ❗ Đảm bảo 2 file này nằm trong thư mục src/assets


import NotificationPopover from '../components/Header/NotificationPopover';
import FloatingChatbot from '../components/FloatingChatbot'; // [NEW] Chatbot AI
import { getMediaUrl } from '../utils/mediaUrl';

const { Header, Content, Footer } = Layout;

const FALLBACK_USER = { ho_ten: 'Đảng viên', ten_chi_bo: 'Chi bộ Sinh viên' };

const readCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user_info')) || FALLBACK_USER;
  } catch {
    return FALLBACK_USER;
  }
};

// Các route được gom theo nhóm để thanh điều hướng luôn gọn trên desktop.
const menuItems = [
  { key: '/home', icon: <HomeOutlined />, label: 'TRANG CHỦ' },
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'TỔNG QUAN' },
  {
    key: 'activity-group',
    icon: <ThunderboltOutlined />,
    label: <span className="nav-group-label">HOẠT ĐỘNG <span className="nav-group-caret" aria-hidden="true">▼</span></span>,
    popupClassName: 'party-nav-dropdown',
    children: [
      { key: '/activities', icon: <ThunderboltOutlined />, label: 'Hoạt động chi bộ' },
      { key: '/neu-guong', icon: <TrophyOutlined />, label: 'Nêu gương' },
      { key: '/tasks', icon: <FileDoneOutlined />, label: 'Nhiệm vụ & Minh chứng' },
    ],
  },
  {
    key: 'resource-group',
    icon: <FileTextOutlined />,
    label: <span className="nav-group-label">TÀI NGUYÊN <span className="nav-group-caret" aria-hidden="true">▼</span></span>,
    popupClassName: 'party-nav-dropdown',
    children: [
      { key: '/documents', icon: <FileTextOutlined />, label: 'Kho tài liệu' },
      { key: '/media', icon: <PictureOutlined />, label: 'Thư viện ảnh' },
    ],
  },
  {
    key: 'service-group',
    icon: <DollarOutlined />,
    label: <span className="nav-group-label">NGHIỆP VỤ <span className="nav-group-caret" aria-hidden="true">▼</span></span>,
    popupClassName: 'party-nav-dropdown',
    children: [
      { key: '/lookup', icon: <DollarOutlined />, label: 'Tra cứu Đảng phí' },
      { key: '/transfer-requests', icon: <SwapOutlined />, label: 'Chuyển Đảng' },
      { key: '/contact', icon: <CustomerServiceOutlined />, label: 'Liên hệ Chi ủy' },
      { key: '/feedback', icon: <MessageOutlined />, label: 'Góp ý' },
    ],
  },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(readCachedUser);
  const [visibleMobileMenu, setVisibleMobileMenu] = useState(false);

  useEffect(() => {
    const syncUser = (event) => {
      setUser(event?.detail || readCachedUser());
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('user-profile-updated', syncUser);

    userApi.getProfile()
      .then((response) => {
        const profile = response.data || response;
        if (profile) {
          localStorage.setItem('user_info', JSON.stringify(profile));
          setUser(profile);
        }
      })
      .catch(() => {
        // Header vẫn sử dụng dữ liệu đã lưu nếu API tạm thời chưa sẵn sàng.
      });

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-profile-updated', syncUser);
    };
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
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ cá nhân',
        onClick: () => navigate('/profile'),
      },
      {
        type: 'divider',
      },
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
        className="px-4 md:px-8 h-auto flex justify-between items-center py-2"
        style={{ 
            backgroundColor: '#fff1aa', 
            borderBottom: '2px solid rgba(169,31,35,0.12)',
            boxShadow: '0 2px 20px rgba(0,0,0,0.06)'
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <img 
              src="/logo-flags.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>
          
          <div className="hidden lg:block">
            <h1 className="font-bold text-lg leading-tight uppercase m-0" style={{ color: '#a91f23' }}>
              ĐẢNG BỘ TRƯỜNG ĐẠI HỌC KỸ THUẬT - CÔNG NGHỆ CẦN THƠ
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
                className="lg:hidden mr-2"
                onClick={() => setVisibleMobileMenu(true)}
            />

            {/* [NEW] CHUÔNG THÔNG BÁO TẠI ĐÂY */}
            <NotificationPopover />

            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
                <div className="flex items-center cursor-pointer hover:bg-yellow-200/50 p-2 rounded transition-colors">
                    <div className="text-right mr-3 hidden lg:block">
                        <div className="font-bold text-sm" style={{ color: '#a91f23' }}>{user.ho_ten}</div>
                    </div>
                    <Avatar 
                        size="large" 
                        src={getMediaUrl(user.anh_the) || null}
                        icon={!user.anh_the && <UserOutlined />} 
                        style={{ backgroundColor: '#a91f23', color: '#fff1aa', objectFit: 'cover' }}
                    />
                    <DownOutlined className="ml-2 text-xs hidden lg:block" style={{ color: '#a91f23' }} />
                </div>
            </Dropdown>
        </div>
      </Header>

      {/* --- PHẦN 2: MENU BAR (MÀU ĐỎ ĐẬM #a91f23) --- */}
      <div className="hidden lg:block sticky top-0 z-50" style={{ 
          background: 'linear-gradient(135deg, #a91f23 0%, #8b1517 100%)',
          boxShadow: '0 4px 20px rgba(169, 31, 35, 0.4)'
      }}>
        <nav className="user-primary-nav" aria-label="Điều hướng chính">
            <Menu
                mode="horizontal"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                className="custom-party-menu bg-transparent border-none font-medium text-base"
                style={{ lineHeight: '52px' }}
            />
        </nav>
      </div>

      <Drawer
        rootClassName="user-mobile-nav-drawer"
        title={<span style={{ color: '#fff', fontWeight: 'bold' }}>MENU ĐIỀU HƯỚNG</span>}
        placement="left"
        onClose={() => setVisibleMobileMenu(false)}
        open={visibleMobileMenu}
        styles={{
            body: { padding: 0, backgroundColor: '#a91f23' },
            header: { backgroundColor: '#8b1517', borderBottom: '1px solid rgba(255,255,255,0.1)' }
        }}
      >
        <style>{`
          .custom-mobile-menu.ant-menu-dark {
            background: transparent;
          }
          .custom-mobile-menu.ant-menu-dark .ant-menu-item {
            color: rgba(255,255,255,0.85);
            margin-top: 8px;
          }
          .custom-mobile-menu.ant-menu-dark .ant-menu-item-selected {
            background-color: rgba(0,0,0,0.2) !important;
            color: #fff1aa !important;
            font-weight: bold;
            border-right: 4px solid #fff1aa;
          }
          .custom-mobile-menu.ant-menu-dark .ant-menu-item:hover {
            background-color: rgba(0,0,0,0.1) !important;
            color: #fff;
          }
        `}</style>
        <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="text-base custom-mobile-menu"
            style={{ borderRight: 'none' }}
        />
      </Drawer>

      {/* --- PHẦN 3: CONTENT --- */}
      <Content className="user-content-area" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%)' }}>
        <div className="user-content-shell">
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

      {/* --- PHẦN 5: CHATBOT AI --- */}
      <FloatingChatbot />

    </Layout>
  );
};

export default MainLayout;
