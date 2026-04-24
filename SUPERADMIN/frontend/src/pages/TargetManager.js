import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Progress, Tag, message, Popconfirm, Switch, Row, Col, Space, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, AimOutlined, CheckCircleOutlined, SyncOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../services/axiosConfig';

const TargetManager = () => {
  const [targets, setTargets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [form] = Form.useForm();

  // Tải chi bộ 1 lần duy nhất
  const fetchBranches = useCallback(async () => {
    try {
      const res = await axios.get('/branches');
      setBranches(res.data || []);
    } catch (e) { /* bỏ qua */ }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/targets?';
      if (searchText)   url += `search=${encodeURIComponent(searchText)}&`;
      if (branchFilter) url += `branch=${branchFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await axios.get(url);
      setTargets(res.data || []);
    } catch (error) { 
      message.error('Lỗi tải danh sách chỉ tiêu'); 
    } finally { 
      setLoading(false); 
    }
  }, [searchText, branchFilter, statusFilter]);

  useEffect(() => { 
    const delay = setTimeout(() => fetchTargets(), 500);
    return () => clearTimeout(delay);
  }, [fetchTargets]);

  const openModal = (record = null) => {
    setEditingTarget(record);
    if (record) {
      form.setFieldsValue({
        ten_chi_tieu: record.ten_chi_tieu,
        nam_hoc: record.nam_hoc,
        so_luong_muc_tieu: record.so_luong_muc_tieu,
        ma_chi_bo: record.ma_chi_bo
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingTarget) {
        await axios.put(`/targets/${editingTarget.ma_chi_tieu}`, values);
        message.success('Cập nhật chỉ tiêu thành công');
      } else {
        await axios.post('/targets', values);
        message.success('Giao chỉ tiêu thành công');
      }
      setIsModalOpen(false);
      fetchTargets();
    } catch (error) { message.error('Thao tác thất bại'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/targets/${id}`);
      message.success('Đã xóa chỉ tiêu');
      fetchTargets();
    } catch (error) { message.error('Xóa thất bại'); }
  };

  const handleUpdateStatus = async (id, checked) => {
    try {
      const trang_thai = checked ? 'Hoàn thành' : 'Chưa hoàn thành';
      await axios.put(`/targets/${id}`, { trang_thai });
      message.success('Cập nhật trạng thái thành công');
      fetchTargets();
    } catch (e) { message.error('Lỗi cập nhật trạng thái'); }
  };

  const columns = [
    { 
      title: 'Tên Chỉ tiêu', 
      dataIndex: 'ten_chi_tieu', 
      // Đặt width % để cột này rộng hơn
      width: '28%',
      render: t => <span style={{ fontWeight: 600, color: '#1f2937', lineHeight: '1.5' }}>{t}</span> 
    },
    { 
      title: 'Năm học', 
      dataIndex: 'nam_hoc', 
      width: 100,
      align: 'center',
      render: t => <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600, fontSize: 13 }}>{t}</Tag> 
    },
    { 
      title: 'Chi bộ thực hiện', 
      dataIndex: 'ten_chi_bo', 
      width: '22%',
      // Cho phép xuống dòng thay vì cắt chữ
      render: t => (
        <Tag 
          color="geekblue" 
          style={{ borderRadius: 6, whiteSpace: 'normal', lineHeight: '1.5', height: 'auto', padding: '3px 8px', display: 'inline-block' }}
        >
          {t}
        </Tag>
      )
    },
    { 
      title: 'Tiến độ', 
      key: 'progress', 
      width: 130,
      render: (_, r) => {
        const percent = r.so_luong_muc_tieu > 0 
          ? Math.round((r.so_luong_dat_duoc / r.so_luong_muc_tieu) * 100) 
          : 0;
        return <Progress percent={percent} size="small" status={percent >= 100 ? "success" : "active"} />
      }
    },
    { 
      title: 'Đạt / Mục tiêu', 
      width: 110,
      align: 'center',
      render: (_, r) => (
        <span style={{ color: '#6b7280' }}>
          {r.so_luong_dat_duoc} / <b style={{ color: '#dc2626', fontSize: 16 }}>{r.so_luong_muc_tieu}</b>
        </span>
      )
    },
    {
      title: 'Đánh giá',
      key: 'danh_gia',
      align: 'center',
      width: 100,
      render: (_, record) => {
        const isCompleted = record.trang_thai === 'Hoàn thành';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Switch 
              checked={isCompleted} 
              onChange={(checked) => handleUpdateStatus(record.ma_chi_tieu, checked)} 
              style={{ backgroundColor: isCompleted ? '#22c55e' : '#d1d5db' }}
            />
            {isCompleted 
              ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500, whiteSpace: 'nowrap' }}><CheckCircleOutlined /> Đạt</span> 
              : <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap' }}><SyncOutlined spin /> Chưa đạt</span>
            }
          </div>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      width: 110,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Sửa chỉ tiêu">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openModal(r)} 
              style={{ color: '#d97706', backgroundColor: '#fef3c7', border: 'none' }}
            />
          </Tooltip>
          <Popconfirm 
            title="Xóa chỉ tiêu này?" 
            onConfirm={() => handleDelete(r.ma_chi_tieu)} 
            okText="Xóa" 
            cancelText="Hủy" 
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              style={{ backgroundColor: '#fef2f2', border: 'none' }}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-['Be_Vietnam_Pro'] pb-8">
      <Card 
        className="rounded-2xl"
        variant="borderless"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
        title={<span style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}><AimOutlined style={{ marginRight: 8 }} />Quản lý Chỉ tiêu Công tác</span>} 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => openModal(null)} 
            style={{ height: 40, borderRadius: 10, fontWeight: 600, backgroundColor: '#dc2626', border: 'none' }}
          >
            Giao chỉ tiêu mới
          </Button>
        }
      >
        {/* ===== BỘ LỌC CHỈ TIÊU ===== */}
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={24} md={9}>
              <Input 
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} 
                placeholder="Tìm kiếm tên chỉ tiêu..." 
                style={{ height: 40, borderRadius: 8 }}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select 
                placeholder="Tất cả Chi bộ" 
                style={{ height: 40, width: '100%' }}
                value={branchFilter || undefined}
                onChange={val => setBranchFilter(val || '')}
                allowClear
                popupMatchSelectWidth={false}
                styles={{ popup: { root: { minWidth: 300 } } }}
              >
                {branches.map(b => (
                  <Select.Option key={b.ma_chi_bo} value={b.ma_chi_bo}>
                    {b.ten_chi_bo}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={7}>
              <Select 
                placeholder="Tất cả Tiến độ" 
                style={{ height: 40, width: '100%' }}
                value={statusFilter || undefined}
                onChange={val => setStatusFilter(val || '')}
                allowClear
              >
                <Select.Option value="active">Đang thực hiện</Select.Option>
                <Select.Option value="completed">Đã hoàn thành</Select.Option>
              </Select>
            </Col>
          </Row>
        </div>

        <Table 
          columns={columns} 
          dataSource={targets} 
          rowKey="ma_chi_tieu" 
          loading={loading} 
          pagination={{ pageSize: 8 }} 
          className="border-t border-gray-100"
          rowClassName="hover:bg-gray-50 transition-colors"
          // Thêm scroll ngang để bảng không bị vỡ layout trên màn hình nhỏ
          scroll={{ x: 820 }}
        />
        
        <Modal 
          title={<span className="text-lg font-bold">{editingTarget ? "Chỉnh sửa Chỉ tiêu" : "Giao Chỉ tiêu cho Chi bộ"}</span>} 
          open={isModalOpen} 
          onCancel={() => setIsModalOpen(false)} 
          footer={null} 
          className="rounded-2xl overflow-hidden font-['Be_Vietnam_Pro']" 
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
            <Form.Item 
              name="ten_chi_tieu" 
              label={<span className="font-semibold">Nội dung chỉ tiêu</span>} 
              rules={[{ required: true, message: 'Nhập nội dung chỉ tiêu!' }]}
            >
              <Input size="large" className="rounded-lg" placeholder="Ví dụ: Kết nạp Đảng viên mới" />
            </Form.Item>
            
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item 
                  name="nam_hoc" 
                  label={<span className="font-semibold">Năm học</span>} 
                  initialValue="2024-2025" 
                  rules={[{ required: true, message: 'Nhập năm học!' }]}
                >
                  <Input size="large" className="rounded-lg" placeholder="2024-2025" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="so_luong_muc_tieu" 
                  label={<span className="font-semibold">Số lượng mục tiêu</span>} 
                  rules={[{ required: true, message: 'Nhập số lượng!' }]}
                >
                  <InputNumber size="large" min={1} style={{ width: '100%', borderRadius: 8 }} placeholder="1, 5, 10..." />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item 
              name="ma_chi_bo" 
              label={<span className="font-semibold">Chi bộ thực hiện</span>} 
              rules={[{ required: true, message: 'Vui lòng chọn chi bộ!' }]}
            >
              <Select 
                size="large" 
                className="rounded-lg" 
                placeholder="Chọn chi bộ"
                popupMatchSelectWidth={false}
                styles={{ popup: { root: { minWidth: 300 } } }}
              >
                {branches.map(b => <Select.Option key={b.ma_chi_bo} value={b.ma_chi_bo}>{b.ten_chi_bo}</Select.Option>)}
              </Select>
            </Form.Item>
            
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large" 
              style={{ borderRadius: 10, height: 48, fontWeight: 700, fontSize: 16, backgroundColor: '#dc2626', border: 'none', marginTop: 16 }}
            >
              Lưu Quyết định Chỉ tiêu
            </Button>
          </Form>
        </Modal>
      </Card>
    </motion.div>
  );
};

export default TargetManager;