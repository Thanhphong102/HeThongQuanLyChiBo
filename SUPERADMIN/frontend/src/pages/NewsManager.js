import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Upload, message, Space, Popconfirm, Image, DatePicker, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FileImageOutlined, SearchOutlined 
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../services/axiosConfig';

const { RangePicker } = DatePicker;

const NewsManager = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [fileList, setFileList] = useState([]); 
  
  const [form] = Form.useForm();

  const fetchNews = async () => {
    setLoading(true);
    try {
        let url = '/news?';
        if (searchText) url += `search=${encodeURIComponent(searchText)}&`;
        if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
            url += `startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`;
        }
        const res = await axios.get(url);
        setNewsList(res.data);
    } catch (error) {
        message.error('Lỗi tải tin tức');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
      const delayDebounceFn = setTimeout(() => {
          fetchNews();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
  }, [searchText, dateRange]);

  const openModal = (record = null) => {
    setEditingNews(record);
    setFileList([]); 
    if (record) {
      form.setFieldsValue({ tieu_de: record.tieu_de, content: record.noi_dung });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    const formData = new FormData();
    formData.append('tieu_de', values.tieu_de);
    formData.append('content', values.noi_dung || '');
    if (fileList.length > 0) formData.append('image', fileList[0]);

    try {
      if (editingNews) {
        await axios.put(`/news/${editingNews.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        message.success('Cập nhật tin tức thành công');
      } else {
        await axios.post('/news/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        message.success('Đăng tin thành công');
      }
      setIsModalOpen(false);
      fetchNews(); 
    } catch (error) {
      message.error('Thao tác thất bại: ' + (error.response?.data?.message || 'Lỗi server'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/news/${id}`);
      message.success('Đã xóa tin tức');
      fetchNews();
    } catch (error) { message.error('Xóa thất bại'); }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => { setFileList([file]); return false; },
    fileList,
    maxCount: 1,
    listType: "picture"
  };

  const getDriveImage = (fileId) => `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`; 

  const columns = [
    {
      tieu_de: 'Hình ảnh', key: 'image', width: 120, align: 'center',
      render: (_, record) => record.ma_file_drive 
           ? <Image width={100} height={60} src={getDriveImage(record.ma_file_drive)} style={{ borderRadius: 8, objectFit: 'cover' }} fallback="https://via.placeholder.com/100x60?text=No+Image" />
           : <FileImageOutlined style={{ fontSize: 24, color: '#ccc' }} />
    },
    { tieu_de: 'Tiêu đề', dataIndex: 'tieu_de', render: (t) => <span className="font-semibold text-gray-800 text-base">{t}</span> },
    { tieu_de: 'Ngày đăng', dataIndex: 'ngay_tao', width: 150, render: (date) => new Date(date).toLocaleDateString('vi-VN') },
    {
      tieu_de: 'Hành động', key: 'action', width: 120, align: 'center',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" />
          <Popconfirm tieu_de="Xóa tin này?" onConfirm={() => handleDelete(record.ma_tin_tuc)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button danger icon={<DeleteOutlined />} className="bg-red-50" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-['Be_Vietnam_Pro'] pb-8">
      <Card 
        className="rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        variant="borderless"
        tieu_de={<span className="text-xl font-bold text-gray-800">Quản lý Tin tức & Sự kiện</span>}
        extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)} className="h-10 px-4 rounded-xl font-medium bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">
                Đăng tin mới
            </Button>
        }
      >
        {/* ===== KHU VỰC BỘ LỌC - Dùng Row/Col để tránh chồng lấp ===== */}
        <div style={{ marginBottom: 24, padding: '16px 16px', backgroundColor: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} md={14} lg={16}>
              <Input 
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} 
                placeholder="Tìm kiếm tiêu đề tin tức..." 
                style={{ height: 40, borderRadius: 8 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={10} lg={8}>
              <RangePicker 
                style={{ height: 40, borderRadius: 8, width: '100%' }}
                onChange={(dates) => setDateRange(dates)}
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                allowClear
              />
            </Col>
          </Row>
        </div>

        <Table 
            columns={columns} 
            dataSource={newsList} 
            rowKey="id" 
            loading={loading} 
            pagination={{ pageSize: 5, className: "custom-pagination" }} 
            className="border-t border-gray-100 mt-2"
            rowClassName="hover:bg-gray-50 transition-colors"
        />
      </Card>

      <Modal
        tieu_de={<span className="text-lg font-bold">{editingNews ? "Chỉnh sửa tin tức" : "Đăng tin mới"}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden={true}
        width={700}
        className="rounded-2xl overflow-hidden font-['Be_Vietnam_Pro']"
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item name="tieu_de" label={<span className="font-semibold">Tiêu đề tin</span>} rules={[{ required: true, message: 'Nhập tiêu đề!' }]}>
            <Input size="large" placeholder="Ví dụ: Lễ kết nạp Đảng viên mới..." className="rounded-lg" />
          </Form.Item>
          
          <Form.Item name="content" label={<span className="font-semibold">Nội dung chi tiết</span>}>
            <Input.TextArea rows={6} placeholder="Nhập nội dung bài viết..." className="rounded-lg" />
          </Form.Item>

          <Form.Item label={<span className="font-semibold">Ảnh bìa (Thumbnail)</span>}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} className="rounded-lg h-10 px-4">Chọn ảnh (JPG/PNG)</Button>
            </Upload>
            {editingNews?.duong_dan_anh && fileList.length === 0 && (
                <div className="mt-2 text-gray-500 text-sm">
                    * Hiện tại đang dùng ảnh cũ. Chọn ảnh mới để thay thế.
                </div>
            )}
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" className="rounded-xl h-12 font-bold text-base bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200 mt-4">
            {editingNews ? "Lưu thay đổi" : "Đăng xuất bản"}
          </Button>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default NewsManager;