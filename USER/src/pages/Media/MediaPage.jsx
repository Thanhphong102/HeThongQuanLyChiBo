// src/pages/Media/MediaPage.jsx
import React, { useState, useEffect } from 'react';
import { Image, Card, Empty, Spin, Tabs, Row, Col, Typography } from 'antd';
import { PlayCircleOutlined, PictureOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi';
import dayjs from 'dayjs';

const { Title } = Typography;

// --- HÀM XỬ LÝ LINK GOOGLE DRIVE ---
const getMediaSrc = (url) => {
    if (!url) return '';
    
    // Kiểm tra nếu là link Google Drive
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        // Tách lấy ID file
        const idMatch = url.match(/[-\w]{25,}/);
        if (idMatch) {
            const fileId = idMatch[0];
            // Link này dùng cho thẻ <img> cực nhanh
            return `https://lh3.googleusercontent.com/d/${fileId}`; 
        }
    }
    
    // Nếu là file upload localhost (có prefix uploads/)
    if (url.includes('uploads/')) {
        return `http://localhost:5001/${url}`; // Đảm bảo đúng port backend
    }

    return url;
};

// Hàm lấy link embed cho Video (Dùng iframe ổn định hơn thẻ video cho Drive)
const getVideoEmbedSrc = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
         const idMatch = url.match(/[-\w]{25,}/);
         if (idMatch) return `https://drive.google.com/file/d/${idMatch[0]}/preview`;
    }
    if (url.includes('uploads/')) {
        return `http://localhost:5001/${url}`;
    }
    return url;
};

const MediaPage = () => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user_info'));
        if (user?.ma_chi_bo) {
            const res = await userApi.getMedia(user.ma_chi_bo);
            setMediaList(res.data || []);
        }
      } catch (e) {
        console.log("Lỗi tải thư viện:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const images = mediaList.filter(m => m.media_type === 'IMAGE');
  const videos = mediaList.filter(m => m.media_type === 'VIDEO');

  // Render danh sách Ảnh
  const renderImages = () => (
    images.length > 0 ? (
      <Image.PreviewGroup>
        <Row gutter={[16, 16]}>
          {images.map((item) => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <Card hoverable className="overflow-hidden h-full shadow-sm" bodyStyle={{padding: 0}} variant="borderless">
                  <div className="aspect-video w-full overflow-hidden flex items-center bg-gray-100">
                    <Image 
                        width="100%"
                        height={200}
                        // Dùng hàm xử lý link ở đây
                        src={getMediaSrc(item.url)} 
                        className="object-cover transition-transform duration-300 hover:scale-110"
                        alt={item.title}
                        fallback="https://via.placeholder.com/300x200?text=Lỗi+Ảnh"
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-gray-800 truncate" title={item.title}>{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{dayjs(item.created_at).format('DD/MM/YYYY')}</div>
                  </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Image.PreviewGroup>
    ) : <Empty description="Chưa có hình ảnh nào" />
  );

  // Render danh sách Video
  const renderVideos = () => (
    videos.length > 0 ? (
      <Row gutter={[16, 16]}>
        {videos.map((item) => {
            const isDrive = item.url.includes('drive.google.com');
            return (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <Card hoverable className="h-full shadow-sm" bodyStyle={{padding: 0}} variant="borderless">
                    <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                        {isDrive ? (
                            // Nếu là Drive thì dùng Iframe để play ổn định
                            <iframe 
                                src={getVideoEmbedSrc(item.url)} 
                                className="w-full h-full" 
                                allow="autoplay"
                                title={item.title}
                            ></iframe>
                        ) : (
                            // Nếu là file thường thì dùng thẻ video
                            <video controls className="w-full h-full object-contain">
                                <source src={getVideoEmbedSrc(item.url)} type="video/mp4" />
                            </video>
                        )}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-red-dang truncate" title={item.title}>
                          <PlayCircleOutlined className="mr-2"/>{item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{dayjs(item.created_at).format('DD/MM/YYYY')}</div>
                    </div>
                </Card>
              </Col>
            );
        })}
      </Row>
    ) : <Empty description="Chưa có video nào" />
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
      <Title level={2} className="text-red-dang border-b-2 border-yellow-sao inline-block mb-6 uppercase">
        Thư viện hoạt động
      </Title>
      <Tabs defaultActiveKey="1" items={items} type="card" size="large" />
    </div>
  );
};

export default MediaPage;