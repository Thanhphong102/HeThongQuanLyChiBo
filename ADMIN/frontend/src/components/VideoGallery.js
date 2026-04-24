import React, { useState, useEffect, useMemo } from 'react';
import {
  Button, Modal, Input, message, Empty, Popconfirm, Tooltip,
  DatePicker, Space, Typography, Tag
} from 'antd';
import { PlusOutlined, DeleteOutlined, YoutubeOutlined, EditOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';

const { Text } = Typography;
const COLOR_RED = '#CE1126';

const VideoGallery = () => {
  const [videos, setVideos]         = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen]   = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle]     = useState('');
  const [tieu_de, setTitle]             = useState('');
  const [duong_dan, setUrl]                 = useState('');
  const [loading, setLoading]         = useState(false);

  // [MỚI] Search + Date filter
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange]   = useState([]);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/media?type=VIDEO');
      setVideos(res.data);
    } catch { message.error('Lỗi tải video'); }
  };

  useEffect(() => { fetchVideos(); }, []);

  // [MỚI] Filter video theo tên + ngày
  const filteredVideos = useMemo(() => {
    let result = videos;
    if (searchText.trim()) {
      result = result.filter(v => v.tieu_de.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const from = dayjs(dateRange[0]).startOf('day');
      const to   = dayjs(dateRange[1]).endOf('day');
      result = result.filter(v => {
        const created = dayjs(v.ngay_tao);
        return created.isAfter(from) && created.isBefore(to);
      });
    }
    return result;
  }, [videos, searchText, dateRange]);

  const handleAdd = async () => {
    if (!duong_dan || !tieu_de) return message.error('Thiếu thông tin');
    setLoading(true);
    try {
      await axios.post('/media', { loai_hinh_anh: 'VIDEO', tieu_de, video_duong_dan: duong_dan });
      message.success('Thêm video thành công');
      setIsModalOpen(false);
      setTitle(''); setUrl('');
      fetchVideos();
    } catch { message.error('Lỗi thêm video'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editTitle) return message.error('Tiêu đề không được để trống');
    try {
      await axios.put(`/media/${editingVideo.ma_hinh_anh}`, { tieu_de: editTitle });
      message.success('Đã đổi tên video');
      setIsEditOpen(false);
      fetchVideos();
    } catch { message.error('Lỗi cập nhật'); }
  };

  const openEditModal = (vid) => { setEditingVideo(vid); setEditTitle(vid.tieu_de); setIsEditOpen(true); };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/media/${id}`);
      message.success('Đã xóa video');
      fetchVideos();
    } catch { message.error('Lỗi xóa'); }
  };

  const getYoutubeId = (u) => {
    if (!u) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = u.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Space wrap>
          <Input
            placeholder="Tìm theo tên video..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 220, borderRadius: 8 }}
            allowClear
          />
          <DatePicker.RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            format="DD/MM/YYYY"
            onChange={(dates) => setDateRange(dates || [])}
            style={{ borderRadius: 8 }}
            suffixIcon={<CalendarOutlined />}
          />
          <Text style={{ color: '#6b7280', fontSize: 13, alignSelf: 'center' }}>
            <strong>{filteredVideos.length}</strong> / {videos.length} video
          </Text>
        </Space>
        <Button
          type="primary"
          danger
          icon={<YoutubeOutlined />}
          onClick={() => setIsModalOpen(true)}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Thêm Video Youtube
        </Button>
      </div>

      {filteredVideos.length === 0
        ? <Empty description="Không có video nào" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredVideos.map(vid => {
              const videoId = getYoutubeId(vid.duong_dan);
              return (
                <div key={vid.ma_hinh_anh} style={{
                  borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  background: '#fff',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Iframe Youtube */}
                  {videoId
                    ? <iframe width="100%" height="190"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        tieu_de={vid.tieu_de} frameBorder="0" allowFullScreen
                        style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12, display: 'block' }}
                      />
                    : <div style={{ height: 190, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Link lỗi</div>
                  }

                  {/* Footer card */}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Be Vietnam Pro, sans-serif', color: '#111827' }}>
                        {vid.tieu_de}
                      </div>
                      {/* [MỚI] Ngày đăng */}
                      <div style={{ marginTop: 3 }}>
                        <Tag color="default" style={{ fontSize: 10, borderRadius: 4, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                          <CalendarOutlined /> {dayjs(vid.ngay_tao).format('DD/MM/YYYY')}
                        </Tag>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                      <Tooltip tieu_de="Sửa tên">
                        <Button size="small" icon={<EditOutlined />} style={{ borderRadius: 6 }} onClick={() => openEditModal(vid)} />
                      </Tooltip>
                      <Popconfirm tieu_de="Xóa video?" onConfirm={() => handleDelete(vid.ma_hinh_anh)}>
                        <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {/* Modal Thêm Video */}
      <Modal
        tieu_de={<span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>▶️ Thêm Video Youtube</span>}
        open={isModalOpen}
        onOk={handleAdd}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        okText="Thêm vào"
        okButtonProps={{ danger: true }}
      >
        <Input
          placeholder="Tiêu đề video"
          value={tieu_de}
          onChange={e => setTitle(e.target.value)}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
        <Input
          placeholder="Dán link Youtube vào đây..."
          value={duong_dan}
          onChange={e => setUrl(e.target.value)}
          prefix={<YoutubeOutlined style={{ color: 'red' }} />}
          style={{ borderRadius: 8 }}
        />
      </Modal>

      {/* Modal Sửa tên */}
      <Modal
        tieu_de={<span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>✏️ Đổi tên Video</span>}
        open={isEditOpen}
        onOk={handleUpdate}
        onCancel={() => setIsEditOpen(false)}
        okText="Lưu"
        okButtonProps={{ danger: true }}
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

export default VideoGallery;