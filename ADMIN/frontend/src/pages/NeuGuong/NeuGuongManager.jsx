import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Button, Space, Modal, Typography, message,
  Input, Form, DatePicker, Descriptions, Tabs, Popconfirm,
  Badge, Tooltip, Alert, Empty
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  TrophyOutlined, EditOutlined, DeleteOutlined, LinkOutlined,
  FileTextOutlined, LockOutlined, UnlockOutlined, StarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../services/axiosConfig';
import PageHeader from '../../components/PageHeader';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// ============================================================
// Helper: Tag trạng thái hồ sơ
// ============================================================
const STATUS_CONFIG = {
  Cho_Duyet:       { color: 'blue',    label: 'Chờ duyệt' },
  Cho_Nop_Bao_Cao: { color: 'orange',  label: 'Chờ nộp báo cáo' },
  Dang_Xu_Ly:      { color: 'cyan',    label: 'Đang xử lý' },
  Duoc_Cong_Nhan:  { color: 'success', label: '🏆 Được công nhận' },
  Bi_Tu_Choi:      { color: 'error',   label: 'Bị từ chối' },
};

const getStatusTag = (t) => {
  const cfg = STATUS_CONFIG[t];
  return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{t}</Tag>;
};

// ============================================================
// Modal: Xem chi tiết hồ sơ + Hành động
// ============================================================
const HoSoDetailModal = ({ open, hoSo, onClose, onSuccess }) => {
  const [ghiChu, setGhiChu] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { if (open) setGhiChu(''); }, [open]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'duyet') {
        await axiosClient.put(`/neu-guong/ho-so/${hoSo.ma_ho_so}/duyet`, { ghi_chu_admin: ghiChu });
        message.success('Đã duyệt hồ sơ! Đảng viên nhận thông báo.');
      } else if (action === 'tu-choi') {
        if (!ghiChu.trim()) { message.warning('Vui lòng nhập lý do từ chối'); return; }
        await axiosClient.put(`/neu-guong/ho-so/${hoSo.ma_ho_so}/tu-choi`, { ghi_chu_admin: ghiChu });
        message.success('Đã từ chối hồ sơ.');
      } else if (action === 'cong-nhan') {
        await axiosClient.put(`/neu-guong/ho-so/${hoSo.ma_ho_so}/cong-nhan`, { ghi_chu_admin: ghiChu });
        message.success('🏆 Đã công nhận Nêu gương! Đảng viên nhận thông báo.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi xử lý hành động');
    } finally {
      setActionLoading(null);
    }
  };

  if (!hoSo) return null;

  const hoatDongs = hoSo.danh_sach_hoat_dong || [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <FileTextOutlined className="text-blue-500" />
          <span className="font-bold">Chi tiết hồ sơ nêu gương — <Text className="text-blue-600">{hoSo.ho_ten}</Text></span>
        </Space>
      }
      width={720}
      footer={null}
      destroyOnClose
    >
      {/* Thông tin Đảng viên */}
      <Descriptions bordered size="small" column={2} className="mb-4">
        <Descriptions.Item label="Họ và tên" span={2}><b className="text-blue-700">{hoSo.ho_ten}</b></Descriptions.Item>
        <Descriptions.Item label="Đối tượng">{hoSo.doi_tuong === 'Can bo' ? 'Cán bộ' : 'Sinh viên'}</Descriptions.Item>
        <Descriptions.Item label={hoSo.doi_tuong === 'Can bo' ? 'Mã Cán bộ' : 'MSSV'}>
          {hoSo.doi_tuong === 'Can bo' ? (hoSo.ma_can_bo || '—') : (hoSo.ma_so_sinh_vien || '—')}
        </Descriptions.Item>
        {hoSo.doi_tuong !== 'Can bo' && (
          <>
            <Descriptions.Item label="Lớp">{hoSo.lop || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngành học">{hoSo.nganh_hoc || '—'}</Descriptions.Item>
          </>
        )}
        <Descriptions.Item label="Ngày nộp">{dayjs(hoSo.ngay_nop).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">{getStatusTag(hoSo.trang_thai)}</Descriptions.Item>
      </Descriptions>

      {/* Danh sách hoạt động */}
      <div className="mb-4">
        <Text strong className="text-sm mb-2 block">
          📋 Danh sách hoạt động ({hoatDongs.length} hoạt động)
        </Text>
        {hoatDongs.length > 0 ? (
          <div className="space-y-2">
            {hoatDongs.map((hd, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Text strong className="text-sm">{idx + 1}. {hd.ten_hoat_dong}</Text>
                    {hd.ghi_chu && <Paragraph className="text-gray-500 text-xs !mb-0 mt-1">{hd.ghi_chu}</Paragraph>}
                  </div>
                  {hd.file_minh_chung && (
                    <a href={hd.file_minh_chung} target="_blank" rel="noopener noreferrer">
                      <Button size="small" icon={<LinkOutlined />} type="link">Minh chứng</Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Chưa có hoạt động" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      {/* File báo cáo (nếu đã nộp) */}
      {hoSo.file_bao_cao && (
        <Alert
          className="mb-4 rounded-lg"
          type="success"
          showIcon
          message="Đảng viên đã nộp Báo cáo Học tập và làm theo lời Bác"
          description={
            <a href={hoSo.file_bao_cao} target="_blank" rel="noopener noreferrer" className="font-semibold flex items-center gap-1 mt-1">
              <LinkOutlined /> Xem file báo cáo
            </a>
          }
        />
      )}

      {/* Ghi chú cũ từ Admin */}
      {hoSo.ghi_chu_admin && (
        <Alert type="info" showIcon className="mb-4 rounded-lg"
          message="Ghi chú trước đó của Chi ủy"
          description={hoSo.ghi_chu_admin}
        />
      )}

      {/* Khu vực hành động */}
      {['Cho_Duyet', 'Dang_Xu_Ly'].includes(hoSo.trang_thai) && (
        <div className="border-t pt-4">
          <Text type="secondary" className="text-xs block mb-2">
            {hoSo.trang_thai === 'Bi_Tu_Choi' ? '' : 'Ghi chú / Phản hồi cho Đảng viên (không bắt buộc):'}
          </Text>
          <TextArea
            value={ghiChu}
            onChange={e => setGhiChu(e.target.value)}
            rows={2}
            placeholder={hoSo.trang_thai === 'Cho_Duyet' ? 'Ghi chú gửi kèm thông báo...' : 'Ghi chú công nhận...'}
            className="mb-3 rounded-lg"
          />
          <div className="flex gap-2 flex-wrap">
            {hoSo.trang_thai === 'Cho_Duyet' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={actionLoading === 'duyet'}
                  onClick={() => handleAction('duyet')}
                  className="bg-green-600 hover:!bg-green-700 border-none rounded-lg"
                >
                  Duyệt hồ sơ lần 1
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={actionLoading === 'tu-choi'}
                  onClick={() => handleAction('tu-choi')}
                  className="rounded-lg"
                >
                  Từ chối
                </Button>
              </>
            )}
            {hoSo.trang_thai === 'Dang_Xu_Ly' && (
              <>
                <Button
                  type="primary"
                  icon={<TrophyOutlined />}
                  loading={actionLoading === 'cong-nhan'}
                  onClick={() => handleAction('cong-nhan')}
                  className="bg-yellow-500 hover:!bg-yellow-600 border-none font-bold rounded-lg"
                >
                  🏆 Công nhận Nêu gương
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={actionLoading === 'tu-choi'}
                  onClick={() => handleAction('tu-choi')}
                  className="rounded-lg"
                >
                  Từ chối (sau duyệt)
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

// ============================================================
// Modal: Tạo / Chỉnh sửa đợt
// ============================================================
const DotFormModal = ({ open, dot, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (dot) {
        form.setFieldsValue({ ten_dot: dot.ten_dot, mo_ta: dot.mo_ta, file_mau_bao_cao: dot.file_mau_bao_cao });
      } else {
        form.resetFields();
        form.setFieldsValue({ thang_nam: dayjs() });
      }
    }
  }, [open, dot, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ten_dot: values.ten_dot,
        thang: dot ? undefined : values.thang_nam.month() + 1,
        nam: dot ? undefined : values.thang_nam.year(),
        mo_ta: values.mo_ta,
        file_mau_bao_cao: values.file_mau_bao_cao,
      };

      if (dot) {
        await axiosClient.put(`/neu-guong/dots/${dot.ma_dot}`, payload);
        message.success('Cập nhật đợt thành công');
      } else {
        await axiosClient.post('/neu-guong/dots', payload);
        message.success('Tạo đợt nêu gương thành công');
      }
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi tạo/cập nhật đợt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<Space><StarOutlined className="text-yellow-500" /><span>{dot ? 'Chỉnh sửa đợt' : 'Tạo Đợt Nêu gương mới'}</span></Space>}
      footer={null}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="ten_dot" label="Tên đợt" rules={[{ required: true, message: 'Vui lòng nhập tên đợt' }]}>
          <Input placeholder='VD: Đợt nêu gương tháng 8/2026' className="h-10 rounded-lg" />
        </Form.Item>

        {!dot && (
          <Form.Item name="thang_nam" label="Tháng/Năm" rules={[{ required: true, message: 'Vui lòng chọn tháng/năm' }]}>
            <DatePicker picker="month" className="w-full h-10 rounded-lg" format="MM/YYYY" />
          </Form.Item>
        )}

        <Form.Item name="file_mau_bao_cao" label="Link file mẫu báo cáo (Google Drive)">
          <Input
            placeholder="https://drive.google.com/..."
            prefix={<LinkOutlined className="text-gray-400" />}
            className="h-10 rounded-lg"
          />
        </Form.Item>

        <Form.Item name="mo_ta" label="Mô tả / Hướng dẫn">
          <TextArea rows={3} placeholder="Mô tả về đợt nêu gương này..." className="rounded-lg" />
        </Form.Item>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-red-700 hover:!bg-red-800 border-none font-bold rounded-lg"
          >
            {dot ? 'Cập nhật' : 'Tạo đợt'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ============================================================
// Component chính: NeuGuongManager
// ============================================================
const NeuGuongManager = () => {
  const [dots, setDots] = useState([]);
  const [hoSoList, setHoSoList] = useState([]);
  const [loadingDots, setLoadingDots] = useState(true);
  const [loadingHoSo, setLoadingHoSo] = useState(false);
  const [selectedDot, setSelectedDot] = useState(null);
  const [selectedHoSo, setSelectedHoSo] = useState(null);
  const [dotFormOpen, setDotFormOpen] = useState(false);
  const [editingDot, setEditingDot] = useState(null);
  const [hoSoModalOpen, setHoSoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dots');

  const fetchDots = useCallback(async () => {
    setLoadingDots(true);
    try {
      const res = await axiosClient.get('/neu-guong/dots');
      setDots(res.data);
    } catch {
      message.error('Lỗi tải danh sách đợt');
    } finally {
      setLoadingDots(false);
    }
  }, []);

  const fetchHoSo = useCallback(async (dot_id) => {
    setLoadingHoSo(true);
    try {
      const res = await axiosClient.get(`/neu-guong/dots/${dot_id}/ho-so`);
      setHoSoList(res.data);
    } catch {
      message.error('Lỗi tải danh sách hồ sơ');
    } finally {
      setLoadingHoSo(false);
    }
  }, []);

  useEffect(() => { fetchDots(); }, [fetchDots]);

  const handleViewHoSo = (dot) => {
    setSelectedDot(dot);
    setActiveTab('hoso');
    fetchHoSo(dot.ma_dot);
  };

  const handleToggleDot = async (dot) => {
    const newTrangThai = dot.trang_thai === 'Mo' ? 'Da_Dong' : 'Mo';
    try {
      await axiosClient.put(`/neu-guong/dots/${dot.ma_dot}`, { trang_thai: newTrangThai });
      message.success(newTrangThai === 'Mo' ? 'Đã mở lại đợt' : 'Đã đóng đợt');
      fetchDots();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDeleteDot = async (dot) => {
    try {
      await axiosClient.delete(`/neu-guong/dots/${dot.ma_dot}`);
      message.success('Đã xóa đợt');
      fetchDots();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi xóa đợt');
    }
  };

  // === Columns: Bảng Đợt ===
  const dotColumns = [
    {
      title: 'Tên đợt', dataIndex: 'ten_dot', key: 'ten_dot',
      render: (text, r) => <span className="font-semibold">{text} <Text type="secondary" className="text-xs ml-1">({r.thang}/{r.nam})</Text></span>
    },
    {
      title: 'Trạng thái', dataIndex: 'trang_thai', key: 'trang_thai',
      render: (t) => t === 'Mo' ? <Badge status="processing" text={<span className="font-semibold text-green-600">Đang mở</span>} /> : <Badge status="default" text="Đã đóng" />
    },
    {
      title: 'Tổng hồ sơ', dataIndex: 'tong_ho_so', key: 'tong_ho_so', align: 'center',
      render: (v) => <Tag color="blue">{v || 0}</Tag>
    },
    {
      title: 'Chờ duyệt', dataIndex: 'so_cho_duyet', key: 'so_cho_duyet', align: 'center',
      render: (v) => v > 0 ? <Badge count={v} /> : <Tag color="default">0</Tag>
    },
    {
      title: 'Được công nhận', dataIndex: 'so_cong_nhan', key: 'so_cong_nhan', align: 'center',
      render: (v) => <Tag color="gold">{v || 0}</Tag>
    },
    {
      title: 'Thao tác', key: 'action', align: 'center',
      render: (_, r) => (
        <Space>
          <Tooltip title="Xem hồ sơ">
            <Button icon={<EyeOutlined />} size="small" type="primary" onClick={() => handleViewHoSo(r)} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingDot(r); setDotFormOpen(true); }} />
          </Tooltip>
          <Tooltip title={r.trang_thai === 'Mo' ? 'Đóng đợt' : 'Mở lại'}>
            <Popconfirm
              title={r.trang_thai === 'Mo' ? 'Đóng đợt này?' : 'Mở lại đợt này?'}
              onConfirm={() => handleToggleDot(r)}
              okText="Xác nhận" cancelText="Hủy"
            >
              <Button
                icon={r.trang_thai === 'Mo' ? <LockOutlined /> : <UnlockOutlined />}
                size="small"
                danger={r.trang_thai === 'Mo'}
                className={r.trang_thai !== 'Mo' ? '!text-green-600 !border-green-600' : ''}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Xóa đợt">
            <Popconfirm title="Xóa đợt này? Chỉ xóa được khi chưa có hồ sơ." onConfirm={() => handleDeleteDot(r)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // === Columns: Bảng Hồ sơ ===
  const hoSoColumns = [
    { title: 'Họ và tên', dataIndex: 'ho_ten', key: 'ho_ten', render: (t) => <b>{t}</b> },
    { title: 'MSSV / Mã CB', key: 'ma_id',
      render: (_, r) => r.doi_tuong === 'Can bo' ? (r.ma_can_bo || '—') : (r.ma_so_sinh_vien || '—')
    },
    { title: 'Ngành / Đối tượng', key: 'doi_tuong',
      render: (_, r) => r.doi_tuong === 'Can bo' ? <Tag color="blue">Cán bộ</Tag> : <Tag color="green">Sinh viên</Tag>
    },
    { title: 'Số HĐ', key: 'so_hd', align: 'center',
      render: (_, r) => <Tag>{(r.danh_sach_hoat_dong || []).length}</Tag>
    },
    { title: 'Ngày nộp', dataIndex: 'ngay_nop', key: 'ngay_nop',
      render: (t) => dayjs(t).format('DD/MM/YYYY')
    },
    { title: 'Trạng thái', dataIndex: 'trang_thai', key: 'trang_thai',
      render: (t) => getStatusTag(t)
    },
    { title: 'Báo cáo', dataIndex: 'file_bao_cao', key: 'file_bao_cao', align: 'center',
      render: (f) => f ? <a href={f} target="_blank" rel="noopener noreferrer"><Button icon={<FileTextOutlined />} size="small" type="link">Xem</Button></a> : '—'
    },
    { title: 'Thao tác', key: 'action', align: 'center',
      render: (_, r) => (
        <Button
          icon={<EyeOutlined />} type="primary" size="small"
          onClick={() => { setSelectedHoSo(r); setHoSoModalOpen(true); }}
        >
          Xem & Xử lý
        </Button>
      )
    }
  ];

  const tabItems = [
    {
      key: 'dots',
      label: <Space size={7}><StarOutlined /><span>Quản lý Đợt</span></Space>,
      children: (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 18,
          }}>
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Danh sách các đợt nêu gương của Chi bộ
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingDot(null); setDotFormOpen(true); }}
              style={{ borderRadius: 8, fontWeight: 600, flexShrink: 0 }}
            >
              Tạo đợt mới
            </Button>
          </div>
          <Table
            columns={dotColumns}
            dataSource={dots}
            rowKey="ma_dot"
            loading={loadingDots}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="Chưa có đợt nêu gương nào" /> }}
            scroll={{ x: 720 }}
          />
        </div>
      )
    },
    {
      key: 'hoso',
      label: (
        <Space size={7}>
          <FileTextOutlined />
          <span>Hồ sơ Đảng viên</span>
          {selectedDot && <Tag className="ml-2" color="blue">{selectedDot.ten_dot}</Tag>}
        </Space>
      ),
      children: (
        <div>
          {!selectedDot ? (
            <Empty
              description={<Text type="secondary">Hãy chọn một đợt để xem danh sách hồ sơ</Text>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <Text strong>{selectedDot.ten_dot}</Text>
                  <Text type="secondary" className="ml-2 text-xs">({selectedDot.thang}/{selectedDot.nam})</Text>
                </div>
                <Space>
                  {getStatusTag(selectedDot.trang_thai)}
                  <Tag color="blue">Tổng: {hoSoList.length} hồ sơ</Tag>
                  <Tag color="orange">Chờ duyệt: {hoSoList.filter(h => h.trang_thai === 'Cho_Duyet').length}</Tag>
                  <Tag color="gold">Công nhận: {hoSoList.filter(h => h.trang_thai === 'Duoc_Cong_Nhan').length}</Tag>
                </Space>
              </div>
              <Table
                columns={hoSoColumns}
                dataSource={hoSoList}
                rowKey="ma_ho_so"
                loading={loadingHoSo}
                pagination={{ pageSize: 15 }}
                locale={{ emptyText: <Empty description="Chưa có hồ sơ nào trong đợt này" /> }}
                scroll={{ x: 900 }}
                rowClassName={(r) => r.trang_thai === 'Cho_Duyet' ? 'bg-blue-50' : r.trang_thai === 'Dang_Xu_Ly' ? 'bg-yellow-50' : ''}
              />
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <PageHeader
        icon={<TrophyOutlined />}
        title="Quản lý Nêu gương"
        subtitle="Tạo đợt, duyệt hồ sơ và công nhận Đảng viên nêu gương"
      />

      <Card
        style={{
          borderRadius: 16,
          border: 'none',
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabBarStyle={{ fontFamily: 'Be Vietnam Pro, sans-serif', marginBottom: 20 }}
        />
      </Card>

      {/* Modal Tạo/Sửa đợt */}
      <DotFormModal
        open={dotFormOpen}
        dot={editingDot}
        onClose={() => { setDotFormOpen(false); setEditingDot(null); }}
        onSuccess={fetchDots}
      />

      {/* Modal Chi tiết hồ sơ */}
      <HoSoDetailModal
        open={hoSoModalOpen}
        hoSo={selectedHoSo}
        onClose={() => setHoSoModalOpen(false)}
        onSuccess={() => { if (selectedDot) fetchHoSo(selectedDot.ma_dot); fetchDots(); }}
      />
    </div>
  );
};

export default NeuGuongManager;
