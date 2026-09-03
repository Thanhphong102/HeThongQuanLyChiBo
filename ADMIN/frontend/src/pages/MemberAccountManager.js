import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, message, Tooltip, Space,
  Popconfirm, Typography, Alert, Row, Col, Statistic, Divider, Select
} from 'antd';
import {
  UserSwitchOutlined, KeyOutlined, LockOutlined, UnlockOutlined,
  SearchOutlined, MailOutlined,
  CopyOutlined, InboxOutlined, RollbackOutlined
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import PageHeader from '../components/PageHeader';

const { Text } = Typography;

const COLOR_RED   = '#CE1126';
const COLOR_GREEN = '#22c55e';
const COLOR_BLUE  = '#3b82f6';

const MemberAccountManager = () => {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searchText, setSearchText] = useState('');
  const [archiveFilter, setArchiveFilter] = useState('false');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [archiving, setArchiving] = useState(false);

  // Modal Cấp TK
  const [isGrantOpen, setIsGrantOpen]     = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Modal kết quả Reset mật khẩu
  const [isResultOpen, setIsResultOpen]   = useState(false);
  const [resetResult, setResetResult]     = useState(null); // { matKhauTam, emailSent, note }
  const [resetting, setResetting]         = useState(null); // ID đang reset

  const [formGrant] = Form.useForm();

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/branch-members', {
        params: { pageSize: 100, search: searchText, archived: archiveFilter }
      });
      setMembers(res.data.data);
    } catch { message.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMembers(); }, [searchText, archiveFilter]);

  const handleArchive = async (memberIds, archived) => {
    setArchiving(true);
    try {
      const response = await axios.put('/branch-members/archive', { memberIds, archived });
      message.success(response.data.message);
      setSelectedRowKeys([]);
      fetchMembers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật tài khoản');
    } finally {
      setArchiving(false);
    }
  };

  // --- XỬ LÝ CẤP TÀI KHOẢN ---
  const handleGrantAccount = async (values) => {
    try {
      await axios.put(`/branch-members/${selectedMember.ma_dang_vien}/grant-account`, values);
      message.success(`Đã cấp tài khoản cho ${selectedMember.ho_ten}`);
      setIsGrantOpen(false);
      formGrant.resetFields();
      fetchMembers();
    } catch (error) { message.error(error.response?.data?.message || 'Lỗi cấp tài khoản'); }
  };

  // --- XỬ LÝ RESET MẬT KHẨU (TỰ ĐỘNG SINH) ---
  const handleResetPassword = async (record) => {
    setResetting(record.ma_dang_vien);
    try {
      const res = await axios.put(`/branch-members/${record.ma_dang_vien}/password`);
      setResetResult({
        hoTen: record.ho_ten,
        ...res.data
      });
      setIsResultOpen(true);
      fetchMembers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi cấp lại mật khẩu');
    } finally {
      setResetting(null);
    }
  };

  // --- XỬ LÝ KHÓA / MỞ KHÓA ---
  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`/branch-members/${id}/status`);
      message.success('Đã thay đổi trạng thái');
      fetchMembers();
    } catch { message.error('Lỗi thay đổi trạng thái'); }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => message.success('Đã copy mật khẩu!'));
  };

  const columns = [
    {
      title: 'Đảng viên',
      dataIndex: 'ho_ten',
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#111827' }}>{t}</div>
          {r.email && <div style={{ fontSize: 12, color: '#9ca3af' }}><MailOutlined /> {r.email}</div>}
        </div>
      )
    },
    {
      title: 'Tài khoản',
      dataIndex: 'ten_dang_nhap',
      render: (u) => u
        ? <Tag color="blue" style={{ borderRadius: 6, fontFamily: 'monospace' }}>{u}</Tag>
        : <Tag color="default" style={{ borderRadius: 6 }}>Chưa có</Tag>
    },
    {
      title: 'Trạng thái',
      key: 'trang_thai',
      render: (_, r) => {
        if (r.da_xoa) return <Tag color="gold" style={{ borderRadius: 6 }}>Đã lưu trữ</Tag>;
        if (!r.ten_dang_nhap) return <Tag style={{ borderRadius: 6 }}>Chưa kích hoạt</Tag>;
        if (r.buoc_doi_mat_khau) return <Tag color="warning" style={{ borderRadius: 6 }}>⏳ Chờ đổi MK</Tag>;
        return r.hoat_dong
          ? <Tag color="success" style={{ borderRadius: 6 }}>✅ Hoạt động</Tag>
          : <Tag color="error" style={{ borderRadius: 6 }}>🔒 Đã khóa</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record) => {
        if (record.da_xoa) {
          return (
            <Popconfirm title="Khôi phục tài khoản này?" onConfirm={() => handleArchive([record.ma_dang_vien], false)} okText="Khôi phục" cancelText="Hủy">
              <Button size="small" icon={<RollbackOutlined />} loading={archiving}>Khôi phục</Button>
            </Popconfirm>
          );
        }
        if (!record.ten_dang_nhap) {
          return (
            <Button type="primary" size="small" icon={<UserSwitchOutlined />}
              style={{ background: COLOR_BLUE, borderColor: COLOR_BLUE, borderRadius: 6 }}
              onClick={() => { setSelectedMember(record); setIsGrantOpen(true); }}>
              Cấp Tài khoản
            </Button>
          );
        }
        return (
          <Space size={4}>
            <Tooltip title="Cấp lại mật khẩu tự động (sẽ gửi email)">
              <Popconfirm
                title="Cấp lại mật khẩu?"
                description={
                  <div>
                    <div>Hệ thống sẽ tự sinh mật khẩu ngẫu nhiên mới.</div>
                    {record.email
                      ? <div style={{ color: COLOR_GREEN }}>✅ Sẽ gửi email tới: <b>{record.email}</b></div>
                      : <div style={{ color: '#f59e0b' }}>⚠️ Đảng viên chưa có email — cần thông báo thủ công</div>
                    }
                  </div>
                }
                onConfirm={() => handleResetPassword(record)}
                okText="Xác nhận Reset"
                cancelText="Hủy"
                okButtonProps={{ style: { background: COLOR_RED, borderColor: COLOR_RED } }}
              >
                <Button
                  size="small"
                  icon={<KeyOutlined />}
                  loading={resetting === record.ma_dang_vien}
                  style={{ borderRadius: 6, color: COLOR_RED, borderColor: COLOR_RED }}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title={record.hoat_dong ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
              <Popconfirm
                title={record.hoat_dong ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?'}
                onConfirm={() => handleToggleStatus(record.ma_dang_vien)}
                okButtonProps={{ danger: record.hoat_dong }}
              >
                <Button
                  size="small"
                  danger={record.hoat_dong}
                  icon={record.hoat_dong ? <LockOutlined /> : <UnlockOutlined />}
                  style={{ borderRadius: 6 }}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="Lưu trữ tài khoản">
              <Popconfirm
                title="Lưu trữ tài khoản này?"
                description="Tài khoản sẽ không thể đăng nhập nhưng dữ liệu lịch sử vẫn được giữ lại."
                onConfirm={() => handleArchive([record.ma_dang_vien], true)}
                okText="Lưu trữ"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<InboxOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <PageHeader
        icon={<UserSwitchOutlined />}
        title="Tài khoản Đảng viên"
        subtitle="Cấp phát, khóa/mở và cấp lại mật khẩu tự động kèm gửi email"
      />

      {/* Stats row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic title="Tổng tài khoản" value={members.filter(m => m.ten_dang_nhap).length} valueStyle={{ color: COLOR_BLUE }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic title="Đang hoạt động" value={members.filter(m => m.ten_dang_nhap && m.hoat_dong).length} valueStyle={{ color: COLOR_GREEN }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic title="Đã bị khóa" value={members.filter(m => m.ten_dang_nhap && !m.hoat_dong).length} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
        styles={{ body: { padding: 0 } }}
        title={
          <div style={{ padding: '16px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Danh sách Đảng viên</span>
            <Space wrap>
              <Select
                value={archiveFilter}
                style={{ width: 160 }}
                onChange={value => { setArchiveFilter(value); setSelectedRowKeys([]); }}
                options={[{ value: 'false', label: 'Đang sử dụng' }, { value: 'true', label: 'Đã lưu trữ' }]}
              />
              <Input
                placeholder="Tìm theo tên..."
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                style={{ width: 260, borderRadius: 8 }}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
              <Popconfirm
                title={archiveFilter === 'true' ? 'Khôi phục các tài khoản đã chọn?' : 'Lưu trữ các tài khoản đã chọn?'}
                onConfirm={() => handleArchive(selectedRowKeys, archiveFilter !== 'true')}
                okText={archiveFilter === 'true' ? 'Khôi phục' : 'Lưu trữ'}
                cancelText="Hủy"
                disabled={!selectedRowKeys.length}
              >
                <Button danger={archiveFilter !== 'true'} icon={archiveFilter === 'true' ? <RollbackOutlined /> : <InboxOutlined />} disabled={!selectedRowKeys.length} loading={archiving}>
                  {archiveFilter === 'true' ? 'Khôi phục' : 'Lưu trữ'} ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </Space>
          </div>
        }
      >
        <Table
          scroll={{ x: 'max-content' }}
          columns={columns}
          dataSource={members}
          rowKey="ma_dang_vien"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: record => ({ disabled: Number(record.cap_quyen) !== 3 })
          }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
        />
      </Card>

      {/* MODAL CẤP TÀI KHOẢN */}
      <Modal
        title={<span style={{ fontWeight: 600 }}>👤 Cấp tài khoản: {selectedMember?.ho_ten}</span>}
        open={isGrantOpen}
        onCancel={() => { setIsGrantOpen(false); formGrant.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <Form form={formGrant} layout="vertical" onFinish={handleGrantAccount} autoComplete="off">
          <Form.Item name="ten_dang_nhap" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập username' }]}>
            <Input prefix={<UserSwitchOutlined />} autoComplete="new-username" style={{ borderRadius: 8 }} placeholder="VD: nguyenvana" />
          </Form.Item>
          <Form.Item name="mat_khau" label="Mật khẩu ban đầu" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password autoComplete="new-password" style={{ borderRadius: 8 }} placeholder="Nhập mật khẩu ban đầu" />
          </Form.Item>
          <Alert
            message="Sau khi cấp, Đảng viên nên đổi mật khẩu ngay trong lần đăng nhập đầu tiên."
            type="info" showIcon style={{ marginBottom: 16, borderRadius: 8 }}
          />
          <Button type="primary" htmlType="submit" block size="large"
            style={{ background: COLOR_BLUE, borderColor: COLOR_BLUE, borderRadius: 8, fontWeight: 600 }}>
            Cấp tài khoản
          </Button>
        </Form>
      </Modal>

      {/* MODAL KẾT QUẢ RESET MẬT KHẨU */}
      <Modal
        title={<span style={{ fontWeight: 600 }}>🔐 Kết quả cấp lại mật khẩu</span>}
        open={isResultOpen}
        onCancel={() => { setIsResultOpen(false); setResetResult(null); }}
        footer={[
          <Button key="close" onClick={() => { setIsResultOpen(false); setResetResult(null); }} style={{ borderRadius: 8 }}>
            Đóng
          </Button>
        ]}
        destroyOnHidden
        width={480}
      >
        {resetResult && (
          <div>
            <Alert
              message={resetResult.emailSent
                ? `✅ Email đã gửi tới: ${resetResult.emailAddress}`
                : `⚠️ ${resetResult.note}`
              }
              type={resetResult.emailSent ? 'success' : 'warning'}
              showIcon
              style={{ marginBottom: 20, borderRadius: 8 }}
            />

            <div style={{ background: '#f0f7ff', border: '1.5px dashed #3b82f6', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <Text style={{ display: 'block', color: '#6b7280', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Mật khẩu tạm thời của {resetResult.hoTen}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: '#dc2626', letterSpacing: 4, fontFamily: 'monospace' }}>
                {resetResult.matKhauTam}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copyToClipboard(resetResult.matKhauTam)}
                  style={{ borderRadius: 6 }}
                >
                  Copy mật khẩu
                </Button>
              </div>
            </div>

            <Divider />
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: 12 }}>
              <Text style={{ fontSize: 13, color: '#92400e' }}>
                ⚠️ <b>Lưu ý:</b> Đảng viên sẽ <b>bị yêu cầu đổi mật khẩu ngay</b> khi đăng nhập lần đầu với mật khẩu tạm này.
                {!resetResult.emailSent && ' Vui lòng thông báo mật khẩu trên cho Đảng viên theo kênh trực tiếp.'}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MemberAccountManager;
