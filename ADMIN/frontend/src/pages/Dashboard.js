import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Spin, Space } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  MoneyCollectOutlined, 
  FileTextOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
// Thư viện biểu đồ
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from '../services/axiosConfig';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Gọi API thống kê dành riêng cho Chi bộ
        // Endpoint này khớp với backend/routes/branchRoutes.js
        const res = await axios.get('/branch-admin/dashboard-stats'); 
        // loi64 ko dinh nghia endpoint 
        setStats(res.data);
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 8 }}>Đang tải dữ liệu...</div>
    </div>
    );
  }

  // Dữ liệu giả lập nếu API chưa trả về đủ (để tránh lỗi render)
  const safeStats = stats || {
    totalMembers: 0,
    officialMembers: 0,
    reserveMembers: 0,
    nextMeeting: null,
    unpaidFeeCount: 0,
    recentDocs: []
  };

  // Dữ liệu cho Biểu đồ tròn (Cơ cấu Đảng viên)
  const chartData = [
    { name: 'Chính thức', value: safeStats.officialMembers },
    { name: 'Dự bị', value: safeStats.reserveMembers },
  ];
  // Màu sắc biểu đồ: Xanh dương (Chính thức), Cam (Dự bị)
  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, color: '#003a8c' }}>
        Tổng quan Tình hình Chi bộ
      </Title>
      
      {/* HÀNG 1: 4 THẺ THỐNG KÊ (STATS CARDS) */}
      <Row gutter={[16, 16]}>
        {/* Thẻ 1: Tổng Đảng viên */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable bordered={false} style={{ borderTop: '4px solid #3f8600' }}>
            <Statistic 
              title="Tổng số Đảng viên" 
              value={safeStats.totalMembers} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} 
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              Nhân sự hiện tại của chi bộ
            </div>
          </Card>
        </Col>

        {/* Thẻ 2: Cuộc họp sắp tới */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable bordered={false} style={{ borderTop: '4px solid #1890ff' }}>
            <Statistic 
              title="Họp Chi bộ sắp tới" 
              value={safeStats.nextMeeting ? new Date(safeStats.nextMeeting.thoi_gian).toLocaleDateString('vi-VN') : 'Chưa có lịch'} 
              prefix={<CalendarOutlined />} 
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {safeStats.nextMeeting?.dia_diem || 'Vui lòng tạo lịch họp mới'}
            </div>
          </Card>
        </Col>

        {/* Thẻ 3: Tình hình Đảng phí */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable bordered={false} style={{ borderTop: '4px solid #cf1322' }}>
            <Statistic 
              title="Chưa đóng Đảng phí" 
              value={safeStats.unpaidFeeCount} 
              suffix="đồng chí" 
              prefix={<MoneyCollectOutlined />} 
              valueStyle={{ color: '#cf1322' }} 
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              Cần nhắc nhở đóng phí tháng này
            </div>
          </Card>
        </Col>

        {/* Thẻ 4: Văn bản mới */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable bordered={false} style={{ borderTop: '4px solid #722ed1' }}>
            <Statistic 
              title="Văn bản mới tiếp nhận" 
              value={safeStats.recentDocs.length} 
              prefix={<FileTextOutlined />} 
              valueStyle={{ color: '#722ed1' }} 
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              Từ Đảng ủy trường gửi xuống
            </div>
          </Card>
        </Col>
      </Row>

      <br />

      {/* HÀNG 2: BIỂU ĐỒ & DANH SÁCH THÔNG BÁO */}
      <Row gutter={[24, 24]}>
        {/* Cột Trái: Biểu đồ tròn */}
        <Col xs={24} lg={10}>
          <Card title="Cơ cấu Đảng viên" bordered={false} style={{ height: '100%' }}>
            <div style={{ height: 300, width: '100%' }}>
                {/* Nếu chưa có dữ liệu thì hiện thông báo */}
                {safeStats.totalMembers === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: 100, color: '#999' }}>Chưa có dữ liệu đảng viên</div>
                ) : (
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie 
                                data={chartData} 
                                cx="50%" cy="50%" 
                                innerRadius={60} 
                                outerRadius={80} 
                                fill="#8884d8" 
                                paddingAngle={5} 
                                dataKey="value"
                                label
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
          </Card>
        </Col>
        
        {/* Cột Phải: Danh sách văn bản mới */}
        <Col xs={24} lg={14}>
          <Card 
            title="Văn bản & Thông báo Mới nhất" 
            bordered={false} 
            extra={<a href="#">Xem tất cả <ArrowRightOutlined /></a>}
            style={{ height: '100%' }}
          >
            <List
                itemLayout="horizontal"
                dataSource={safeStats.recentDocs}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff', backgroundColor: '#e6f7ff', padding: 8, borderRadius: '50%' }} />}
                            title={
                                <a href={item.duong_dan} target="_blank" rel="noreferrer" style={{ fontWeight: 500 }}>
                                    {item.ten_tai_lieu}
                                </a>
                            }
                            description={
                                <Space size="small">
                                    <Tag color="blue">{item.loai_tai_lieu}</Tag>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {new Date(item.ngay_tai_len).toLocaleDateString('vi-VN')}
                                    </Text>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;