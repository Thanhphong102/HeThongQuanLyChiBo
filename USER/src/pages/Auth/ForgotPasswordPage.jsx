import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import authApi from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(values);
      message.success(response.data.message || 'Mật khẩu mới đã được gửi vào email của bạn!', 5);
      setIsSuccess(true);
      
      // Tự động quay về trang đăng nhập sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error("Lỗi quên mật khẩu:", error);
      const serverMessage = error.response?.data?.message || 'Lỗi kết nối server';
      message.error(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card 
        className="w-full max-w-md shadow-2xl border-t-8 border-red-dang" 
        styles={{ 
            header: { backgroundColor: '#CE1126', color: '#FFFF00', textAlign: 'center' } 
        }}
        title={<div className="text-xl font-bold text-yellow-sao">QUÊN MẬT KHẨU</div>}
      >
        {!isSuccess ? (
          <>
            <p className="text-gray-600 text-center mb-6">
              Vui lòng nhập địa chỉ email đã đăng ký tài khoản của bạn. Hệ thống sẽ gửi mật khẩu mới vào email này.
            </p>
            <Form
              name="forgot_password_form"
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập Email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined className="site-form-item-icon text-red-dang" />} 
                  placeholder="Nhập địa chỉ Email" 
                  size="large"
                />
              </Form.Item>

              <Form.Item className='mt-8 mb-2'>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="w-full bg-red-dang hover:!bg-red-dam border-none shadow-md h-12" 
                  size="large"
                  loading={loading}
                >
                  <span className="font-bold text-yellow-sao tracking-wider uppercase">Gửi mật khẩu mới</span>
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-green-500 text-5xl mb-4">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Thành công!</h3>
            <p className="text-gray-600 mb-6">
              Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (hoặc mục Spam).
            </p>
            <p className="text-sm text-gray-500">Đang quay lại trang đăng nhập...</p>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/login')}
            className="text-gray-500 hover:text-red-dang"
          >
            Quay lại Đăng nhập
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
