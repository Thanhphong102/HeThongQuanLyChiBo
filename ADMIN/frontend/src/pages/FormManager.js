import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Modal, Form, Input, Upload, message,
  Popconfirm, Tag, Space, Tooltip, Typography, Spin,
  Empty, Badge, Progress, Drawer
} from 'antd';
import {
  FolderOutlined, FolderOpenOutlined, FileTextOutlined,
  UploadOutlined, DeleteOutlined, FilePdfOutlined,
  FileWordOutlined, FileExcelOutlined, CloudDownloadOutlined,
  PlusOutlined, ArrowLeftOutlined, EditOutlined,
  FileOutlined, InboxOutlined
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

// ─── Component chính ─────────────────────────────────────────────────────────

const FormManager = () => {
  // Trạng thái navigation: null = màn danh sách folder, object = đang xem folder
  const [currentFolder, setCurrentFolder] = useState(null);

  // Folder list
  const [folders, setFolders]     = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Files trong folder đang mở
  const [files, setFiles]         = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Modal tạo / sửa folder
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder]     = useState(null);
  const [folderForm] = Form.useForm();

  // Drawer upload nhiều file
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [fileList, setFileList]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Fetch folders ───────────────────────────────────────────────────────────
  const fetchFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await axios.get('/branch-forms/folders');
      setFolders(res.data);
    } catch {
      message.error('Lỗi tải danh sách thư mục');
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  // ── Fetch files trong folder ────────────────────────────────────────────────
  const fetchFiles = useCallback(async (folder) => {
    setLoadingFiles(true);
    try {
      const res = await axios.get(`/branch-forms/folders/${folder.ma_folder}/files`);
      setFiles(res.data.files || []);
    } catch {
      message.error('Lỗi tải danh sách file');
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const openFolder = (folder) => {
    setCurrentFolder(folder);
    fetchFiles(folder);
  };

  const goBack = () => {
    setCurrentFolder(null);
    setFiles([]);
    fetchFolders();
  };

  // ── CRUD Folder ─────────────────────────────────────────────────────────────
  const handleSaveFolder = async (values) => {
    try {
      if (editingFolder) {
        await axios.put(`/branch-forms/folders/${editingFolder.ma_folder}`, values);
        message.success('Đã cập nhật thư mục');
      } else {
        await axios.post('/branch-forms/folders', values);
        message.success('Đã tạo thư mục mới');
      }
      setFolderModalOpen(false);
      folderForm.resetFields();
      setEditingFolder(null);
      fetchFolders();
    } catch {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await axios.delete(`/branch-forms/folders/${folderId}`);
      message.success('Đã xóa thư mục và tất cả file bên trong');
      fetchFolders();
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

  // ── Upload nhiều file ────────────────────────────────────────────────────────
  const handleBulkUpload = async () => {
    if (fileList.length === 0) return message.warning('Vui lòng chọn ít nhất 1 file');

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    fileList.forEach((f) => {
      formData.append('files', f.originFileObj);
    });

    try {
      await axios.post(
        `/branch-forms/folders/${currentFolder.ma_folder}/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
      );
      message.success(`Đã tải lên ${fileList.length} file thành công`);
      setUploadDrawerOpen(false);
      setFileList([]);
      fetchFiles(currentFolder);
      fetchFolders();
    } catch {
      message.error('Lỗi tải lên file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Xóa file ─────────────────────────────────────────────────────────────────
  const handleDeleteFile = async (fileId) => {
    try {
      await axios.delete(`/branch-forms/${fileId}`);
      message.success('Đã xóa file');
      fetchFiles(currentFolder);
      fetchFolders();
    } catch {
      message.error('Lỗi xóa file');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Biểu mẫu & Tài liệu Nội bộ"
        subtitle="Tổ chức tài liệu theo thư mục, tải lên nhiều file cùng lúc"
      />

      {/* ── MÀN 1: DANH SÁCH THƯ MỤC ── */}
      {!currentFolder && (
        <div>
          {/* Toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, flexWrap: 'wrap', gap: 12
          }}>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>
              <strong>{folders.length}</strong> thư mục
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateFolder}
              style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}
            >
              Tạo thư mục mới
            </Button>
          </div>

          {/* Grid thư mục */}
          {loadingFolders ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
          ) : folders.length === 0 ? (
            <Empty
              image={<FolderOutlined style={{ fontSize: 64, color: '#d1d5db' }} />}
              description="Chưa có thư mục nào. Hãy tạo thư mục đầu tiên!"
            >
              <Button type="primary" onClick={openCreateFolder}
                style={{ background: COLOR_RED, borderColor: COLOR_RED }}>
                Tạo ngay
              </Button>
            </Empty>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16
            }}>
              {folders.map(folder => (
                <Card
                  key={folder.ma_folder}
                  hoverable
                  style={{
                    borderRadius: 16, border: '1.5px solid #f3f4f6',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  styles={{ body: { padding: '16px 20px' } }}
                  onClick={() => openFolder(folder)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Icon thư mục */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FolderOutlined style={{ fontSize: 26, color: '#D97706' }} />
                    </div>

                    {/* Thông tin */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {folder.ten_folder}
                      </div>
                      {folder.mo_ta && (
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {folder.mo_ta}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <Tag color="blue" style={{ borderRadius: 6, fontSize: 11 }}>
                          {folder.so_luong_file || 0} file
                        </Tag>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          {folder.lan_cap_nhat_cuoi
                            ? dayjs(folder.lan_cap_nhat_cuoi).format('DD/MM/YYYY')
                            : dayjs(folder.ngay_tao).format('DD/MM/YYYY')}
                        </span>
                      </div>
                    </div>

                    {/* Actions — ngừng bubble click lên Card */}
                    <Space
                      size={4}
                      style={{ flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Tooltip title="Sửa tên">
                        <Button size="small" icon={<EditOutlined />}
                          style={{ borderRadius: 6 }}
                          onClick={() => openEditFolder(folder)} />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa thư mục?"
                        description="Toàn bộ file bên trong sẽ bị xóa vĩnh viễn."
                        onConfirm={() => handleDeleteFolder(folder.ma_folder)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}
                          style={{ borderRadius: 6 }} />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MÀN 2: FILE BÊN TRONG THƯ MỤC ── */}
      {currentFolder && (
        <div>
          {/* Header trong folder */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, flexWrap: 'wrap', gap: 12
          }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={goBack} style={{ borderRadius: 8 }}>
                Quay lại
              </Button>
              <div>
                <Title level={5} style={{ margin: 0, color: '#111827' }}>
                  📁 {currentFolder.ten_folder}
                </Title>
                {currentFolder.mo_ta && (
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>{currentFolder.mo_ta}</Text>
                )}
              </div>
            </Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadDrawerOpen(true)}
              style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}
            >
              Tải lên nhiều file
            </Button>
          </div>

          {/* Danh sách file */}
          {loadingFiles ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
          ) : files.length === 0 ? (
            <Empty
              description="Thư mục chưa có file nào"
              image={<FileTextOutlined style={{ fontSize: 48, color: '#d1d5db' }} />}
            >
              <Button type="primary" onClick={() => setUploadDrawerOpen(true)}
                style={{ background: COLOR_RED, borderColor: COLOR_RED }}>
                Tải file lên ngay
              </Button>
            </Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {files.map(file => (
                <Card
                  key={file.ma_bieu_mau}
                  style={{
                    borderRadius: 12, border: '1px solid #f3f4f6',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)'
                  }}
                  styles={{ body: { padding: '12px 20px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {getFileIcon(file.tieu_de, 28)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={file.duong_dan_file}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontWeight: 600, fontSize: 14, color: '#111827',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          display: 'block' }}
                      >
                        {file.tieu_de}
                      </a>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {dayjs(file.ngay_tao).format('DD/MM/YYYY HH:mm')}
                        {file.nguoi_dang ? ` • ${file.nguoi_dang}` : ''}
                      </div>
                    </div>
                    <Space size={6}>
                      <Tooltip title="Xem / Tải xuống">
                        <Button size="small" type="primary" ghost
                          icon={<CloudDownloadOutlined />}
                          href={file.duong_dan_file} target="_blank"
                          style={{ borderRadius: 6 }} />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa file này?"
                        onConfirm={() => handleDeleteFile(file.ma_bieu_mau)}
                        okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}
                          style={{ borderRadius: 6 }} />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL TẠO / SỬA FOLDER ── */}
      <Modal
        title={
          <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
            {editingFolder ? '✏️ Sửa tên Thư mục' : '📁 Tạo Thư mục mới'}
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
          <Form.Item
            name="ten_folder"
            label="Tên thư mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên thư mục!' }]}
          >
            <Input
              size="large"
              placeholder="Ví dụ: Biểu mẫu tháng 8/2026"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item name="mo_ta" label="Mô tả (tuỳ chọn)">
            <Input.TextArea rows={2} placeholder="Ghi chú về nội dung thư mục..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large"
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
            {editingFolder ? 'Lưu thay đổi' : 'Tạo thư mục'}
          </Button>
        </Form>
      </Modal>

      {/* ── DRAWER UPLOAD NHIỀU FILE ── */}
      <Drawer
        title={
          <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
            📤 Tải lên File vào: {currentFolder?.ten_folder}
          </span>
        }
        placement="right"
        width={480}
        open={uploadDrawerOpen}
        onClose={() => { if (!uploading) { setUploadDrawerOpen(false); setFileList([]); } }}
        styles={{ body: { padding: '20px 24px', fontFamily: 'Be Vietnam Pro, sans-serif' } }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => { setUploadDrawerOpen(false); setFileList([]); }}
              disabled={uploading} style={{ marginRight: 8, borderRadius: 8 }}>
              Hủy
            </Button>
            <Button type="primary" onClick={handleBulkUpload} loading={uploading}
              disabled={fileList.length === 0}
              style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
              Tải lên {fileList.length > 0 ? `${fileList.length} file` : ''}
            </Button>
          </div>
        }
      >
        <Dragger
          multiple
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: fl }) => setFileList(fl)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          style={{ borderRadius: 12, marginBottom: 16 }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: COLOR_RED }} />
          </p>
          <p style={{ fontWeight: 600, fontSize: 15, margin: '8px 0 4px' }}>
            Kéo thả file vào đây hoặc bấm để chọn
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Hỗ trợ: PDF, Word, Excel, PowerPoint, ZIP... Tối đa 20 file mỗi lần
          </p>
        </Dragger>

        {fileList.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <Badge
              count={fileList.length}
              style={{ backgroundColor: '#22c55e' }}
            >
              <Tag color="green" style={{ borderRadius: 8, padding: '4px 12px', fontSize: 13 }}>
                Đã chọn {fileList.length} file
              </Tag>
            </Badge>
          </div>
        )}

        {uploading && (
          <div style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>Đang tải lên...</Text>
            <Progress percent={uploadProgress} strokeColor={COLOR_RED} style={{ marginTop: 8 }} />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FormManager;