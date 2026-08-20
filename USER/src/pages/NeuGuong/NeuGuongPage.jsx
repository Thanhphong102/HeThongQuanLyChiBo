import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Tag, Typography, Spin, Empty, Modal, Form,
  Input, Upload, message, Divider, Space, Tooltip, Steps, Row, Col, Alert
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, UploadOutlined, StarOutlined,
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, TrophyOutlined, InboxOutlined, DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import neuGuongApi from '../../api/neuGuongApi';
import userApi from '../../api/userApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ============================================================
// Helper: Trạng thái hồ sơ
// ============================================================
const TRANG_THAI_CONFIG = {
  Cho_Duyet:       { color: 'blue',    icon: <ClockCircleOutlined />,   label: 'Chờ Chi ủy duyệt' },
  Cho_Nop_Bao_Cao: { color: 'orange',  icon: <FileTextOutlined />,      label: 'Chờ nộp Báo cáo' },
  Dang_Xu_Ly:      { color: 'cyan',    icon: <ClockCircleOutlined />,   label: 'Đang xử lý' },
  Duoc_Cong_Nhan:  { color: 'success', icon: <TrophyOutlined />,        label: 'Được công nhận 🏆' },
  Bi_Tu_Choi:      { color: 'error',   icon: <CloseCircleOutlined />,   label: 'Bị từ chối' },
};

const getStatusTag = (trangThai) => {
  const cfg = TRANG_THAI_CONFIG[trangThai];
  if (!cfg) return <Tag>{trangThai}</Tag>;
  return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>;
};

const getStepCurrent = (trangThai) => {
  const map = { Cho_Duyet: 0, Cho_Nop_Bao_Cao: 1, Dang_Xu_Ly: 2, Duoc_Cong_Nhan: 3, Bi_Tu_Choi: 0 };
  return map[trangThai] ?? 0;
};

