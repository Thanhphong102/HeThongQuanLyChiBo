import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, message, Tooltip, Space, Popconfirm } from 'antd';
import { UserSwitchOutlined, KeyOutlined, LockOutlined, UnlockOutlined, SearchOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';

const MemberAccountManager = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Modal Cấp TK
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Modal Reset Pass
  const [isPassOpen, setIsPassOpen] = useState(false);

  const [formGrant] = Form.useForm();
  const [formPass] = Form.useForm();

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách (dùng chung API cũ cũng được)
      const res = await axios.get('/branch-members', { params: { pageSize: 100, search: searchText } });
      setMembers(res.data.data);
    } catch (error) { message.error('Lỗi tải dữ liệu'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [searchText]);

  // --- XỬ LÝ CẤP TÀI KHOẢN ---
  const handleGrantAccount = async (values) => {
    try {
      await axios.put(`/branch-members/${selectedMember.ma_dang_vien}/grant-account`, values);
      message.success(`Đã cấp tài khoản cho ${selectedMember.ho_ten}`);
      setIsGrantOpen(false);
      fetchMembers();
    } catch (error) { message.error(error.response?.data?.message || 'Lỗi'); }
  };

  // --- XỬ LÝ ĐỔI PASS ---
  const handleResetPassword = async (values) => {
    try {
      await axios.put(`/branch-members/${selectedMember.ma_dang_vien}/password`, values);
      message.success('Đã đổi mật khẩu');
      setIsPassOpen(false);
    } catch (error) { message.error('Lỗi'); }
  };

  // --- XỬ LÝ KHÓA ---
  const handleToggleStatus = async (id) => {
    try {
        await axios.put(`/branch-members/${id}/status`);
        message.success('Đã thay đổi trạng thái');
        fetchMembers(); // Load lại để cập nhật UI
    } catch (error) { message.error('Lỗi'); }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'ho_ten', render: t => <b>{t}</b> },
    { 
        title: 'Tài khoản (Username)', 
        dataIndex: 'ten_dang_nhap',
        render: (u) => u ? <Tag color="blue">{u}</Tag> : <Tag color="default">Chưa có</Tag>
    },
    { 
        title: 'Trạng thái', 
        render: (_, r) => {
            if (!r.ten_dang_nhap) return <Tag>Chưa kích hoạt</Tag>;
            return r.hoat_dong ? <Tag color="success">Hoạt động</Tag> : <Tag color="error">Đã khóa</Tag>;
        }
    },
    {
      title: 'Hành động', key: 'action', align: 'center',
      render: (_, record) => {
        // Nếu CHƯA CÓ tài khoản -> Hiện nút Cấp
        if (!record.ten_dang_nhap) {
            return (
                <Button type="primary" size="small" icon={<UserSwitchOutlined />} onClick={() => {
                    setSelectedMember(record);
                    setIsGrantOpen(true);
                }}>Cấp Tài khoản</Button>
            );
        }

        // Nếu ĐÃ CÓ tài khoản -> Hiện nút Đổi pass / Khóa
        return (
            <Space>
                <Tooltip title="Đổi mật khẩu"><Button size="small" icon={<KeyOutlined />} onClick={() => { setSelectedMember(record); setIsPassOpen(true); }} /></Tooltip>
                <Popconfirm title="Khóa/Mở?" onConfirm={() => handleToggleStatus(record.ma_dang_vien)}>
                    <Button size="small" danger={record.hoat_dong} icon={record.hoat_dong ? <LockOutlined /> : <UnlockOutlined />} />
                </Popconfirm>
            </Space>
        );
      }
    }
  ];

  return (
    <Card title="Quản lý Tài khoản Đảng viên (Cấp 3)">
      <div style={{ marginBottom: 16 }}>
        <Input placeholder="Tìm tên..." prefix={<SearchOutlined />} style={{ width: 300 }} onChange={e => setSearchText(e.target.value)} />
      </div>
      <Table columns={columns} dataSource={members} rowKey="ma_dang_vien" loading={loading} />

      {/* MODAL CẤP TK */}
      <Modal title={`Cấp tài khoản cho: ${selectedMember?.ho_ten}`} open={isGrantOpen} onCancel={() => setIsGrantOpen(false)} footer={null}>
        <Form form={formGrant} layout="vertical" onFinish={handleGrantAccount} autoComplete="off">
            <Form.Item name="ten_dang_nhap" label="Username" rules={[{ required: true }]}><Input autoComplete="new-username" /></Form.Item>
            <Form.Item name="mat_khau" label="Password" rules={[{ required: true }]}><Input.Password autoComplete="new-password" /></Form.Item>
            <Button type="primary" htmlType="submit" block>Cấp tài khoản</Button>
        </Form>
      </Modal>

      {/* MODAL ĐỔI PASS */}
      <Modal title={`Đổi mật khẩu: ${selectedMember?.ho_ten}`} open={isPassOpen} onCancel={() => setIsPassOpen(false)} footer={null}>
        <Form form={formPass} layout="vertical" onFinish={handleResetPassword}>
            <Form.Item name="new_password" label="Mật khẩu mới" rules={[{ required: true }]}><Input.Password /></Form.Item>
            <Button type="primary" htmlType="submit" block danger>Lưu thay đổi</Button>
        </Form>
      </Modal>
    </Card>
  );
};

export default MemberAccountManager;