import React, { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Drawer, Empty, List, Table, Tag, message } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from '../services/axiosConfig';
import PageHeader from '../components/PageHeader';
import RichTextEditor, { RichTextContent } from '../components/RichTextEditor';
import './FeedbackManager.css';

const topicLabel = { Ho_tro: 'Hỗ trợ', He_thong: 'Hệ thống', Hoat_dong: 'Hoạt động', Dang_phi: 'Đảng phí', Tai_lieu: 'Tài liệu', Khac: 'Khác' };
const statusLabel = { Moi: 'Mới', Da_tiep_nhan: 'Đang xử lý', Dang_xu_ly: 'Đang xử lý', Da_phan_hoi: 'Đã phản hồi', Da_dong: 'Đã kết thúc' };

const FeedbackManager = () => {
  const [feedback, setFeedback] = useState([]);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await axios.get('/support/feedback'); setFeedback(data || []); }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải hộp thư góp ý'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openThread = async id => {
    try { const res = await axios.get(`/support/feedback/${id}`); setThread(res.data); load(); }
    catch (e) { message.error(e.response?.data?.message || 'Lỗi tải góp ý'); }
  };
  const sendReply = async () => {
    if (!reply.trim()) return message.warning('Vui lòng nhập nội dung phản hồi');
    try {
      await axios.post(`/support/feedback/${thread.feedback.ma_gop_y}/replies`, { noi_dung: reply });
      setReply(''); await openThread(thread.feedback.ma_gop_y);
      message.success('Đã gửi phản hồi');
    } catch (e) { message.error(e.response?.data?.message || 'Lỗi gửi phản hồi'); }
  };

  const columns = [
    { title: 'Góp ý', dataIndex: 'tieu_de', render: (text, row) => <div><b>{text}</b><div className="feedback-meta">{row.an_danh ? 'Ẩn danh' : row.ho_ten} · {dayjs(row.thoi_gian_tao).format('DD/MM/YYYY HH:mm')}</div></div> },
    { title: 'Chủ đề', dataIndex: 'chu_de', render: value => <Tag>{topicLabel[value] || value}</Tag> },
    { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Tag color={value === 'Moi' ? 'red' : value === 'Da_phan_hoi' ? 'green' : 'blue'}>{statusLabel[value] || value}</Tag> },
    { title: 'Phản hồi', dataIndex: 'so_phan_hoi', align: 'center' },
    { title: '', width: 90, render: (_, row) => <Button onClick={() => openThread(row.ma_gop_y)}>Xem</Button> }
  ];

  return <div className="feedback-page">
    <PageHeader icon={<MessageOutlined />} title="Quản lý Góp ý" subtitle="Tiếp nhận, xử lý và phản hồi ý kiến của Đảng viên" />
    <Card className="feedback-list-card"><Table loading={loading} rowKey="ma_gop_y" dataSource={feedback} columns={columns} scroll={{ x: 700 }} /></Card>
    <Drawer title={thread?.feedback?.tieu_de} open={Boolean(thread)} onClose={() => setThread(null)} width={680}>
      {thread && <>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Người gửi">{thread.feedback.ho_ten}</Descriptions.Item>
          <Descriptions.Item label="Chủ đề">{topicLabel[thread.feedback.chu_de] || thread.feedback.chu_de}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái"><Tag color={thread.feedback.trang_thai === 'Da_phan_hoi' ? 'green' : 'blue'}>{statusLabel[thread.feedback.trang_thai]}</Tag></Descriptions.Item>
          <Descriptions.Item label="Nội dung"><RichTextContent html={thread.feedback.noi_dung} /></Descriptions.Item>
        </Descriptions>
        <List className="feedback-thread" dataSource={thread.replies} locale={{ emptyText: <Empty description="Chưa có phản hồi" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} renderItem={item => <List.Item><List.Item.Meta title={`${item.vai_tro === 'Admin' ? 'Chi ủy' : 'Đảng viên'} · ${item.ho_ten}`} description={<><RichTextContent html={item.noi_dung} /><small>{dayjs(item.thoi_gian_tao).format('DD/MM/YYYY HH:mm')}</small></>} /></List.Item>} />
        <div className="feedback-composer">
          <RichTextEditor value={reply} onChange={setReply} minHeight={110} placeholder="Nhập phản hồi..." />
          <div className="feedback-composer__actions"><Button type="primary" icon={<SendOutlined />} onClick={sendReply}>Gửi phản hồi</Button></div>
        </div>
      </>}
    </Drawer>
  </div>;
};
export default FeedbackManager;
