import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Button, Tooltip } from 'antd';
import { 
    BellOutlined, 
    CheckCircleOutlined, 
    CalendarOutlined, 
    ExclamationCircleOutlined,
    AimOutlined,
    FileTextOutlined,
    StarOutlined,
    MoreOutlined,
    DeleteOutlined,
    ClearOutlined,
    CheckSquareOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';

const NotificationPopover = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [expandedItems, setExpandedItems] = useState({});

    const fetchNotifs = async () => {
        try {
            const res = await userApi.getNotifications();
            const data = res.data || [];
            setNotifications(data);
            // Backend trả về field `isUnread` (đã map từ !da_doc)
            setUnreadCount(data.filter(n => n.isUnread).length);
        } catch (error) {
            console.error("Lỗi lấy thông báo:", error);
        }
    };

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, []);

    // FIX: Dùng `item.id` (không phải item.ma_thong_bao) vì backend map sang `id`
    const handleReadNotification = async (item, e) => {
        if (e) e.stopPropagation();
        if (!item.isUnread) return;
        try {
            await userApi.markNotificationRead(item.id);
            const updated = notifications.map(n => n.id === item.id ? { ...n, isUnread: false } : n);
            setNotifications(updated);
            setUnreadCount(updated.filter(n => n.isUnread).length);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAsUnread = async (item, e) => {
        if (e) e.stopPropagation();
        if (item.isUnread) return;
        try {
            await userApi.markNotificationUnread(item.id);
            const updated = notifications.map(n => n.id === item.id ? { ...n, isUnread: true } : n);
            setNotifications(updated);
            setUnreadCount(updated.filter(n => n.isUnread).length);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (item, e) => {
        if (e) e.stopPropagation();
        try {
            await userApi.deleteNotification(item.id);
            const updated = notifications.filter(n => n.id !== item.id);
            setNotifications(updated);
            setUnreadCount(updated.filter(n => n.isUnread).length);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteAll = async (e) => {
        if (e) e.stopPropagation();
        try {
            await userApi.deleteAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };

    // [NEW] Đánh dấu tất cả là đã đọc
    const handleMarkAllRead = async (e) => {
        if (e) e.stopPropagation();
        try {
            await userApi.markAllNotificationsRead();
            const updated = notifications.map(n => ({ ...n, isUnread: false }));
            setNotifications(updated);
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dropdown 
            trigger={['click']} 
            placement="bottomRight"
            popupRender={() => (
                <div className="bg-white rounded-xl shadow-2xl w-80 overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="p-3 text-white font-bold flex justify-between items-center" style={{ backgroundColor: '#7a1618' }}>
                        <span>THÔNG BÁO</span>
                        <div className="flex items-center gap-2">
                            {/* [NEW] Nút đọc tất cả */}
                            {unreadCount > 0 && (
                                <Tooltip title="Đánh dấu tất cả đã đọc">
                                    <Button 
                                        type="text" 
                                        size="small" 
                                        icon={<CheckSquareOutlined />}
                                        onClick={handleMarkAllRead}
                                        className="text-white/80 hover:!text-white hover:!bg-white/10"
                                    />
                                </Tooltip>
                            )}
                            <Badge count={unreadCount} style={{ backgroundColor: '#ffca28', color: '#a91f23' }} />
                        </div>
                    </div>

                    <List
                        className="max-h-80 overflow-y-auto"
                        dataSource={notifications}
                        locale={{ emptyText: 'Chưa có thông báo nào' }}
                        renderItem={(item) => {
                            // FIX: Dùng `item.type` (không phải item.loai_thong_bao) vì backend đã map
                            let IconRender = <CheckCircleOutlined className="text-gray-400" />;
                            if (item.type === 'MEETING') IconRender = <CalendarOutlined className="text-blue-500" />;
                            if (item.type === 'FEE')     IconRender = <ExclamationCircleOutlined className="text-red-500" />;
                            if (item.type === 'TARGET')  IconRender = <AimOutlined className="text-blue-600" />;
                            if (item.type === 'DOCUMENT') IconRender = <FileTextOutlined className="text-purple-500" />;
                            if (item.type === 'ACTIVITY') IconRender = <StarOutlined className="text-pink-500" />;
                            
                            const actionMenu = [
                                {
                                    key: '1',
                                    label: item.isUnread ? 'Đánh dấu đã đọc' : 'Đánh dấu chưa đọc',
                                    icon: <CheckCircleOutlined />,
                                    onClick: (e) => item.isUnread 
                                        ? handleReadNotification(item, e.domEvent) 
                                        : handleMarkAsUnread(item, e.domEvent)
                                },
                                {
                                    key: '2',
                                    danger: true,
                                    label: 'Xóa thông báo',
                                    icon: <DeleteOutlined />,
                                    onClick: (e) => handleDelete(item, e.domEvent)
                                }
                            ];

                            return (
                                <List.Item 
                                    className={`px-4 py-3 hover:bg-red-50 transition-colors cursor-pointer border-b last:border-0 border-gray-100 ${item.isUnread ? 'bg-red-50/50' : 'bg-white'}`}
                                    onClick={() => handleReadNotification(item)}
                                >
                                    <List.Item.Meta
                                        avatar={<div className="mt-1 text-lg">{IconRender}</div>}
                                        title={
                                            <div className="flex justify-between items-start">
                                                {/* Chấm tròn biểu thị chưa đọc */}
                                                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                                    {item.isUnread && (
                                                        <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-red-500 inline-block" />
                                                    )}
                                                    <span className={`text-sm pr-2 transition-colors break-words ${item.isUnread ? 'font-bold text-gray-900' : 'font-normal text-gray-500'}`}>
                                                        {/* FIX: Dùng item.title (backend đã map từ tieu_de) */}
                                                        {item.title}
                                                    </span>
                                                </div>
                                                <Dropdown menu={{ items: actionMenu }} trigger={['click']} placement="bottomRight">
                                                    <Button type="text" size="small" icon={<MoreOutlined className="text-gray-400" />} onClick={e => e.stopPropagation()} className="flex-shrink-0" />
                                                </Dropdown>
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <div className={`text-xs mt-1 transition-colors ${item.isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'} ${expandedItems[item.id] ? '' : 'line-clamp-2'}`}>
                                                    {/* FIX: Dùng item.message (backend đã map từ noi_dung) */}
                                                    {item.message}
                                                </div>
                                                {item.message?.length > 70 && (
                                                    <span 
                                                        className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold cursor-pointer mt-0.5 inline-block"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedItems(prev => ({...prev, [item.id]: !prev[item.id]}));
                                                        }}
                                                    >
                                                        {expandedItems[item.id] ? 'Thu gọn' : 'Xem thêm...'}
                                                    </span>
                                                )}
                                                <div className="text-[10px] text-gray-400 mt-1">{dayjs(item.date).format('HH:mm - DD/MM/YYYY')}</div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="flex justify-between items-center p-2 border-t border-gray-100 bg-gray-50">
                            {unreadCount > 0 && (
                                <Button 
                                    type="link" 
                                    icon={<CheckSquareOutlined />} 
                                    onClick={handleMarkAllRead} 
                                    className="text-xs text-blue-500"
                                >
                                    Đọc tất cả ({unreadCount})
                                </Button>
                            )}
                            <Button type="link" danger icon={<ClearOutlined />} onClick={handleDeleteAll} className="text-xs ml-auto">
                                Xóa tất cả
                            </Button>
                        </div>
                    )}
                </div>
            )}
        >
            <div className="mr-6 cursor-pointer mt-2 hover:opacity-80 transition-opacity">
                <Badge count={unreadCount} size="small">
                    <BellOutlined style={{ fontSize: '22px', color: '#a91f23' }} />
                </Badge>
            </div>
        </Dropdown>
    );
};

export default NotificationPopover;
