import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Upload, message, Popconfirm, Tag, Tooltip, Space, InputNumber, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, AppstoreOutlined, FileImageOutlined, TeamOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../services/axiosConfig';

const { TabPane } = Tabs;

const LandingManager = () => {
  const [orgData, setOrgData] = useState([]);
  const [processData, setProcessData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  // Modal Org
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [orgForm] = Form.useForm();
  const [orgFileList, setOrgFileList] = useState([]);

  // Modal Process
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processForm] = Form.useForm();
  const [processFileList, setProcessFileList] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === '1') {
        const res = await axios.get('/landing/org-chart');
        setOrgData(res.data);
      } else {
        const res = await axios.get('/landing/process');
        setProcessData(res.data);
      }
    } catch (error) {
      // Bỏ qua lỗi lần đầu nếu chưa khởi tạo bảng
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // === XỬ LÝ SƠ ĐỒ TỔ CHỨC ===
  const handleCreateOrg = async (values) => {
    const formData = new FormData();
    formData.append('ho_ten', values.ho_ten);
    formData.append('chuc_vu', values.chuc_vu);
    if (values.thu_tu) formData.append('thu_tu', values.thu_tu);
    if (values.ma_so_do_cha) formData.append('ma_so_do_cha', values.ma_so_do_cha);
    if (orgFileList.length > 0) formData.append('file', orgFileList[0]);

    setLoading(true);
    try {
      await axios.post('/landing/org-chart', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('Thêm nhân sự cấu trúc thành công');
      orgForm.resetFields();
      setIsOrgModalOpen(false);
      setOrgFileList([]);
      fetchData();
    } catch (error) { message.error('Lỗi khi thêm'); }
    finally { setLoading(false); }
  };

  const handleDeleteOrg = async (id) => {
    try {
      await axios.delete(`/landing/org-chart/${id}`);
      message.success('Xóa thành công');
      fetchData();
    } catch (e) { message.error('Xóa thất bại'); }
  };

  // === XỬ LÝ QUY TRÌNH ===
  const handleCreateProcess = async (values) => {
    const formData = new FormData();
    formData.append('tieu_de', values.tieu_de);
    formData.append('mo_ta', values.mo_ta || '');
    if (values.thu_tu) formData.append('thu_tu', values.thu_tu);
    
    if (processFileList.length === 0) return message.error('Vui lòng chọn ảnh / file quy trình!');
    formData.append('file', processFileList[0]);

    setLoading(true);
    try {
      await axios.post('/landing/process', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('Thêm quy trình thành công');
      processForm.resetFields();
      setIsProcessModalOpen(false);
      setProcessFileList([]);
      fetchData();
    } catch (error) { message.error('Lỗi khi thêm'); }
    finally { setLoading(false); }
  };

  const handleDeleteProcess = async (id) => {
    try {
      await axios.delete(`/landing/process/${id}`);
      message.success('Xóa thành công');
      fetchData();
    } catch (e) { message.error('Xóa thất bại'); }
  };

  // Cột Sơ đồ tổ chức
  const orgColumns = [
    { title: 'Ảnh', dataIndex: 'anh_the', render: (url) => url ? <img src={url} alt="Avt" className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200" /> : <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-400">Trống</div> },
    { title: 'Họ và tên', dataIndex: 'ho_ten', render: t => <span className="font-semibold text-gray-800 text-base">{t}</span> },
    { title: 'Chức vụ', dataIndex: 'chuc_vu', render: t => <Tag color="blue" className="rounded-md">{t}</Tag> },
    { title: 'Thứ tự hiển thị', dataIndex: 'thu_tu', align: 'center', render: t => <b className="text-gray-500">{t}</b> },
    { title: 'Thao tác', key: 'action', align: 'center', width: 100, render: (_, r) => ( <Popconfirm title="Xóa nhân sự này?" onConfirm={() => handleDeleteOrg(r.ma_so_do)} okText="Xóa" cancelText="Hủy"><Button danger type="text" icon={<DeleteOutlined />} className="bg-red-50 hover:bg-red-100" /></Popconfirm> ) }
  ];

  // Cột Quy trình Đảng
  const processColumns = [
    { title: 'Tiêu đề quy trình', dataIndex: 'tieu_de', render: t => <span className="font-semibold text-gray-800 text-base">{t}</span> },
    { title: 'Mô tả ngắn gọn', dataIndex: 'mo_ta' },
    { title: 'File/Ảnh Minh họa', dataIndex: 'duong_dan_file', render: (url) => <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full"><FileImageOutlined /> Xem biểu đồ</a> },
    { title: 'Thứ tự', dataIndex: 'thu_tu', align: 'center' },
    { title: 'Thao tác', key: 'action', align: 'center', width: 100, render: (_, r) => ( <Popconfirm title="Xóa quy trình này?" onConfirm={() => handleDeleteProcess(r.ma_quy_trinh)} okText="Xóa" cancelText="Hủy"><Button danger type="text" icon={<DeleteOutlined />} className="bg-red-50 hover:bg-red-100" /></Popconfirm> ) }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-['Be_Vietnam_Pro'] pb-8">
      <Card 
        className="rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        variant="borderless"
        title={<span className="text-xl font-bold text-gray-800"><AppstoreOutlined className="mr-2" /> Quản lý Giao diện Landing Page</span>}
      >
        <Tabs 
          defaultActiveKey="1" 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          size="large" 
          className="custom-tabs"
          items={[
            {
              key: '1',
              label: <span className="font-semibold"><TeamOutlined /> Sơ đồ Tổ chức Đảng ủy</span>,
              children: (
                <div className="mt-4">
                  <div className="flex justify-end mb-4">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsOrgModalOpen(true)} className="h-10 px-4 rounded-xl font-medium bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Thêm nhân sự / cấu trúc</Button>
                  </div>
                  <Table columns={orgColumns} dataSource={orgData} rowKey="ma_so_do" loading={loading} pagination={false} className="border-t border-gray-100" rowClassName="hover:bg-gray-50 transition-colors" />
                </div>
              )
            },
            {
              key: '2',
              label: <span className="font-semibold"><FileImageOutlined /> Các Quy trình Công tác Đảng</span>,
              children: (
                <div className="mt-4">
                  <div className="flex justify-end mb-4">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsProcessModalOpen(true)} className="h-10 px-4 rounded-xl font-medium bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Đăng biểu đồ quy trình</Button>
                  </div>
                  <Table columns={processColumns} dataSource={processData} rowKey="ma_quy_trinh" loading={loading} pagination={false} className="border-t border-gray-100" rowClassName="hover:bg-gray-50 transition-colors" />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* MODAL ORG */}
      <Modal title={<span className="text-lg font-bold">Thêm dữ liệu Sơ đồ tổ chức</span>} open={isOrgModalOpen} onCancel={() => setIsOrgModalOpen(false)} footer={null} className="rounded-2xl overflow-hidden" destroyOnHidden>
        <Form form={orgForm} layout="vertical" onFinish={handleCreateOrg} className="mt-4">
          <Form.Item name="ho_ten" label={<span className="font-semibold text-gray-700">Họ và tên</span>} rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input size="large" className="rounded-lg" placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="chuc_vu" label={<span className="font-semibold text-gray-700">Chức vụ</span>} rules={[{ required: true, message: 'Nhập chức vụ!' }]}>
            <Input size="large" className="rounded-lg" placeholder="Ví dụ: Bí thư Đảng ủy" />
          </Form.Item>
          <Form.Item label={<span className="font-semibold text-gray-700">Ảnh chân dung (nếu có)</span>}>
              <Upload beforeUpload={(file) => { setOrgFileList([file]); return false; }} fileList={orgFileList} onRemove={() => setOrgFileList([])} maxCount={1}>
                  <Button icon={<UploadOutlined />} className="rounded-lg">Chọn ảnh (jpg, png)</Button>
              </Upload>
          </Form.Item>
          <Form.Item name="thu_tu" label={<span className="font-semibold text-gray-700">Thứ tự ưu tiên hiển thị</span>} help="Số nhỏ hiện trước (Ví dụ: 1 ưu tiên đứng đầu)">
            <InputNumber min={0} size="large" className="w-full rounded-lg" placeholder="Ví dụ: 1" />
          </Form.Item>
          <Form.Item className="mb-0 mt-6"><Button type="primary" htmlType="submit" loading={loading} block size="large" className="rounded-xl h-12 font-bold bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Lưu thông tin</Button></Form.Item>
        </Form>
      </Modal>

      {/* MODAL PROCESS */}
      <Modal title={<span className="text-lg font-bold">Thêm Biểu đồ / Quy trình mới</span>} open={isProcessModalOpen} onCancel={() => setIsProcessModalOpen(false)} footer={null} className="rounded-2xl overflow-hidden" destroyOnHidden>
        <Form form={processForm} layout="vertical" onFinish={handleCreateProcess} className="mt-4">
          <Form.Item name="tieu_de" label={<span className="font-semibold text-gray-700">Tên quy trình</span>} rules={[{ required: true, message: 'Nhập tên!' }]}>
            <Input size="large" className="rounded-lg" placeholder="Ví dụ: Quy trình kết nạp Đảng viên" />
          </Form.Item>
          <Form.Item name="mo_ta" label={<span className="font-semibold text-gray-700">Mô tả tóm tắt</span>}>
            <Input.TextArea rows={3} className="rounded-lg" placeholder="Mô tả nội dung quy trình..." />
          </Form.Item>
          <Form.Item label={<span className="font-semibold text-gray-700">Biểu đồ (Bắt buộc img/pdf)</span>}>
              <Upload beforeUpload={(file) => { setProcessFileList([file]); return false; }} fileList={processFileList} onRemove={() => setProcessFileList([])} maxCount={1}>
                  <Button icon={<UploadOutlined />} className="rounded-lg border-blue-400 text-blue-600 font-medium bg-blue-50">Chọn ảnh Flowchart</Button>
              </Upload>
          </Form.Item>
          <Form.Item name="thu_tu" label={<span className="font-semibold text-gray-700">Thứ tự hiển thị</span>}>
            <InputNumber min={0} size="large" className="w-full rounded-lg" placeholder="1, 2, 3..." />
          </Form.Item>
          <Form.Item className="mb-0 mt-6"><Button type="primary" htmlType="submit" loading={loading} block size="large" className="rounded-xl h-12 font-bold bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Xác nhận tải lên</Button></Form.Item>
        </Form>
      </Modal>

    </motion.div>
  );
};
export default LandingManager;
