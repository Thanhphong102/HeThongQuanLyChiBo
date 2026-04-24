import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message, theme, Button } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  LogoutOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  DollarCircleOutlined,
  UserOutlined,
  AimOutlined,
  UserSwitchOutlined,
  PictureOutlined,
  StarOutlined    // Task 8: Icon cho Hoạt động
} from '@ant-design/icons';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NotificationPopover from '../components/NotificationPopover';

// Import ảnh trực tiếp từ src/assets (Đảm bảo file tồn tại)
import imgCoToQuoc from '../assets/co-to-quoc.png'; 
import imgCoDang from '../assets/co-dang.jpg';      

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const { token: { colorBgContainer } } = theme.useToken();
  const primaryColor = '#CE1126'; 

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('Đăng xuất thành công');
    navigate('/login');
  };

  const menuItemsUser = [
    { key: '1', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: handleLogout }
  ];

  // CẤU HÌNH MENU SIDEBAR
  const menuItems = [
    { 
      key: '/dashboard', 
      icon: <DashboardOutlined />, 
      label: <Link to="/dashboard">Tổng quan</Link> 
    },
    { 
      key: '/dang-vien', 
      icon: <TeamOutlined />, 
      label: <Link to="/dang-vien">Hồ sơ Đảng viên</Link> 
    },
    { 
      key: '/tai-khoan-dang-vien', // <--- MỤC MỚI
      icon: <UserSwitchOutlined />, 
      label: <Link to="/tai-khoan-dang-vien">Tài khoản Đảng viên</Link> 
    },
    { 
      key: '/sinh-hoat', 
      icon: <CalendarOutlined />, 
      label: <Link to="/sinh-hoat">Sinh hoạt & Điểm danh</Link> 
    },
    { 
      key: '/dang-phi', 
      icon: <DollarCircleOutlined />, 
      label: <Link to="/dang-phi">Thu Đảng phí</Link> 
    },
    { 
      key: '/bieu-mau', 
      icon: <FileTextOutlined />, 
      label: <Link to="/bieu-mau">Biểu mẫu nội bộ</Link> 
    },
    { 
      key: '/thu-vien', 
      icon: <PictureOutlined />,
      label: <Link to="/thu-vien">Thư viện Ảnh/Video</Link> 
    },
    { 
      key: '/hoat-dong', 
      icon: <StarOutlined />,
      label: <Link to="/hoat-dong">Quản lý Hoạt động</Link>  // Task 8
    },
    { 
      key: '/nhan-chi-tieu', 
      icon: <AimOutlined />,
      label: <Link to="/nhan-chi-tieu">Nhận chỉ tiêu</Link> // Task 9
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} collapsible collapsed={collapsed} breakpoint="lg" 
        collapsedWidth="80" onBreakpoint={(broken) => setCollapsed(broken)} width={260}
        style={{ 
          background: `linear-gradient(180deg, #001529 0%, #003a8c 100%)`,
          boxShadow: '4px 0 10px rgba(0,0,0,0.15)',
          // Dùng sticky để menu luôn hiện khi scroll, minHeight 100vh để đủ chiều cao khi chụp ảnh
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',          // cho phép sidebar bám theo scroll
          height: '100vh',
          overflowY: 'auto',
          left: 0,
          zIndex: 100,
          fontFamily: 'Be Vietnam Pro, sans-serif',
        }}
      >
        <div style={{ 
            padding: collapsed ? '16px 8px' : '20px 12px', textAlign: 'center', 
            borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16, transition: 'all 0.3s'
        }}>
          {!collapsed ? (
            <>
              <div style={{ 
                  color: '#fff', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', 
                  marginBottom: 12, lineHeight: '1.4', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Inter, "Be Vietnam Pro", sans-serif',
                  letterSpacing: '0.5px',
                  padding: '0 8px'
              }}>
                {user?.ten_chi_bo || 'CHI BỘ ĐIỆN TỬ'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: 12 }}>
                 <img 
                    src={imgCoToQuoc} 
                    alt="Cờ Tổ Quốc" 
                    style={{ height: '35px', width: 'auto', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }} 
                 />
                 <img 
                    src={imgCoDang} 
                    alt="Cờ Đảng" 
                    style={{ height: '35px', width: 'auto', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }} 
                 />
              </div>
              
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.5px' }}>
                Hệ thống Quản lý Đảng viên
              </div>
            </>
          ) : (
            <div style={{ 
                color: '#fff', fontSize: '18px', fontWeight: 'bold', 
                padding: '10px 0', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px' 
            }}>
              CB
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{
            background: 'transparent',
            fontSize: '14px',
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontWeight: 500,
          }}
        />
      </Sider>

      <Layout style={{ background: '#f5f6fa', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 99, width: '100%' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 64, height: 64 }} />
          {/* User Profile (Phải) */}
          <div style={{ paddingRight: 24, display: 'flex', alignItems: 'center', height: '100%', gap: '16px' }}> 
            
            {/* TASK 9 & 10: CHUÔNG THÔNG BÁO (Đã Component hóa) */}
            <NotificationPopover />

            <Dropdown menu={{ items: menuItemsUser }} placement="bottomRight" arrow>
              <div style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '4px 12px', // Giảm padding để nút nhỏ gọn hơn (Cũ: 4px 12px)
                  borderRadius: '20px', 
                  transition: 'all 0.3s', 
                  background: '#f5f5f5', 
                  border: '1px solid #e0e0e0',
                  height: '32px', // Set chiều cao cố định để nó gọn gàng
                  gap: '8px' // Khoảng cách giữa Avatar và Tên
              }}>
                <Avatar 
                    size="small" // Dùng size small (24px)
                    style={{ backgroundColor: primaryColor }} 
                    icon={<UserOutlined />} 
                />
                <span style={{ 
                    fontWeight: 600, 
                    color: '#003a8c', 
                    fontSize: '13px', // Giảm cỡ chữ xíu cho cân đối
                    lineHeight: '1'   // Căn giữa dòng chữ
                }}>
                    {user?.ho_ten || 'Đồng chí Bí thư'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            style={{
              padding: 28,
              minHeight: 360,
              background: 'transparent',
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}
          >
            <Outlet />
          </motion.div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;