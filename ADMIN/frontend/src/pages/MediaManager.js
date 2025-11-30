import React from 'react';
import { Card, Tabs } from 'antd';
import { PictureOutlined, VideoCameraOutlined, AppstoreOutlined } from '@ant-design/icons';

// Import 2 component con
import ImageGallery from '../components/ImageGallery'; 
import VideoGallery from '../components/VideoGallery';

const MediaManager = () => {
  const items = [
    {
      key: '1',
      label: (
        <span>
          <PictureOutlined /> Thư viện Ảnh
        </span>
      ),
      children: <ImageGallery />,
    },
    {
      key: '2',
      label: (
        <span>
          <VideoCameraOutlined /> Thư viện Video
        </span>
      ),
      children: <VideoGallery />,
    },
  ];

  return (
    <div style={{ padding: 0 }}>
        <Card 
            title={
                <span><AppstoreOutlined /> Thư viện Truyền thông & Kỷ yếu Chi bộ</span>
            }
            style={{ minHeight: '80vh' }}
        >
            <Tabs defaultActiveKey="1" items={items} type="card" />
        </Card>
    </div>
  );
};

export default MediaManager;