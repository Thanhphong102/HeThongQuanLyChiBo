import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Row, Col, Avatar, Tooltip } from 'antd';
import {
  AppstoreOutlined, KeyOutlined, TeamOutlined,
  UserOutlined, FileImageOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import userApi from '../../api/userApi';

const { Title, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const [orgData, setOrgData] = useState([]);
  const [processData, setProcessData] = useState([]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [orgRes, processRes] = await Promise.all([
          userApi.getPublicOrgChart(),
          userApi.getPublicProcesses()
        ]);
        setOrgData(orgRes.data || []);
        setProcessData(processRes.data || []);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu public:", error);
      }
    };
    fetchLandingData();
  }, []);

  const features = [
    {
      icon: <TeamOutlined className="text-4xl text-red-dang mb-4" />,
      title: "Quản Lý Đảng Viên",
      desc: "Theo dõi, số hóa hồ sơ Đảng viên và quản lý sinh hoạt thuận tiện, minh bạch."
    },
    {
      icon: <AppstoreOutlined className="text-4xl text-red-dang mb-4" />,
      title: "Hồ Sơ & Tài Liệu",
      desc: "Lưu trữ văn bản, biểu mẫu trực tuyến, dễ dàng tra cứu và tải xuống."
    },
    {
      icon: <KeyOutlined className="text-4xl text-red-dang mb-4" />,
      title: "Bảo Mật Cao",
      desc: "Cấp quyền rõ ràng giữa Bí thư, Quản trị viên và người dùng cơ bản."
    }
  ];

  // Helper convert Drive Link -> Proxy Link cho màn Landing (Dành cho ảnh cũ lẫn mới)
  const getDirectImageUrl = (url) => {
    if (!url) return '';
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = (match && match[1]) || (idParamMatch && idParamMatch[1]);

    // axiosClient.js default baseURL là VITE_API_URL hoặc http://localhost:5001/api
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    if (id) {
      return `${apiBaseUrl}/media/proxy/${id}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden flex flex-col">
      {/* Navbar đơn giản */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md py-4 px-8 flex justify-between items-center z-10 sticky top-0"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Trường" className="w-12 h-12 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="font-bold text-red-dang text-sm uppercase hidden sm:block leading-tight">
            <div>ĐẢNG BỘ TRƯỜNG</div>
            <div>ĐẠI HỌC KỸ THUẬT CÔNG NGHỆ - CẦN THƠ</div>
          </div>
        </div>
        <Button
          type="primary"
          className="bg-red-dang hover:!bg-red-dam border-none shadow-md text-yellow-sao font-semibold"
          onClick={() => navigate('/login')}
        >
          Đăng Nhập
        </Button>
      </motion.nav>

      {/* Hero Section */}
      <div className="py-20 flex flex-col items-center justify-center px-4 relative bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="text-center z-10 mb-12"
        >
          <div className="inline-block px-4 py-1 bg-yellow-sao/20 text-red-dang rounded-full text-sm font-semibold mb-6 border border-yellow-sao/50">
            Công Tác Đảng Trực Tuyến
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-red-dang mb-6 leading-tight">
            Hệ Thống Quản Lý Chi Bộ <br />
            <span className="text-4xl md:text-5xl">Trường Đại học Kỹ thuật - Công nghệ Cần Thơ</span>
          </h1>
          <Paragraph className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Nền tảng số hoá quy trình hoạt động công tác Đảng dành cho Chi bộ Sinh viên. Đồng bộ, trực quan, bảo mật và thân thiện với thế hệ trẻ.
          </Paragraph>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="primary"
              size="large"
              className="bg-red-dang hover:!bg-yellow-sao hover:!text-red-dang border-none shadow-xl h-14 px-10 text-lg text-yellow-sao font-bold transition-all duration-300 rounded-full"
              onClick={() => navigate('/login')}
            >
              Vào Hệ Thống
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <div className="container mx-auto z-10 max-w-5xl">
          <Row gutter={[24, 24]} justify="center">
            {features.map((item, index) => (
              <Col xs={24} md={8} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full rounded-2xl shadow-lg hover:shadow-2xl border-none transition-all duration-300 flex flex-col items-center text-center px-4 py-6 group bg-white/80 backdrop-blur-sm">
                    <div className="transform group-hover:-translate-y-2 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <Title level={4} className="!mt-4 !font-bold !text-gray-800">{item.tieu_de}</Title>
                    <Paragraph className="text-gray-500 text-base">{item.desc}</Paragraph>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-red-dang/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-yellow-sao/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* SECTION 2: SƠ ĐỒ CƠ CẤU TỔ CHỨC */}
      {orgData.length > 0 && (
        <div className="py-20 bg-gray-50 px-4 relative">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Cơ cấu Tổ chức Chi bộ</h2>
              <div className="w-24 h-1 bg-red-dang mx-auto rounded-full"></div>
            </motion.div>

            <Row gutter={[24, 32]} justify="center">
              {orgData.map((person, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={person.ma_so_do}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full"
                  >
                    <Card className="h-full rounded-2xl shadow-sm hover:shadow-xl border-t-4 border-t-red-dang text-center transition-all bg-white relative overflow-hidden group">
                      <div className="flex flex-col items-center">
                        <Avatar
                          size={100}
                          src={getDirectImageUrl(person.anh_the)}
                          icon={<UserOutlined />}
                          className="border-4 border-white shadow-md mb-4 bg-gray-200"
                        />
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{person.ho_ten}</h3>
                        <div className="text-sm font-semibold text-red-dang bg-red-50 px-3 py-1 rounded-full">
                          {person.chuc_vu}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      )}

      {/* SECTION 3: QUY TRÌNH CÔNG TÁC ĐẢNG */}
      {processData.length > 0 && (
        <div className="py-20 bg-white px-4 relative">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Quy trình Công tác Đảng</h2>
              <div className="w-24 h-1 bg-yellow-sao mx-auto rounded-full"></div>
            </motion.div>

            <div className="space-y-8">
              {processData.map((process, index) => (
                <motion.div
                  key={process.ma_quy_trinh}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
                    <Row align="middle" gutter={24}>
                      <Col xs={24} md={16} className="mb-4 md:mb-0">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{process.tieu_de}</h3>
                            <p className="text-gray-500 text-base m-0">{process.mo_ta || "Ban hành quy định biểu mẫu chi tiết trong công tác chuyên môn."}</p>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} md={8} className="text-left md:text-right">
                        <Button
                          size="large"
                          icon={<FileImageOutlined />}
                          href={getDirectImageUrl(process.duong_dan_file)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #a91f23 0%, #8b1517 100%)',
                            color: '#fff1aa',
                            border: 'none',
                            boxShadow: '0 4px 14px rgba(169,31,35,0.4)'
                          }}
                        >
                          Xem Sơ đồ / Tài liệu
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="container mx-auto">
          <p className="mb-2">© 2026 Hệ thống Quản lý Chi bộ Sinh viên.</p>
          <p>Thiết kế tinh gọn, bảo mật và thông minh.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
