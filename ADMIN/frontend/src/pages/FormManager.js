import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Upload, message,
  Popconfirm, Tag, Space, Tooltip, Select, Typography
} from 'antd';
import {
  FileTextOutlined, UploadOutlined, DeleteOutlined,
  FilePdfOutlined, FileWordOutlined, FileExcelOutlined,
  CloudDownloadOutlined, SearchOutlined, FilterOutlined
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const COLOR_RED = '#CE1126';

const FormManager = () => {
  const [forms, setForms]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  // [MỚI] State Search & Filter
  const [searchText, setSearchText]       = useState('');
  const [filterUploader, setFilterUploader] = useState('all');

  // 1. Lấy danh sách
  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/branch-forms');
      setForms(res.data);
    } catch {
      message.error('Lỗi tải danh sách biểu mẫu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForms(); }, []);

  // [MỚI] Danh sách Uploader duy nhất (để đổ vào filter dropdown)
  const uploaderOptions = useMemo(() => {
    const names = [...new Set(forms.map(f => f.nguoi_dang || 'Admin').filter(Boolean))];
    return names;
  }, [forms]);

  // [MỚI] Filter với search + uploader
  const filteredForms = useMemo(() => {
    let result = forms;
    if (searchText.trim()) {
      result = result.filter(f =>
        f.tieu_de.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterUploader !== 'all') {
      result = result.filter(f => (f.nguoi_dang || 'Admin') === filterUploader);
    }
    return result;
  }, [forms, searchText, filterUploader]);

  // 2. Upload Biểu mẫu
  const handleUpload = async (values) => {
    if (fileList.length === 0) return message.error('Vui lòng chọn file!');
    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('tieu_de', values.tieu_de);
    try {
      await axios.post('/branch-forms', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('Tải lên thành công');
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      fetchForms();
    } catch {
      message.error('Tải lên thất bại');
    }
  };

  // 3. Xóa
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/branch-forms/${id}`);
      message.success('Đã xóa biểu mẫu');
      fetchForms();
    } catch {
      message.error('Xóa thất bại');
    }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => { setFileList([file]); return false; },
    fileList,
    maxCount: 1
  };

  const getFileIcon = (fileName) => {
    const name = (fileName || '').toLowerCase();
    if (name.includes('.pdf'))  return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 24 }} />;
    if (name.includes('.doc'))  return <FileWordOutlined style={{ color: '#3b82f6', fontSize: 24 }} />;
    if (name.includes('.xls'))  return <FileExcelOutlined style={{ color: '#22c55e', fontSize: 24 }} />;
    return <FileTextOutlined style={{ color: '#6b7280', fontSize: 24 }} />;
  };

  const columns = [
    {
      tieu_de: 'Loại', key: 'icon', width: 72, align: 'center',
      render: (_, r) => getFileIcon(r.tieu_de)
    },
    {
      tieu_de: 'Tên Biểu mẫu / Tài liệu',
      dataIndex: 'tieu_de',
      render: (text, record) => (
        <div>
          <a href={record.duong_dan_file} target="_blank" rel="noreferrer"
            style={{ fontWeight: 600, fontSize: 14, color: '#111827', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            {text}
          </a>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            Ngày đăng: {dayjs(record.ngay_tao).format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
      )
    },
    {
      tieu_de: 'Người đăng',
      dataIndex: 'nguoi_dang',
      width: 160,
      render: (text) => (
        <Tag color="red" style={{ borderRadius: 6, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
          {text || 'Admin'}
        </Tag>
      )
    },
    {
      tieu_de: 'Hành động', key: 'action', width: 110, align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip tieu_de="Tải xuống / Xem">
            <Button type="primary" ghost size="small" icon={<CloudDownloadOutlined />}
              href={record.duong_dan_file} target="_blank" style={{ borderRadius: 6 }} />
          </Tooltip>
          <Popconfirm tieu_de="Xóa tài liệu này?"
            onConfirm={() => handleDelete(record.ma_bieu_mau)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 700, color: '#111827' }}>
          Kho Biểu mẫu & Tài liệu Nội bộ
        </Title>
        <Text style={{ color: '#6b7280' }}>Quản lý biểu mẫu và tài liệu nội bộ của Chi bộ</Text>
      </div>

      <Card
        variant="borderless"
        style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
      >
        {/* [MỚI] Thanh tìm kiếm & lọc */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, marginBottom: 20
        }}>
          <Space wrap>
            <Input
              placeholder="Tìm theo tên biểu mẫu..."
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 260, borderRadius: 8 }}
              allowClear
            />
            <Select
              value={filterUploader}
              onChange={setFilterUploader}
              style={{ width: 200, borderRadius: 8 }}
            >
              <Select.Option value="all">👤 Tất cả người đăng</Select.Option>
              {uploaderOptions.map(name => (
                <Select.Option key={name} value={name}>{name}</Select.Option>
              ))}
            </Select>
            <Text style={{ color: '#6b7280', fontSize: 13, alignSelf: 'center' }}>
              <strong>{filteredForms.length}</strong> / {forms.length} biểu mẫu
            </Text>
          </Space>

          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}
          >
            Tải lên biểu mẫu
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredForms}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
        />
      </Card>

      {/* Modal Upload */}
      <Modal
        tieu_de={
          <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
            📤 Tải lên Biểu mẫu mới
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item name="tieu_de" label="Tên biểu mẫu" rules={[{ required: true, message: 'Nhập tên biểu mẫu!' }]}>
            <Input placeholder="Ví dụ: Mẫu biên bản họp Chi bộ tháng 4" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="File đính kèm" required>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>Chọn file (Word/Excel/PDF)</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large"
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
            Xác nhận tải lên
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default FormManager;