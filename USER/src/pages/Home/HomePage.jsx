// src/pages/Home/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Carousel, Spin, Empty, Modal, Button } from 'antd';
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi';
import dayjs from 'dayjs';

const { Paragraph } = Typography;

// --- HÀM XỬ LÝ ẢNH ---
const getImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/800x400?text=No+Image';
    
    // 1. Xử lý link Google Drive (Cách mới: lh3.googleusercontent.com)
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            const fileId = match[1];
            return `https://lh3.googleusercontent.com/d/${fileId}=w1000`; 
        }
    }
    
    // 2. Xử lý link Localhost
    if (url.includes('uploads/') || url.includes('uploads\\')) {
        const cleanPath = url.replace(/\\/g, '/');
        if (!cleanPath.startsWith('http')) {
             const path = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
             return `http://localhost:5001/${path}`;
        }
    }

    return url;
};

const HomePage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        setUser(userInfo || {});

        const res = await userApi.getNews();
        const sortedNews = (res.data || []).sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));
        setNews(sortedNews);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleViewDetail = (item) => {
      setSelectedNews(item);
      setIsModalOpen(true);
  };

  const carouselNews = news.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* 1. BANNER CHÀO MỪNG */}
      <div className="bg-red-dang text-yellow-sao p-8 rounded-lg shadow-md text-center border-b-4 border-yellow-400">
        <h2 className="text-xl md:text-3xl font-bold uppercase m-0 leading-relaxed" style={{ color: '#FFFF00' }}>
          CHÀO MỪNG ĐẾN VỚI {user.ten_chi_bo ? user.ten_chi_bo.toUpperCase() : 'HỆ THỐNG QUẢN LÝ CHI BỘ'}
        </h2>
        <Paragraph className="text-white mt-2 text-lg italic opacity-90">
          HỌC TẬP VÀ LÀM THEO TƯ TƯỞNG, ĐẠO ĐỨC, PHONG CÁCH HỒ CHÍ MINH 
        </Paragraph>
      </div>

      {/* 2. CAROUSEL TIN TỨC */}
      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-black">
        {loading ? (
            <div className="h-64 flex items-center justify-center bg-white"><Spin /></div>
        ) : carouselNews.length > 0 ? (
            <Carousel autoplay effect="fade" autoplaySpeed={5000}>
                {carouselNews.map((item) => (
                    <div key={item.id} className="relative h-[300px] md:h-[500px] cursor-pointer" onClick={() => handleViewDetail(item)}>
                        <img 
                            src={getImageUrl(item.duong_dan_anh)} 
                            alt={item.tieu_de} 
                            className="w-full h-full object-contain bg-black"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6">
                            <h3 className="text-white text-xl md:text-3xl font-bold mb-2 line-clamp-2 hover:text-yellow-sao transition-colors">
                                {item.tieu_de}
                            </h3>
                            <div className="text-gray-300 text-sm flex items-center">
                                <CalendarOutlined className="mr-2"/> 
                                {dayjs(item.ngay_tao).format('HH:mm - [Ngày] DD [tháng] MM [năm] YYYY')}
                            </div>
                        </div>
                    </div>
                ))}
            </Carousel>
        ) : (
            <div className="h-40 flex items-center justify-center text-gray-500 bg-white">Chưa có tin tức nổi bật</div>
        )}
      </div>

      {/* 3. DANH SÁCH BẢN TIN NỔI BẬT */}
      <Card 
        title={<span className="text-red-dang font-bold text-xl border-l-4 border-red-dang pl-3">BẢN TIN HOẠT ĐỘNG MỚI</span>} 
        className="shadow-md"
        variant="borderless"
      >
        <List
            itemLayout="vertical"
            size="large"
            pagination={{ pageSize: 5 }}
            dataSource={news}
            locale={{ emptyText: <Empty description="Không có bản tin nào" /> }}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                className="hover:bg-gray-50 transition-colors rounded-lg px-4"
                actions={[
                    <span className="text-gray-500">
                        <CalendarOutlined /> {dayjs(item.ngay_tao).format('DD/MM/YYYY HH:mm')}
                    </span>,
                    <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(item)}>Xem chi tiết</Button>
                ]}
                extra={
                  item.duong_dan_anh && (
                    <div className="w-48 h-32 overflow-hidden rounded-md border border-gray-200 hidden md:block bg-gray-100">
                        <img 
                            alt="tintuc" 
                            src={getImageUrl(item.duong_dan_anh)} 
                            className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" 
                        />
                    </div>
                  )
                }
              >
                <List.Item.Meta
                  title={
                    <a onClick={() => handleViewDetail(item)} className="text-lg font-bold text-gray-800 hover:text-red-dang">
                        {item.tieu_de}
                    </a>
                  }
                  description={<div className="line-clamp-2 text-gray-500">{item.noi_dung}</div>}
                />
              </List.Item>
            )}
        />
      </Card>

      {/* 4. MODAL XEM CHI TIẾT TIN TỨC */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
            <Button key="close" type="primary" onClick={() => setIsModalOpen(false)} className="bg-red-dang">
                Đóng
            </Button>
        ]}
        width={900}
        centered
        styles={{ body: { padding: 0 } }}
      >
        {selectedNews && (
            <div>
                {/* Header ảnh của Modal */}
                {selectedNews.duong_dan_anh && (
                    // FIX 3: Bỏ fixed height (h-64), dùng w-full và h-auto để ảnh hiển thị 100% kích thước
                    // Thêm max-h để không quá dài nếu ảnh dọc
                    <div className="w-full bg-gray-100 flex justify-center">
                        <img 
                            src={getImageUrl(selectedNews.duong_dan_anh)} 
                            alt={selectedNews.tieu_de} 
                            className="w-full h-auto max-h-[600px] object-contain" 
                        />
                    </div>
                )}
                
                {/* Nội dung chi tiết */}
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-red-dang mb-2">{selectedNews.tieu_de}</h2>
                    <div className="flex items-center text-gray-500 text-sm mb-6 border-b pb-4">
                        <CalendarOutlined className="mr-2"/> 
                        {/* FIX 2: Format ngày tháng trong Modal */}
                        {dayjs(selectedNews.ngay_tao).format('HH:mm - [Ngày] DD [tháng] MM [năm] YYYY')}
                    </div>
                    
                    <div className="text-gray-800 text-base leading-relaxed whitespace-pre-line text-justify">
                        {selectedNews.noi_dung}
                    </div>

                    {selectedNews.drive_file_id && (
                        <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
                            <p className="font-semibold mb-2">Tài liệu đính kèm:</p>
                            <Button href={`https://drive.google.com/file/d/${selectedNews.drive_file_id}/view`} target="_blank">
                                Xem trên Google Drive
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default HomePage;