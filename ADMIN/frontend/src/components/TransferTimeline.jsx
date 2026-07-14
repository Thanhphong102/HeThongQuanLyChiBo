import React from 'react';
import { Timeline, Typography, Spin, Tag, Card } from 'antd';
import { CheckCircleOutlined, SyncOutlined, EditOutlined, CloseCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const statusMap = {
  'Da_Gui': 'Đã gửi',
  'Dang_Tham_Dinh': 'Đang thẩm định',
  'Can_Bo_Sung': 'Cần bổ sung',
  'Cho_Ky_Giay': 'Chờ ký giấy',
  'Hoan_Tat': 'Hoàn tất',
  'Da_Huy': 'Đã hủy'
};

const formatChiTiet = (text) => {
  let result = text;
  Object.keys(statusMap).forEach(key => {
    result = result.replace(key, statusMap[key]);
  });
  return result;
};

const TransferTimeline = ({ logs }) => {
  if (!logs) return <Spin size="small" />;
  if (logs.length === 0) return <Text type="secondary">Chưa có lịch sử xử lý.</Text>;

  const getTimelineIcon = (action, chi_tiet) => {
    if (action === 'TAO_MOI') return <CheckCircleOutlined style={{ fontSize: '16px', color: 'green' }} />;
    if (action === 'YEU_CAU_BO_SUNG') return <WarningOutlined style={{ fontSize: '16px', color: 'orange' }} />;
    if (action === 'NOP_BO_SUNG_HO_SO') return <EditOutlined style={{ fontSize: '16px', color: 'blue' }} />;
    
    if (action === 'CAP_NHAT_TRANG_THAI') {
      if (chi_tiet.includes('Hoan_Tat')) return <CheckCircleOutlined style={{ fontSize: '16px', color: 'green' }} />;
      if (chi_tiet.includes('Da_Huy')) return <CloseCircleOutlined style={{ fontSize: '16px', color: 'red' }} />;
      if (chi_tiet.includes('Can_Bo_Sung')) return <WarningOutlined style={{ fontSize: '16px', color: 'orange' }} />;
      if (chi_tiet.includes('Cho_Ky_Giay')) return <ClockCircleOutlined style={{ fontSize: '16px', color: 'cyan' }} />;
      return <SyncOutlined spin style={{ fontSize: '16px', color: '#1890ff' }} />;
    }
    return <CheckCircleOutlined style={{ fontSize: '16px', color: 'gray' }} />;
  };

  return (
    <Card title="Tiến Độ Xử Lý" bordered={false} size="small">
      <Timeline mode="left">
        {logs.map(log => (
          <Timeline.Item 
            key={log.id} 
            dot={getTimelineIcon(log.hanh_dong, log.chi_tiet)}
            label={<Text type="secondary">{dayjs(log.thoi_gian).format('DD/MM/YYYY HH:mm')}</Text>}
          >
            <div>
              <Text strong>{formatChiTiet(log.chi_tiet)}</Text>
            </div>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">{log.ten_nguoi_thuc_hien}</Tag>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};

export default TransferTimeline;
