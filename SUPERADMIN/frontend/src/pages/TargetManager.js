import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Progress, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, AimOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';

const TargetManager = () => {
  const [targets, setTargets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTargets, resBranches] = await Promise.all([
        axios.get('/targets'),
        axios.get('/branches')
      ]);
      setTargets(resTargets.data);
      setBranches(resBranches.data);
    } catch (error) { message.error('Lỗi tải dữ liệu'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values) => {
    try {
      await axios.post('/targets', values);
      message.success('Giao chỉ tiêu thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) { message.error('Thất bại'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/targets/${id}`);
      message.success('Đã xóa chỉ tiêu');
      fetchData();
    } catch (error) { message.error('Xóa thất bại'); }
  };

  const columns = [
    { title: 'Tên Chỉ tiêu', dataIndex: 'ten_chi_tieu', render: t => <b>{t}</b> },
    { title: 'Năm học', dataIndex: 'nam_hoc', width: 100 },
    { title: 'Chi bộ thực hiện', dataIndex: 'ten_chi_bo', render: t => <Tag color="geekblue">{t}</Tag> },
    { 
      title: 'Tiến độ', 
      key: 'progress',
      render: (_, r) => {
        const percent = Math.round((r.so_luong_dat_duoc / r.so_luong_muc_tieu) * 100) || 0;
        return <Progress percent={percent} size="small" status={percent >= 100 ? "success" : "active"} />
      }
    },
    { 
        title: 'Mục tiêu', 
        render: (_, r) => <span>{r.so_luong_dat_duoc} / <b>{r.so_luong_muc_tieu}</b></span> 
    },
    {
      title: '', key: 'action',
      render: (_, r) => (
        <Popconfirm title="Xóa chỉ tiêu này?" onConfirm={() => handleDelete(r.ma_chi_tieu)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <Card title={<span><AimOutlined /> Quản lý Chỉ tiêu Công tác</span>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Giao chỉ tiêu mới</Button>}>
      <Table columns={columns} dataSource={targets} rowKey="ma_chi_tieu" loading={loading} />
      
      <Modal title="Giao Chỉ tiêu cho Chi bộ" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="ten_chi_tieu" label="Nội dung chỉ tiêu" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Kết nạp Đảng viên mới" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="nam_hoc" label="Năm học" initialValue={new Date().getFullYear()} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="so_luong_muc_tieu" label="Số lượng mục tiêu" rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="ma_chi_bo" label="Chi bộ thực hiện" rules={[{ required: true }]}>
            <Select placeholder="Chọn chi bộ">
              {branches.map(b => <Select.Option key={b.ma_chi_bo} value={b.ma_chi_bo}>{b.ten_chi_bo}</Select.Option>)}
            </Select>
          </Form.Item>
          
          <Button type="primary" htmlType="submit" block>Lưu Chỉ tiêu</Button>
        </Form>
      </Modal>
    </Card>
  );
};
export default TargetManager;