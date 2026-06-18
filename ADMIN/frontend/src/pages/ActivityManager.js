import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, DatePicker, Select, TimePicker,
  message, Tag, Space, Upload, Row, Col, Statistic, Popconfirm,
  Typography, Switch, Divider, Alert, Tooltip
} from 'antd';
import {
  CalendarOutlined, PlusOutlined, CheckSquareOutlined, UploadOutlined,
  FilePdfOutlined, ClockCircleOutlined, FileExcelOutlined,
  EditOutlined, DeleteOutlined, SyncOutlined,
  CheckCircleOutlined, QrcodeOutlined, WifiOutlined, StopOutlined,
  EnvironmentOutlined, ReloadOutlined
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { fuzzySearch } from '../utils/stringUtils';
import PageHeader from '../components/PageHeader';

const { Text } = Typography;

const COLOR_RED    = '#CE1126';
const COLOR_GREEN  = '#22c55e';
const COLOR_BLUE   = '#3b82f6';

// ── Auto-status component ──────────────────────────────────────────
const getAutoStatus = (thoiGian, thoiGianKetThuc) => {
  const now   = dayjs();
  const start = dayjs(thoiGian);
  const end   = thoiGianKetThuc ? dayjs(thoiGianKetThuc) : start.add(2, 'hour');
  if (now.isBefore(start)) return 'Sap dien ra';
  if (now.isBefore(end))   return 'Dang dien ra';
  return 'Da ket thuc';
};

const StatusTag = ({ thoiGian, thoiGianKetThuc }) => {
  const status = getAutoStatus(thoiGian, thoiGianKetThuc);
  if (status === 'Sap dien ra')  return <Tag icon={<ClockCircleOutlined />} color="gold">Sắp diễn ra</Tag>;
  if (status === 'Dang dien ra') return <Tag icon={<SyncOutlined spin />}  color="processing">Đang diễn ra</Tag>;
  return <Tag icon={<CheckCircleOutlined />} color="default">Đã kết thúc</Tag>;
};

const LoaiHinhTag = ({ loai }) => {
  const map = {
    'Thuong ky': { color: 'blue',   label: 'Thường kỳ' },
    'Chuyen de': { color: 'purple', label: 'Chuyên đề' },
    'Chi uy':    { color: 'red',    label: 'Họp Chi ủy' },
  };
  const cfg = map[loai] || { color: 'default', label: loai };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

// ── QR Content helper ──────────────────────────────────────────────
// Chuỗi QR chứa JSON encode: { meetingId, token }
// User side sẽ scan → parse JSON → gọi API điểm danh
const buildQrContent = (meetingId, token) =>
  JSON.stringify({ meetingId, token, type: 'ATTENDANCE_QR' });

// ──────────────────────────────────────────────────────────────────
const ActivityManager = () => {
  const [activities, setActivities]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [dateRange, setDateRange]     = useState([]);
  const [loaiHinh, setLoaiHinh]       = useState('');

  // Modal Tạo/Sửa
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Modal Điểm danh thủ công
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [currentActivity, setCurrentActivity]   = useState(null);
  const [attendanceList, setAttendanceList]      = useState([]);
  const [attendanceSearch, setAttendanceSearch]  = useState('');
  const [stats, setStats]                        = useState({ present: 0, absent: 0, excused: 0, total: 0 });

  // ── TASK 7: QR Modal state ────────────────────────────────────────
  const [isQrModalOpen, setIsQrModalOpen]   = useState(false);
  const [qrMeeting, setQrMeeting]           = useState(null);   // { meetingId, tieu_de, ... }
  const [qrData, setQrData]                 = useState(null);   // { token, lat, lng, isOpen }
  const [qrLoading, setQrLoading]           = useState(false);
  const [manualLat, setManualLat]           = useState('');
  const [manualLng, setManualLng]           = useState('');
  const [useGeolocation, setUseGeolocation] = useState(true);
  // Auto-refresh QR mỗi 45 giây khi đang mở điểm danh
  const qrTimerRef = useRef(null);

  const [form] = Form.useForm();

  // 1. Lấy danh sách lịch sinh hoạt
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        params.from_date = dateRange[0].startOf('day').format('YYYY-MM-DD HH:mm:ss');
        params.to_date   = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');
      }
      if (loaiHinh) params.loai_hinh = loaiHinh;
      const res = await axios.get('/activities', { params });
      setActivities(res.data);
    } catch { message.error('Lỗi tải dữ liệu'); }
    finally   { setLoading(false); }
  };

  useEffect(() => {
    fetchActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, loaiHinh]);

  useEffect(() => {
    if (attendanceList.length > 0) {
      const present = attendanceList.filter(m => m.status === 'Co mat' || m.isQR).length;
      const excused = attendanceList.filter(m => m.status === 'Vang co phep').length;
      const absent  = attendanceList.filter(m => m.status === 'Vang khong phep').length;
      setStats({ present, excused, absent, total: attendanceList.length });
    }
  }, [attendanceList]);

  const filteredAttendance = useMemo(() => {
    if (!attendanceSearch.trim()) return attendanceList;
    return attendanceList.filter(m =>
      fuzzySearch(m.ho_ten, attendanceSearch)
    );
  }, [attendanceList, attendanceSearch]);

  // ── TASK 7: QR Functions ──────────────────────────────────────────

  // Lấy vị trí GPS thiết bị Admin
  const getDeviceLocation = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation
        ? navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          )
        : reject(new Error('Trình duyệt không hỗ trợ Geolocation'))
    );

  // Mở cửa sổ QR và lấy thông tin hiện tại của cuộc họp
  const openQrModal = async (activity) => {
    setQrMeeting(activity);
    setIsQrModalOpen(true);
    setQrLoading(true);
    try {
      const res = await axios.get(`/hybrid-attendance/${activity.ma_lich}/qr`);
      setQrData(res.data);
    } catch { message.error('Không lấy được thông tin QR'); }
    finally { setQrLoading(false); }
  };

  // Mở điểm danh: lấy GPS → gọi API → nhận token mới
  const handleOpenAttendanceQR = async () => {
    setQrLoading(true);
    try {
      let lat = parseFloat(manualLat) || null;
      let lng = parseFloat(manualLng) || null;

      if (useGeolocation) {
        try {
          const pos = await getDeviceLocation();
          lat = pos.lat;
          lng = pos.lng;
          message.success(`📍 Lấy GPS thành công: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          message.warning('Không lấy được GPS, dùng tọa độ nhập tay (nếu có)');
        }
      }

      const res = await axios.post(`/hybrid-attendance/${qrMeeting.ma_lich}/open`, { lat, lng });
      setQrData({ ...res.data, isOpen: true });
      message.success('✅ Đã mở điểm danh QR!');

      // Auto-refresh token mỗi 45 giây (token tái tạo ở backend nếu muốn)
      qrTimerRef.current = setInterval(() => {
        handleRefreshToken();
      }, 45000);
    } catch { message.error('Lỗi mở điểm danh'); }
    finally { setQrLoading(false); }
  };

  // Gia hạn token (tạo token mới, User cần scan lại)
  const handleRefreshToken = async () => {
    if (!qrMeeting) return;
    try {
      const lat = qrData?.lat;
      const lng = qrData?.lng;
      const res = await axios.post(`/hybrid-attendance/${qrMeeting.ma_lich}/open`, { lat, lng });
      setQrData(prev => ({ ...prev, token: res.data.token }));
    } catch { /* silent */ }
  };

  // Đóng điểm danh QR
  const handleCloseAttendanceQR = async () => {
    setQrLoading(true);
    try {
      await axios.post(`/hybrid-attendance/${qrMeeting.ma_lich}/close`);
      setQrData(prev => ({ ...prev, isOpen: false, token: null }));
      clearInterval(qrTimerRef.current);
      message.success('🔒 Đã đóng điểm danh QR');
    } catch { message.error('Lỗi đóng điểm danh'); }
    finally { setQrLoading(false); }
  };

  const closeQrModal = () => {
    clearInterval(qrTimerRef.current);
    setIsQrModalOpen(false);
    setQrData(null);
    setQrMeeting(null);
    setManualLat('');
    setManualLng('');
  };

  // 2. Submit tạo/sửa lịch họp
  const handleSubmit = async (values) => {
    try {
      const { ngay_hop, gio_bat_dau, gio_ket_thuc, ...rest } = values;
      const thoi_gian = dayjs(ngay_hop).format('YYYY-MM-DD') + ' ' + dayjs(gio_bat_dau).format('HH:mm:00');
      const thoi_gian_ket_thuc = gio_ket_thuc 
        ? dayjs(ngay_hop).format('YYYY-MM-DD') + ' ' + dayjs(gio_ket_thuc).format('HH:mm:00')
        : null;

      const payload = { ...rest, thoi_gian, thoi_gian_ket_thuc };

      if (editingActivity) {
        await axios.put(`/activities/${editingActivity.ma_lich}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await axios.post('/activities', payload);
        message.success('Đã lên lịch họp thành công');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingActivity(null);
      fetchActivities();
    } catch { message.error('Lỗi lưu thông tin'); }
  };

  const handleEdit = (record) => {
    setEditingActivity(record);
    form.setFieldsValue({ 
      ...record, 
      ngay_hop: dayjs(record.thoi_gian),
      gio_bat_dau: dayjs(record.thoi_gian),
      gio_ket_thuc: record.thoi_gian_ket_thuc ? dayjs(record.thoi_gian_ket_thuc) : null,
      hinh_thuc_diem_danh: record.hinh_thuc_diem_danh || 'Offline'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/activities/${id}`);
      message.success('Đã hủy lịch họp');
      fetchActivities();
    } catch { message.error('Lỗi xóa lịch'); }
  };

  // Helper: map dữ liệu điểm danh từ server (không tự gán vắng)
  const mapAttendanceData = (data) => {
    return data.map(m => {
      const isQR = m.nguon_diem_danh === 'QR';
      const status = m.trang_thai_tham_gia || null;
      return { ...m, status, note: m.ghi_chu || '', nguon: m.nguon_diem_danh || null, isQR };
    });
  };

  // 3. Điểm danh thủ công
  const openAttendance = async (activity) => {
    setCurrentActivity(activity);
    setAttendanceSearch('');
    try {
      const res = await axios.get(`/activities/${activity.ma_lich}/attendance`);
      setAttendanceList(mapAttendanceData(res.data));
      setIsAttendanceOpen(true);
    } catch { message.error('Không tải được danh sách điểm danh'); }
  };

  const refreshAttendance = async () => {
    if (!currentActivity) return;
    try {
      const res = await axios.get(`/activities/${currentActivity.ma_lich}/attendance`);
      setAttendanceList(mapAttendanceData(res.data));
      message.success('Đã tải lại danh sách!');
    } catch { message.error('Lỗi tải lại'); }
  };

  const handleStatusChange    = (memberId, val) =>
    setAttendanceList(prev => prev.map(item =>
      item.ma_dang_vien === memberId ? { ...item, status: val } : item
    ));

  const saveAttendance = async () => {
    try {
      // Chỉ lưu những người Admin đã tích thủ công
      const dataToSave = attendanceList
        .filter(m => !m.isQR && m.status === 'Co mat')
        .map(m => ({ ma_dang_vien: m.ma_dang_vien, status: 'Co mat', note: m.note }));
      if (dataToSave.length === 0) {
        message.info('Không có điểm danh thủ công nào cần lưu.');
        return;
      }
      await axios.post(`/activities/${currentActivity.ma_lich}/attendance`, { attendanceData: dataToSave });
      message.success(`Đã lưu ${dataToSave.length} điểm danh thủ công!`);
      setIsAttendanceOpen(false);
      fetchActivities();
    } catch { message.error('Lỗi lưu điểm danh'); }
  };

  const handleExportExcel = () => {
    if (attendanceList.length === 0) return message.warning('Không có dữ liệu');
    const dataToExport = attendanceList.map((m, i) => ({
      STT: i + 1,
      'Họ và tên': m.ho_ten,
      'Chức vụ': m.chuc_vu_dang,
      'Trạng thái': m.status === 'Co mat' ? 'Có mặt' : m.status === 'Vang co phep' ? 'Có phép' : 'Không phép',
      'Ghi chú': m.note
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DiemDanh');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }),
      `DiemDanh_${dayjs(currentActivity.thoi_gian).format('DD-MM-YYYY')}.xlsx`);
  };

  const handleUploadMinutes = async (file, activityId) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      await axios.post(`/activities/${activityId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Upload biên bản thành công');
      fetchActivities();
    } catch { message.error('Upload thất bại'); }
    return false;
  };

  // ── Cột bảng chính ──────────────────────────────────────────────
  const columns = [
    {
      title: 'Thời gian', dataIndex: 'thoi_gian', width: 130,
      render: (t) => (
        <div>
          <div style={{ fontWeight: 700, color: '#111827', fontFamily: 'Be Vietnam Pro, sans-serif' }}>{dayjs(t).format('DD/MM/YYYY')}</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}><ClockCircleOutlined /> {dayjs(t).format('HH:mm')}</div>
        </div>
      )
    },
    {
      title: 'Nội dung sinh hoạt', dataIndex: 'tieu_de',
      render: (text, record) => (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLOR_BLUE, fontFamily: 'Be Vietnam Pro, sans-serif' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>📍 {record.dia_diem}</div>
          <div style={{ marginTop: 4 }}><LoaiHinhTag loai={record.loai_hinh} /></div>
        </div>
      )
    },
    {
      title: 'Biên bản', dataIndex: 'file_dinh_kem', align: 'center', width: 150,
      render: (url, record) => url
        ? <a href={url} target="_blank" rel="noreferrer"><Tag icon={<FilePdfOutlined />} color="blue">Xem biên bản</Tag></a>
        : <Upload beforeUpload={(f) => handleUploadMinutes(f, record.ma_lich)} showUploadList={false}>
            <Button size="small" icon={<UploadOutlined />}>Up biên bản</Button>
          </Upload>
    },
    {
      title: 'Trạng thái', key: 'trang_thai', align: 'center', width: 150,
      render: (_, record) => <StatusTag thoiGian={record.thoi_gian} thoiGianKetThuc={record.thoi_gian_ket_thuc} />
    },
    {
      title: 'Hành động', key: 'action', align: 'center', width: 210,
      render: (_, record) => (
        <Space size={4} wrap>
          {/* Điểm danh thủ công */}
          <Tooltip title="Điểm danh thủ công">
            <Button type="primary" size="small" icon={<CheckSquareOutlined />}
              onClick={() => openAttendance(record)}
              style={{ background: COLOR_GREEN, borderColor: COLOR_GREEN }} />
          </Tooltip>
          {/* TASK 7: Nút mở QR */}
          <Tooltip title="Điểm danh bằng QR">
            <Button size="small" icon={<QrcodeOutlined />}
              onClick={() => openQrModal(record)}
              style={{ color: COLOR_BLUE, borderColor: COLOR_BLUE }} />
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Hủy lịch họp?" description="Sẽ xóa cả dữ liệu điểm danh."
            onConfirm={() => handleDelete(record.ma_lich)} okText="Đồng ý" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const attendanceColumns = [
    { title: 'Đảng viên', dataIndex: 'ho_ten', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
    { 
      title: 'Chức vụ', 
      dataIndex: 'chuc_vu_dang',
      render: (role) => {
        const map = {
          'Bi thu chi bo': 'Bí thư chi bộ',
          'Pho bi thu chi bo': 'Phó bí thư chi bộ',
          'Chi uy vien': 'Chi ủy viên',
          'Dang vien': 'Đảng viên'
        };
        return map[role] || role;
      }
    },
    {
      title: 'Nguồn', key: 'nguon', width: 160, align: 'left',
      render: (_, record) => {
        if (record.isQR) return <Tag color="green" style={{ fontWeight: 600 }}>📱 QR</Tag>;
        if (record.status === 'Co mat') return <Tag color="blue" style={{ fontWeight: 600 }}>✏️ Thủ công</Tag>;
        return <Tag color="default" style={{ color: '#6b7280' }}>Chưa điểm danh</Tag>;
      }
    },
    {
      title: 'Trạng thái', key: 'status', align: 'center',
      render: (_, record) => {
        if (record.isQR) {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />} style={{ padding: '4px 14px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
              ĐÃ ĐIỂM DANH (QR)
            </Tag>
          );
        }
        if (record.status === 'Co mat') {
          return (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record.ma_dang_vien, null)}
              style={{ borderRadius: 8, fontWeight: 600, background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
            >
              ✅ Đã điểm danh
            </Button>
          );
        }
        return (
          <Button
            onClick={() => handleStatusChange(record.ma_dang_vien, 'Co mat')}
            style={{ borderRadius: 8, fontWeight: 600, borderColor: '#f87171', color: '#dc2626', background: '#fff5f5' }}
          >
            ❌ Vắng họp
          </Button>
        );
      }
    }
  ];

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <PageHeader
        icon={<CalendarOutlined />}
        title="Lịch Sinh hoạt Chi bộ"
        subtitle="Quản lý lịch họp, điểm danh và biên bản"
      />

      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }} styles={{ body: { padding: 0 } }}
        title={
          <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
              <CalendarOutlined style={{ marginRight: 8, color: COLOR_RED }} />Danh sách buổi sinh hoạt
            </span>
            <Space wrap>
              <DatePicker.RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                onChange={(dates) => setDateRange(dates || [])}
                style={{ borderRadius: 8 }}
              />
              <Select
                value={loaiHinh || 'all'}
                onChange={(val) => setLoaiHinh(val === 'all' ? '' : val)}
                style={{ width: 200, borderRadius: 8 }}
                popupMatchSelectWidth={false}
              >
                <Select.Option value="all">📋 Tất cả loại hình</Select.Option>
                <Select.Option value="Thuong ky">🔵 Sinh hoạt thường kỳ</Select.Option>
                <Select.Option value="Chuyen de">🟣 Sinh hoạt chuyên đề</Select.Option>
                <Select.Option value="Chi uy">🔴 Họp Chi ủy</Select.Option>
              </Select>
              <Button type="primary" icon={<PlusOutlined />}
                onClick={() => { setEditingActivity(null); form.resetFields(); setIsModalOpen(true); }}
                style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8 }}>
                Tạo lịch họp
              </Button>
            </Space>
          </div>
        }
      >
        <Table scroll={{ x: 'max-content' }} columns={columns} dataSource={activities} rowKey="ma_lich" loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }} />
      </Card>

      {/* MODAL TẠO / SỬA */}
      <Modal
        title={<span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>{editingActivity ? '✏️ Cập nhật lịch họp' : '➕ Tạo buổi sinh hoạt mới'}</span>}
        open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="tieu_de" label="Tiêu đề" rules={[{ required: true }]}><Input style={{ borderRadius: 8 }} /></Form.Item>
          
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="ngay_hop" label="Ngày họp" rules={[{ required: true }]}>
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item name="gio_bat_dau" label="Bắt đầu" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item name="gio_ket_thuc" label="Kết thúc">
                <TimePicker format="HH:mm" style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dia_diem" label="Địa điểm (hoặc Link họp trực tuyến)"><Input style={{ borderRadius: 8 }} /></Form.Item>
          
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="loai_hinh" label="Loại hình" initialValue="Thuong ky">
                <Select style={{ borderRadius: 8 }}>
                  <Select.Option value="Thuong ky">Sinh hoạt thường kỳ</Select.Option>
                  <Select.Option value="Chuyen de">Sinh hoạt chuyên đề</Select.Option>
                  <Select.Option value="Chi uy">Họp Chi ủy</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hinh_thuc_diem_danh" label="Hình thức họp" initialValue="Offline">
                <Select style={{ borderRadius: 8 }}>
                  <Select.Option value="Offline">🔵 Trực tiếp</Select.Option>
                  <Select.Option value="Online">🟢 Trực tuyến</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="noi_dung_du_kien" label="Nội dung dự kiến"><Input.TextArea rows={3} style={{ borderRadius: 8 }} /></Form.Item>
          <Button type="primary" htmlType="submit" block
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, height: 40, fontWeight: 600 }}>
            {editingActivity ? 'Cập nhật' : 'Lưu lịch họp'}
          </Button>
        </Form>
      </Modal>

      {/* ── TASK 7: MODAL QR ĐIỂM DANH ────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrcodeOutlined style={{ color: COLOR_BLUE, fontSize: 20 }} />
            <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
              Điểm danh QR — {qrMeeting?.tieu_de}
            </span>
          </div>
        }
        open={isQrModalOpen}
        onCancel={closeQrModal}
        footer={null}
        width={520}
        destroyOnHidden
      >
        {/* Trạng thái điểm danh */}
        {qrData?.isOpen ? (
          <Alert
            message="Điểm danh đang MỞ — Đảng viên có thể scan mã QR"
            type="success"
            icon={<WifiOutlined />}
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        ) : (
          <Alert
            message="Điểm danh đang ĐÓNG — Bấm 'Mở điểm danh' để kích hoạt QR"
            type="warning"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        {/* QR Code */}
        {qrData?.isOpen && qrData?.token && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-block', padding: 16,
              border: '3px solid #3b82f6', borderRadius: 16,
              background: '#fff', boxShadow: '0 4px 20px rgba(59,130,246,0.2)'
            }}>
              <QRCodeSVG
                value={buildQrContent(qrMeeting?.ma_lich, qrData.token)}
                size={220}
                level="H"
                includeMargin
                imageSettings={{
                  src: '/logo_chibo.png',
                  height: 36, width: 36,
                  excavate: true
                }}
              />
            </div>
            <div style={{ marginTop: 12, color: '#6b7280', fontSize: 12, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
              Token: <code style={{ color: COLOR_BLUE, fontSize: 11 }}>{qrData.token?.slice(0, 12)}...</code>
              <br />
              {qrData.lat && qrData.lng && (
                <><EnvironmentOutlined style={{ color: COLOR_GREEN }} />{' '}
                  GPS: {parseFloat(qrData.lat).toFixed(5)}, {parseFloat(qrData.lng).toFixed(5)}
                </>
              )}
            </div>
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* Cài đặt tọa độ */}
        {!qrData?.isOpen && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                <EnvironmentOutlined /> Tọa độ hội trường
              </Text>
              <Space>
                <Text style={{ fontSize: 13 }}>Tự lấy GPS:</Text>
                <Switch checked={useGeolocation} onChange={setUseGeolocation} size="small" />
              </Space>
            </div>
            {!useGeolocation && (
              <Row gutter={12}>
                <Col span={12}>
                  <Input prefix="Lat" value={manualLat} onChange={e => setManualLat(e.target.value)}
                    placeholder="10.7612..." style={{ borderRadius: 8 }} />
                </Col>
                <Col span={12}>
                  <Input prefix="Lng" value={manualLng} onChange={e => setManualLng(e.target.value)}
                    placeholder="106.6823..." style={{ borderRadius: 8 }} />
                </Col>
              </Row>
            )}
          </div>
        )}

        {/* Buttons điều khiển */}
        <Space style={{ width: '100%', justifyContent: 'center' }} size={12}>
          {!qrData?.isOpen ? (
            <Button type="primary" icon={<QrcodeOutlined />} loading={qrLoading}
              onClick={handleOpenAttendanceQR} size="large"
              style={{ background: COLOR_GREEN, borderColor: COLOR_GREEN, borderRadius: 8, fontWeight: 600, height: 44 }}>
              🔓 Mở điểm danh QR
            </Button>
          ) : (
            <>
              <Button icon={<ReloadOutlined />} loading={qrLoading}
                onClick={handleRefreshToken}
                style={{ borderRadius: 8, height: 40 }}>
                Làm mới mã QR
              </Button>
              <Button danger icon={<StopOutlined />} loading={qrLoading}
                onClick={handleCloseAttendanceQR} size="large"
                style={{ borderRadius: 8, height: 40, fontWeight: 600 }}>
                🔒 Đóng điểm danh
              </Button>
            </>
          )}
        </Space>
      </Modal>

      {/* MODAL ĐIỂM DANH THỦ CÔNG */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 30 }}>
            <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>✅ Điểm danh: {currentActivity?.tieu_de}</span>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={refreshAttendance} style={{ borderRadius: 8 }}>Làm mới</Button>
              <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ color: COLOR_GREEN, borderColor: COLOR_GREEN, borderRadius: 8 }}>Xuất BC</Button>
            </Space>
          </div>
        }
        open={isAttendanceOpen} onCancel={() => setIsAttendanceOpen(false)} width={950}
        footer={[
          <Button key="cancel" onClick={() => setIsAttendanceOpen(false)} style={{ borderRadius: 8 }}>Đóng</Button>,
          <Button key="submit" type="primary" onClick={saveAttendance}
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
            Lưu kết quả
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 12 }}>
          <Row gutter={16} style={{ textAlign: 'center' }}>
            <Col span={8}><Statistic title="Tổng số" value={stats.total} valueStyle={{ fontSize: 16 }} /></Col>
            <Col span={8}><Statistic title="✅ Đã điểm danh" value={stats.present} valueStyle={{ color: COLOR_GREEN, fontSize: 16 }} /></Col>
            <Col span={8}><Statistic title="❌ Vắng mặt" value={stats.total - stats.present} valueStyle={{ color: COLOR_RED, fontSize: 16 }} /></Col>
          </Row>
        </div>
        <Input placeholder="🔍 Tìm nhanh theo tên Đảng viên..." value={attendanceSearch}
          onChange={e => setAttendanceSearch(e.target.value)} style={{ marginBottom: 12, borderRadius: 8 }} allowClear />
        <Table columns={attendanceColumns} dataSource={filteredAttendance} rowKey="ma_dang_vien"
          pagination={false} size="small" scroll={{ y: 360 }} style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }} />
      </Modal>
    </div>
  );
};

export default ActivityManager;