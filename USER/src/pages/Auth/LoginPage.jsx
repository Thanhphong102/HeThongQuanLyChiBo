import React from 'react';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import authApi from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await authApi.login(values);
      // Kiểm tra cấu trúc dữ liệu trả về từ Backend của bạn
      // Nếu Backend trả về { token: "...", user: {...} } thì code dưới đúng.
      // Nếu Backend trả về { data: { token: "..." } } thì cần sửa lại response.data.data
      const { token, user } = response.data; 

      if (!token) {
         throw new Error("Không nhận được token từ server");
      }

      localStorage.setItem('access_token', token);
      localStorage.setItem('user_info', JSON.stringify(user));
      
      message.success('Đăng nhập thành công!');
      navigate('/dashboard'); 

    }  catch (error) {
      console.error("Lỗi đăng nhập:", error);
      
      // 1. Lấy thông báo lỗi cụ thể từ Backend gửi về
      // (Backend của bạn trả về: { message: "Mật khẩu sai" } hoặc "Tài khoản không tồn tại")
      const serverMessage = error.response?.data?.message || 'Lỗi kết nối server';

      // 2. Hiển thị lỗi đó lên màn hình
      message.error(serverMessage);
      
      // 3. TẠM THỜI COMMENT (TẮT) CHẾ ĐỘ GIẢ LẬP ĐỂ KHÔNG BỊ CHUYỂN TRANG
      /* console.log("--> Chuyển sang chế độ giả lập...");
      localStorage.setItem('access_token', 'fake-token-dev');
      ...
      navigate('/dashboard');
      */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card 
        className="w-full max-w-md shadow-2xl border-t-8 border-red-dang" 
        // Đã sửa headStyle thành styles.header theo chuẩn mới
        styles={{ 
            header: { backgroundColor: '#CE1126', color: '#FFFF00', textAlign: 'center' } 
        }}
        title={<div className="text-xl font-bold text-yellow-sao">ĐĂNG NHẬP HỆ THỐNG</div>}
      >
        <Form
          name="login_form"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="ten_dang_nhap"
            rules={[{ required: true, message: 'Vui lòng nhập Tên đăng nhập!' }]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon text-red-dang" />} 
              placeholder="Tên đăng nhập" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="mat_khau"
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon text-red-dang" />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item className='mt-8'>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full bg-red-dang hover:!bg-red-dam border-none shadow-md h-12" 
              size="large"
            >
              <span className="font-bold text-yellow-sao tracking-wider uppercase">Đăng nhập</span>
            </Button>
          </Form.Item>
        </Form>
        <Divider className="my-6 border-gray-300"><span className="text-gray-400 text-sm">Cổng Điều Hướng</span></Divider>
        <div className="flex justify-between gap-4 w-full">
          <Button 
            className="w-1/2 h-12 rounded-xl text-red-dang font-semibold border-red-dang/30 hover:bg-red-50 hover:border-red-dang transition-all" 
            onClick={() => window.location.href = import.meta.env.VITE_SUPERADMIN_URL || 'http://localhost:5174'}
          >
            Quản lý Đảng bộ
          </Button>
          <Button 
            className="w-1/2 h-12 rounded-xl text-yellow-600 font-semibold border-yellow-sao/50 hover:bg-yellow-50 hover:border-yellow-600 transition-all" 
            onClick={() => window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175'}
          >
            Quản lý Chi bộ
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;