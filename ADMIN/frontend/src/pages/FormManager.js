import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Upload, message, Popconfirm, Tag, Space, Tooltip 
} from 'antd';
import { 
  FileTextOutlined, UploadOutlined, DeleteOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, CloudDownloadOutlined 
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';

const FormManager = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  // 1. Lấy danh sách
  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/branch-forms');
      setForms(res.data);
    } catch (error) {
      message.error('Lỗi tải danh sách biểu mẫu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForms(); }, []);

  // 2. Upload Biểu mẫu
  const handleUpload = async (values) => {
    if (fileList.length === 0) return message.error('Vui lòng chọn file!');

    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('title', values.title);

    try {
      await axios.post('/branch-forms', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Tải lên thành công');
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      fetchForms();
    } catch (error) {
      message.error('Tải lên thất bại');
    }
  };

  // 3. Xóa Biểu mẫu
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/branch-forms/${id}`);
      message.success('Đã xóa biểu mẫu');
      fetchForms();
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  // Cấu hình Upload
  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1
  };

  // Helper: Render Icon theo loại file (Dựa vào đuôi file hoặc title)
  const getFileIcon = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes('.pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
    if (name.includes('.doc')) return <FileWordOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
    if (name.includes('.xls')) return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
    return <FileTextOutlined style={{ color: '#666', fontSize: 24 }} />;
  };

  const columns = [
    {
      title: 'Loại',
      key: 'icon',
      width: 80,
      align: 'center',
      // Dùng title để đoán loại file (hoặc bạn có thể lưu mimeType vào DB nếu muốn chính xác hơn)
      render: (_, r) => getFileIcon(r.title) 
    },
    {
      title: 'Tên Biểu mẫu / Tài liệu',
      dataIndex: 'title',
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <a href={record.file_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 15, color: '#003a8c' }}>
              {text}
            </a>
            <span style={{ fontSize: 12, color: '#888' }}>Ngày đăng: {dayjs(record.created_at).format('DD/MM/YYYY HH:mm')}</span>
        </div>
      )
    },
    {
      title: 'Người đăng',
      dataIndex: 'nguoi_dang',
      render: (text) => <Tag color="blue">{text || 'Admin'}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
            <Tooltip title="Tải xuống / Xem">
                <Button type="primary" ghost size="small" icon={<CloudDownloadOutlined />} href={record.file_url} target="_blank" />
            </Tooltip>
            <Popconfirm title="Xóa tài liệu này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 0 }}>
      <Card 
        title="Kho Biểu mẫu & Tài liệu Nội bộ" 
        extra={<Button type="primary" icon={<UploadOutlined />} onClick={() => setIsModalOpen(true)}>Tải lên biểu mẫu</Button>}
      >
        <Table 
            columns={columns} 
            dataSource={forms} 
            rowKey="id" 
            loading={loading} 
            pagination={{ pageSize: 6 }} 
        />
      </Card>

      <Modal 
        title="Tải lên Biểu mẫu mới" 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item name="title" label="Tên biểu mẫu" rules={[{ required: true, message: 'Nhập tên biểu mẫu!' }]}>
            <Input placeholder="Ví dụ: Mẫu biên bản họp tháng 10.docx" />
          </Form.Item>

          <Form.Item label="File đính kèm" required>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Chọn file (Word/Excel/PDF)</Button>
            </Upload>
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Xác nhận tải lên
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default FormManager;