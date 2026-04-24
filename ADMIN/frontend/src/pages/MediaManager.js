import React from 'react';
import { Tabs, Typography } from 'antd';
import { PictureOutlined, VideoCameraOutlined } from '@ant-design/icons';

import ImageGallery from '../components/ImageGallery';
import VideoGallery from '../components/VideoGallery';

const { Title, Text } = Typography;

const MediaManager = () => {
  const items = [
    {
      key: '1',
      label: (
        <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 500 }}>
          <PictureOutlined /> Thư viện Ảnh
        </span>
      ),
      children: <ImageGallery />,
    },
    {
      key: '2',
      label: (
        <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 500 }}>
          <VideoCameraOutlined /> Thư viện Video
        </span>
      ),
      children: <VideoGallery />,
    },
  ];

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      {/* Tiêu đề trang */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 700, color: '#111827' }}>
          Thư viện Truyền thông & Kỷ yếu Chi bộ
        </Title>
        <Text style={{ color: '#6b7280', fontSize: 14 }}>
          Quản lý hình ảnh và video hoạt động của Chi bộ
        </Text>
      </div>

      {/* Tabs Ảnh / Video */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        padding: 24,
        minHeight: '70vh',
      }}>
        <Tabs
          defaultActiveKey="1"
          items={items}
          type="card"
          size="middle"
          tabBarStyle={{ fontFamily: 'Be Vietnam Pro, sans-serif', marginBottom: 20 }}
        />
      </div>
    </div>
  );
};

export default MediaManager;