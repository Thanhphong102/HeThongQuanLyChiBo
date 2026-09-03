import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  InboxOutlined,
  LinkOutlined,
  PaperClipOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';
import RichTextEditor, { RichTextContent } from '../../components/RichTextEditor';
import './TasksPage.css';

const { Title, Text, Paragraph } = Typography;

const statusMeta = {
  Chua_xem: ['default', 'Chưa xem'],
  Chua_nop: ['warning', 'Chưa nộp'],
  Da_nop: ['blue', 'Đã nộp'],
  Nop_tre: ['orange', 'Nộp trễ'],
  Can_bo_sung: ['volcano', 'Cần bổ sung'],
  Da_duyet: ['green', 'Đã duyệt'],
  Khong_dat: ['red', 'Không đạt'],
};

const taskTypeMeta = {
  Cuoc_thi: ['Cuộc thi', 'user-task-type--gold'],
  Hoc_tap: ['Học tập', 'user-task-type--blue'],
  Bao_cao: ['Báo cáo', 'user-task-type--cyan'],
  Phong_trao: ['Phong trào', 'user-task-type--red'],
  Khac: ['Khác', 'user-task-type--neutral'],
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const response = await userApi.getMyTasks();
      setTasks(response.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi tải nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = async id => {
    try {
      const response = await userApi.getMyTask(id);
      setDetail(response.data);
      form.setFieldsValue({
        ket_qua: response.data.task.ket_qua,
        ghi_chu_dang_vien: response.data.task.ghi_chu_dang_vien,
      });
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi tải nhiệm vụ');
    }
  };

  const submit = async values => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      fileList.forEach(file => formData.append('files', file.originFileObj));
      formData.append('ket_qua', values.ket_qua || '');
      formData.append('ghi_chu_dang_vien', values.ghi_chu_dang_vien || '');
      await userApi.submitTaskEvidence(detail.task.ma_nguoi_nhan, formData);
      message.success('Đã nộp minh chứng');
      setFileList([]);
      await open(detail.task.ma_nhiem_vu);
      load();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi nộp minh chứng');
    } finally {
      setSubmitting(false);
    }
  };

  const visible = useMemo(
    () => tasks.filter(task => filter === 'all' || task.trang_thai_nop === filter),
    [tasks, filter]
  );
  const completed = tasks.filter(task => task.trang_thai_nop === 'Da_duyet').length;
  const awaiting = tasks.filter(task => ['Chua_xem', 'Chua_nop', 'Can_bo_sung'].includes(task.trang_thai_nop)).length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;

  return (
    <main className="user-tasks-page">
      <section className="user-tasks-hero">
        <div className="user-tasks-hero__icon"><FileDoneOutlined /></div>
        <div>
          <Title level={2}>Nhiệm vụ &amp; Minh chứng</Title>
          <Text>Theo dõi công việc được giao, thời hạn và kết quả của bạn</Text>
        </div>
        <span className="user-tasks-hero__label">Không gian công việc</span>
      </section>

      <Row gutter={[16, 16]} className="user-task-stats">
        <Col xs={24} md={8}>
          <Card className="user-task-stat user-task-stat--red">
            <div className="user-task-stat__icon"><FileDoneOutlined /></div>
            <div><Text>Tổng nhiệm vụ</Text><strong>{tasks.length}</strong><small>Được Chi ủy giao</small></div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="user-task-stat user-task-stat--gold">
            <div className="user-task-stat__icon"><ClockCircleOutlined /></div>
            <div><Text>Cần thực hiện</Text><strong>{awaiting}</strong><small>Nhiệm vụ đang chờ</small></div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="user-task-stat user-task-stat--green">
            <div className="user-task-stat__icon"><CheckCircleOutlined /></div>
            <div className="user-task-stat__progress">
              <Text>Tiến độ hoàn thành</Text>
              <strong>{progress}%</strong>
              <Progress percent={progress} showInfo={false} strokeColor="#23764b" trailColor="#deeee5" />
            </div>
          </Card>
        </Col>
      </Row>

      <section className="user-task-board">
        <header className="user-task-board__header">
          <div>
            <h3>Danh sách nhiệm vụ của bạn</h3>
            <p>Chọn một nhiệm vụ để xem hướng dẫn và nộp minh chứng</p>
          </div>
          <Select
            value={filter}
            onChange={setFilter}
            className="user-task-filter"
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              ...Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta[1] })),
            ]}
          />
        </header>

        {visible.length ? (
          <div className="user-task-grid">
            {visible.map(item => {
              const [typeLabel, typeClass] = taskTypeMeta[item.loai_nhiem_vu] || [item.loai_nhiem_vu?.replaceAll('_', ' ') || 'Khác', 'user-task-type--neutral'];
              const isOverdue = item.han_nop && dayjs(item.han_nop).isBefore(dayjs()) && !['Da_duyet', 'Da_nop'].includes(item.trang_thai_nop);
              return (
                <article
                  key={item.ma_nhiem_vu}
                  className={`user-task-card user-task-card--${item.trang_thai_nop || 'default'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => open(item.ma_nhiem_vu)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') open(item.ma_nhiem_vu);
                  }}
                >
                  <div className="user-task-card__top">
                    <span className={`user-task-type ${typeClass}`}>{typeLabel}</span>
                    <Tag color={statusMeta[item.trang_thai_nop]?.[0]}>{statusMeta[item.trang_thai_nop]?.[1]}</Tag>
                  </div>
                  <h4>{item.tieu_de}</h4>
                  <div className={`user-task-card__deadline ${isOverdue ? 'is-overdue' : ''}`}>
                    <ClockCircleOutlined />
                    <span>{item.han_nop ? `Hạn ${dayjs(item.han_nop).format('DD/MM/YYYY · HH:mm')}` : 'Không giới hạn thời gian'}</span>
                  </div>
                  <footer>
                    <span><PaperClipOutlined /> {item.so_minh_chung || 0} minh chứng</span>
                    <span className="user-task-card__action">Xem nhiệm vụ <ArrowRightOutlined /></span>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="user-task-empty">
            <Empty description={loading ? 'Đang tải...' : 'Chưa có nhiệm vụ phù hợp'} />
          </div>
        )}
      </section>

      <Drawer
        title={detail?.task?.tieu_de}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        width={620}
        className="user-task-detail"
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMeta[detail.task.trang_thai_nop]?.[0]}>{statusMeta[detail.task.trang_thai_nop]?.[1]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hạn nộp">
                {detail.task.han_nop ? dayjs(detail.task.han_nop).format('DD/MM/YYYY HH:mm') : 'Không giới hạn'}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {detail.task.mo_ta ? <RichTextContent html={detail.task.mo_ta} /> : <Paragraph className="user-task-detail__empty-text">—</Paragraph>}
              </Descriptions.Item>
              {detail.task.link_huong_dan && (
                <Descriptions.Item label="Hướng dẫn">
                  <a href={detail.task.link_huong_dan} target="_blank" rel="noreferrer"><LinkOutlined /> Mở tài liệu</a>
                </Descriptions.Item>
              )}
            </Descriptions>

            {detail.task.phan_hoi_chi_uy && (
              <Alert
                type={detail.task.trang_thai_nop === 'Can_bo_sung' ? 'warning' : 'info'}
                showIcon
                message="Phản hồi của Chi ủy"
                description={detail.task.phan_hoi_chi_uy}
                className="user-task-detail__section"
              />
            )}

            <Card title="Minh chứng đã nộp" size="small" className="user-task-detail__section">
              {detail.evidence.length
                ? detail.evidence.map(file => <div key={file.ma_minh_chung}><a href={file.file_url} target="_blank" rel="noreferrer">{file.ten_file}</a></div>)
                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có minh chứng" />}
            </Card>

            {detail.task.trang_thai === 'Dang_mo' && !['Da_duyet', 'Khong_dat'].includes(detail.task.trang_thai_nop) && (
              <Card title="Nộp kết quả" size="small" className="user-task-detail__section user-task-submit-card">
                <Form form={form} layout="vertical" onFinish={submit}>
                  <Form.Item name="ket_qua" label="Kết quả/Điểm số">
                    <Input placeholder="Ví dụ: 10/10 hoặc Đã hoàn thành" />
                  </Form.Item>
                  <Form.Item name="ghi_chu_dang_vien" label="Ghi chú">
                    <RichTextEditor minHeight={110} />
                  </Form.Item>
                  <Upload.Dragger
                    multiple
                    maxCount={5}
                    fileList={fileList}
                    beforeUpload={() => false}
                    onChange={({ fileList: list }) => setFileList(list)}
                    accept="image/*,.pdf,.doc,.docx"
                  >
                    <InboxOutlined className="user-task-upload__icon" />
                    <p>Tải tối đa 5 ảnh/PDF/tài liệu, mỗi file không quá 10MB</p>
                  </Upload.Dragger>
                  <Button type="primary" htmlType="submit" loading={submitting} icon={<SendOutlined />} block size="large" className="user-task-submit-button">
                    Nộp minh chứng
                  </Button>
                </Form>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </main>
  );
};

export default TasksPage;