// ============================================================
// Component con: Form nộp hồ sơ
// ============================================================
const NopHoSoModal = ({ open, onClose, dot, onSuccess }) => {
  const [activities, setActivities] = useState([{ ten_hoat_dong: '', file_minh_chung: '', ghi_chu: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem('user_info') || '{}');
    setUserInfo(info);
  }, []);

  const addActivity = () => {
    setActivities(prev => [...prev, { ten_hoat_dong: '', file_minh_chung: '', ghi_chu: '' }]);
  };

  const removeActivity = (idx) => {
    if (activities.length === 1) { message.warning('Phải có ít nhất 1 hoạt động'); return; }
    setActivities(prev => prev.filter((_, i) => i !== idx));
  };

  const updateActivity = (idx, field, value) => {
    setActivities(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async () => {
    const invalid = activities.some(a => !a.ten_hoat_dong.trim());
    if (invalid) { message.error('Vui lòng nhập đầy đủ tên hoạt động'); return; }

    setSubmitting(true);
    try {
      await neuGuongApi.nopHoSo({
        ma_dot: dot.ma_dot,
        danh_sach_hoat_dong: activities
      });
      message.success('Nộp hồ sơ thành công! Chi ủy sẽ xem xét sớm nhất.');
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi khi nộp hồ sơ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <StarOutlined className="text-yellow-500" />
          <span className="font-bold text-lg">Đề xuất Nêu gương — {dot?.ten_dot}</span>
        </Space>
      }
      width={700}
      footer={null}
      destroyOnClose
    >
      {/* Thông tin tự động */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
        <Text className="text-blue-700 font-semibold text-sm">📋 Thông tin Đảng viên (tự động)</Text>
        <Row gutter={16} className="mt-2">
          <Col span={12}>
            <Text type="secondary">Họ và tên:</Text>
            <div className="font-bold">{userInfo.ho_ten || '—'}</div>
          </Col>
          <Col span={12}>
            <Text type="secondary">
              {userInfo.doi_tuong === 'Can bo' ? 'Mã Cán bộ:' : 'MSSV:'}
            </Text>
            <div className="font-bold">
              {userInfo.doi_tuong === 'Can bo' ? (userInfo.ma_can_bo || '—') : (userInfo.ma_so_sinh_vien || '—')}
            </div>
          </Col>
        </Row>
      </div>

      <Divider orientation="left" plain>
        <Text className="text-red-600 font-semibold">Danh sách hoạt động đã tham gia</Text>
      </Divider>

      <div className="space-y-4">
        {activities.map((act, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <Text strong className="text-gray-700">Hoạt động {idx + 1}</Text>
              <Button
                danger type="text" size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeActivity(idx)}
              />
            </div>
            <div className="space-y-3">
              <div>
                <Text type="secondary" className="text-xs">Tên hoạt động *</Text>
                <Input
                  value={act.ten_hoat_dong}
                  onChange={e => updateActivity(idx, 'ten_hoat_dong', e.target.value)}
                  placeholder='VD: "Tổ chức tập huấn kỹ năng lập kế hoạch..."'
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Text type="secondary" className="text-xs">Link file minh chứng (Google Drive / URL)</Text>
                <Input
                  value={act.file_minh_chung}
                  onChange={e => updateActivity(idx, 'file_minh_chung', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  prefix={<UploadOutlined className="text-gray-400" />}
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Text type="secondary" className="text-xs">Ghi chú thêm (không bắt buộc)</Text>
                <TextArea
                  value={act.ghi_chu}
                  onChange={e => updateActivity(idx, 'ghi_chu', e.target.value)}
                  rows={2}
                  placeholder="Mô tả ngắn về hoạt động..."
                  className="mt-1 rounded-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        className="w-full mt-4 rounded-xl h-10"
        onClick={addActivity}
      >
        + Thêm hoạt động
      </Button>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button onClick={onClose}>Hủy</Button>
        <Button
          type="primary"
          icon={<StarOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          className="bg-red-700 hover:!bg-red-800 border-none font-bold px-8 rounded-lg"
        >
          Gửi Đề xuất
        </Button>
      </div>
    </Modal>
  );
};

// ============================================================
// Component con: Modal nộp báo cáo
// ============================================================
const NopBaoCaoModal = ({ open, onClose, hoSo, fileMau, onSuccess }) => {
  const [fileBaoCao, setFileBaoCao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fileBaoCao.trim()) { message.error('Vui lòng nhập link file báo cáo'); return; }
    setSubmitting(true);
    try {
      await neuGuongApi.nopBaoCao({ ma_ho_so: hoSo.ma_ho_so, file_bao_cao: fileBaoCao });
      message.success('Nộp báo cáo thành công! Chi ủy đang xem xét.');
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lỗi khi nộp báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<Space><FileTextOutlined className="text-orange-500" /><span className="font-bold">Nộp Báo cáo Học tập và làm theo lời Bác</span></Space>}
      width={560}
      footer={null}
      destroyOnClose
    >
      {fileMau && (
        <Alert
          className="mb-4 rounded-xl"
          type="info"
          showIcon
          message="File mẫu báo cáo"
          description={
            <a href={fileMau} target="_blank" rel="noopener noreferrer" className="font-semibold flex items-center gap-1">
              <DownloadOutlined /> Tải file mẫu tại đây
            </a>
          }
        />
      )}
      <Paragraph className="text-gray-500 text-sm">
        Sau khi điền hoàn chỉnh vào file mẫu, hãy tải lên Google Drive rồi dán link chia sẻ vào ô bên dưới.
      </Paragraph>
      <div>
        <Text type="secondary" className="text-xs">Link file Báo cáo *</Text>
        <Input
          value={fileBaoCao}
          onChange={e => setFileBaoCao(e.target.value)}
          placeholder="https://drive.google.com/..."
          prefix={<UploadOutlined className="text-gray-400" />}
          className="mt-1 rounded-lg h-10"
        />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button onClick={onClose}>Hủy</Button>
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          loading={submitting}
          onClick={handleSubmit}
          className="bg-orange-500 hover:!bg-orange-600 border-none font-bold px-8 rounded-lg"
        >
          Nộp Báo cáo
        </Button>
      </div>
    </Modal>
  );
};

// ============================================================
// Component chính: NeuGuongPage
// ============================================================
const NeuGuongPage = () => {
  const [dots, setDots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nopHoSoOpen, setNopHoSoOpen] = useState(false);
  const [nopBaoCaoOpen, setNopBaoCaoOpen] = useState(false);
  const [selectedDot, setSelectedDot] = useState(null);
  const [selectedHoSo, setSelectedHoSo] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await neuGuongApi.getMyDots();
      setDots(res.data);
    } catch (err) {
      message.error('Không thể tải dữ liệu đợt nêu gương');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
        <span className="ml-4 text-gray-500">Đang tải...</span>
      </div>
    );
  }

  const dotDangMo = dots.find(d => d.trang_thai === 'Mo');
  const dotDaDong = dots.filter(d => d.trang_thai === 'Da_Dong');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="!mb-1 flex items-center gap-2">
          <TrophyOutlined className="text-yellow-500" />
          Đề xuất Nêu gương
        </Title>
        <Text type="secondary">
          Đăng ký và theo dõi hồ sơ đề xuất nêu gương của bạn hàng tháng
        </Text>
      </div>

      {/* === ĐỢT ĐANG MỞ === */}
      {dotDangMo ? (
        <Card
          className="mb-6 rounded-2xl shadow-sm border-2 border-yellow-200"
          style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tag color="gold" icon={<StarOutlined />} className="font-semibold">Đang mở</Tag>
                <Text type="secondary" className="text-xs">Tháng {dotDangMo.thang}/{dotDangMo.nam}</Text>
              </div>
              <Title level={4} className="!mb-1">{dotDangMo.ten_dot}</Title>
              {dotDangMo.mo_ta && <Paragraph className="text-gray-500 !mb-0 text-sm">{dotDangMo.mo_ta}</Paragraph>}
            </div>

            {/* Chưa có hồ sơ → Hiện nút Đăng ký */}
            {!dotDangMo.ma_ho_so && (
              <Button
                type="primary"
                size="large"
                icon={<StarOutlined />}
                onClick={() => { setSelectedDot(dotDangMo); setNopHoSoOpen(true); }}
                className="bg-red-700 hover:!bg-red-800 border-none font-bold px-6 rounded-xl shrink-0"
              >
                Đăng ký Nêu gương
              </Button>
            )}
          </div>

          {/* Đã có hồ sơ → Hiện tiến độ */}
          {dotDangMo.ma_ho_so && (
            <div className="mt-5">
              <Divider className="!my-3" />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <Text strong>Trạng thái hồ sơ của bạn:</Text>
                {getStatusTag(dotDangMo.trang_thai_ho_so)}
              </div>

              {/* Steps tiến độ */}
              <Steps
                size="small"
                current={getStepCurrent(dotDangMo.trang_thai_ho_so)}
                status={dotDangMo.trang_thai_ho_so === 'Bi_Tu_Choi' ? 'error' : 'process'}
                className="mb-4"
                items={[
                  { title: 'Đã nộp', description: dotDangMo.ngay_nop ? dayjs(dotDangMo.ngay_nop).format('DD/MM/YYYY') : '' },
                  { title: 'Được duyệt', description: dotDangMo.ngay_duyet ? dayjs(dotDangMo.ngay_duyet).format('DD/MM/YYYY') : '' },
                  { title: 'Nộp báo cáo' },
                  { title: 'Công nhận', description: dotDangMo.ngay_cong_nhan ? dayjs(dotDangMo.ngay_cong_nhan).format('DD/MM/YYYY') : '' },
                ]}
              />

              {/* Ghi chú từ Admin */}
              {dotDangMo.ghi_chu_admin && (
                <Alert
                  className="rounded-xl mb-3"
                  type={dotDangMo.trang_thai_ho_so === 'Bi_Tu_Choi' ? 'error' : 'info'}
                  showIcon
                  message="Phản hồi từ Chi ủy"
                  description={dotDangMo.ghi_chu_admin}
                />
              )}

              {/* Nút nộp báo cáo */}
              {dotDangMo.trang_thai_ho_so === 'Cho_Nop_Bao_Cao' && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => { setSelectedHoSo(dotDangMo); setNopBaoCaoOpen(true); }}
                  className="bg-orange-500 hover:!bg-orange-600 border-none font-bold rounded-xl"
                >
                  Nộp Báo cáo Học tập và làm theo lời Bác
                </Button>
              )}

              {/* Hiển thị link báo cáo đã nộp */}
              {dotDangMo.file_bao_cao && (
                <div className="mt-2">
                  <Text type="secondary" className="text-sm">Báo cáo đã nộp: </Text>
                  <a href={dotDangMo.file_bao_cao} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm font-medium">
                    Xem file báo cáo
                  </a>
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card className="mb-6 rounded-2xl bg-gray-50 border border-dashed border-gray-300">
          <Empty
            image={<InboxOutlined className="text-5xl text-gray-300" />}
            description={
              <Text type="secondary">Chi ủy chưa mở đợt nêu gương mới.<br/>Vui lòng quay lại sau.</Text>
            }
          />
        </Card>
      )}

      {/* === LỊCH SỬ CÁC ĐỢT CŨ === */}
      {dotDaDong.length > 0 && (
        <>
          <Divider orientation="left">
            <Text type="secondary" className="text-sm font-semibold">Lịch sử đợt cũ</Text>
          </Divider>
          <div className="space-y-3">
            {dotDaDong.map(dot => (
              <Card key={dot.ma_dot} size="small" className="rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <Text strong>{dot.ten_dot}</Text>
                    <Text type="secondary" className="ml-2 text-xs">Tháng {dot.thang}/{dot.nam}</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color="default">Đã đóng</Tag>
                    {dot.trang_thai_ho_so ? getStatusTag(dot.trang_thai_ho_so) : <Tag color="default">Không tham gia</Tag>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {selectedDot && (
        <NopHoSoModal
          open={nopHoSoOpen}
          onClose={() => setNopHoSoOpen(false)}
          dot={selectedDot}
          onSuccess={fetchData}
        />
      )}

      {selectedHoSo && (
        <NopBaoCaoModal
          open={nopBaoCaoOpen}
          onClose={() => setNopBaoCaoOpen(false)}
          hoSo={selectedHoSo}
          fileMau={selectedHoSo.file_mau_bao_cao}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default NeuGuongPage;
