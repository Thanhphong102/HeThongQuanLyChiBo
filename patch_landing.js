const fs = require('fs');

const fileContent = `import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Upload, message, Popconfirm, Tag, Tooltip, Space, InputNumber, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, AppstoreOutlined, FileImageOutlined, TeamOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../services/axiosConfig';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const { TabPane } = Tabs;

const getDirectImageUrl = (url) => {
  if (!url) return '';
  const match = url.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)\\//);
  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const id = (match && match[1]) || (idParamMatch && idParamMatch[1]);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  if (id) {
    return \`\${apiBaseUrl}/media/proxy/\${id}\`;
  }
  return url;
};

const LandingManager = () => {
  const [orgData, setOrgData] = useState([]);
  const [processData, setProcessData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  // Modal Org
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [orgForm] = Form.useForm();
  const [orgFileList, setOrgFileList] = useState([]);
  const [editingOrgId, setEditingOrgId] = useState(null);

  // Modal Process
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processForm] = Form.useForm();
  const [processFileList, setProcessFileList] = useState([]);
  const [editingProcessId, setEditingProcessId] = useState(null);

  // Detail Modal Process
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);

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
  const handleSaveOrg = async (values) => {
    const formData = new FormData();
    formData.append('ho_ten', values.ho_ten);
    formData.append('chuc_vu', values.chuc_vu);
    if (values.thu_tu) formData.append('thu_tu', values.thu_tu);
    if (values.ma_so_do_cha) formData.append('ma_so_do_cha', values.ma_so_do_cha);
    if (orgFileList.length > 0 && orgFileList[0].originFileObj) {
        formData.append('file', orgFileList[0].originFileObj);
    }

    setLoading(true);
    try {
      if (editingOrgId) {
        await axios.put(\`/landing/org-chart/\${editingOrgId}\`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success('Cập nhật nhân sự thành công');
      } else {
        await axios.post('/landing/org-chart', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success('Thêm nhân sự cấu trúc thành công');
      }
      orgForm.resetFields();
      setIsOrgModalOpen(false);
      setOrgFileList([]);
      setEditingOrgId(null);
      fetchData();
    } catch (error) { message.error('Lỗi khi lưu thông tin'); }
    finally { setLoading(false); }
  };

  const handleEditOrg = (record) => {
    setEditingOrgId(record.ma_so_do);
    orgForm.setFieldsValue({
      ho_ten: record.ho_ten,
      chuc_vu: record.chuc_vu,
      thu_tu: record.thu_tu,
      ma_so_do_cha: record.ma_so_do_cha
    });
    setOrgFileList([]); // We don't preload the actual file, just allow uploading a new one to replace
    setIsOrgModalOpen(true);
  };

  const handleDeleteOrg = async (id) => {
    try {
      await axios.delete(\`/landing/org-chart/\${id}\`);
      message.success('Xóa thành công');
      fetchData();
    } catch (e) { message.error('Xóa thất bại'); }
  };

  // === XỬ LÝ QUY TRÌNH ===
  const handleSaveProcess = async (values) => {
    const formData = new FormData();
    formData.append('tieu_de', values.tieu_de);
    formData.append('mo_ta', values.mo_ta || '');
    
    // Process new files
    const filesToUpload = processFileList.filter(f => f.originFileObj).map(f => f.originFileObj);
    if (!editingProcessId && filesToUpload.length === 0) {
      // return message.error('Vui lòng chọn tài liệu đính kèm!');
    }
    
    filesToUpload.forEach(file => {
      formData.append('files', file);
    });

    setLoading(true);
    try {
      if (editingProcessId) {
        await axios.put(\`/landing/process/\${editingProcessId}\`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success('Cập nhật quy trình thành công');
      } else {
        await axios.post('/landing/process', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success('Thêm quy trình thành công');
      }
      processForm.resetFields();
      setIsProcessModalOpen(false);
      setProcessFileList([]);
      setEditingProcessId(null);
      fetchData();
    } catch (error) { message.error('Lỗi khi lưu quy trình'); }
    finally { setLoading(false); }
  };

  const handleEditProcess = (record) => {
    setEditingProcessId(record.ma_quy_trinh);
    processForm.setFieldsValue({
      tieu_de: record.tieu_de,
      mo_ta: record.mo_ta
    });
    setProcessFileList([]);
    setIsProcessModalOpen(true);
  };

  const handleDeleteProcess = async (id) => {
    try {
      await axios.delete(\`/landing/process/\${id}\`);
      message.success('Xóa thành công');
      fetchData();
    } catch (e) { message.error('Xóa thất bại'); }
  };

  // Cột Sơ đồ tổ chức
  const orgColumns = [
    { title: 'Ảnh', dataIndex: 'anh_the', render: (url) => url ? <img src={getDirectImageUrl(url)} alt="Avt" className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200" /> : <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-400">Trống</div> },
    { title: 'Họ và tên', dataIndex: 'ho_ten', render: t => <span className="font-semibold text-gray-800 text-base">{t}</span> },
    { title: 'Chức vụ', dataIndex: 'chuc_vu', render: t => <Tag color="blue" className="rounded-md">{t}</Tag> },
    { title: 'Thứ tự hiển thị', dataIndex: 'thu_tu', align: 'center', render: t => <b className="text-gray-500">{t}</b> },
    { title: 'Thao tác', key: 'action', align: 'center', width: 120, render: (_, r) => ( 
      <Space>
        <Tooltip title="Sửa"><Button type="text" icon={<EditOutlined />} onClick={() => handleEditOrg(r)} className="text-blue-500 hover:bg-blue-50" /></Tooltip>
        <Popconfirm title="Xóa nhân sự này?" onConfirm={() => handleDeleteOrg(r.ma_so_do)} okText="Xóa" cancelText="Hủy"><Button danger type="text" icon={<DeleteOutlined />} className="hover:bg-red-50" /></Popconfirm> 
      </Space>
    ) }
  ];

  // Helper cho file đính kèm
  const renderAttachments = (fileData) => {
    if (!fileData) return null;
    let files = [];
    try {
      files = JSON.parse(fileData);
    } catch (e) {
      // fallback for old data
      return <a href={getDirectImageUrl(fileData)} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-xs">Xem đính kèm</a>;
    }
    
    if (!Array.isArray(files) || files.length === 0) return <span className="text-gray-400 text-xs">Không có</span>;
    return (
      <div className="flex flex-col gap-1">
        {files.map((f, i) => (
          <a key={i} href={getDirectImageUrl(f.url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs truncate max-w-[200px]" title={f.name}>
            📎 {f.name}
          </a>
        ))}
      </div>
    );
  };

  // Cột Quy trình Đảng
  const processColumns = [
    { title: 'Tiêu đề quy trình', dataIndex: 'tieu_de', render: t => <span className="font-semibold text-gray-800 text-base">{t}</span> },
    { title: 'Chi tiết quy trình', align: 'center', render: (_, r) => (
        <Tooltip title="Xem chi tiết">
          <Button type="primary" shape="circle" icon={<EyeOutlined />} onClick={() => { setSelectedProcess(r); setDetailModalOpen(true); }} className="bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white" />
        </Tooltip>
      ) 
    },
    { title: 'Các Tài liệu đính kèm', dataIndex: 'duong_dan_file', render: renderAttachments },
    { title: 'Thao tác', key: 'action', align: 'center', width: 120, render: (_, r) => ( 
      <Space>
        <Tooltip title="Sửa"><Button type="text" icon={<EditOutlined />} onClick={() => handleEditProcess(r)} className="text-blue-500 hover:bg-blue-50" /></Tooltip>
        <Popconfirm title="Xóa quy trình này?" onConfirm={() => handleDeleteProcess(r.ma_quy_trinh)} okText="Xóa" cancelText="Hủy"><Button danger type="text" icon={<DeleteOutlined />} className="hover:bg-red-50" /></Popconfirm> 
      </Space>
    ) }
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingOrgId(null); orgForm.resetFields(); setOrgFileList([]); setIsOrgModalOpen(true); }} className="h-10 px-4 rounded-xl font-medium bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Thêm nhân sự / cấu trúc</Button>
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingProcessId(null); processForm.resetFields(); setProcessFileList([]); setIsProcessModalOpen(true); }} className="h-10 px-4 rounded-xl font-medium bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Thêm Quy trình mới</Button>
                  </div>
                  <Table columns={processColumns} dataSource={processData} rowKey="ma_quy_trinh" loading={loading} pagination={false} className="border-t border-gray-100" rowClassName="hover:bg-gray-50 transition-colors" />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* MODAL ORG */}
      <Modal title={<span className="text-lg font-bold">{editingOrgId ? 'Cập nhật nhân sự' : 'Thêm dữ liệu Sơ đồ tổ chức'}</span>} open={isOrgModalOpen} onCancel={() => setIsOrgModalOpen(false)} footer={null} className="rounded-2xl overflow-hidden" destroyOnHidden>
        <Form form={orgForm} layout="vertical" onFinish={handleSaveOrg} className="mt-4">
          <Form.Item name="ho_ten" label={<span className="font-semibold text-gray-700">Họ và tên</span>} rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input size="large" className="rounded-lg" placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="chuc_vu" label={<span className="font-semibold text-gray-700">Chức vụ</span>} rules={[{ required: true, message: 'Nhập chức vụ!' }]}>
            <Input size="large" className="rounded-lg" placeholder="Ví dụ: Bí thư Đảng ủy" />
          </Form.Item>
          <Form.Item label={<span className="font-semibold text-gray-700">Ảnh chân dung (nếu có)</span>}>
              <Upload beforeUpload={(file) => { setOrgFileList([{ originFileObj: file, name: file.name }]); return false; }} fileList={orgFileList} onRemove={() => setOrgFileList([])} maxCount={1}>
                  <Button icon={<UploadOutlined />} className="rounded-lg">Chọn ảnh (jpg, png)</Button>
              </Upload>
              {editingOrgId && <div className="text-xs text-gray-400 mt-1">Để trống nếu không muốn thay đổi ảnh cũ.</div>}
          </Form.Item>
          <Form.Item name="thu_tu" label={<span className="font-semibold text-gray-700">Thứ tự ưu tiên hiển thị</span>} help="Số nhỏ hiện trước (Ví dụ: 1 ưu tiên đứng đầu)">
            <InputNumber min={0} size="large" className="w-full rounded-lg" placeholder="Ví dụ: 1" />
          </Form.Item>
          <Form.Item className="mb-0 mt-6"><Button type="primary" htmlType="submit" loading={loading} block size="large" className="rounded-xl h-12 font-bold bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Lưu thông tin</Button></Form.Item>
        </Form>
      </Modal>

      {/* MODAL PROCESS */}
      <Modal title={<span className="text-lg font-bold">{editingProcessId ? 'Cập nhật Quy trình' : 'Thêm Quy trình mới'}</span>} open={isProcessModalOpen} onCancel={() => setIsProcessModalOpen(false)} footer={null} className="rounded-2xl overflow-hidden" destroyOnHidden width={700}>
        <Form form={processForm} layout="vertical" onFinish={handleSaveProcess} className="mt-4">
          <Form.Item name="tieu_de" label={<span className="font-semibold text-gray-700">Tên quy trình</span>} rules={[{ required: true, message: 'Nhập tên!' }]}>
            <Input size="large" className="rounded-lg" placeholder="Ví dụ: Quy trình kết nạp Đảng viên" />
          </Form.Item>
          <Form.Item name="mo_ta" label={<span className="font-semibold text-gray-700">Chi tiết quy trình (có thể định dạng)</span>}>
            <ReactQuill 
              theme="snow" 
              className="bg-white rounded-lg"
              placeholder="Mô tả chi tiết quy trình theo từng bước..." 
              style={{ minHeight: '150px' }}
            />
          </Form.Item>
          <Form.Item label={<span className="font-semibold text-gray-700">Tài liệu hướng dẫn đính kèm (có thể chọn nhiều file word, pdf, img...)</span>}>
              <Upload beforeUpload={(file) => { setProcessFileList(prev => [...prev, { originFileObj: file, name: file.name }]); return false; }} fileList={processFileList} onRemove={(file) => setProcessFileList(prev => prev.filter(f => f.uid !== file.uid))} multiple>
                  <Button icon={<UploadOutlined />} className="rounded-lg border-blue-400 text-blue-600 font-medium bg-blue-50">Chọn Tài liệu đính kèm</Button>
              </Upload>
              {editingProcessId && <div className="text-xs text-gray-400 mt-1">Chọn file mới sẽ GHI ĐÈ toàn bộ file cũ. Nếu để trống sẽ giữ nguyên file cũ.</div>}
          </Form.Item>
          <Form.Item className="mb-0 mt-6"><Button type="primary" htmlType="submit" loading={loading} block size="large" className="rounded-xl h-12 font-bold bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200">Xác nhận</Button></Form.Item>
        </Form>
      </Modal>

      {/* DETAIL MODAL PROCESS */}
      <Modal 
        title={<span className="text-xl font-bold text-[#a91f23]">{selectedProcess?.tieu_de}</span>} 
        open={detailModalOpen} 
        onCancel={() => setDetailModalOpen(false)} 
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)} className="rounded-xl bg-gray-100 hover:bg-gray-200 border-0">Đóng</Button>
        ]}
        width={700}
        centered
        className="rounded-2xl"
      >
        <div className="mt-6 mb-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {selectedProcess?.mo_ta ? (
            <div 
              className="ql-editor prose prose-sm max-w-none prose-red" 
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedProcess.mo_ta) }} 
            />
          ) : (
            <p className="text-gray-500 italic">Chưa có chi tiết cho quy trình này.</p>
          )}
        </div>
      </Modal>

    </motion.div>
  );
};
export default LandingManager;
`;
fs.writeFileSync('d:/NCKHSV/SUPERADMIN/frontend/src/pages/LandingManager.js', fileContent);
