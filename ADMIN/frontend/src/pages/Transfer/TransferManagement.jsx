import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Typography, message, Select, Input, Descriptions, List } from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axiosClient from '../../services/axiosConfig';
import TransferTimeline from '../../components/TransferTimeline';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TransferManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // States for changing status
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/transfer-requests');
      setData(res.data);
      
      // Kiểm tra URL nếu có id query để tự động mở modal
      const params = new URLSearchParams(location.search);
      const queryId = params.get('id');
      if (queryId) {
        handleViewDetail({ id: queryId });
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi lấy danh sách hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleViewDetail = async (record) => {
    try {
      const res = await axiosClient.get(`/transfer-requests/${record.id}`);
      setSelectedRecord(res.data);
      setNewStatus(res.data.trang_thai);
      setNote('');
      setIsModalVisible(true);
    } catch (error) {
      console.error(error);
      message.error('Lỗi tải chi tiết');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await axiosClient.put(`/transfer-requests/${selectedRecord.id}/status`, {
        trang_thai: newStatus,
        ghi_chu_chi_uy: note
      });
      message.success('Cập nhật trạng thái thành công');
      setIsModalVisible(false);
      fetchData(); // Reload list
    } catch (error) {
      console.error(error);
      message.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleReviewDoc = async (docId, status) => {
    try {
      await axiosClient.put(`/transfer-requests/documents/${docId}/review`, {
        trang_thai_tai_lieu: status,
        ghi_chu: 'Admin đã duyệt'
      });
      message.success('Đã cập nhật trạng thái tài liệu');
      // Tải lại chi tiết
      handleViewDetail({ id: selectedRecord.id });
    } catch (error) {
      console.error(error);
      message.error('Lỗi đánh giá tài liệu');
    }
  };

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
      title: 'Đảng viên',
      dataIndex: 'ho_ten',
      key: 'ho_ten',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: 'gray' }}>Mã ĐV: {record.so_the_dang_vien || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Loại chuyển',
      dataIndex: 'loai_chuyen',
      key: 'loai_chuyen',
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'ngay_cap_nhat',
      key: 'ngay_cap_nhat',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.ngay_cap_nhat).unix() - dayjs(b.ngay_cap_nhat).unix(),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (text) => getStatusTag(text),
      filters: [
        { text: 'Đã gửi', value: 'Da_Gui' },
        { text: 'Đang thẩm định', value: 'Dang_Tham_Dinh' },
        { text: 'Cần bổ sung', value: 'Can_Bo_Sung' },
        { text: 'Chờ ký giấy', value: 'Cho_Ky_Giay' },
        { text: 'Hoàn tất', value: 'Hoan_Tat' },
      ],
      onFilter: (value, record) => record.trang_thai === value,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewDetail(record)}
        >
          Xử lý
        </Button>
      ),
    },
  ];

  return (
    <Card 
      title="Quản Lý Yêu Cầu Chuyển Đảng"
      extra={
        <Button type="primary" onClick={() => navigate('/chuyen-dang/huong-dan')}>
          Cấu hình Hướng dẫn
        </Button>
      }
    >
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
      />

      <Modal
        title="Xử lý hồ sơ chuyển Đảng"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Đảng viên">{selectedRecord.ho_ten}</Descriptions.Item>
              <Descriptions.Item label="Số ĐT">{selectedRecord.so_dien_thoai}</Descriptions.Item>
              <Descriptions.Item label="Loại chuyển">{selectedRecord.loai_chuyen}</Descriptions.Item>
              <Descriptions.Item label="Nơi chuyển đến">{selectedRecord.noi_chuyen_den}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái hiện tại" span={2}>
                {getStatusTag(selectedRecord.trang_thai)}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="Tài liệu đính kèm" style={{ marginBottom: 16 }}>
              <List
                itemLayout="horizontal"
                dataSource={selectedRecord.documents || []}
                renderItem={(doc) => (
                  <List.Item
                    actions={[
                      <a href={doc.file_url} download={doc.ten_tai_lieu}><DownloadOutlined /> Tải xuống</a>,
                      <Select 
                        value={doc.trang_thai_tai_lieu} 
                        style={{ width: 120 }}
                        onChange={(val) => handleReviewDoc(doc.id, val)}
                      >
                        <Option value="Cho_Duyet">Chờ duyệt</Option>
                        <Option value="Hop_Le">Hợp lệ</Option>
                        <Option value="Khong_Hop_Le">Không hợp lệ</Option>
                      </Select>
                    ]}
                  >
                    <List.Item.Meta
                      title={doc.ten_tai_lieu}
                      description={<Tag color={doc.trang_thai_tai_lieu === 'Hop_Le' ? 'success' : doc.trang_thai_tai_lieu === 'Khong_Hop_Le' ? 'error' : 'default'}>{doc.trang_thai_tai_lieu}</Tag>}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card size="small" title="Cập nhật tiến độ" style={{ background: '#f5f5f5' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Chuyển trạng thái sang:</Text>
                  <Select 
                    value={newStatus} 
                    onChange={setNewStatus}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="Da_Gui">Đã gửi</Option>
                    <Option value="Dang_Tham_Dinh">Đang thẩm định</Option>
                    <Option value="Can_Bo_Sung">Cần bổ sung</Option>
                    <Option value="Cho_Ky_Giay">Chờ ký giấy</Option>
                    <Option value="Hoan_Tat">Hoàn tất</Option>
                    <Option value="Da_Huy">Đã hủy</Option>
                  </Select>
                </div>
                <div>
                  <Text strong>Ghi chú phản hồi (Nếu cần bổ sung/hủy):</Text>
                  <TextArea 
                    rows={3} 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{ marginTop: 8 }}
                    placeholder="VD: Cần bổ sung bản tự kiểm điểm có chữ ký..."
                  />
                </div>
                <Button type="primary" onClick={handleUpdateStatus} style={{ marginTop: 8 }}>
                  Lưu Trạng Thái & Ghi Log
                </Button>
              </Space>
            </Card>

            <div style={{ marginTop: 16 }}>
              <TransferTimeline logs={selectedRecord.logs} />
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default TransferManagement;
