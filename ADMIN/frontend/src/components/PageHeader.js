import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

/**
 * PageHeader - Component tiêu đề trang có gradient xanh đồng nhất
 * 
 * @param {ReactNode} icon - Icon hiển thị bên trái (từ @ant-design/icons)
 * @param {string} title - Tiêu đề chính
 * @param {string} subtitle - Dòng mô tả nhỏ bên dưới
 */
const PageHeader = ({ icon, title, subtitle }) => {
  return (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,21,41,0.15)',
        background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
        border: 'none',
      }}
      styles={{ body: { padding: '20px 28px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon && React.cloneElement(icon, { style: { fontSize: 28, color: '#fff' } })}
        </div>
        <div>
          <Title level={3} style={{ color: '#fff', margin: 0, fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 700 }}>
            {title}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            {subtitle}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default PageHeader;
