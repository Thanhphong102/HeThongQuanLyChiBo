import React, { useEffect, useState } from 'react';
import { Button, Card, Drawer, Empty, Form, Input, List, Select, Switch, Table, Tag, Typography, message } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';
import RichTextEditor, { RichTextContent } from '../../components/RichTextEditor';
import './FeedbackPage.css';

const { Title, Text } = Typography;
const topicLabel = { Ho_tro: 'Hỗ trợ', He_thong: 'Hệ thống', Hoat_dong: 'Hoạt động', Dang_phi: 'Đảng phí', Tai_lieu: 'Tài liệu', Khac: 'Khác' };
const statusLabel = { Moi: 'Mới', Da_tiep_nhan: 'Đang xử lý', Dang_xu_ly: 'Đang xử lý', Da_phan_hoi: 'Đã phản hồi', Da_dong: 'Đã kết thúc' };

const FeedbackPage = () => {
  const [items, setItems] = useState([]);
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState('');
  const [form] = Form.useForm();
  const load = async () => { try { const r = await userApi.getMyFeedback(); setItems(r.data || []); } catch (e) { message.error(e.response?.data?.message || 'Lỗi tải góp ý'); } };
  useEffect(() => { load(); }, []);
  const create = async values => { try { await userApi.createFeedback(values); message.success('Đã gửi góp ý tới Chi ủy'); form.resetFields(); load(); } catch (e) { message.error(e.response?.data?.message || 'Lỗi gửi góp ý'); } };
  const open = async id => { try { const r = await userApi.getFeedback(id); setThread(r.data); } catch (e) { message.error(e.response?.data?.message || 'Lỗi tải góp ý'); } };
  const send = async () => { if (!reply.trim()) return message.warning('Vui lòng nhập nội dung phản hồi'); try { await userApi.replyFeedback(thread.feedback.ma_gop_y, reply); setReply(''); await open(thread.feedback.ma_gop_y); load(); message.success('Đã gửi phản hồi'); } catch (e) { message.error(e.response?.data?.message || 'Lỗi gửi phản hồi'); } };
  const columns = [
    { title: 'Góp ý', dataIndex: 'tieu_de', render: (text, row) => <div><b>{text}</b><div className="feedback-meta">{dayjs(row.thoi_gian_tao).format('DD/MM/YYYY HH:mm')}</div></div> },
    { title: 'Chủ đề', dataIndex: 'chu_de', render: value => <Tag>{topicLabel[value] || value}</Tag> },
    { title: 'Trạng thái', dataIndex: 'trang_thai', render: value => <Tag color={value === 'Moi' ? 'red' : value === 'Da_phan_hoi' ? 'green' : 'blue'}>{statusLabel[value] || value}</Tag> },
    { title: '', width: 90, render: (_, row) => <Button onClick={() => open(row.ma_gop_y)}>Xem</Button> }
  ];
  return <div className="user-feedback-page">
    <div className="feedback-hero"><Title level={2}><MessageOutlined /> Góp ý</Title><Text>Gửi ý kiến và theo dõi phản hồi từ Chi ủy</Text></div>
    <Card title="Gửi góp ý"><Form form={form} layout="vertical" onFinish={create} initialValues={{ chu_de: 'Ho_tro', an_danh: false }}>
      <Form.Item name="chu_de" label="Chủ đề"><Select options={Object.entries(topicLabel).map(([value, label]) => ({ value, label }))} /></Form.Item>
      <Form.Item name="tieu_de" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}><Input /></Form.Item>
      <Form.Item name="noi_dung" label="Nội dung" rules={[{ required: true, message: 'Nhập nội dung' }]}><RichTextEditor minHeight={180} /></Form.Item>
      <Form.Item name="an_danh" label="Ẩn danh khi Chi ủy xem danh sách" valuePropName="checked"><Switch /></Form.Item>
      <div className="feedback-form-actions"><Button type="primary" htmlType="submit" icon={<SendOutlined />}>Gửi góp ý</Button></div>
    </Form></Card>
    <Card title="Góp ý đã gửi" className="feedback-history"><Table rowKey="ma_gop_y" dataSource={items} columns={columns} scroll={{ x: 600 }} /></Card>
    <Drawer title={thread?.feedback?.tieu_de} open={Boolean(thread)} onClose={() => setThread(null)} width={680}>
      {thread && <>
        <Card size="small" className="feedback-summary"><div className="feedback-summary__tags"><Tag>{topicLabel[thread.feedback.chu_de]}</Tag><Tag color={thread.feedback.trang_thai === 'Da_phan_hoi' ? 'green' : 'blue'}>{statusLabel[thread.feedback.trang_thai]}</Tag></div><RichTextContent html={thread.feedback.noi_dung} /></Card>
        <List className="feedback-thread" dataSource={thread.replies} locale={{ emptyText: <Empty description="Chi ủy chưa phản hồi" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} renderItem={item => <List.Item><List.Item.Meta title={`${item.vai_tro === 'Admin' ? 'Chi ủy' : 'Bạn'} · ${item.ho_ten}`} description={<><RichTextContent html={item.noi_dung} /><small>{dayjs(item.thoi_gian_tao).format('DD/MM/YYYY HH:mm')}</small></>} /></List.Item>} />
        {thread.feedback.trang_thai !== 'Da_dong' && <div className="feedback-composer"><RichTextEditor value={reply} onChange={setReply} minHeight={110} placeholder="Phản hồi thêm..." /><div className="feedback-composer__actions"><Button type="primary" icon={<SendOutlined />} onClick={send}>Gửi phản hồi</Button></div></div>}
      </>}
    </Drawer>
  </div>;
};
export default FeedbackPage;
