import React from 'react';
import { Tabs } from 'antd';
import { PictureOutlined, VideoCameraOutlined, FolderOpenOutlined } from '@ant-design/icons';

import ImageGallery from '../components/ImageGallery';
import AlbumGallery from '../components/AlbumGallery';
import VideoGallery from '../components/VideoGallery';
import PageHeader from '../components/PageHeader';

const MediaManager = () => {
  const items = [
    {
      key: '1',
      label: (
        <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 500 }}>
          <FolderOpenOutlined /> Thư viện Album
        </span>
      ),
      children: <AlbumGallery />,
    },
    {
      key: '2',
      label: (
        <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 500 }}>
          <PictureOutlined /> Thư viện Ảnh (Tự do)
        </span>
      ),
      children: <ImageGallery />,
    },
    {
      key: '3',
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
      <PageHeader
        icon={<PictureOutlined />}
        title="Thư viện Truyền thông & Kỷ yếu"
        subtitle="Quản lý hình ảnh và video hoạt động của Chi bộ"
      />

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