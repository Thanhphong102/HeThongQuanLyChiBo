import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, Space, Card } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import transferApi from '../../api/transferApi';
import dayjs from 'dayjs';

const { Title } = Typography;

const TransferDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await transferApi.getMyRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusTag = (status) => {
    switch (status) {
      case 'Da_Gui': return <Tag color="blue">Đã gửi</Tag>;
      case 'Dang_Tham_Dinh': return <Tag color="orange">Đang thẩm định</Tag>;
      case 'Can_Bo_Sung': return <Tag color="red">Cần bổ sung</Tag>;
      case 'Cho_Ky_Giay': return <Tag color="cyan">Chờ ký giấy</Tag>;
      case 'Hoan_Tat': return <Tag color="green">Hoàn tất</Tag>;
      case 'Da_Huy': return <Tag color="default">Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Loại chuyển',
      dataIndex: 'loai_chuyen',
      key: 'loai_chuyen',
    },
    {
      title: 'Nơi chuyển đến',
      dataIndex: 'noi_chuyen_den',
      key: 'noi_chuyen_den',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'ngay_tao',
      key: 'ngay_tao',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (text) => getStatusTag(text),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/transfer-requests/${record.id}`)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title={<Title level={3} style={{ margin: 0 }}>Quản lý chuyển sinh hoạt Đảng</Title>} 
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/transfer-requests/new')}>Tạo yêu cầu mới</Button>}
    >
      <Table 
        columns={columns} 
        dataSource={requests} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default TransferDashboard;
