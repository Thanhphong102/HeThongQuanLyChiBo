import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Modal, Form, Input, Upload, message,
  Popconfirm, Tag, Space, Tooltip, Typography, Spin,
  Empty, Progress, Drawer, Breadcrumb
} from 'antd';
import {
  FolderOutlined, FolderOpenOutlined, FileTextOutlined,
  UploadOutlined, DeleteOutlined, FilePdfOutlined,
  FileWordOutlined, FileExcelOutlined, CloudDownloadOutlined,
  PlusOutlined, ArrowLeftOutlined, EditOutlined,
  FileOutlined, InboxOutlined, FolderAddOutlined, HomeOutlined
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';
import PageHeader from '../components/PageHeader';

const { Text, Title } = Typography;
const { Dragger } = Upload;
const COLOR_RED = '#CE1126';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getFileIcon = (fileName = '', size = 22) => {
  const n = fileName.toLowerCase();
  if (n.endsWith('.pdf'))  return <FilePdfOutlined  style={{ color: '#ef4444', fontSize: size }} />;
  if (n.endsWith('.doc') || n.endsWith('.docx'))
                            return <FileWordOutlined  style={{ color: '#3b82f6', fontSize: size }} />;
  if (n.endsWith('.xls') || n.endsWith('.xlsx'))
                            return <FileExcelOutlined style={{ color: '#22c55e', fontSize: size }} />;
  return <FileOutlined style={{ color: '#6b7280', fontSize: size }} />;
};

const FolderCard = ({ folder, onOpen, onEdit, onDelete }) => (
  <Card
    hoverable
    style={{
      borderRadius: 16, border: '1.5px solid #f3f4f6',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      cursor: 'pointer', transition: 'all 0.2s'
    }}
    styles={{ body: { padding: '14px 18px' } }}
    onClick={() => onOpen(folder)}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <FolderOutlined style={{ fontSize: 24, color: '#D97706' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 14, color: '#111827',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {folder.ten_folder}
        </div>
        {folder.mo_ta && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {folder.mo_ta}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {folder.so_luong_thu_muc_con > 0 && (
            <Tag color="gold" style={{ borderRadius: 6, fontSize: 10 }}>
              📁 {folder.so_luong_thu_muc_con} thư mục
            </Tag>
          )}
          <Tag color="blue" style={{ borderRadius: 6, fontSize: 10 }}>
            📄 {folder.so_luong_file || 0} file
          </Tag>
        </div>
      </div>
      <Space size={4} onClick={e => e.stopPropagation()}>
        <Tooltip title="Sửa tên">
          <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 6 }}
            onClick={() => onEdit(folder)} />
        </Tooltip>
        <Popconfirm
          title="Xóa thư mục?"
          description="Toàn bộ thư mục con và file bên trong sẽ bị xóa vĩnh viễn."
          onConfirm={() => onDelete(folder.ma_folder)}
          okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
        </Popconfirm>
      </Space>
    </div>
  </Card>
);

// ─── Component chính ─────────────────────────────────────────────────────────
const FormManager = () => {
  // Navigation: mảng breadcrumb [{ma_folder, ten_folder}]
  const [breadcrumb, setBreadcrumb] = useState([]); // [] = root
  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].ma_folder : null;

  // Content của folder hiện tại
  const [subfolders, setSubfolders] = useState([]);
  const [files, setFiles]           = useState([]);
  const [loading, setLoading]       = useState(false);

  // Modal tạo / sửa folder
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder]     = useState(null);
  const [folderForm] = Form.useForm();

  // Drawer upload nhiều file
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [fileList, setFileList]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Fetch nội dung thư mục hiện tại ─────────────────────────────────────────
  const fetchContent = useCallback(async (folderId) => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        axios.get('/branch-forms/folders', {
          params: folderId ? { parent_id: folderId } : {}
        }),
        folderId
          ? axios.get(`/branch-forms/folders/${folderId}/files`)
          : Promise.resolve({ data: { files: [] } })
      ]);
      setSubfolders(foldersRes.data);
      setFiles(filesRes.data.files || []);
    } catch {
      message.error('Lỗi tải nội dung thư mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent(currentFolderId);
  }, [currentFolderId, fetchContent]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const openFolder = (folder) => {
    setBreadcrumb(prev => [...prev, { ma_folder: folder.ma_folder, ten_folder: folder.ten_folder }]);
  };

  const goToRoot = () => setBreadcrumb([]);

  const goToBreadcrumb = (index) => {
    setBreadcrumb(prev => prev.slice(0, index + 1));
  };

  // ── CRUD Folder ──────────────────────────────────────────────────────────────
  const handleSaveFolder = async (values) => {
    try {
      const payload = { ...values, parent_folder_id: currentFolderId || null };
      if (editingFolder) {
        await axios.put(`/branch-forms/folders/${editingFolder.ma_folder}`, payload);
        message.success('Đã cập nhật thư mục');
      } else {
        await axios.post('/branch-forms/folders', payload);
        message.success('Đã tạo thư mục mới');
      }
      setFolderModalOpen(false);
      folderForm.resetFields();
      setEditingFolder(null);
      fetchContent(currentFolderId);
    } catch {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await axios.delete(`/branch-forms/folders/${folderId}`);
      message.success('Đã xóa thư mục');
      fetchContent(currentFolderId);
    } catch {
      message.error('Lỗi xóa thư mục');
    }
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    folderForm.resetFields();
    setFolderModalOpen(true);
  };

  const openEditFolder = (folder) => {
    setEditingFolder(folder);
    folderForm.setFieldsValue({ ten_folder: folder.ten_folder, mo_ta: folder.mo_ta });
    setFolderModalOpen(true);
  };

  // ── Upload nhiều file ─────────────────────────────────────────────────────────
  const handleBulkUpload = async () => {
    if (!currentFolderId) return message.warning('Hãy mở vào một thư mục trước khi tải file lên');
    if (fileList.length === 0) return message.warning('Vui lòng chọn ít nhất 1 file');

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    fileList.forEach(f => formData.append('files', f.originFileObj));

    try {
      await axios.post(`/branch-forms/folders/${currentFolderId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      message.success(`Đã tải lên ${fileList.length} file`);
      setUploadDrawerOpen(false);
      setFileList([]);
      fetchContent(currentFolderId);
    } catch {
      message.error('Lỗi tải lên file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await axios.delete(`/branch-forms/${fileId}`);
      message.success('Đã xóa file');
      fetchContent(currentFolderId);
    } catch {
      message.error('Lỗi xóa file');
    }
  };

  const isEmpty = subfolders.length === 0 && files.length === 0;

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Biểu mẫu & Tài liệu Nội bộ"
        subtitle="Tổ chức tài liệu theo thư mục đa cấp, tải lên nhiều file cùng lúc"
      />

      {/* ── Breadcrumb ── */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '10px 16px',
        marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <Breadcrumb
          items={[
            {
              title: (
                <span onClick={goToRoot} style={{ cursor: 'pointer', color: COLOR_RED }}>
                  <HomeOutlined /> Trang chủ
                </span>
              )
            },
            ...breadcrumb.map((b, i) => ({
              title: (
                <span
                  onClick={() => i < breadcrumb.length - 1 ? goToBreadcrumb(i) : undefined}
                  style={{
                    cursor: i < breadcrumb.length - 1 ? 'pointer' : 'default',
                    color: i < breadcrumb.length - 1 ? COLOR_RED : '#111827',
                    fontWeight: i === breadcrumb.length - 1 ? 700 : 400
                  }}
                >
                  📁 {b.ten_folder}
                </span>
              )
            }))
          ]}
        />
      </div>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexWrap: 'wrap', gap: 12
      }}>
        <Space>
          {breadcrumb.length > 0 && (
            <Button icon={<ArrowLeftOutlined />}
              onClick={() => setBreadcrumb(prev => prev.slice(0, -1))}
              style={{ borderRadius: 8 }}>
              Quay lại
            </Button>
          )}
          <Text style={{ color: '#6b7280', fontSize: 13 }}>
            <strong>{subfolders.length}</strong> thư mục &nbsp;·&nbsp; <strong>{files.length}</strong> file
          </Text>
        </Space>
        <Space>
          <Button icon={<FolderAddOutlined />} onClick={openCreateFolder}
            style={{ borderRadius: 8, borderColor: COLOR_RED, color: COLOR_RED }}>
            Tạo thư mục
          </Button>
          {currentFolderId && (
            <Button type="primary" icon={<UploadOutlined />}
              onClick={() => setUploadDrawerOpen(true)}
              style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
              Tải lên file
            </Button>
          )}
        </Space>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : isEmpty ? (
        <Empty
          image={<FolderOutlined style={{ fontSize: 64, color: '#d1d5db' }} />}
          description={currentFolderId ? 'Thư mục trống. Tạo thư mục con hoặc tải file lên!' : 'Chưa có thư mục nào. Hãy tạo thư mục đầu tiên!'}
        >
          <Space>
            <Button onClick={openCreateFolder}
              style={{ borderRadius: 8, borderColor: COLOR_RED, color: COLOR_RED }}>
              Tạo thư mục
            </Button>
            {currentFolderId && (
              <Button type="primary" onClick={() => setUploadDrawerOpen(true)}
                style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8 }}>
                Tải file lên
              </Button>
            )}
          </Space>
        </Empty>
      ) : (
        <div>
          {/* Thư mục con */}
          {subfolders.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                📁 THƯ MỤC
              </Text>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12, marginTop: 10
              }}>
                {subfolders.map(folder => (
                  <FolderCard
                    key={folder.ma_folder}
                    folder={folder}
                    onOpen={openFolder}
                    onEdit={openEditFolder}
                    onDelete={handleDeleteFolder}
                  />
                ))}
              </div>
            </div>
          )}

          {/* File */}
          {files.length > 0 && (
            <div>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                📄 FILE TRONG THƯ MỤC NÀY
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {files.map(file => (
                  <Card
                    key={file.ma_bieu_mau}
                    style={{ borderRadius: 10, border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    styles={{ body: { padding: '10px 16px' } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {getFileIcon(file.tieu_de, 26)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={file.duong_dan_file} target="_blank" rel="noreferrer"
                          style={{ fontWeight: 600, fontSize: 13, color: '#111827',
                            display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.tieu_de}
                        </a>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                          {dayjs(file.ngay_tao).format('DD/MM/YYYY HH:mm')}{file.nguoi_dang ? ` · ${file.nguoi_dang}` : ''}
                        </div>
                      </div>
                      <Space size={6}>
                        <Tooltip title="Xem / Tải xuống">
                          <Button size="small" type="primary" ghost icon={<CloudDownloadOutlined />}
                            href={file.duong_dan_file} target="_blank" style={{ borderRadius: 6 }} />
                        </Tooltip>
                        <Popconfirm title="Xóa file này?"
                          onConfirm={() => handleDeleteFile(file.ma_bieu_mau)}
                          okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                          <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
                        </Popconfirm>
                      </Space>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL Tạo / Sửa Folder ── */}
      <Modal
        title={
          <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
            {editingFolder ? '✏️ Sửa thư mục' : `📁 Tạo thư mục${currentFolderId ? ' con' : ' mới'}`}
          </span>
        }
        open={folderModalOpen}
        onCancel={() => { setFolderModalOpen(false); folderForm.resetFields(); setEditingFolder(null); }}
        footer={null}
        width={420}
        destroyOnHidden
      >
        <Form form={folderForm} layout="vertical" onFinish={handleSaveFolder}
          style={{ fontFamily: 'Be Vietnam Pro, sans-serif', marginTop: 12 }}>
          <Form.Item name="ten_folder" label="Tên thư mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên thư mục!' }]}>
            <Input size="large" placeholder="Ví dụ: Biểu mẫu tháng 8/2026" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="mo_ta" label="Mô tả (tuỳ chọn)">
            <Input.TextArea rows={2} placeholder="Ghi chú nội dung..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large"
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
            {editingFolder ? 'Lưu thay đổi' : 'Tạo thư mục'}
          </Button>
        </Form>
      </Modal>

      {/* ── DRAWER Upload ── */}
      <Drawer
        title={
          <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
            📤 Tải file vào: {breadcrumb[breadcrumb.length - 1]?.ten_folder}
          </span>
        }
        placement="right" width={480}
        open={uploadDrawerOpen}
        onClose={() => { if (!uploading) { setUploadDrawerOpen(false); setFileList([]); } }}
        styles={{ body: { padding: '20px 24px', fontFamily: 'Be Vietnam Pro, sans-serif' } }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => { setUploadDrawerOpen(false); setFileList([]); }} disabled={uploading}
              style={{ marginRight: 8, borderRadius: 8 }}>Hủy</Button>
            <Button type="primary" onClick={handleBulkUpload} loading={uploading}
              disabled={fileList.length === 0}
              style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
              Tải lên {fileList.length > 0 ? `${fileList.length} file` : ''}
            </Button>
          </div>
        }
      >
        <Dragger multiple fileList={fileList} beforeUpload={() => false}
          onChange={({ fileList: fl }) => setFileList(fl)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          style={{ borderRadius: 12, marginBottom: 16 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: COLOR_RED }} />
          </p>
          <p style={{ fontWeight: 600, fontSize: 15, margin: '8px 0 4px' }}>
            Kéo thả file vào đây hoặc bấm để chọn
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            PDF, Word, Excel, PowerPoint... Tối đa 20 file
          </p>
        </Dragger>

        {uploading && (
          <div style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>Đang tải lên...</Text>
            <Progress percent={uploadProgress} strokeColor={COLOR_RED} style={{ marginTop: 8 }} />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FormManager;