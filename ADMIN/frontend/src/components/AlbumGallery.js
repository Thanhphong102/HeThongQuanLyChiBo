import React, { useState, useEffect } from 'react';
import {
  Button, Modal, Input, message, Empty, Popconfirm, Tooltip,
  Space, Typography, Card, Upload, Spin, Badge
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, FolderOpenOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const COLOR_RED = '#CE1126';

const AlbumGallery = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal tạo/sửa album
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [albumName, setAlbumName] = useState('');

  // Trạng thái xem bên trong 1 album
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [albumImages, setAlbumImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Upload nhiều ảnh
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/albums');
      setAlbums(res.data);
    } catch { message.error('Lỗi tải danh sách Album'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlbums(); }, []);

  const handleSaveAlbum = async () => {
    if (!albumName.trim()) return message.error('Vui lòng nhập tên Album');
    try {
      if (editingAlbum) {
        await axios.put(`/albums/${editingAlbum.ma_album}`, { ten_album: albumName });
        message.success('Đã đổi tên Album');
      } else {
        await axios.post('/albums', { ten_album: albumName });
        message.success('Tạo Album thành công');
      }
      setIsModalOpen(false);
      setAlbumName('');
      setEditingAlbum(null);
      fetchAlbums();
    } catch { message.error('Có lỗi xảy ra'); }
  };

  const handleDeleteAlbum = async (id) => {
    try {
      await axios.delete(`/albums/${id}`);
      message.success('Đã xóa Album và các ảnh bên trong');
      fetchAlbums();
    } catch { message.error('Lỗi xóa Album'); }
  };

  const openAlbum = async (album) => {
    setCurrentAlbum(album);
    setLoadingImages(true);
    try {
      const res = await axios.get(`/albums/${album.ma_album}`);
      setAlbumImages(res.data.images || []);
    } catch { message.error('Lỗi tải ảnh trong album'); }
    finally { setLoadingImages(false); }
  };

  const getDriveImage = (img) => {
    const apiUrl = axios.defaults.baseURL || 'http://localhost:5001/api';
    if (img.ma_file_drive) return `${apiUrl}/media/proxy/${img.ma_file_drive}`;
    if (img.duong_dan) {
      const idMatch = img.duong_dan.match(/[-\w]{25,}/);
      if (idMatch) return `${apiUrl}/media/proxy/${idMatch[0]}`;
    }
    return '';
  };

  const handleBulkUpload = async () => {
    if (fileList.length === 0) return message.error('Chọn ít nhất 1 file');
    setUploading(true);
    const formData = new FormData();
    formData.append('ma_album', currentAlbum.ma_album);
    fileList.forEach(file => {
      formData.append('files', file.originFileObj);
    });

    try {
      const res = await axios.post('/media/album', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success(`Đã tải lên ${res.data.uploaded} ảnh`);
      setUploadModalOpen(false);
      setFileList([]);
      // Reload current album
      openAlbum(currentAlbum);
      fetchAlbums(); // update counts
    } catch {
      message.error('Lỗi tải lên ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id) => {
      try {
          await axios.delete(`/media/${id}`);
          message.success('Đã xóa ảnh');
          openAlbum(currentAlbum);
          fetchAlbums();
      } catch { message.error('Lỗi xóa ảnh'); }
  };

  if (currentAlbum) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentAlbum(null)}>Quay lại</Button>
            <Title level={4} style={{ margin: 0 }}>📂 {currentAlbum.ten_album}</Title>
          </Space>
          <Button 
            type="primary" icon={<UploadOutlined />} 
            style={{ background: COLOR_RED, borderColor: COLOR_RED }}
            onClick={() => setUploadModalOpen(true)}
          >
            Tải lên nhiều ảnh
          </Button>
        </div>

        {loadingImages ? <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div> : 
          albumImages.length === 0 ? <Empty description="Album chưa có ảnh nào" /> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {albumImages.map(img => (
              <div key={img.ma_hinh_anh} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 140, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <img src={getDriveImage(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="album-img" />
                <Popconfirm title="Xóa ảnh này?" onConfirm={() => handleDeleteImage(img.ma_hinh_anh)}>
                    <Button danger size="small" icon={<DeleteOutlined />} style={{ position: 'absolute', top: 5, right: 5, opacity: 0.8 }} />
                </Popconfirm>
              </div>
            ))}
          </div>
        }

        <Modal
          title={`Tải ảnh lên: ${currentAlbum.ten_album}`}
          open={uploadModalOpen}
          onOk={handleBulkUpload}
          onCancel={() => setUploadModalOpen(false)}
          confirmLoading={uploading}
          okText="Bắt đầu tải lên"
          okButtonProps={{ style: { background: COLOR_RED, borderColor: COLOR_RED } }}
          width={600}
        >
          <Upload.Dragger
            multiple
            listType="picture"
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList }) => setFileList(fileList)}
            style={{ padding: 20 }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: COLOR_RED }} />
            </p>
            <p className="ant-upload-text">Kéo thả ảnh vào đây hoặc click để chọn</p>
          </Upload.Dragger>
          <div style={{ marginTop: 10, color: '#666', fontSize: 13, textAlign: 'center' }}>
            * Chấp nhận kéo thả. Bạn có thể chọn cùng lúc 50 ảnh. Không cần đặt tên từng ảnh.
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={5} style={{ margin: 0, color: '#4b5563' }}>Quản lý Album ({albums.length})</Title>
        <Button 
            type="primary" icon={<FolderOpenOutlined />} 
            onClick={() => { setEditingAlbum(null); setAlbumName(''); setIsModalOpen(true); }}
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8 }}
        >
          Tạo Album Mới
        </Button>
      </div>

      {loading ? <Spin /> : albums.length === 0 ? <Empty description="Chưa có Album nào" /> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {albums.map(al => (
            <Card 
              key={al.ma_album} 
              hoverable 
              bodyStyle={{ padding: 12 }} 
              style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}
            >
              <div 
                style={{ height: 140, background: '#f3f4f6', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => openAlbum(al)}
              >
                {al.anh_bia ? <img src={getDriveImage({ duong_dan: al.anh_bia })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="cover" /> 
                : <FolderOpenOutlined style={{ fontSize: 48, color: '#d1d5db' }} />}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openAlbum(al)}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{al.ten_album}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{al.so_luong_anh} ảnh • {dayjs(al.ngay_tao).format('DD/MM/YYYY')}</div>
                </div>
                <Space>
                  <Tooltip title="Sửa tên">
                    <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingAlbum(al); setAlbumName(al.ten_album); setIsModalOpen(true); }} />
                  </Tooltip>
                  <Popconfirm title="Xóa Album sẽ xóa toàn bộ ảnh bên trong. Tiếp tục?" onConfirm={() => handleDeleteAlbum(al.ma_album)}>
                    <Button danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            </Card>
          ))}
        </div>
      }

      <Modal
        title={editingAlbum ? 'Sửa tên Album' : 'Tạo Album Mới'}
        open={isModalOpen}
        onOk={handleSaveAlbum}
        onCancel={() => setIsModalOpen(false)}
        okButtonProps={{ style: { background: COLOR_RED, borderColor: COLOR_RED } }}
      >
        <Input 
          placeholder="Nhập tên Album (vd: Mùa hè xanh 2024)" 
          value={albumName} 
          onChange={e => setAlbumName(e.target.value)} 
        />
      </Modal>
    </div>
  );
};

export default AlbumGallery;
