import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Popconfirm, Tag, Tooltip, Space, DatePicker, Row, Col } from 'antd';
import { PlusOutlined, StopOutlined, BankOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';

const { Option } = Select;

const BranchManager = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null); 
  const [form] = Form.useForm();

  const fetchBranches = async () => {
    setLoading(true);
    try {
      let url = '/branches?';
      if (searchText) url += `search=${encodeURIComponent(searchText)}&`;
      if (statusFilter !== '') url += `status=${statusFilter}`;
      
      const res = await axios.get(url);
      setBranches(res.data);
    } catch (error) { message.error('Không thể tải danh sách chi bộ'); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
     const delayDn = setTimeout(() => fetchBranches(), 500);
     return () => clearTimeout(delayDn);
  }, [searchText, statusFilter]);

  const openModal = (record = null) => {
    setEditingBranch(record);
    if (record) {
      form.setFieldsValue({
        ten_chi_bo: record.ten_chi_bo,
        mo_ta: record.mo_ta,
        ngay_thanh_lap: record.ngay_thanh_lap ? dayjs(record.ngay_thanh_lap) : null
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    const payload = {
        ...values,
        ngay_thanh_lap: values.ngay_thanh_lap ? values.ngay_thanh_lap.format('YYYY-MM-DD') : null
    };
    try {
      if (editingBranch) {
        await axios.put(`/branches/${editingBranch.ma_chi_bo}`, payload);
        message.success('Cập nhật thông tin thành công!');
      } else {
        await axios.post('/branches', payload);
        message.success('Thêm chi bộ thành công!');
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (error) { message.error(error.response?.data?.message || 'Lỗi hệ thống'); }
  };

  const handleArchive = async (id) => {
    try {
      await axios.put(`/branches/${id}/archive`);
      message.success('Đã chuyển trạng thái sang giải thể');
      fetchBranches();
    } catch (error) { message.error('Thao tác thất bại'); }
  };

  const columns = [
    { title: 'Mã số', dataIndex: 'ma_chi_bo', key: 'ma_chi_bo', width: 80, align: 'center' },
    { title: 'Tên Chi bộ', dataIndex: 'ten_chi_bo', key: 'ten_chi_bo', render: (text) => <span className="font-semibold text-red-600 text-lg">{text}</span> },
    { title: 'Mô tả / Nhiệm vụ', dataIndex: 'mo_ta', key: 'mo_ta' },
    { title: 'Ngày thành lập', dataIndex: 'ngay_thanh_lap', key: 'ngay_thanh_lap', render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : '-' },
    { title: 'Trạng thái', dataIndex: 'trang_thai', key: 'trang_thai', align: 'center', render: (active) => ( active ? <Tag color="success" className="rounded-md px-2 py-1">Đang hoạt động</Tag> : <Tag color="default" className="rounded-md px-2 py-1">Đã giải thể</Tag> ) },
    { title: 'Thao tác', key: 'action', align: 'center', width: 150, render: (_, record) => ( <Space> {record.trang_thai && ( <Tooltip title="Chỉnh sửa"> <Button type="text" icon={<EditOutlined />} onClick={() => openModal(record)} className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-0" /> </Tooltip> )} {record.trang_thai ? ( <Popconfirm title="Giải thể chi bộ này?" description="Chi bộ sẽ chuyển sang trạng thái lưu trữ." onConfirm={() => handleArchive(record.ma_chi_bo)} okText="Đồng ý" cancelText="Hủy" okButtonProps={{ danger: true }}> <Tooltip title="Dừng hoạt động"> <Button type="text" danger icon={<StopOutlined />} className="bg-red-50 hover:bg-red-100 border-0" /> </Tooltip> </Popconfirm> ) : ( <span className="text-gray-400 text-xs italic">Đã lưu trữ</span> )} </Space> ) }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-['Be_Vietnam_Pro'] pb-8">
      <Card 
        className="rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        variant="borderless"
        title={<span className="text-xl font-bold text-gray-800"><BankOutlined className="mr-2" /> Quản lý Danh sách Chi bộ</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)} className="h-10 px-4 rounded-xl font-medium bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200"> Thêm Chi bộ mới </Button>}
      >
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
            <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={16} md={12}>
                    <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Tìm kiếm chi bộ theo tên..." className="h-10 rounded-lg w-full" value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
                </Col>
                <Col xs={24} sm={8} md={8}>
                    <Select placeholder="Lọc trạng thái" className="h-10 w-full" value={statusFilter} onChange={val => setStatusFilter(val)} options={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'true', label: 'Đang hoạt động' }, { value: 'false', label: 'Đã giải thể' }]}/>
                </Col>
            </Row>
        </div>

        <Table columns={columns} dataSource={branches} rowKey="ma_chi_bo" loading={loading} pagination={{ pageSize: 8, className: "custom-pagination" }} className="border-t border-gray-100 mt-2" rowClassName="hover:bg-gray-50 transition-colors" />
      </Card>

      <Modal title={<span className="text-lg font-bold">{editingBranch ? "Chỉnh sửa thông tin" : "Thêm Chi bộ mới"}</span>} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} className="rounded-2xl overflow-hidden font-['Be_Vietnam_Pro']" destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item name="ten_chi_bo" label={<span className="font-semibold">Tên Chi bộ</span>} rules={[{ required: true, message: 'Vui lòng nhập tên chi bộ!' }]}>
            <Input size="large" prefix={<BankOutlined className="text-gray-400" />} placeholder="Ví dụ: Chi bộ Sinh viên 1" className="rounded-lg" />
          </Form.Item>

          <Form.Item name="mo_ta" label={<span className="font-semibold">Mô tả chức năng nhiệm vụ</span>}>
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn..." className="rounded-lg" />
          </Form.Item>

          <Form.Item name="ngay_thanh_lap" label={<span className="font-semibold">Ngày thành lập</span>}>
             <DatePicker size="large" className="w-full rounded-lg" format="DD/MM/YYYY" placeholder="Chọn ngày thành lập (Để trống: tự lấy ngày hôm nay)" />
          </Form.Item>

          <Form.Item className="mt-6 mb-0">
            <Button type="primary" htmlType="submit" block size="large" className="rounded-xl h-12 font-bold text-base bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">
              {editingBranch ? "Lưu thay đổi" : "Xác nhận thêm"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default BranchManager;