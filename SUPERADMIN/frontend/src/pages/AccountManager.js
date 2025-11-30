import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Select, Tag, message, Space, Popconfirm, Tooltip 
} from 'antd';
import { 
  UserAddOutlined, KeyOutlined, LockOutlined, UnlockOutlined 
} from '@ant-design/icons';
import axios from '../services/axiosConfig';

const AccountManager = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form] = Form.useForm();
  const [passForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsers, resBranches] = await Promise.all([
        axios.get('/members'),
        axios.get('/branches')
      ]);
      setUsers(resUsers.data.data);
      setBranches(resBranches.data);
    } catch (error) { message.error('Lỗi tải dữ liệu'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showModal = () => { form.resetFields(); setIsModalOpen(true); };
  
  const showPassModal = (user) => {
    setSelectedUser(user);
    passForm.resetFields();
    setIsPassModalOpen(true);
  };

  const handleCreate = async (values) => {
    try {
      await axios.post('/auth/register', values);
      message.success('Cấp tài khoản thành công!');
      setIsModalOpen(false);
      fetchData();
    } catch (error) { message.error(error.response?.data?.message || 'Tạo thất bại'); }
  };

  const handleResetPassword = async (values) => {
    try {
      await axios.put(`/auth/reset-password/${selectedUser.ma_dang_vien}`, {
        new_password: values.new_password
      });
      message.success(`Đã đổi mật khẩu cho ${selectedUser.ho_ten}`);
      setIsPassModalOpen(false);
    } catch (error) { message.error('Đổi mật khẩu thất bại'); }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.put(`/auth/toggle-status/${id}`);
      message.success(response.data.message);
      
      // Cập nhật State ngay lập tức để giao diện đổi màu
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.ma_dang_vien === id) {
          return { ...user, hoat_dong: response.data.status };
        }
        return user;
      }));
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi thay đổi trạng thái');
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'ho_ten', render: t => <b>{t}</b> },
    { title: 'Tài khoản', dataIndex: 'ten_dang_nhap', copyable: true },
    { title: 'Chi bộ', dataIndex: 'ten_chi_bo', render: t => <Tag color="blue">{t || 'Chưa phân loại'}</Tag> },
    { title: 'Quyền', dataIndex: 'cap_quyen', align: 'center', render: r => r===1?<Tag color="red">Admin</Tag>:(r===2?<Tag color="orange">Chi ủy</Tag>:<Tag color="green">Đảng viên</Tag>) },
    {
      title: 'Trạng thái', dataIndex: 'hoat_dong', align: 'center',
      render: (active) => (active !== false ? <Tag color="success">Hoạt động</Tag> : <Tag color="default">Đã khóa</Tag>)
    },
    {
      title: 'Thao tác', key: 'action', align: 'center',
      render: (_, record) => {
        // Logic xác định trạng thái hiện tại (Null hoặc True đều là Active)
        const isActive = record.hoat_dong !== false;

        return (
          <Space>
            <Tooltip title="Cấp lại mật khẩu"><Button icon={<KeyOutlined />} onClick={() => showPassModal(record)} /></Tooltip>
            
            <Popconfirm
              // Nếu đang Active -> Hỏi Khóa? Ngược lại -> Hỏi Mở?
              title={isActive ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?"}
              description={isActive ? "Người dùng sẽ không thể đăng nhập được nữa." : "Người dùng sẽ có thể đăng nhập lại bình thường."}
              onConfirm={() => handleToggleStatus(record.ma_dang_vien)}
              okText={isActive ? "Khóa ngay" : "Mở khóa"}
              cancelText="Hủy"
              okButtonProps={{ danger: isActive }}
            >
              <Tooltip title={isActive ? "Khóa tài khoản" : "Mở khóa"}>
                <Button 
                  danger={isActive} 
                  type={isActive ? 'default' : 'primary'}
                  icon={isActive ? <LockOutlined /> : <UnlockOutlined />} 
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Card title="Quản lý Tài khoản & Đảng viên" extra={<Button type="primary" icon={<UserAddOutlined />} onClick={showModal}>Cấp tài khoản</Button>}>
        <Table columns={columns} dataSource={users} rowKey="ma_dang_vien" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      <Modal title="Cấp tài khoản mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnClose={true}>
        <Form form={form} layout="vertical" onFinish={handleCreate} autoComplete="off">
          <Form.Item name="ho_ten" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên!' }]}><Input placeholder="Nguyễn Văn A" autoComplete="off" /></Form.Item>
          <Form.Item name="ten_dang_nhap" label="Username" rules={[{ required: true, message: 'Nhập username!' }]}><Input placeholder="username" autoComplete="new-username" /></Form.Item>
          <Form.Item name="mat_khau" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}><Input.Password placeholder="******" autoComplete="new-password" /></Form.Item>
          <Form.Item name="ma_chi_bo" label="Chi bộ" rules={[{ required: true, message: 'Chọn chi bộ!' }]}>
            <Select placeholder="Chọn chi bộ">{branches.map(b => <Select.Option key={b.ma_chi_bo} value={b.ma_chi_bo}>{b.ten_chi_bo}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="cap_quyen" label="Quyền hạn" initialValue={3}>
            <Select><Select.Option value={3}>Đảng viên (Cấp 3)</Select.Option><Select.Option value={2}>Bí thư/Chi ủy (Cấp 2)</Select.Option><Select.Option value={1}>Admin (Cấp 1)</Select.Option></Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">Xác nhận tạo</Button>
        </Form>
      </Modal>

      <Modal title={`Đổi mật khẩu cho: ${selectedUser?.ho_ten}`} open={isPassModalOpen} onCancel={() => setIsPassModalOpen(false)} footer={null} destroyOnClose={true}>
        <Form form={passForm} layout="vertical" onFinish={handleResetPassword}>
            <Form.Item name="new_password" label="Mật khẩu mới" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}><Input.Password placeholder="Nhập mật khẩu mới" /></Form.Item>
            <Button type="primary" htmlType="submit" block danger>Cập nhật mật khẩu</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManager;