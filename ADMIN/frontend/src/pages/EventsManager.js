import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, DatePicker, InputNumber,
  Select, message, Tag, Space, Popconfirm, Typography, Drawer,
  Descriptions, Image, Badge, Tooltip, Row, Col, Statistic, Avatar
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  TeamOutlined, SearchOutlined, PictureOutlined, UserOutlined,
  CalendarOutlined, EnvironmentOutlined, SyncOutlined
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const COLOR_RED    = '#CE1126';
const COLOR_GREEN  = '#22c55e';
const COLOR_ORANGE = '#f59e0b';
const COLOR_BLUE   = '#3b82f6';

// ── Trạng thái hoạt động ──────────────────────────────────────────
const TrangThaiTag = ({ status }) => {
  const map = {
    'Dang mo':   { color: 'processing', icon: <SyncOutlined spin />,      label: 'Đang mở ĐK' },
    'Da dong':   { color: 'warning',    icon: <ClockCircleOutlined />,     label: 'Đã đóng ĐK' },
    'Da ket thuc':{ color: 'default',   icon: <CheckCircleOutlined />,     label: 'Đã kết thúc' },
    'Huy':       { color: 'error',      icon: <CloseCircleOutlined />,     label: 'Đã hủy' },
  };
  const cfg = map[status] || { color: 'default', label: status };
  return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>;
};

// ── Trạng thái đăng ký ────────────────────────────────────────────
const RegStatusTag = ({ xacNhanAdmin, trangThaiThamGia }) => {
  if (xacNhanAdmin)      return <Tag icon={<CheckCircleOutlined />} color="success">✅ Đã xác nhận</Tag>;
  if (trangThaiThamGia)  return <Tag icon={<SyncOutlined />}       color="processing">🔵 Đã Check-in</Tag>;
  return <Tag icon={<ClockCircleOutlined />} color="warning">⏳ Chờ duyệt</Tag>;
};

