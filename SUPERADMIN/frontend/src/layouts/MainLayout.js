import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message, Typography, theme, Button, Space } from 'antd';
import { 
  UserOutlined, 
  DashboardOutlined, 
  BankOutlined, 
  FileTextOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
  AimOutlined,
  ReadOutlined,
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  DownOutlined // Import thêm icon mũi tên
} from '@ant-design/icons';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [collapsed, setCollapsed] = useState(false);
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const primaryColor = '#CE1126'; 
  const secondaryColor = '#F9D71C';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('Đăng xuất thành công');
    navigate('/login');
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { key: '/quan-ly-tin-tuc', icon: <ReadOutlined />, label: <Link to="/quan-ly-tin-tuc">Tin tức & Sự kiện</Link> },
    { key: '/quan-ly-chi-bo', icon: <BankOutlined />, label: <Link to="/quan-ly-chi-bo">Quản lý Chi bộ</Link> },
    { key: '/quan-ly-tai-khoan', icon: <UsergroupAddOutlined />, label: <Link to="/quan-ly-tai-khoan">Quản lý Tài khoản</Link> },
    { key: '/chi-tieu', icon: <AimOutlined />, label: <Link to="/chi-tieu">Quản lý Chỉ tiêu</Link> },
    { key: '/tai-lieu', icon: <FileTextOutlined />, label: <Link to="/tai-lieu">Quản lý Tài liệu</Link> },
  ];

  // Menu Dropdown được thiết kế lại chút cho đẹp hơn
  const userMenu = {
    items: [
      { 
        key: '1', 
        label: 'Đăng xuất', 
        icon: <LogoutOutlined />, 
        onClick: handleLogout,
        danger: true // Màu đỏ cho nút đăng xuất
      }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* SIDEBAR - Giữ nguyên */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg" 
        collapsedWidth="80" 
        onBreakpoint={(broken) => setCollapsed(broken)}
        width={260}
        style={{ 
          background: `linear-gradient(180deg, ${primaryColor} 0%, #8a0c1a 100%)`,
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
          position: 'sticky', top: 0, height: '100vh', left: 0, zIndex: 100 
        }}
      >
        <div style={{ 
            padding: collapsed ? '16px 8px' : '24px 16px', 
            textAlign: 'center', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s'
        }}>
          {!collapsed && (
            <Title level={4} style={{ color: secondaryColor, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '16px' }}>
              ĐẢNG ỦY TRƯỜNG
            </Title>
          )}
          
          <div style={{ marginTop: collapsed ? 0 : 12, transition: 'all 0.3s' }}>
            <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ 
                    width: collapsed ? '40px' : '80px', 
                    height: collapsed ? '40px' : '80px', 
                    borderRadius: '50%', 
                    border: `3px solid ${secondaryColor}`,
                    padding: '2px',
                    backgroundColor: '#fff',
                    objectFit: 'contain',
                    transition: 'all 0.3s'
                }} 
            />
          </div>

          {!collapsed && (
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Hệ thống Quản lý Số hóa
            </div>
          )}
        </div>

        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={menuItems}
          style={{ background: 'transparent', marginTop: 16, fontSize: '15px' }}
        />
      </Sider>

      <Layout style={{ background: '#f0f2f5' }}>
        {/* HEADER - Đã chỉnh sửa phần Dropdown */}
        <Header style={{ 
            padding: '0 24px 0 0', // Padding phải để cách lề
            background: colorBgContainer, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            position: 'sticky', top: 0, zIndex: 99, width: '100%',
            height: '64px'
        }}>
          {/* Nút Toggle Menu (Trái) */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          {/* User Profile (Phải) - Đã thiết kế lại */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown menu={userMenu} placement="bottomRight" arrow trigger={['click']}>
                <div style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    // hover effect sẽ được xử lý bằng css hoặc inline đơn giản
                }}
                className="admin-dropdown-trigger" // Bạn có thể thêm css hover vào file css nếu muốn
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.025)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <Avatar 
                        size="default" 
                        style={{ backgroundColor: primaryColor, verticalAlign: 'middle' }} 
                        icon={<UserOutlined />} 
                        src={user?.avatar} // Nếu có avatar
                    />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>
                            {user?.ho_ten || 'Đảng ủy trường'}
                        </span>
                        {/* Có thể thêm dòng chức vụ nhỏ ở dưới nếu muốn, hoặc bỏ đi để gọn */}
                        {/* <span style={{ fontSize: '11px', color: '#888' }}>Super Admin</span> */}
                    </div>

                    <DownOutlined style={{ fontSize: '12px', color: '#999', marginLeft: '4px' }} />
                </div>
            </Dropdown>
          </div>
        </Header>

        {/* CONTENT */}
        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ 
                padding: 24, 
                minHeight: 360, 
                background: colorBgContainer, 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
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