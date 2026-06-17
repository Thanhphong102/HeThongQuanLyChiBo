// src/pages/Media/MediaPage.jsx
import React, { useState, useEffect } from 'react';
import { Image, Card, Empty, Spin, Tabs, Row, Col, Typography, Input, DatePicker, Space, Pagination, Popover, Badge, Button } from 'antd';
import { PlayCircleOutlined, PictureOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi';
import dayjs from 'dayjs';
import { removeAccents } from '../../utils/stringUtils';

const { Title } = Typography;

// --- HÀM XỬ LÝ LINK GOOGLE DRIVE ---
const getMediaSrc = (duong_dan) => {
  if (!duong_dan) return '';

  // Kiểm tra nếu là link Google Drive
  if (duong_dan.includes('drive.google.com') || duong_dan.includes('docs.google.com')) {
    // Tách lấy ID file
    const idMatch = duong_dan.match(/[-\w]{25,}/);
    if (idMatch) {
      const fileId = idMatch[0];
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      return `${apiBaseUrl}/media/proxy/${fileId}`;
    }
  }

  if (duong_dan.includes('uploads/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const backendUrl = apiBaseUrl.replace('/api', '');
    return `${backendUrl}/${duong_dan}`;
  }

  return duong_dan;
};

// Hàm lấy link embed cho Video (Dùng iframe ổn định hơn thẻ video cho Drive)
const getVideoEmbedSrc = (duong_dan) => {
  if (!duong_dan) return '';
  if (duong_dan.includes('drive.google.com')) {
    const idMatch = duong_dan.match(/[-\w]{25,}/);
    if (idMatch) return `https://drive.google.com/file/d/${idMatch[0]}/preview`;
  }
  if (duong_dan.includes('uploads/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const backendUrl = apiBaseUrl.replace('/api', '');
    return `${backendUrl}/${duong_dan}`;
  }
  return duong_dan;
};

// Hàm lấy ID Youtube từ link
const getYoutubeId = (u) => {
  if (!u) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = u.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const MediaPage = () => {
  const [mediaList, setMediaList] = useState([]);
  const [albumList, setAlbumList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  
  const [imgPage, setImgPage] = useState(1);
  const imgPageSize = 8; 

  // Album Preview State
  const [previewAlbum, setPreviewAlbum] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [loadingAlbum, setLoadingAlbum] = useState(false);

  const [vidPage, setVidPage] = useState(1);
  const vidPageSize = 6;

  useEffect(() => {
    setImgPage(1);
    setVidPage(1);
  }, [searchTerm, dateFilter]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user_info'));
        if (user?.ma_chi_bo) {
          const [mediaRes, albumRes] = await Promise.all([
            userApi.getMedia(user.ma_chi_bo),
            userApi.getAlbums()
          ]);
          setMediaList(mediaRes.data || []);
          setAlbumList(albumRes.data || []);
        }
      } catch (e) {
        console.log("Lỗi tải thư viện:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const filteredMedia = mediaList.filter(m => {
    const matchSearch = removeAccents(m.tieu_de).includes(removeAccents(searchTerm));
    const matchDate = dateFilter ? dayjs(m.ngay_tao).format('MM/YYYY') === dateFilter.format('MM/YYYY') : true;
    return matchSearch && matchDate;
  });

  const images = filteredMedia.filter(m => m.loai_hinh_anh === 'IMAGE' && !m.ma_album);
  const videos = filteredMedia.filter(m => m.loai_hinh_anh === 'VIDEO');

  const filteredAlbums = albumList.filter(al => {
    const matchSearch = removeAccents(al.ten_album).includes(removeAccents(searchTerm));
    const matchDate = dateFilter ? dayjs(al.ngay_tao).format('MM/YYYY') === dateFilter.format('MM/YYYY') : true;
    return matchSearch && matchDate;
  });

  const handleOpenAlbum = async (album) => {
    setLoadingAlbum(true);
    try {
      const res = await userApi.getAlbumById(album.ma_album);
      setPreviewAlbum(res.data.images || []);
      setPreviewVisible(true);
    } catch (e) {
      console.log('Lỗi mở album:', e);
    } finally {
      setLoadingAlbum(false);
    }
  };

  const paginatedImages = images.slice((imgPage - 1) * imgPageSize, imgPage * imgPageSize);
  const paginatedVideos = videos.slice((vidPage - 1) * vidPageSize, vidPage * vidPageSize);

  // Render danh sách Ảnh và Album
  const renderImages = () => (
    <div>
      {/* --- PHẦN ALBUM --- */}
      {filteredAlbums.length > 0 && (
        <div className="mb-8">
          <div className="font-semibold text-gray-700 text-lg mb-4">🗂️ Danh sách Album</div>
          <Row gutter={[16, 16]}>
            {filteredAlbums.map(album => (
              <Col xs={24} sm={12} md={8} lg={6} key={album.ma_album}>
                <Card 
                  hoverable 
                  className="overflow-hidden h-full shadow-sm" 
                  bodyStyle={{ padding: 0 }} 
                  variant="borderless"
                  onClick={() => handleOpenAlbum(album)}
                >
                  <div className="aspect-video w-full overflow-hidden flex items-center justify-center bg-gray-100">
                    {album.anh_bia ? (
                      <img
                        src={getMediaSrc(album.anh_bia)}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        alt={album.ten_album}
                      />
                    ) : (
                      <span className="text-gray-400">Không có ảnh</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-gray-800 truncate" title={album.ten_album}>{album.ten_album}</div>
                    <div className="text-xs text-gray-500 mt-1">{album.so_luong_anh} ảnh • {dayjs(album.ngay_tao).format('DD/MM/YYYY')}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* --- PHẦN ẢNH LẺ --- */}
      {images.length > 0 && (
        <div>
          <div className="font-semibold text-gray-700 text-lg mb-4">🖼️ Ảnh tự do</div>
          <Image.PreviewGroup>
            <Row gutter={[16, 16]}>
              {paginatedImages.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.ma_hinh_anh}>
                  <Card hoverable className="overflow-hidden h-full shadow-sm" bodyStyle={{ padding: 0 }} variant="borderless">
                    <div className="aspect-video w-full overflow-hidden flex items-center bg-gray-100">
                      <Image
                        width="100%"
                        height={200}
                        src={getMediaSrc(item.duong_dan)}
                        className="object-cover transition-transform duration-300 hover:scale-110"
                        alt={item.tieu_de}
                        fallback="https://via.placeholder.com/300x200?text=Lỗi+Ảnh"
                      />
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-gray-800 truncate" title={item.tieu_de}>{item.tieu_de}</div>
                      <div className="text-xs text-gray-500 mt-1">{dayjs(item.ngay_tao).format('DD/MM/YYYY')}</div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Image.PreviewGroup>
          <div className="mt-8 flex justify-center">
              <Pagination 
                  current={imgPage} 
                  pageSize={imgPageSize} 
                  total={images.length} 
                  onChange={page => setImgPage(page)} 
                  showSizeChanger={false}
              />
          </div>
        </div>
      )}

      {filteredAlbums.length === 0 && images.length === 0 && (
        <Empty description="Không có ảnh nào" />
      )}

      {/* Hidden PreviewGroup for Album Lightbox */}
      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          preview={{
            visible: previewVisible,
            onVisibleChange: (vis) => setPreviewVisible(vis),
          }}
        >
          {previewAlbum && previewAlbum.map(img => (
            <Image key={img.ma_hinh_anh} src={getMediaSrc(img.duong_dan)} />
          ))}
        </Image.PreviewGroup>
      </div>
    </div>
  );

  // Render danh sách Video
  const renderVideos = () => (
    videos.length > 0 ? (
      <div>
        <Row gutter={[16, 16]}>
          {paginatedVideos.map((item) => {
            const isDrive = item.duong_dan.includes('drive.google.com');
            const youtubeId = getYoutubeId(item.duong_dan);
            
            return (
              <Col xs={24} sm={12} md={8} key={item.ma_hinh_anh}>
                <Card hoverable className="h-full shadow-sm" bodyStyle={{ padding: 0 }} variant="borderless">
                  <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                    {youtubeId ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={item.tieu_de || 'Video'}
                        frameBorder="0"
                        allowFullScreen
                        className="block"
                      ></iframe>
                    ) : isDrive ? (
                      <iframe
                        src={getVideoEmbedSrc(item.duong_dan)}
                        className="w-full h-full"
                        allow="autoplay"
                        title={item.tieu_de}
                      ></iframe>
                    ) : (
                      <video controls className="w-full h-full object-contain">
                        <source src={getVideoEmbedSrc(item.duong_dan)} type="video/mp4" />
                      </video>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-red-dang truncate" title={item.tieu_de}>
                      <PlayCircleOutlined className="mr-2" />{item.tieu_de}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{dayjs(item.ngay_tao).format('DD/MM/YYYY')}</div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
        <div className="mt-8 flex justify-center">
            <Pagination 
                current={vidPage} 
                pageSize={vidPageSize} 
                total={videos.length} 
                onChange={page => setVidPage(page)} 
                showSizeChanger={false}
            />
        </div>
      </div>
    ) : <Empty description="Không tìm thấy video nào phù hợp" className="mt-10" />
  );

  const items = [
    {
      key: '1',
      label: <span><PictureOutlined /> HÌNH ẢNH ({images.length})</span>,
      children: renderImages(),
    },
    {
      key: '2',
      label: <span><PlayCircleOutlined /> VIDEO ({videos.length})</span>,
      children: renderVideos(),
    },
  ];

  if (loading) return <div className="text-center p-20"><Spin size="large" /></div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <Title level={2} className="text-red-dang border-b-2 border-yellow-sao inline-block uppercase m-0">
            Thư viện hoạt động
          </Title>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0">
            <Input 
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm kiếm hình ảnh/video..." 
              allowClear 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ width: '100%', minWidth: 300, borderRadius: 8 }} 
              size="large"
            />
            <Popover 
                content={
                    <div className="flex flex-col gap-4 w-64 p-2">
                        <div>
                            <Typography.Text strong className="block mb-1 text-gray-700">Lọc theo tháng</Typography.Text>
                            <DatePicker 
                                picker="month" 
                                placeholder="Chọn tháng/năm" 
                                format="MM/YYYY"
                                style={{ width: '100%', borderRadius: 8 }} 
                                onChange={date => setDateFilter(date)}
                                value={dateFilter}
                                allowClear
                            />
                        </div>
                        {dateFilter && (
                            <Button 
                                type="link" 
                                danger 
                                onClick={() => setDateFilter(null)}
                                className="p-0 text-left"
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                } 
                title={<span className="font-bold text-gray-800 border-b pb-2 block">Bộ lọc nâng cao</span>} 
                trigger="click" 
                placement="bottomRight"
            >
                <Badge count={dateFilter ? 1 : 0} size="small" color="#a91f23">
                    <Button size="large" icon={<FilterOutlined />} className="font-semibold text-gray-700 flex items-center gap-2">
                        Bộ lọc
                    </Button>
                </Badge>
            </Popover>
          </div>
      </div>
      <Tabs defaultActiveKey="1" items={items} type="card" size="large" />
    </div>
  );
};

export default MediaPage;