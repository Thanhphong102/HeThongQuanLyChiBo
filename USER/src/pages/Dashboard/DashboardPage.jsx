// src/pages/Dashboard/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Divider, List, Tag, Button, Empty } from 'antd';
// Import useNavigate để chuyển trang
import { useNavigate } from 'react-router-dom';
import { UserOutlined, CalendarOutlined, DollarCircleOutlined, DashboardOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [meetings, setMeetings] = useState([]);
  
  // Khai báo hook điều hướng
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        setProfile(userInfo || {});

        const res = await userApi.getActivities();
        const allMeetings = res.data || [];
        const upcoming = allMeetings
            .filter(m => dayjs(m.thoi_gian).isAfter(dayjs()))
            .sort((a, b) => dayjs(a.thoi_gian).valueOf() - dayjs(b.thoi_gian).valueOf());

        setMeetings(upcoming);
      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
    </div>
  );

  return (
    <div>
      <Title level={2} className="text-red-dang border-b pb-2 mb-6">
        <DashboardOutlined className="mr-2" />DASHBOARD CÁ NHÂN
      </Title>

      <Row gutter={[24, 24]}>
        {/* Cột 1: Thông tin Cá nhân */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-red-dang font-bold"><UserOutlined /> Hồ sơ Đảng viên</span>} 
            className="shadow-md h-full"
            variant="borderless"
          >
            <div className="space-y-2">
                <p><Text strong>Họ và Tên:</Text> {profile.ho_ten}</p>
                <p><Text strong>Chức vụ:</Text> {profile.chuc_vu_dang}</p>
                <p><Text strong>Chi bộ:</Text> {profile.ten_chi_bo}</p>
                <p><Text strong>Ngày vào Đảng:</Text> {profile.ngay_vao_dang ? dayjs(profile.ngay_vao_dang).format('DD/MM/YYYY') : '...'}</p>
                <div className="mt-4 text-center">
                    <Tag color="red" className="px-4 py-1 text-base">Đảng viên chính thức</Tag>
                </div>
            </div>
          </Card>
        </Col>

        {/* Cột 2: Lịch sinh hoạt */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-red-dang font-bold"><CalendarOutlined /> Lịch sinh hoạt Sắp tới</span>} 
            className="shadow-md h-full"
            variant="borderless"
          >
            <List
                dataSource={meetings}
                locale={{ emptyText: <Empty description="Không có lịch họp sắp tới" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                renderItem={item => (
                    <List.Item className="border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
                        <List.Item.Meta
                            title={<span className="text-red-dang font-semibold">{item.tieu_de}</span>}
                            description={
                                <div className="text-xs text-gray-500 mt-1">
                                    <div className="mb-1"><ClockCircleOutlined className="mr-1"/> {dayjs(item.thoi_gian).format('HH:mm - DD/MM/YYYY')}</div>
                                    <div><EnvironmentOutlined className="mr-1"/> {item.dia_diem || 'Chưa cập nhật'}</div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
          </Card>
        </Col>

        {/* Cột 3: Đảng phí */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-red-dang font-bold"><DollarCircleOutlined /> Trạng thái Đảng phí</span>} 
            className="shadow-md h-full"
            variant="borderless"
          >
             <div className="text-center py-4">
                 <p className="text-gray-600 mb-2">Mức đóng hàng tháng</p>
                 <h2 className="text-3xl font-bold text-red-dang mb-4">
                    {Number(profile.muc_dong_phi || 0).toLocaleString('vi-VN')} đ
                 </h2>
                 <Divider />
                 <Button 
                    type="primary" 
                    className="bg-red-dang w-full h-10 font-bold hover:!bg-red-800"
                    // 👇 Gắn sự kiện chuyển trang tại đây
                    onClick={() => navigate('/lookup')}
                 >
                    Tra cứu Lịch sử Đóng phí
                 </Button>
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;