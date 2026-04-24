import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, message, Space, Popconfirm, Tooltip, Row, Col } from 'antd';
import { UserAddOutlined, KeyOutlined, LockOutlined, UnlockOutlined, SearchOutlined, TeamOutlined, EditOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../services/axiosConfig';

// Palette màu cho các chi bộ
const BRANCH_COLORS = [
  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
  { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  { bg: '#fefce8', text: '#a16207', border: '#fef08a' },
  { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
  { bg: '#faf5ff', text: '#6d28d9', border: '#ddd6fe' },
];

const CHUC_VU_OPTIONS = [
  { value: 'Bi thu chi bo', label: 'Bí thư Chi bộ' },
  { value: 'Pho bi thu chi bo', label: 'Phó Bí thư Chi bộ' },
  { value: 'Chi uy vien', label: 'Chi ủy viên' },
];

const QUYEN_LABEL = { 1: 'SuperAdmin', 2: 'Chi ủy', 3: 'Đảng viên' };
const QUYEN_COLOR = { 1: 'red', 2: 'orange', 3: 'green' };

const AccountManager = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Map branchId → màu index (ổn định qua các lần render)
  const branchColorMapRef = useRef({});

  const [searchText, setSearchText] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal: Cấp tài khoản mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Modal: Đổi mật khẩu
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  // Modal: Cập nhật quyền
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null); // giá trị cap_quyen đang chọn trong modal

  const [form] = Form.useForm();
  const [passForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  // Lấy màu cố định cho chi bộ dựa theo hash của Tên chi bộ (deterministic)
  const getBranchColor = (tenChiBo) => {
    if (!tenChiBo) return BRANCH_COLORS[0];
    let hash = 0;
    for (let i = 0; i < tenChiBo.length; i++) {
      hash = tenChiBo.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % BRANCH_COLORS.length;
    return BRANCH_COLORS[idx];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/members?';
      if (searchText) url += `search=${encodeURIComponent(searchText)}&`;
      if (branchFilter) url += `branch=${branchFilter}&`;
      if (roleFilter) url += `permission=${roleFilter}&`;
      if (statusFilter !== '') url += `status=${statusFilter}`;

      const [resUsers, resBranches] = await Promise.all([
        axios.get(url),
        axios.get('/branches')
      ]);
      setUsers(resUsers.data.data || []);
      setBranches(resBranches.data || []);
    } catch (error) { message.error('Lỗi tải dữ liệu'); } 
    finally { setLoading(false); }
  };

  // Initial fetch + debounced filter fetch khi filter thay đổi
  useEffect(() => { 
    const delay = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(delay);
  }, [searchText, branchFilter, roleFilter, statusFilter]);

  // Auto sync ngầm mỗi 5 giây (Silent polling) để cập nhật dữ liệu từ Admin
  // (Vì không dùng setLoading(true) phía trong nên UI KHÔNG bị nháy/flash loading, rất mượt)
  useEffect(() => {
    const silentFetch = async () => {
      try {
        let url = '/members?';
        if (searchText) url += `search=${encodeURIComponent(searchText)}&`;
        if (branchFilter) url += `branch=${branchFilter}&`;
        if (roleFilter) url += `permission=${roleFilter}&`;
        if (statusFilter !== '') url += `status=${statusFilter}`;
  
        const [resUsers, resBranches] = await Promise.all([
          axios.get(url),
          axios.get('/branches')
        ]);
        setUsers(resUsers.data.data || []);
        if (resBranches.data) setBranches(resBranches.data);
      } catch (error) {}
    };

    const interval = setInterval(silentFetch, 5000);
    return () => clearInterval(interval);
  }, [searchText, branchFilter, roleFilter, statusFilter]);

  const showModal = () => { form.resetFields(); setIsModalOpen(true); };
  
  const showPassModal = (user) => {
    setSelectedUser(user);
    passForm.resetFields();
    setIsPassModalOpen(true);
  };

  const showRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.cap_quyen);
    roleForm.setFieldsValue({
      cap_quyen: user.cap_quyen,
      chuc_vu_dang: user.chuc_vu_dang || undefined
    });
    setIsRoleModalOpen(true);
  };

  const handleCreate = async (values) => {
    try {
      await axios.post('/auth/register', values);
      message.success('Cấp tài khoản thành công!');
      form.resetFields();
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
      passForm.resetFields();
      setIsPassModalOpen(false);
    } catch (error) { message.error('Đổi mật khẩu thất bại'); }
  };

  const handleUpdateRole = async (values) => {
    try {
      const res = await axios.put(`/auth/update-role/${selectedUser.ma_dang_vien}`, values);
      message.success(res.data.message);
      // Cập nhật local state ngay lập tức
      setUsers(prev => prev.map(u =>
        u.ma_dang_vien === selectedUser.ma_dang_vien
          ? { ...u, cap_quyen: res.data.cap_quyen, chuc_vu_dang: res.data.chuc_vu_dang }
          : u
      ));
      roleForm.resetFields();
      setIsRoleModalOpen(false);
    } catch (error) { message.error(error.response?.data?.message || 'Lỗi cập nhật quyền'); }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.put(`/auth/toggle-status/${id}`);
      message.success(response.data.message);
      // Cập nhật local state - ghi vào hoat_dong (source of truth)
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

  // Đọc từ cột hoat_dong (boolean DB) - đây là source of truth
  // trang_thai_dang_vien là string mô tả đảng tịch, không phải trạng thái khóa
  const isActiveStatus = (record) => {
    // Ưu tiên hoat_dong (boolean) — Admin và SuperAdmin đều ghi vào cột này
    if (record.hoat_dong !== undefined && record.hoat_dong !== null) {
      return record.hoat_dong !== false && record.hoat_dong !== 'false';
    }
    // Fallback
    const s = record.trang_thai_dang_vien;
    return !(s === false || s === 'false' || s === 'Đã khóa' || s === 0);
  };

  const columns = [
    { 
      title: 'Họ tên', dataIndex: 'ho_ten', 
      render: t => <span className="font-semibold text-gray-800">{t}</span> 
    },
    { title: 'Tài khoản', dataIndex: 'ten_dang_nhap', width: 140 },
    { 
      title: 'Chi bộ', dataIndex: 'ten_chi_bo', width: 220,
      render: (t, record) => {
        const color = getBranchColor(record.ten_chi_bo);
        return (
          <span style={{
            display: 'inline-block',
            background: color.bg,
            color: color.text,
            border: `1px solid ${color.border}`,
            borderRadius: 8,
            padding: '3px 10px',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: '1.6',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}>
            {t || 'Chưa phân loại'}
          </span>
        );
      }
    },
    { 
      title: 'Quyền', dataIndex: 'cap_quyen', align: 'center', width: 110,
      render: r => <Tag color={QUYEN_COLOR[r] || 'default'} style={{ borderRadius: 6 }}>{QUYEN_LABEL[r] || `Cấp ${r}`}</Tag>
    },
    {
      title: 'Chức vụ Đảng', dataIndex: 'chuc_vu_dang', width: 155,
      render: (cv) => {
        const map = {
          'Bi thu chi bo':      { label: 'Bí thư',       bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
          'Pho bi thu chi bo':  { label: 'Phó Bí thư',   bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
          'Chi uy vien':        { label: 'Chi ủy viên',  bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
          'Dang vien':          { label: 'Đảng viên',    bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
        };
        const cfg = map[cv] || { label: cv || 'Đảng viên', bg: '#f9fafb', text: '#374151', border: '#e5e7eb' };
        return (
          <span style={{ display: 'inline-block', background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: 7, padding: '2px 9px', fontSize: 12, fontWeight: 600 }}>
            {cfg.label}
          </span>
        );
      }
    },
    {
      title: 'Trạng thái', key: 'trang_thai', align: 'center', width: 145,
      render: (_, record) => {
        const active = isActiveStatus(record);
        return active
          ? <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>● Hoạt động</span>
          : <span style={{ display: 'inline-block', background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>○ Đã khóa</span>;
      }
    },
    {
      title: 'Thao tác', key: 'action', align: 'center', width: 150,
      render: (_, record) => {
        const active = isActiveStatus(record);
        return (
          <Space>
            <Tooltip title="Cập nhật quyền">
              <Button 
                icon={<EditOutlined />} 
                onClick={() => showRoleModal(record)} 
                className="text-purple-600 bg-purple-50 border-0 hover:bg-purple-100"
                size="small"
              />
            </Tooltip>
            <Tooltip title="Cấp lại mật khẩu">
              <Button icon={<KeyOutlined />} onClick={() => showPassModal(record)} className="text-blue-600 bg-blue-50 border-0 hover:bg-blue-100" size="small" />
            </Tooltip>
            
            <Popconfirm
              title={active ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?"}
              description={active ? "Người dùng sẽ không thể đăng nhập được." : "Người dùng sẽ có thể đăng nhập bình thường."}
              onConfirm={() => handleToggleStatus(record.ma_dang_vien)}
              okText={active ? "Khóa ngay" : "Mở khóa"}
              cancelText="Hủy"
              okButtonProps={{ danger: active }}
            >
              <Tooltip title={active ? "Khóa tài khoản" : "Mở khóa"}>
                <Button 
                  danger={active} 
                  size="small"
                  style={{ borderWidth: 0 }}
                  className={active ? "bg-red-50 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}
                  icon={active ? <LockOutlined /> : <UnlockOutlined />} 
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-['Be_Vietnam_Pro'] pb-8">
      <Card 
        className="rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        variant="borderless"
        title={<span className="text-xl font-bold text-gray-800"><TeamOutlined className="mr-2" /> Quản lý Tài khoản & Đảng viên</span>} 
        extra={
          <Button type="primary" icon={<UserAddOutlined />} onClick={showModal} className="h-10 px-4 rounded-xl font-medium bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Cấp tài khoản</Button>
        }
      >
        {/* ===== BỘ LỌC ===== */}
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={12} lg={6}>
              <Input 
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} 
                placeholder="Tìm kiếm họ tên..." 
                style={{ height: 40, borderRadius: 8 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select 
                placeholder="Tất cả Chi bộ" 
                style={{ height: 40, width: '100%' }}
                value={branchFilter || undefined}
                onChange={val => setBranchFilter(val || '')}
                allowClear
                popupMatchSelectWidth={false}
                styles={{ popup: { root: { minWidth: 280 } } }}
              >
                {branches.map(b => (
                  <Select.Option key={b.ma_chi_bo} value={b.ma_chi_bo}>
                    {b.ten_chi_bo}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select 
                placeholder="Tất cả Quyền" 
                style={{ height: 40, width: '100%' }}
                value={roleFilter || undefined}
                onChange={val => setRoleFilter(val || '')}
                allowClear
              >
                <Select.Option value="1">SuperAdmin (Cấp 1)</Select.Option>
                <Select.Option value="2">Chi ủy / Bí thư (Cấp 2)</Select.Option>
                <Select.Option value="3">Đảng viên (Cấp 3)</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Select 
                placeholder="Tất cả Trạng thái" 
                style={{ height: 40, width: '100%' }}
                value={statusFilter || undefined}
                onChange={val => setStatusFilter(val || '')}
                allowClear
              >
                <Select.Option value="true">Đang hoạt động</Select.Option>
                <Select.Option value="false">Đã khóa</Select.Option>
              </Select>
            </Col>
          </Row>
        </div>

        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="ma_dang_vien" 
          loading={loading} 
          pagination={{ pageSize: 8 }} 
          className="border-t border-gray-100"
          rowClassName="hover:bg-gray-50 transition-colors"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* ===== MODAL: CẤP TÀI KHOẢN ===== */}
      <Modal 
        title={<span className="text-lg font-bold">Cấp tài khoản mới</span>} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        destroyOnHidden={true} 
        className="rounded-2xl overflow-hidden font-['Be_Vietnam_Pro']"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} autoComplete="off" className="mt-4">
          <Form.Item name="ho_ten" label={<span className="font-semibold">Họ tên</span>} rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input size="large" className="rounded-lg" placeholder="Nguyễn Văn A" autoComplete="off" />
          </Form.Item>
          <Form.Item name="ten_dang_nhap" label={<span className="font-semibold">Tên đăng nhập</span>} rules={[{ required: true, message: 'Nhập username!' }]}>
            <Input size="large" className="rounded-lg" placeholder="username" autoComplete="new-username" />
          </Form.Item>
          <Form.Item name="mat_khau" label={<span className="font-semibold">Mật khẩu</span>} rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
            <Input.Password size="large" className="rounded-lg" placeholder="******" autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="ma_chi_bo" label={<span className="font-semibold">Chi bộ</span>} rules={[{ required: true, message: 'Chọn chi bộ!' }]}>
            <Select size="large" className="rounded-lg" placeholder="Chọn chi bộ" popupMatchSelectWidth={false} styles={{ popup: { root: { minWidth: 280 } } }}>
              {branches.map(b => <Select.Option key={b.ma_chi_bo} value={b.ma_chi_bo}>{b.ten_chi_bo}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="cap_quyen" label={<span className="font-semibold">Quyền hạn</span>} initialValue={3}>
            <Select size="large" className="rounded-lg">
              <Select.Option value={3}>Đảng viên (Cấp 3)</Select.Option>
              <Select.Option value={2}>Bí thư / Chi ủy (Cấp 2)</Select.Option>
              <Select.Option value={1}>Admin (Cấp 1)</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" className="rounded-xl h-12 font-bold text-base bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200 mt-4">Xác nhận tạo</Button>
        </Form>
      </Modal>

      {/* ===== MODAL: ĐỔI MẬT KHẨU ===== */}
      <Modal 
        title={<span className="text-lg font-bold">Đổi mật khẩu: <span className="text-red-600">{selectedUser?.ho_ten}</span></span>} 
        open={isPassModalOpen} 
        onCancel={() => setIsPassModalOpen(false)} 
        footer={null} 
        destroyOnHidden={true} 
        className="rounded-2xl overflow-hidden font-['Be_Vietnam_Pro']"
      >
        <Form form={passForm} layout="vertical" onFinish={handleResetPassword} className="mt-4">
          <Form.Item name="new_password" label={<span className="font-semibold">Mật khẩu mới</span>} rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}>
            <Input.Password size="large" className="rounded-lg" placeholder="Nhập mật khẩu mới" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block danger size="large" className="rounded-xl h-12 font-bold text-base mt-2">Cập nhật mật khẩu</Button>
        </Form>
      </Modal>

      {/* ===== MODAL: CẬP NHẬT QUYỀN ===== */}
      <Modal 
        title={
          <div>
            <span className="text-lg font-bold">Cập nhật Quyền & Chức vụ</span>
            <div className="text-sm font-normal text-gray-500 mt-0.5">{selectedUser?.ho_ten}</div>
          </div>
        }
        open={isRoleModalOpen} 
        onCancel={() => setIsRoleModalOpen(false)} 
        footer={null} 
        destroyOnHidden={true} 
        className="rounded-2xl overflow-hidden font-['Be_Vietnam_Pro']"
      >
        <Form form={roleForm} layout="vertical" onFinish={handleUpdateRole} className="mt-4">
          <Form.Item name="cap_quyen" label={<span className="font-semibold">Quyền hạn</span>} rules={[{ required: true }]}>
            <Select 
              size="large" 
              className="rounded-lg"
              onChange={(val) => {
                setSelectedRole(val);
                // Nếu chọn cấp 3, reset chức vụ
                if (val === 3) roleForm.setFieldsValue({ chuc_vu_dang: undefined });
              }}
            >
              <Select.Option value={3}>Đảng viên (Cấp 3)</Select.Option>
              <Select.Option value={2}>Bí thư / Chi ủy (Cấp 2)</Select.Option>
            </Select>
          </Form.Item>

          {/* Chỉ hiển thị chức vụ khi cấp 2 */}
          {selectedRole === 2 && (
            <Form.Item 
              name="chuc_vu_dang" 
              label={<span className="font-semibold">Chức vụ trong Chi ủy</span>}
              rules={[{ required: true, message: 'Vui lòng chọn chức vụ!' }]}
            >
              <Select size="large" className="rounded-lg" placeholder="Chọn chức vụ">
                {CHUC_VU_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-700">
            <strong>Lưu ý:</strong> Nếu đổi về Cấp 3, chức vụ sẽ tự động được đặt lại thành <strong>Đảng viên</strong>.
          </div>

          <Button type="primary" htmlType="submit" block size="large" className="rounded-xl h-12 font-bold text-base bg-purple-600 hover:bg-purple-700 border-0">
            Xác nhận cập nhật
          </Button>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default AccountManager;