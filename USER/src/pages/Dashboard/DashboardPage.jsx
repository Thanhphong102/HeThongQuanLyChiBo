// src/pages/Dashboard/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Divider, List, Tag, Button, Empty } from 'antd';
// Import useNavigate để chuyển trang
import { useNavigate } from 'react-router-dom';
import { UserOutlined, CalendarOutlined, DollarCircleOutlined, DashboardOutlined, ClockCircleOutlined, EnvironmentOutlined, QrcodeOutlined, EditOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi';
import dayjs from 'dayjs';
import AttendanceScannerModal from '../../components/AttendanceScannerModal';
const { Title, Text } = Typography;

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [meetings, setMeetings] = useState([]);
  
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  // Khai báo hook điều hướng
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        setProfile(userInfo || {});

        const res = await userApi.getActivities();
        // Cập nhật phân quyền & thời gian
        const allMeetings = res.data || [];
        const upcoming = allMeetings
            .filter(m => {
                 // Nếu là họp chi ủy, check cap_quyen
                 const isCommitteeMeeting = m.loai_hinh && m.loai_hinh.toLowerCase().includes('chi uy');
                 if (isCommitteeMeeting && userInfo.cap_quyen !== 2) {
                     return false;
                 }
                 
                 const now = dayjs();
                 const eventTime = dayjs(m.thoi_gian);
                 
                 // Chỉ hiển thị khi: Thời gian hiện tại >= eventTime - 1 ngày
                 // Tức là: Không cho xem quá sớm khi cuộc họp còn cách xa
                 if (now.isBefore(eventTime.subtract(1, 'day'))) return false;
                 
                 // Ẩn lịch khi: Thời gian hiện tại > eventTime + 1 ngày
                 // Tức là: Đã kết thúc và qua 24h
                 if (now.isAfter(eventTime.add(1, 'day'))) return false;
                 
                 return true;
            })
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
    <div className="animate-fade-in">
      {/* Page Header Premium */}
      <div className="mb-8 p-6 rounded-2xl text-white relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #a91f23 0%, #8b1517 100%)', boxShadow: '0 8px 32px rgba(169,31,35,0.35)' }}>
          <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold text-white m-0 flex items-center gap-3">
              <DashboardOutlined /> TỔNG QUAN CÁ NHÂN
              </h1>
              <p className="text-white/75 mt-1 m-0 text-sm">Xin chào, <strong>{profile.ho_ten || 'Bạn'}</strong> — {profile.chuc_vu_dang || 'Đảng viên'}</p>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute right-16 -bottom-6 w-24 h-24 bg-white/5 rounded-full"></div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Cột 1: Thông tin Cá nhân */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-red-dang font-bold"><UserOutlined /> Hồ sơ Đảng viên</span>} 
            className="shadow-md h-full relative"
            variant="borderless"
            extra={<Button type="link" icon={<EditOutlined />} onClick={() => navigate('/profile')} className="text-gray-500 hover:text-red-dang">Cập nhật</Button>}
          >
            <div className="space-y-2 text-sm">
                <p><Text strong>Họ và Tên:</Text> <span className="text-red-700 font-semibold">{profile.ho_ten}</span></p>
                <Row>
                   <Col span={12}><p><Text strong>MSSV:</Text> {profile.ma_so_sinh_vien || 'Chưa cập nhật'}</p></Col>
                   <Col span={12}><p><Text strong>Lớp:</Text> {profile.lop || '...'}</p></Col>
                </Row>
                <p><Text strong>Ngày sinh:</Text> {profile.ngay_sinh ? dayjs(profile.ngay_sinh).format('DD/MM/YYYY') : '...'}</p>
                <p><Text strong>Điện thoại:</Text> {profile.so_dien_thoai || '...'}</p>
                <p><Text strong>Email:</Text> {profile.email || '...'}</p>
                <p><Text strong>Ngành học:</Text> {profile.nganh_hoc || '...'}</p>

                <Divider className="my-2" />

                 <p><Text strong>Chức vụ:</Text> <span className="font-semibold text-blue-700">{(() => {
                    const mapChucVu = {
                        'Bi thu': 'Bí thư',
                        'Pho bi thu': 'Phó Bí thư',
                        'Dang vien': 'Đảng viên',
                        'Chi uy vien': 'Chi ủy viên',
                    };
                    return mapChucVu[profile.chuc_vu_dang] || profile.chuc_vu_dang;
                 })()}</span></p>
                 <p><Text strong>Chi bộ:</Text> {profile.ten_chi_bo}</p>
                 <Row>
                    <Col span={12}><p><Text strong>Vào Đảng:</Text> {profile.ngay_vao_dang ? dayjs(profile.ngay_vao_dang).format('DD/MM/YYYY') : '...'}</p></Col>
                    <Col span={12}><p><Text strong>Chính thức:</Text> {profile.ngay_chinh_thuc ? dayjs(profile.ngay_chinh_thuc).format('DD/MM/YYYY') : 'Chưa'}</p></Col>
                 </Row>
                 {(profile.so_dinh_danh || profile.so_the_dang_vien) && (
                   <Row>
                     {profile.so_dinh_danh && <Col span={12}><p><Text strong>CCCD:</Text> {profile.so_dinh_danh}</p></Col>}
                     {profile.so_the_dang_vien && <Col span={12}><p><Text strong>Số thẻ ĐV:</Text> {profile.so_the_dang_vien}</p></Col>}
                   </Row>
                 )}
                 <div className="mt-4 text-center">
                     <Tag color={(() => {
                        const s = profile.trang_thai_dang_vien;
                        if (!s) return 'green';
                        if (s === 'Du bi' || s.toLowerCase().includes('dự bị')) return 'orange';
                        if (s === 'Chuyen di') return 'purple';
                        return 'green';
                     })()} className="px-4 py-1 text-base font-bold">
                         {(() => {
                             const mapTT = {
                                 'Du bi': 'DỰ BỊ',
                                 'Chinh thuc': 'CHÍNH THỨC',
                                 'Chuyen di': 'ĐÃ CHUYỂN ĐI',
                             };
                             return mapTT[profile.trang_thai_dang_vien] || (profile.trang_thai_dang_vien ? profile.trang_thai_dang_vien.toUpperCase() : 'ĐẢNG VIÊN CHÍNH THỨC');
                         })()}
                     </Tag>
                 </div>
            </div>
          </Card>
        </Col>

        {/* Cột 2: Lịch sinh hoạt */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-red-dang font-bold"><CalendarOutlined /> Lịch sinh hoạt</span>} 
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
                                    <div className="mt-2">
                                        {dayjs().isAfter(dayjs(item.thoi_gian)) ? (
                                            <Tag color="default" className="text-gray-500 border-gray-300 text-sm font-semibold px-3 py-1">
                                                Đã kết thúc
                                            </Tag>
                                        ) : (
                                            <Button 
                                                size="small"
                                                onClick={() => {
                                                    setSelectedMeeting(item);
                                                    setIsQrModalOpen(true);
                                                }}
                                                className="bg-yellow-50 text-yellow-600 border-yellow-200 hover:!bg-yellow-100 hover:!text-yellow-700 font-bold"
                                            >
                                                <QrcodeOutlined /> Điểm danh (QR)
                                            </Button>
                                        )}
                                    </div>
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

      <AttendanceScannerModal
         isOpen={isQrModalOpen}
         onClose={() => setIsQrModalOpen(false)}
         meetingId={selectedMeeting?.ma_lich}
         meetingTitle={selectedMeeting?.tieu_de || 'Cuộc họp'}
      />
    </div>
  );
};

export default DashboardPage;