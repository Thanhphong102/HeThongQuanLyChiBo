import React, { useEffect, useState } from 'react';
import { Badge, Popover, List, Button, Dropdown, Tooltip, Empty } from 'antd';
import { 
  BellOutlined, 
  CalendarOutlined, 
  DollarCircleOutlined, 
  AimOutlined, 
  FileTextOutlined,
  MoreOutlined,
  CheckOutlined,
  DeleteOutlined,
  ClearOutlined,
  StarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import notificationService from '../services/notificationService';

// ── Bản đồ icon + màu theo loại thông báo ──
const TYPE_CONFIG = {
  MEETING:  { icon: <CalendarOutlined />,      color: '#faad14', bg: '#fffbe6' },
  FEE:      { icon: <DollarCircleOutlined />,  color: '#ff4d4f', bg: '#fff1f0' },
  TARGET:   { icon: <AimOutlined />,           color: '#1677ff', bg: '#e6f4ff' },
  DOCUMENT: { icon: <FileTextOutlined />,      color: '#722ed1', bg: '#f9f0ff' },
  ACTIVITY: { icon: <StarOutlined />,          color: '#eb2f96', bg: '#fff0f6' },
  default:  { icon: <BellOutlined />,          color: '#1677ff', bg: '#e6f4ff' },
};

const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.default;

const NotificationPopover = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Lỗi lấy thông báo:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAsUnread = async (id, e) => {
    e?.stopPropagation();
    await notificationService.markAsUnread(id);
    fetchNotifications();
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    await notificationService.deleteNotification(id);
    fetchNotifications();
  };

  const handleDeleteAll = async () => {
    await notificationService.deleteAllNotifications();
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const content = (
    <div style={{ width: 370, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <div style={{ 
        padding: '14px 18px 12px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, color: '#003a8c', fontSize: 17, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            Thông báo
          </span>
          {unreadCount > 0 && (
            <span style={{
              background: '#ff4d4f', color: '#fff',
              borderRadius: 20, fontSize: 11, fontWeight: 700,
              padding: '1px 8px', lineHeight: '18px'
            }}>
              {unreadCount} mới
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Tooltip title="Đánh dấu đọc tất cả">
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAllAsRead}
              style={{ color: '#1677ff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Đọc tất cả
            </Button>
          </Tooltip>
        )}
      </div>

      {/* ── DANH SÁCH THÔNG BÁO ── */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <Empty 
            description={<span style={{ color: '#9ca3af', fontSize: 13 }}>Bạn không có thông báo nào</span>}
            style={{ padding: '32px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            locale={{ emptyText: '' }}
            renderItem={(item) => {
              const { icon, color, bg } = getTypeConfig(item.type);

              const actionMenu = [
                {
                  key: '1',
                  label: item.isUnread ? 'Đánh dấu đã đọc' : 'Đánh dấu chưa đọc',
                  icon: item.isUnread ? <EyeOutlined /> : <CheckOutlined />,
                  onClick: (e) => item.isUnread
                    ? handleMarkAsRead(item.id)
                    : handleMarkAsUnread(item.id, e.domEvent),
                },
                { type: 'divider' },
                {
                  key: '2',
                  danger: true,
                  label: 'Xóa thông báo',
                  icon: <DeleteOutlined />,
                  onClick: (e) => handleDelete(item.id, e.domEvent),
                }
              ];

              return (
                <List.Item
                  style={{
                    padding: '12px 18px',
                    cursor: 'pointer',
                    background: item.isUnread ? '#f0f7ff' : '#fff',
                    borderBottom: '1px solid #f4f6f8',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                  onClick={() => { if (item.isUnread) handleMarkAsRead(item.id); }}
                >
                  {/* Chấm xanh báo chưa đọc */}
                  {item.isUnread && (
                    <div style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 7, height: 7, borderRadius: '50%', background: '#1677ff'
                    }} />
                  )}

                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 18, color,
                      }}>
                        {icon}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: item.isUnread ? 700 : 500,
                          color: '#111827',
                          lineHeight: 1.5,
                          flex: 1,
                          fontFamily: 'Be Vietnam Pro, sans-serif'
                        }}>
                          {item.title}
                        </span>
                        <Dropdown menu={{ items: actionMenu }} trigger={['click']} placement="bottomRight">
                          <Button
                            type="text" size="small"
                            icon={<MoreOutlined />}
                            onClick={e => e.stopPropagation()}
                            style={{ color: '#9ca3af', flexShrink: 0 }}
                          />
                        </Dropdown>
                      </div>
                    }
                    description={
                      <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                        <div style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.6, marginBottom: 4 }}>
                          {item.message}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {new Date(item.date).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>

      {/* ── FOOTER ── */}
      {notifications.length > 0 && (
        <div style={{ 
          textAlign: 'center', padding: '10px 0', 
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          <Button type="link" danger icon={<ClearOutlined />} onClick={handleDeleteAll}
            style={{ fontSize: 13, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            Xóa tất cả thông báo
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      placement="bottomRight"
      trigger="click"
      content={content}
      overlayInnerStyle={{ padding: 0, borderRadius: 16 }}
      styles={{ body: { padding: 0 } }}
      overlayStyle={{ minWidth: 370 }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 6]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: '20px', color: '#595959' }} />}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      </Badge>
    </Popover>
  );
};

export default NotificationPopover;