// ─────────────────────────────────────────────────────────────────
const EventsManager = () => {
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal CRUD
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form] = Form.useForm();

  // Drawer xem đăng ký
  const [isDrawerOpen, setIsDrawerOpen]       = useState(false);
  const [selectedEvent, setSelectedEvent]     = useState(null);
  const [registrations, setRegistrations]     = useState([]);
  const [regLoading, setRegLoading]           = useState(false);

  // Modal xem ảnh minh chứng
  const [previewImage, setPreviewImage]       = useState(null);
  const [isPreviewOpen, setIsPreviewOpen]     = useState(false);

  // Helper chuyển đổi link Google Drive sang link Proxy Backend
  const getDirectImageUrl = (url) => {
    if (!url) return '';
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = (match && match[1]) || (idParamMatch && idParamMatch[1]);
    
    if (id) {
      return `http://localhost:5001/api/media/proxy/${id}`;
    }
    return url;
  };

  // 1. Lấy danh sách hoạt động
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { keyword: searchText || undefined };
      if (filterStatus !== 'all') params.trang_thai = filterStatus;
      const res = await axios.get('/events', { params });
      setEvents(res.data);
    } catch { message.error('Lỗi tải danh sách hoạt động'); }
    finally   { setLoading(false); }
  }, [searchText, filterStatus]);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 400);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  // 2. Lấy danh sách đăng ký của 1 hoạt động
  const loadRegistrations = async (event) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
    setRegLoading(true);
    try {
      const res = await axios.get(`/events/${event.id}/registrations`);
      setRegistrations(res.data);
    } catch { message.error('Lỗi tải danh sách đăng ký'); }
    finally   { setRegLoading(false); }
  };

  // 3. CRUD
  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      thoi_gian_bat_dau: values.thoi_gian_bat_dau?.format('YYYY-MM-DD HH:mm:ss'),
      thoi_gian_ket_thuc: values.thoi_gian_ket_thuc?.format('YYYY-MM-DD HH:mm:ss'),
    };
    try {
      if (editingEvent) {
        await axios.put(`/events/${editingEvent.id}`, payload);
        message.success('Cập nhật hoạt động thành công');
      } else {
        await axios.post('/events', payload);
        message.success('Đã tạo hoạt động mới');
      }
      setIsFormOpen(false);
      form.resetFields();
      setEditingEvent(null);
      fetchEvents();
    } catch { message.error('Lỗi lưu hoạt động'); }
  };

  const handleEdit = (record) => {
    setEditingEvent(record);
    form.setFieldsValue({
      ...record,
      thoi_gian_bat_dau:  record.thoi_gian_bat_dau  ? dayjs(record.thoi_gian_bat_dau)  : null,
      thoi_gian_ket_thuc: record.thoi_gian_ket_thuc ? dayjs(record.thoi_gian_ket_thuc) : null,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/events/${id}`);
      message.success('Đã xóa hoạt động');
      fetchEvents();
    } catch { message.error('Lỗi xóa hoạt động'); }
  };

  // 4. Xác nhận / Hủy xác nhận đăng ký
  const handleConfirm = async (regId) => {
    try {
      await axios.post(`/events/registrations/${regId}/confirm`);
      message.success('Đã xác nhận tham gia');
      setRegistrations(prev =>
        prev.map(r => r.id === regId ? { ...r, xac_nhan_admin: true, trang_thai_tham_gia: true } : r)
      );
    } catch { message.error('Lỗi xác nhận'); }
  };

  const handleReject = async (regId) => {
    try {
      await axios.post(`/events/registrations/${regId}/reject`);
      message.success('Đã hủy xác nhận');
      setRegistrations(prev =>
        prev.map(r => r.id === regId ? { ...r, xac_nhan_admin: false, trang_thai_tham_gia: false } : r)
      );
    } catch { message.error('Lỗi hủy xác nhận'); }
  };

  // ── Cột bảng chính ─────────────────────────────────────────────
  const columns = [
    {
      title: 'Hoạt động',
      dataIndex: 'ten_hoat_dong',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', fontFamily: 'Be Vietnam Pro, sans-serif' }}>{text}</div>
          {record.mo_ta && (
            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
              {record.mo_ta.length > 80 ? record.mo_ta.slice(0, 80) + '...' : record.mo_ta}
            </div>
          )}
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {record.dia_diem && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                <EnvironmentOutlined /> {record.dia_diem}
              </span>
            )}
            {record.so_luong_toi_da && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                <TeamOutlined /> Tối đa {record.so_luong_toi_da} người
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'thoi_gian_bat_dau',
      width: 160,
      render: (t, record) => (
        <div style={{ fontSize: 13, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
          <div style={{ fontWeight: 600, color: COLOR_BLUE }}>
            <CalendarOutlined /> {t ? dayjs(t).format('DD/MM/YYYY') : '—'}
          </div>
          {record.thoi_gian_ket_thuc && (
            <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
              → {dayjs(record.thoi_gian_ket_thuc).format('DD/MM/YYYY')}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Đăng ký',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Badge
          count={record.so_luong_dang_ky || 0}
          style={{ backgroundColor: COLOR_BLUE }}
          showZero
        >
          <Tag style={{ cursor: 'pointer', borderRadius: 8, padding: '2px 10px' }}
            onClick={() => loadRegistrations(record)}>
            <TeamOutlined /> Xem
          </Tag>
        </Badge>
      )
    },
    {
      title: 'Đã XN',
      align: 'center',
      width: 80,
      render: (_, record) => (
        <Tag color="green" style={{ borderRadius: 6 }}>
          {record.so_luong_xac_nhan || 0}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai',
      align: 'center',
      width: 140,
      render: (s) => <TrangThaiTag status={s} />
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem đăng ký">
            <Button size="small" icon={<EyeOutlined />} type="primary" ghost
              onClick={() => loadRegistrations(record)} style={{ borderRadius: 6 }} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />}
              onClick={() => handleEdit(record)} style={{ borderRadius: 6 }} />
          </Tooltip>
          <Popconfirm title="Xóa hoạt động này?" description="Sẽ xóa toàn bộ đăng ký liên quan."
            onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // ── Cột Drawer đăng ký ─────────────────────────────────────────
  const regColumns = [
    {
      title: 'Đảng viên',
      key: 'member',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar icon={<UserOutlined />} style={{ background: r.xac_nhan_admin ? COLOR_GREEN : '#d1d5db' }} />
          <div>
            <div style={{ fontWeight: 700, fontFamily: 'Be Vietnam Pro, sans-serif', color: '#111827' }}>{r.ho_ten}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.ma_so_sinh_vien} · {r.lop}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Đăng ký lúc',
      dataIndex: 'thoi_gian_dang_ky',
      width: 130,
      render: (t) => <span style={{ fontSize: 12, color: '#6b7280' }}>{dayjs(t).format('DD/MM HH:mm')}</span>
    },
    {
      title: 'Minh chứng',
      dataIndex: 'minh_chung_url',
      align: 'center',
      width: 110,
      render: (url) => url ? (
        <Tooltip title="Bấm để xem ảnh minh chứng">
          <Button
            size="small"
            icon={<PictureOutlined />}
            style={{ color: COLOR_BLUE, borderColor: COLOR_BLUE, borderRadius: 6 }}
            onClick={() => { setPreviewImage(url); setIsPreviewOpen(true); }}
          >
            Xem ảnh
          </Button>
        </Tooltip>
      ) : <span style={{ color: '#d1d5db', fontSize: 12 }}>Chưa có</span>
    },
    {
      title: 'Trạng thái',
      align: 'center',
      width: 140,
      render: (_, r) => <RegStatusTag xacNhanAdmin={r.xac_nhan_admin} trangThaiThamGia={r.trang_thai_tham_gia} />
    },
    {
      title: 'Hành động',
      align: 'center',
      width: 130,
      render: (_, r) => (
        <Space size={4}>
          {!r.xac_nhan_admin ? (
            <Tooltip title="Xác nhận tham gia">
              <Button size="small" type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirm(r.id)}
                style={{ background: COLOR_GREEN, borderColor: COLOR_GREEN, borderRadius: 6, fontSize: 12 }}>
                Duyệt
              </Button>
            </Tooltip>
          ) : (
            <Popconfirm title="Hủy xác nhận?" onConfirm={() => handleReject(r.id)} okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<CloseCircleOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>
                Hủy XN
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // Thống kê nhanh trong Drawer
  const confirmedCount = registrations.filter(r => r.xac_nhan_admin).length;
  const pendingCount   = registrations.filter(r => !r.xac_nhan_admin).length;

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 700, color: '#111827' }}>
          Quản lý Hoạt động Chi bộ
        </Title>
        <Text style={{ color: '#6b7280' }}>Tổ chức và theo dõi đăng ký tham gia của Đảng viên</Text>
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        padding: '16px 24px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên hoạt động..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250, borderRadius: 8 }}
            allowClear
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 170, borderRadius: 8 }}
            popupMatchSelectWidth={false}
          >
            <Select.Option value="all">🔍 Tất cả trạng thái</Select.Option>
            <Select.Option value="Dang mo">🟢 Đang mở ĐK</Select.Option>
            <Select.Option value="Da dong">🟡 Đã đóng ĐK</Select.Option>
            <Select.Option value="Da ket thuc">⚪ Đã kết thúc</Select.Option>
            <Select.Option value="Huy">🔴 Đã hủy</Select.Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditingEvent(null); form.resetFields(); setIsFormOpen(true); }}
          style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
          Tạo hoạt động mới
        </Button>
      </div>

      {/* Bảng danh sách */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
        />
      </div>

      {/* MODAL TẠO / SỬA */}
      <Modal
        title={
          <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
            {editingEvent ? '✏️ Chỉnh sửa Hoạt động' : '➕ Tạo Hoạt động mới'}
          </span>
        }
        open={isFormOpen}
        onCancel={() => { setIsFormOpen(false); setEditingEvent(null); form.resetFields(); }}
        footer={null}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
          <Form.Item name="ten_hoat_dong" label="Tên hoạt động" rules={[{ required: true, message: 'Nhập tên hoạt động' }]}>
            <Input placeholder="VD: Tình nguyện mùa hè xanh 2026" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="mo_ta" label="Mô tả">
            <Input.TextArea rows={3} style={{ borderRadius: 8 }} placeholder="Mô tả chi tiết hoạt động..." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="thoi_gian_bat_dau" label="Thời gian bắt đầu" rules={[{ required: true }]}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="thoi_gian_ket_thuc" label="Thời gian kết thúc">
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="dia_diem" label="Địa điểm">
                <Input prefix={<EnvironmentOutlined />} style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="so_luong_toi_da" label="Số lượng tối đa">
                <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
          </Row>
          {editingEvent && (
            <Form.Item name="trang_thai" label="Trạng thái">
              <Select style={{ borderRadius: 8 }} popupMatchSelectWidth={false}>
                <Select.Option value="Dang mo">🟢 Đang mở đăng ký</Select.Option>
                <Select.Option value="Da dong">🟡 Đã đóng đăng ký</Select.Option>
                <Select.Option value="Da ket thuc">⚪ Đã kết thúc</Select.Option>
                <Select.Option value="Huy">🔴 Hủy</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" block size="large"
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600, height: 44 }}>
            {editingEvent ? 'Lưu thay đổi' : 'Tạo hoạt động'}
          </Button>
        </Form>
      </Modal>

      {/* DRAWER: Danh sách đăng ký */}
      <Drawer
        title={
          <div>
            <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827' }}>
              📋 Danh sách đăng ký
            </div>
            <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif', color: COLOR_BLUE, fontSize: 13, marginTop: 2 }}>
              {selectedEvent?.ten_hoat_dong}
            </div>
          </div>
        }
        placement="right"
        width={820}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        styles={{ body: { padding: '16px 24px', fontFamily: 'Be Vietnam Pro, sans-serif' } }}
      >
        {/* Thống kê nhanh */}
        <Row gutter={16} style={{ marginBottom: 20, padding: '12px 16px', background: '#f9fafb', borderRadius: 12 }}>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic title="Tổng đăng ký" value={registrations.length}
              valueStyle={{ color: COLOR_BLUE, fontSize: 20 }} prefix={<TeamOutlined />} />
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic title="✅ Đã xác nhận" value={confirmedCount}
              valueStyle={{ color: COLOR_GREEN, fontSize: 20 }} />
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <Statistic title="⏳ Chờ duyệt" value={pendingCount}
              valueStyle={{ color: COLOR_ORANGE, fontSize: 20 }} />
          </Col>
        </Row>

        <Table
          columns={regColumns}
          dataSource={registrations}
          rowKey="id"
          loading={regLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="small"
          style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
          rowClassName={(r) => r.xac_nhan_admin ? 'row-confirmed' : ''}
        />
      </Drawer>

      {/* MODAL XEM ẢNH MINH CHỨNG */}
      <Modal
        title={<span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>🖼️ Ảnh minh chứng tham gia</span>}
        open={isPreviewOpen}
        onCancel={() => { setIsPreviewOpen(false); setPreviewImage(null); }}
        footer={[
          <Button key="close" onClick={() => setIsPreviewOpen(false)} style={{ borderRadius: 8 }}>Đóng</Button>,
          <Button key="view" type="primary" href={previewImage} target="_blank"
            style={{ background: COLOR_BLUE, borderColor: COLOR_BLUE, borderRadius: 8 }}>
            Mở ảnh gốc
          </Button>
        ]}
        width={600}
      >
        {previewImage && (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={getDirectImageUrl(previewImage)}
              style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              fallback="https://placehold.co/400x300?text=Không+tải+được+ảnh"
              alt="Minh chứng tham gia"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventsManager;
