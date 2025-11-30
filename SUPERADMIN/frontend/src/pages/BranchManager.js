import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, message, Popconfirm, Tag, Tooltip, Space 
} from 'antd';
import { 
  PlusOutlined, StopOutlined, BankOutlined, InfoCircleOutlined, EditOutlined 
} from '@ant-design/icons';
// Import axios đã cấu hình token
import axios from '../services/axiosConfig';

const BranchManager = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State cho Modal (Dùng chung cho Thêm và Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null); 
  const [form] = Form.useForm();

  // 1. Hàm lấy danh sách từ API
  const fetchBranches = async () => {
    setLoading(true);
    try {
      // Gọi endpoint /branches (baseURL đã là /api)
      const res = await axios.get('/branches');
      setBranches(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách chi bộ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // 2. Mở Modal
  const openModal = (record = null) => {
    setEditingBranch(record);
    if (record) {
      // Chế độ Sửa: Fill dữ liệu cũ vào form
      form.setFieldsValue({
        ten_chi_bo: record.ten_chi_bo,
        mo_ta: record.mo_ta
      });
    } else {
      // Chế độ Thêm: Reset form
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 3. Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async (values) => {
    try {
      if (editingBranch) {
        // --- GỌI API SỬA ---
        await axios.put(`/branches/${editingBranch.ma_chi_bo}`, values);
        message.success('Cập nhật thông tin thành công!');
      } else {
        // --- GỌI API THÊM ---
        await axios.post('/branches', values);
        message.success('Thêm chi bộ thành công!');
      }
      
      // Đóng modal và load lại
      setIsModalOpen(false);
      fetchBranches();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi hệ thống';
      message.error(errorMsg);
    }
  };

  // 4. Xử lý Ẩn/Giải thể
  const handleArchive = async (id) => {
    try {
      await axios.put(`/branches/${id}/archive`);
      message.success('Đã chuyển trạng thái sang giải thể');
      fetchBranches();
    } catch (error) {
      message.error('Thao tác thất bại');
    }
  };

  // Cấu hình bảng
  const columns = [
    {
      title: 'Mã số',
      dataIndex: 'ma_chi_bo',
      key: 'ma_chi_bo',
      width: 80,
      align: 'center',
    },
    {
      title: 'Tên Chi bộ',
      dataIndex: 'ten_chi_bo',
      key: 'ten_chi_bo',
      render: (text) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{text}</span>,
    },
    {
      title: 'Mô tả / Nhiệm vụ',
      dataIndex: 'mo_ta',
      key: 'mo_ta',
    },
    {
      title: 'Ngày thành lập',
      dataIndex: 'ngay_thanh_lap',
      key: 'ngay_thanh_lap',
      render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      align: 'center',
      render: (active) => (
        active 
          ? <Tag color="success">Đang hoạt động</Tag> 
          : <Tag color="default">Đã giải thể</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space>
          {/* Nút Sửa: Chỉ hiện khi còn hoạt động */}
          {record.trang_thai && (
            <Tooltip title="Chỉnh sửa">
              <Button 
                type="text" 
                icon={<EditOutlined style={{ color: '#faad14' }} />} 
                onClick={() => openModal(record)}
              />
            </Tooltip>
          )}

          {/* Nút Dừng hoạt động */}
          {record.trang_thai ? (
            <Popconfirm
              title="Giải thể chi bộ này?"
              description="Chi bộ sẽ chuyển sang trạng thái lưu trữ."
              onConfirm={() => handleArchive(record.ma_chi_bo)}
              okText="Đồng ý"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Dừng hoạt động">
                <Button type="text" danger icon={<StopOutlined />}>
                  Dừng
                </Button>
              </Tooltip>
            </Popconfirm>
          ) : (
            <span style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>Đã lưu trữ</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Card 
        title={<span><BankOutlined /> Quản lý Danh sách Chi bộ</span>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>
            Thêm Chi bộ mới
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={branches} 
          rowKey="ma_chi_bo"
          loading={loading}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      {/* Modal dùng chung */}
      <Modal
        title={editingBranch ? "Chỉnh sửa thông tin" : "Thêm Chi bộ mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item 
            name="ten_chi_bo" 
            label="Tên Chi bộ" 
            rules={[{ required: true, message: 'Vui lòng nhập tên chi bộ!' }]}
          >
            <Input prefix={<BankOutlined />} placeholder="Ví dụ: Chi bộ Sinh viên 1" />
          </Form.Item>

          <Form.Item 
            name="mo_ta" 
            label="Mô tả chức năng nhiệm vụ"
          >
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn..." />
          </Form.Item>

          {!editingBranch && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, color: '#888' }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              <span>Ngày thành lập: Hôm nay (Tự động)</span>
            </div>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              {editingBranch ? "Lưu thay đổi" : "Xác nhận thêm"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BranchManager;