import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Upload, message, Space, Tag, Popconfirm, Tooltip, Row, Col, Select } from 'antd';
import { UploadOutlined, CloudDownloadOutlined, DeleteOutlined, PlusOutlined, EditOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../services/axiosConfig';

// Danh sách loại văn bản preset - cũng cho phép nhập tự do
const DOC_TYPES = [
  'Nghị quyết',
  'Quyết định',
  'Thông báo',
  'Báo cáo',
  'Kế hoạch',
  'Hướng dẫn',
  'Công văn',
  'Biên bản',
  'Tờ trình',
  'Chương trình',
];

const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  // typeFilter lưu giá trị từ dropdown
  const [typeFilter, setTypeFilter] = useState('');

  const [fileList, setFileList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [form] = Form.useForm();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/documents?';
      if (searchText) url += `search=${encodeURIComponent(searchText)}&`;
      if (typeFilter)  url += `type=${encodeURIComponent(typeFilter)}&`;

      const response = await axios.get(url);
      setDocuments(response.data || []); 
    } catch (error) { 
      message.error('Không thể tải danh sách tài liệu!'); 
    } finally { 
      setLoading(false); 
    }
  }, [searchText, typeFilter]);

  useEffect(() => { 
    const delay = setTimeout(() => fetchDocuments(), 500);
    return () => clearTimeout(delay);
  }, [fetchDocuments]);

  const openModal = (record = null) => {
    setEditingDoc(record);
    setFileList([]);
    if (record) {
      form.setFieldsValue({ ten_tai_lieu: record.ten_tai_lieu, loai_tai_lieu: record.loai_tai_lieu });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleUploadOrUpdate = async (values) => {
    if (!editingDoc && fileList.length === 0) {
      return message.error('Vui lòng chọn file đính kèm để tải lên!');
    }
    setLoading(true);
    try {
      if (editingDoc) {
        const payload = { ten_tai_lieu: values.ten_tai_lieu, loai_tai_lieu: values.loai_tai_lieu };
        await axios.put(`/documents/${editingDoc.ma_tai_lieu}`, payload);
        message.success('Cập nhật thông tin tài liệu thành công!');
      } else {
        const formData = new FormData();
        formData.append('file', fileList[0]); 
        formData.append('ten_tai_lieu', values.ten_tai_lieu);
        formData.append('loai_tai_lieu', values.loai_tai_lieu);
        // Không gửi ma_chi_bo → backend sẽ gửi thông báo 'All' cho mọi Admin & User
        await axios.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success('Tải lên thành công!');
      }
      setIsModalOpen(false);
      fetchDocuments();
    } catch (error) { 
      message.error('Lỗi thao tác: ' + (error.response?.data?.message || 'Lỗi server')); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/documents/${id}`);
      message.success('Đã xóa tài liệu!');
      fetchDocuments();
    } catch (error) { message.error('Xóa thất bại!'); }
  };

  const columns = [
    { 
      title: 'Tên văn bản', 
      dataIndex: 'ten_tai_lieu', 
      key: 'ten_tai_lieu', 
      render: (text) => <span style={{ fontWeight: 600, color: '#1f2937' }}>{text}</span> 
    },
    { 
      title: 'Loại', 
      dataIndex: 'loai_tai_lieu', 
      key: 'loai_tai_lieu', 
      width: 140,
      render: (text) => <Tag color="blue" style={{ borderRadius: 6 }}>{text}</Tag> 
    },
    {
      title: 'File đính kèm', 
      key: 'file',
      width: 160,
      render: (_, record) => (
        <a 
          href={record.duong_dan} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: '#3b82f6', 
            fontWeight: 500, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            backgroundColor: '#eff6ff',
            padding: '4px 12px',
            borderRadius: 20 
          }}
        >
          <CloudDownloadOutlined /> Xem / Tải về
        </a>
      ),
    },
    {
      title: 'Hành động', 
      key: 'action', 
      align: 'center', 
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Sửa tên/loại">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openModal(record)} 
              style={{ color: '#d97706', backgroundColor: '#fef3c7', border: 'none' }}
            />
          </Tooltip>
          <Popconfirm 
            title="Xóa tài liệu này?" 
            description="Hành động này sẽ xóa file vĩnh viễn khỏi hệ thống." 
            onConfirm={() => handleDelete(record.ma_tai_lieu)} 
            okText="Xóa ngay" 
            cancelText="Hủy" 
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa tài liệu">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                style={{ backgroundColor: '#fef2f2', border: 'none' }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-['Be_Vietnam_Pro'] pb-8">
      <Card 
        className="rounded-2xl"
        variant="borderless"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
        title={
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
            <FileTextOutlined style={{ marginRight: 8 }} /> Quản lý Văn bản & Tài liệu
          </span>
        } 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal(null)} 
            style={{ height: 40, borderRadius: 10, fontWeight: 600, backgroundColor: '#dc2626', border: 'none' }}
          >
            Thêm tài liệu
          </Button>
        }
      >
        {/* ===== BỘ LỌC TÀI LIỆU ===== */}
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} md={14} lg={16}>
              {/* Thanh tìm kiếm theo tên */}
              <Input 
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} 
                placeholder="Tìm kiếm tên tài liệu / văn bản..." 
                style={{ height: 40, borderRadius: 8 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={10} lg={8}>
              {/* Dropdown lọc theo LOẠI - hiển thị đầy đủ thông tin */}
              <Select 
                placeholder="Lọc theo loại văn bản" 
                style={{ height: 40, width: '100%' }}
                value={typeFilter || undefined}
                onChange={val => setTypeFilter(val || '')}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {DOC_TYPES.map(type => (
                  <Select.Option key={type} value={type}>{type}</Select.Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        <Table 
          columns={columns} 
          dataSource={documents} 
          rowKey="ma_tai_lieu" 
          loading={loading} 
          pagination={{ pageSize: 8 }}
          className="border-t border-gray-100"
          rowClassName="hover:bg-gray-50 transition-colors"
        />
      </Card>

      <Modal 
        title={
          <span style={{ fontSize: 17, fontWeight: 700 }}>
            {editingDoc ? "Cập nhật thông tin Tài liệu" : "Tải lên tài liệu mới"}
          </span>
        } 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        className="rounded-2xl overflow-hidden font-['Be_Vietnam_Pro']" 
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleUploadOrUpdate} className="mt-4">
          <Form.Item 
            name="ten_tai_lieu" 
            label={<span className="font-semibold">Tên văn bản</span>} 
            rules={[{ required: true, message: 'Nhập tên văn bản' }]}
          >
            <Input size="large" className="rounded-lg" placeholder="Ví dụ: Nghị quyết TW5 khóa XIII" />
          </Form.Item>

          <Form.Item 
            name="loai_tai_lieu" 
            label={<span className="font-semibold">Loại văn bản</span>} 
            rules={[{ required: true, message: 'Chọn hoặc nhập loại văn bản' }]}
          >
            {/* Select + showSearch để tìm kiếm + nhập tự do */}
            <Select 
              size="large"
              showSearch 
              allowClear
              placeholder="Chọn hoặc nhập loại văn bản..."
              optionFilterProp="children"
              style={{ borderRadius: 8 }}
              // mode không phải tags vì server chỉ nhận string đơn
            >
              {DOC_TYPES.map(type => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {!editingDoc && (
            <Form.Item label={<span className="font-semibold">Đính kèm file (PDF/Img) <span className="text-red-500">*</span></span>}>
              <Upload 
                beforeUpload={(file) => { setFileList([file]); return false; }} 
                fileList={fileList} 
                onRemove={() => setFileList([])} 
                maxCount={1}
              >
                <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>Chọn file (Bắt buộc)</Button>
              </Upload>
            </Form.Item>
          )}

          <Form.Item className="mb-0 mt-6">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block 
              size="large" 
              style={{ borderRadius: 10, height: 48, fontWeight: 700, fontSize: 16, backgroundColor: '#dc2626', border: 'none' }}
            >
              {editingDoc ? "Lưu thay đổi" : "Xác nhận tải lên"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default DocumentManager;