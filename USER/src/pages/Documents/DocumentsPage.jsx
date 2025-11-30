// src/pages/Documents/DocumentsPage.jsx
import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Card, message, Tag } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi';
import dayjs from 'dayjs';

const DocumentsPage = () => {
  const [branchForms, setBranchForms] = useState([]); // Tab 1: Biểu mẫu chi bộ
  const [schoolDocs, setSchoolDocs] = useState([]);   // Tab 2: Văn bản trường
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user_info'));
            
            // 1. Lấy Biểu mẫu chi bộ
            if (user && user.ma_chi_bo) {
                const resForms = await userApi.getForms(user.ma_chi_bo);
                setBranchForms(resForms.data || []);
            }

            // 2. Lấy Văn bản cấp trường (MỚI THÊM)
            const resDocs = await userApi.getSchoolDocuments();
            setSchoolDocs(resDocs.data || []);

        } catch (err) {
            console.error("Lỗi tải tài liệu:", err);
            // message.error("Không tải được dữ liệu tài liệu");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Hàm render icon theo loại file (Tùy chọn cho đẹp)
  const getFileIcon = (filename) => {
      if (!filename) return <FilePdfOutlined />;
      if (filename.endsWith('.doc') || filename.endsWith('.docx')) return <FileWordOutlined className="text-blue-600" />;
      if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) return <FileExcelOutlined className="text-green-600" />;
      return <FilePdfOutlined className="text-red-600" />;
  };

  // Cấu hình cột cho Văn bản Trường
  const schoolDocColumns = [
    { 
        title: 'Tên Văn bản', 
        dataIndex: 'ten_tai_lieu', 
        key: 'name', 
        render: (text) => <span className="font-semibold text-red-800">{getFileIcon(text)} {text}</span> 
    },
    { 
        title: 'Loại', 
        dataIndex: 'loai_tai_lieu', 
        key: 'type',
        render: t => <Tag color="blue">{t || 'Văn bản'}</Tag>
    },
    { 
        title: 'Ngày ban hành', 
        dataIndex: 'ngay_tai_len', 
        key: 'date', 
        render: d => dayjs(d).format('DD/MM/YYYY') 
    },
    { 
      title: 'Tải về', 
      key: 'action', 
      render: (_, record) => (
        <Button 
            type="primary" ghost size="small"
            href={record.duong_dan} // Link Drive lấy từ DB
            target="_blank" 
            icon={<DownloadOutlined />}
        >
          Xem/Tải
        </Button>
      ) 
    },
  ];

  // Cấu hình cột cho Biểu mẫu Chi bộ
  const formColumns = [
    { 
        title: 'Tên Biểu mẫu', 
        dataIndex: 'title', 
        key: 'title', 
        render: text => <span className="font-semibold text-blue-800">{text}</span> 
    },
    { title: 'Ngày đăng', dataIndex: 'created_at', key: 'date', render: d => dayjs(d).format('DD/MM/YYYY') },
    { 
      title: 'Tải về', 
      key: 'action', 
      render: (_, record) => (
        <Button type="link" href={record.file_url} target="_blank" icon={<DownloadOutlined />}>
          Tải về
        </Button>
      ) 
    },
  ];

  const items = [
    {
      key: '1',
      label: 'BIỂU MẪU CHI BỘ',
      children: <Table dataSource={branchForms} columns={formColumns} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />,
    },
    {
      key: '2',
      label: 'VĂN BẢN CẤP TRƯỜNG',
      children: <Table dataSource={schoolDocs} columns={schoolDocColumns} rowKey="ma_tai_lieu" loading={loading} pagination={{ pageSize: 5 }} />,
    },
  ];

  return (
    <div className="space-y-6">
      <Card variant="borderless" className="shadow-md">
          <h2 className="text-2xl font-bold text-red-dang mb-4 uppercase border-b pb-2">
            Kho Tài liệu & Văn bản
          </h2>
          <Tabs defaultActiveKey="2" items={items} type="card" size="large" />
      </Card>
    </div>
  );
};

export default DocumentsPage;