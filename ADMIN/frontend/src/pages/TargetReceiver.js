import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  Progress, 
  Button, 
  Modal, 
  Form, 
  InputNumber, 
  Select, 
  message, 
  Tooltip,
  Input,
  Typography,
  Space,
  Empty
} from 'antd';
import { 
  EditOutlined, 
  CloudUploadOutlined, 
  InfoCircleOutlined,
  AimOutlined
} from '@ant-design/icons';
import targetService from '../services/targetService';

const { Title, Text } = Typography;
const { Option } = Select;

const TargetReceiver = () => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [form] = Form.useForm();

  // Load danh sách chỉ tiêu
  const fetchTargets = async () => {
    setLoading(true);
    try {
      const data = await targetService.getAssignedTargets();
      setTargets(data);
    } catch (error) {
      message.error('Không thể tải danh sách chỉ tiêu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  // Mở modal cập nhật tiến độ
  const handleEdit = (record) => {
    setEditingTarget(record);
    form.setFieldsValue({
      so_luong_dat_duoc: record.so_luong_dat_duoc,
      trang_thai: record.trang_thai,
      minh_chung_url: record.minh_chung_url
    });
    setIsModalOpen(true);
  };

  // Lưu cập nhật
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await targetService.updateProgress(editingTarget.ma_chi_tieu, values);
      message.success('Cập nhật tiến độ thành công');
      setIsModalOpen(false);
      fetchTargets();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi lưu dữ liệu');
    }
  };

  const columns = [
    {
      title: 'Tên Chỉ Tiêu',
      dataIndex: 'ten_chi_tieu',
      key: 'ten_chi_tieu',
      render: (text) => <Text strong style={{ color: '#003a8c' }}>{text}</Text>,
    },
    {
      title: 'Năm học',
      dataIndex: 'nam_hoc',
      key: 'nam_hoc',
      width: 120,
    },
    {
      title: 'Mục tiêu',
      dataIndex: 'so_luong_muc_tieu',
      key: 'so_luong_muc_tieu',
      align: 'center',
    },
    {
      title: 'Kết quả',
      dataIndex: 'so_luong_dat_duoc',
      key: 'so_luong_dat_duoc',
      align: 'center',
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      width: 250,
      render: (_, record) => {
        const percent = Math.min(Math.round((record.so_luong_dat_duoc / record.so_luong_muc_tieu) * 100), 100);
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Progress 
                percent={percent} 
                size="small" 
                status={percent >= 100 ? "success" : "active"}
                strokeColor={percent >= 100 ? '#52c41a' : '#1890ff'}
            />
          </Space>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      key: 'trang_thai',
      render: (status) => {
        const map = {
            'Dang thuc hien': { label: 'Đang thực hiện', color: 'blue' },
            'Hoan thanh': { label: 'Hoàn thành', color: 'green' },
            'Hoàn thành': { label: 'Hoàn thành', color: 'green' },
            'Chua hoan thanh': { label: 'Chưa hoàn thành', color: 'red' },
            'Tam dung': { label: 'Tạm dừng', color: 'gray' },
        };
        const cfg = map[status] || { label: status, color: 'default' };
        return <Tag color={cfg.color} style={{ fontWeight: '600' }}>{cfg.label}</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Cập nhật tiến độ">
          <Button 
            type="primary" 
            shape="circle" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={{ backgroundColor: '#003a8c' }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Card style={{ 
          marginBottom: 24, 
          borderRadius: 16, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
          border: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
              width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AimOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <div>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>Chỉ tiêu Công tác</Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Quản lý và báo cáo tiến độ chỉ tiêu được Đảng bộ giao</Text>
          </div>
        </div>
      </Card>

      <Table 
        columns={columns} 
        dataSource={targets} 
        rowKey="ma_chi_tieu" 
        loading={loading}
        locale={{ emptyText: <Empty description="Chưa có chỉ tiêu nào được giao" /> }}
        style={{ 
            background: '#fff', 
            borderRadius: 12, 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      />

      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Cập nhật tiến độ: {editingTarget?.ten_chi_tieu}</span>
          </Space>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Cập nhật"
        cancelText="Hủy"
        width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item 
            label="Số lượng đã đạt được" 
            name="so_luong_dat_duoc" 
            rules={[{ required: true, message: 'Vui lòng nhập số lượng đạt được' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Trạng thái" name="trang_thai" initialValue="Dang thuc hien">
            <Select>
              <Option value="Dang thuc hien">Đang thực hiện</Option>
              <Option value="Hoan thanh">Hoàn thành</Option>
              <Option value="Chua hoan thanh">Chưa hoàn thành</Option>
              <Option value="Tam dung">Tạm dừng</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Link minh chứng (Ảnh/PDF)" name="minh_chung_url">
            <Input prefix={<CloudUploadOutlined />} placeholder="Nhập URL tài liệu hoặc ảnh minh chứng" />
          </Form.Item>
          
          <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <InfoCircleOutlined /> Lưu ý: Bạn có thể cập nhật kết quả từng phần. Tiến độ % sẽ tự động tính dựa trên Mục tiêu mà Đảng bộ đã đề ra.
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TargetReceiver;
