import React, { useState, useEffect, useMemo } from 'react';
import {
  Button, Upload, Modal, message, Image, Input, Empty, Popconfirm, Tooltip,
  DatePicker, Space, Typography
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';

const { Text } = Typography;
const COLOR_RED = '#CE1126';

const ImageGallery = () => {
  const [images, setImages]         = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen]   = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle]     = useState('');
  const [fileList, setFileList]       = useState([]);
  const [tieu_de, setTitle]             = useState('');
  const [loading, setLoading]         = useState(false);

  // [MỚI] Search + Date filter
  const [searchText, setSearchText]   = useState('');
  const [dateRange, setDateRange]     = useState([]);

  const fetchImages = async () => {
    try {
      const res = await axios.get('/media?type=IMAGE');
      setImages(res.data);
    } catch { message.error('Lỗi tải ảnh'); }
  };

  useEffect(() => { fetchImages(); }, []);

  // [MỚI] Filter ảnh theo tên + ngày
  const filteredImages = useMemo(() => {
    let result = images;
    if (searchText.trim()) {
      result = result.filter(img => img.tieu_de.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const from = dayjs(dateRange[0]).startOf('day');
      const to   = dayjs(dateRange[1]).endOf('day');
      result = result.filter(img => {
        const created = dayjs(img.ngay_tao);
        return created.isAfter(from) && created.isBefore(to);
      });
    }
    return result;
  }, [images, searchText, dateRange]);

  const handleUpload = async () => {
    if (fileList.length === 0 || !tieu_de) return message.error('Thiếu thông tin');
    const formData = new FormData();
    formData.append('loai_hinh_anh', 'IMAGE');
    formData.append('tieu_de', tieu_de);
    formData.append('file', fileList[0]);
    setLoading(true);
    try {
      await axios.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('Upload thành công');
      setIsModalOpen(false);
      setFileList([]); setTitle('');
      fetchImages();
    } catch { message.error('Lỗi upload'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editTitle) return message.error('Tiêu đề không được để trống');
    try {
      await axios.put(`/media/${editingImage.ma_hinh_anh}`, { tieu_de: editTitle });
      message.success('Đã đổi tên ảnh');
      setIsEditOpen(false);
      fetchImages();
    } catch { message.error('Lỗi cập nhật'); }
  };

  const openEditModal = (img) => { setEditingImage(img); setEditTitle(img.tieu_de); setIsEditOpen(true); };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/media/${id}`);
      message.success('Đã xóa ảnh');
      fetchImages();
    } catch { message.error('Lỗi xóa'); }
  };

  const getDriveImage = (fileId) => `https://lh3.googleusercontent.com/d/${fileId}`;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Space wrap>
          {/* [MỚI] Search */}
          <Input
            placeholder="Tìm theo tên ảnh..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 220, borderRadius: 8 }}
            allowClear
          />
          {/* [MỚI] Date Range filter */}
          <DatePicker.RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            format="DD/MM/YYYY"
            onChange={(dates) => setDateRange(dates || [])}
            style={{ borderRadius: 8 }}
            suffixIcon={<CalendarOutlined />}
          />
          <Text style={{ color: '#6b7280', fontSize: 13, alignSelf: 'center' }}>
            <strong>{filteredImages.length}</strong> / {images.length} ảnh
          </Text>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}
        >
          Thêm Ảnh Mới
        </Button>
      </div>

      {filteredImages.length === 0
        ? <Empty description="Không có ảnh nào" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {filteredImages.map(img => (
              <div key={img.ma_hinh_anh} style={{
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Hình ảnh */}
                <div style={{ position: 'relative', height: 155, overflow: 'hidden', background: '#f3f4f6' }}>
                  <Image
                    height={155} width="100%"
                    src={getDriveImage(img.ma_file_drive)}
                    style={{ objectFit: 'cover' }}
                    fallback="https://placehold.co/200x155?text=Ảnh"
                    referrerPolicy="no-referrer"
                    preview={{ mask: '🔍 Xem' }}
                  />
                  {/* Nút hành động */}
                  <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, display: 'flex', gap: 4 }}>
                    <Tooltip tieu_de="Đổi tên">
                      <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 6, opacity: 0.9 }} onClick={() => openEditModal(img)} />
                    </Tooltip>
                    <Popconfirm tieu_de="Xóa ảnh này?" onConfirm={() => handleDelete(img.ma_hinh_anh)}>
                      <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6, opacity: 0.9 }} />
                    </Popconfirm>
                  </div>
                  {/* [MỚI] Badge ngày đăng ở góc dưới */}
                  <div style={{
                    position: 'absolute', bottom: 6, left: 6,
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: 10, borderRadius: 4, padding: '2px 6px',
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                  }}>
                    {dayjs(img.ngay_tao).format('DD/MM/YYYY')}
                  </div>
                </div>

                {/* Caption */}
                <div style={{
                  padding: '8px 10px',
                  fontWeight: 600, fontSize: 12,
                  textAlign: 'center',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontFamily: 'Be Vietnam Pro, sans-serif', color: '#374151',
                }}>
                  {img.tieu_de}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Modal Upload */}
      <Modal
        tieu_de={<span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>🖼️ Upload Ảnh Mới</span>}
        open={isModalOpen}
        onOk={handleUpload}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        okText="Tải lên"
        okButtonProps={{ style: { background: COLOR_RED, borderColor: COLOR_RED } }}
      >
        <Input
          placeholder="Nhập tiêu đề ảnh"
          value={tieu_de}
          onChange={e => setTitle(e.target.value)}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
        <Upload
          beforeUpload={file => { setFileList([file]); return false; }}
          onRemove={() => setFileList([])}
          fileList={fileList}
          listType="picture"
          maxCount={1}
        >
          <Button icon={<PlusOutlined />} style={{ borderRadius: 8 }}>Chọn ảnh</Button>
        </Upload>
      </Modal>

      {/* Modal Sửa tên */}
      <Modal
        tieu_de={<span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>✏️ Đổi tên ảnh</span>}
        open={isEditOpen}
        onOk={handleUpdate}
        onCancel={() => setIsEditOpen(false)}
        okText="Lưu"
        okButtonProps={{ style: { background: COLOR_RED, borderColor: COLOR_RED } }}
      >
        <Input
          placeholder="Nhập tiêu đề mới"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          style={{ borderRadius: 8 }}
        />
      </Modal>
    </div>
  );
};

export default ImageGallery;