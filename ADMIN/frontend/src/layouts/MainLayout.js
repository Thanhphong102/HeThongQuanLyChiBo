import React, { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message, theme, Button, Grid } from 'antd';
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
  StarOutlined,    // Task 8: Icon cho Hoạt động
  SwapOutlined,
  TrophyOutlined,    // [NEW] Nêu gương
  FileDoneOutlined,
  CustomerServiceOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NotificationPopover from '../components/NotificationPopover';
import './MainLayout.css';

// Import ảnh trực tiếp từ src/assets (Đảm bảo file tồn tại)
import imgCoToQuoc from '../assets/co-to-quoc.png'; 
import imgCoDang from '../assets/co-dang.jpg';      

const { Header, Sider, Content } = Layout;

const groupForPath = (path) => {
  if (['/dang-vien', '/tai-khoan-dang-vien'].includes(path)) return 'group-members';
  if (['/sinh-hoat', '/dang-phi', '/nhan-chi-tieu', '/chuyen-dang', '/neu-guong'].includes(path)) return 'group-operations';
  if (['/bieu-mau', '/thu-vien', '/hoat-dong', '/nhiem-vu'].includes(path)) return 'group-content';
  if (['/lien-he', '/gop-y', '/lien-he-gop-y'].includes(path)) return 'group-support';
  return null;
};

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const { token: { colorBgContainer } } = theme.useToken();
  const screens = Grid.useBreakpoint();
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

  useEffect(() => {
    const activeGroup = groupForPath(location.pathname);
    if (activeGroup) setOpenKeys(keys => keys.includes(activeGroup) ? keys : [...keys, activeGroup]);
  }, [location.pathname]);

  // CẤU HÌNH MENU SIDEBAR THEO NHÓM
  const menuItems = [
    { 
      key: '/dashboard', 
      icon: <DashboardOutlined />, 
      label: <Link to="/dashboard">Tổng quan</Link> 
    },
    {
      key: 'group-members', icon: <TeamOutlined />, label: 'Đảng viên',
      children: [
        { key: '/dang-vien', icon: <TeamOutlined />, label: <Link to="/dang-vien">Hồ sơ Đảng viên</Link> },
        { key: '/tai-khoan-dang-vien', icon: <UserSwitchOutlined />, label: <Link to="/tai-khoan-dang-vien">Tài khoản Đảng viên</Link> },
      ],
    },
    {
      key: 'group-operations', icon: <CalendarOutlined />, label: 'Nghiệp vụ Chi bộ',
      children: [
        { key: '/sinh-hoat', icon: <CalendarOutlined />, label: <Link to="/sinh-hoat">Sinh hoạt & Điểm danh</Link> },
        { key: '/dang-phi', icon: <DollarCircleOutlined />, label: <Link to="/dang-phi">Thu Đảng phí</Link> },
        { key: '/nhan-chi-tieu', icon: <AimOutlined />, label: <Link to="/nhan-chi-tieu">Nhận chỉ tiêu</Link> },
        { key: '/chuyen-dang', icon: <SwapOutlined />, label: <Link to="/chuyen-dang">Quản lý chuyển Đảng</Link> },
        { key: '/neu-guong', icon: <TrophyOutlined />, label: <Link to="/neu-guong">Quản lý Nêu gương</Link> },
      ],
    },
    {
      key: 'group-content', icon: <FileTextOutlined />, label: 'Nội dung & Tài liệu',
      children: [
        { key: '/bieu-mau', icon: <FileTextOutlined />, label: <Link to="/bieu-mau">Biểu mẫu nội bộ</Link> },
        { key: '/thu-vien', icon: <PictureOutlined />, label: <Link to="/thu-vien">Thư viện Ảnh/Video</Link> },
        { key: '/hoat-dong', icon: <StarOutlined />, label: <Link to="/hoat-dong">Quản lý Hoạt động</Link> },
        { key: '/nhiem-vu', icon: <FileDoneOutlined />, label: <Link to="/nhiem-vu">Nhiệm vụ & Minh chứng</Link> },
      ],
    },
    {
      key: 'group-support', icon: <CustomerServiceOutlined />, label: 'Hỗ trợ',
      children: [
        { key: '/lien-he', icon: <CustomerServiceOutlined />, label: <Link to="/lien-he">Quản lý Liên hệ</Link> },
        { key: '/gop-y', icon: <MessageOutlined />, label: <Link to="/gop-y">Quản lý Góp ý</Link> },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        className="admin-sidebar"
        trigger={null} collapsible collapsed={collapsed} breakpoint="lg" 
        collapsedWidth={screens.md ? 80 : 0} onBreakpoint={(broken) => setCollapsed(broken)} width={260}
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
                  color: '#fff', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase',
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
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setOpenKeys}
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

        <Content className="admin-main-content" style={{ overflow: 'initial' }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="admin-page-shell"
            style={{
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
