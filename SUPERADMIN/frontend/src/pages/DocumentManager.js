import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Upload, message, Space, Tag, Popconfirm 
} from 'antd';
import { 
  UploadOutlined, CloudDownloadOutlined, DeleteOutlined, PlusOutlined, FilePdfOutlined 
} from '@ant-design/icons';

// QUAN TRỌNG: Import axios từ file cấu hình để tự động có Token
import axios from '../services/axiosConfig'; 

const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 1. Lấy danh sách tài liệu từ Backend
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Endpoint là /documents (baseURL đã là /api)
      const response = await axios.get('/documents');
      setDocuments(response.data); 
    } catch (error) {
      message.error('Không thể tải danh sách tài liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // 2. Hàm Upload file
  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      return message.error('Vui lòng chọn file đính kèm!');
    }

    const formData = new FormData();
    // Tên trường phải KHỚP 100% với Backend (adminController.js)
    formData.append('file', fileList[0]); 
    formData.append('ten_tai_lieu', values.ten_tai_lieu);
    formData.append('loai_tai_lieu', values.loai_tai_lieu);
    formData.append('ma_chi_bo', '1'); // Tạm thời hardcode ID chi bộ (hoặc lấy từ user)

    setLoading(true);
    try {
      // Gọi API POST /documents
      await axios.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      message.success('Tải lên thành công!');
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      fetchDocuments(); // Load lại danh sách
    } catch (error) {
      message.error('Lỗi upload: ' + (error.response?.data?.message || 'Lỗi server'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Hàm Xóa tài liệu
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/documents/${id}`);
      message.success('Đã xóa tài liệu!');
      fetchDocuments(); // Load lại sau khi xóa
    } catch (error) {
      message.error('Xóa thất bại!');
    }
  };

  // Cấu hình bảng (Mapping đúng tên cột trong Database)
  const columns = [
    {
      title: 'Tên văn bản',
      dataIndex: 'ten_tai_lieu', // Tên cột trong DB
      key: 'ten_tai_lieu',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Loại',
      dataIndex: 'loai_tai_lieu', // Tên cột trong DB
      key: 'loai_tai_lieu',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'File đính kèm',
      key: 'file',
      render: (_, record) => (
        // Sử dụng trường 'duong_dan' từ DB
        <a href={record.duong_dan} target="_blank" rel="noopener noreferrer">
          <Space>
            <CloudDownloadOutlined style={{ color: '#1890ff' }} />
            Xem / Tải về
          </Space>
        </a>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
            title="Xóa tài liệu này?"
            description="Hành động này sẽ xóa file vĩnh viễn."
            onConfirm={() => handleDelete(record.ma_tai_lieu)} // Dùng ma_tai_lieu
            okText="Xóa"
            cancelText="Hủy"
        >
            <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title="Quản lý Văn bản & Tài liệu (Google Drive)" 
        extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Thêm tài liệu
            </Button>
        }
      >
        <Table 
            columns={columns} 
            dataSource={documents} 
            rowKey="ma_tai_lieu" // Key duy nhất là ma_tai_lieu
            loading={loading} 
            pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title="Tải lên tài liệu mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
            {/* Name phải khớp với formData.append ở trên */}
            <Form.Item 
                name="ten_tai_lieu" label="Tên văn bản" 
                rules={[{ required: true, message: 'Nhập tên văn bản' }]}
            >
                <Input placeholder="Ví dụ: Nghị quyết TW5" />
            </Form.Item>

            <Form.Item 
                name="loai_tai_lieu" label="Loại văn bản"
                rules={[{ required: true, message: 'Nhập loại văn bản' }]}
            >
                <Input placeholder="Ví dụ: Nghị quyết, Báo cáo..." />
            </Form.Item>

            <Form.Item label="Đính kèm file">
                <Upload 
                    beforeUpload={(file) => {
                        setFileList([file]);
                        return false; // Chặn upload tự động
                    }}
                    fileList={fileList}
                    onRemove={() => setFileList([])}
                    maxCount={1}
                >
                    <Button icon={<UploadOutlined />}>Chọn file (PDF/Ảnh)</Button>
                </Upload>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                    Xác nhận tải lên & Lưu Drive
                </Button>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManager;