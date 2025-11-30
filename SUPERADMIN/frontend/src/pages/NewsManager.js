import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Upload, message, Space, Popconfirm, Image 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FileImageOutlined 
} from '@ant-design/icons';
import axios from '../services/axiosConfig';

const NewsManager = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [fileList, setFileList] = useState([]); // Lưu file ảnh upload
  
  const [form] = Form.useForm();

  // 1. Lấy danh sách tin tức
  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/news');
      setNewsList(res.data);
    } catch (error) {
      message.error('Lỗi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  // 2. Mở Modal (Thêm hoặc Sửa)
  const openModal = (record = null) => {
    setEditingNews(record);
    setFileList([]); // Reset file upload
    if (record) {
      form.setFieldsValue({
        title: record.title,
        content: record.content
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // 3. Xử lý Lưu (Create / Update)
  const handleSave = async (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content || '');
    
    // Nếu có file mới thì gửi kèm
    if (fileList.length > 0) {
      formData.append('image', fileList[0]);
    }

    try {
      if (editingNews) {
        // UPDATE
        await axios.put(`/news/${editingNews.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Cập nhật tin tức thành công');
      } else {
        // CREATE
        await axios.post('/news/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Đăng tin thành công');
      }
      
      setIsModalOpen(false);
      fetchNews(); // Load lại bảng
    } catch (error) {
      message.error('Thao tác thất bại: ' + (error.response?.data?.message || 'Lỗi server'));
    }
  };

  // 4. Xử lý Xóa
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/news/${id}`);
      message.success('Đã xóa tin tức');
      fetchNews();
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  // Cấu hình Upload (Chặn auto upload)
  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      setFileList([file]); // Chỉ giữ 1 file
      return false;
    },
    fileList,
    maxCount: 1,
    listType: "picture"
  };

  // Hàm tạo link ảnh trực tiếp từ Google Drive ID
  const getDriveImage = (fileId) => {
    // sz=w500: Lấy ảnh kích thước chiều rộng 500px (đủ nét cho bảng và modal)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`; 
  };

  const columns = [
    {
      title: 'Hình ảnh',
      key: 'image',
      width: 100,
      align: 'center',
      render: (_, record) => {
        // Ưu tiên dùng ID để tạo link chuẩn
        if (record.drive_file_id) {
           return (
             <Image 
               width={100} 
               height={60}
               src={getDriveImage(record.drive_file_id)} 
               style={{ borderRadius: 8, objectFit: 'cover' }} 
               // Fallback nếu lỗi (ví dụ ảnh bị xóa trên Drive nhưng DB còn)
               fallback="https://via.placeholder.com/100x60?text=No+Image"
             />
           );
        }
        
        // Trường hợp cũ hoặc lỗi không có ID
        return <FileImageOutlined style={{ fontSize: 24, color: '#ccc' }} />;
      }
    },
    { 
      title: 'Tiêu đề', 
      dataIndex: 'title', 
      render: (t) => <b style={{ fontSize: 15 }}>{t}</b> 
    },
    { 
      title: 'Ngày đăng', 
      dataIndex: 'created_at', 
      width: 150,
      render: (date) => new Date(date).toLocaleDateString('vi-VN') 
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
          <Popconfirm title="Xóa tin này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Card 
        title="Quản lý Tin tức & Sự kiện" 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>Đăng tin mới</Button>}
      >
        <Table columns={columns} dataSource={newsList} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />
      </Card>

      <Modal
        title={editingNews ? "Chỉnh sửa tin tức" : "Đăng tin mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose={true}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Tiêu đề tin" rules={[{ required: true, message: 'Nhập tiêu đề!' }]}>
            <Input size="large" placeholder="Ví dụ: Lễ kết nạp Đảng viên mới..." />
          </Form.Item>

          <Form.Item name="content" label="Nội dung chi tiết">
            <Input.TextArea rows={6} placeholder="Nhập nội dung bài viết..." />
          </Form.Item>

          <Form.Item label="Ảnh bìa (Thumbnail)">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Chọn ảnh (JPG/PNG)</Button>
            </Upload>
            {editingNews?.image_url && fileList.length === 0 && (
                <div style={{ marginTop: 8, color: '#888' }}>
                    * Hiện tại đang dùng ảnh cũ. Chọn ảnh mới để thay thế.
                </div>
            )}
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            {editingNews ? "Lưu thay đổi" : "Đăng ngay"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default NewsManager;