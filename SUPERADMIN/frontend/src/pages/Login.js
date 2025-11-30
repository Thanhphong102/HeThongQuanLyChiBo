import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axiosConfig';

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Gọi API đăng nhập
      const response = await axios.post('/auth/login', {
        username: values.username,
        password: values.password,
      });

      const { token, user, message: msg } = response.data;

      // 2. SỬA LỖI TẠI ĐÂY: Kiểm tra 'cap_quyen' thay vì 'role'
      // Vì Database trả về cột tên là 'cap_quyen'
      if (user.cap_quyen !== 1) {
        message.error('Bạn không có quyền truy cập trang quản trị này!');
        setLoading(false);
        return;
      }

      // 3. Lưu Token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      message.success(msg || 'Đăng nhập thành công!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      // Hiển thị thông báo cụ thể từ Backend (ví dụ: Tài khoản bị khóa)
      const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5',
      backgroundImage: 'url("https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center 110px',
      backgroundSize: '100%',
    }}>
      <Card 
        style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} 
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ color: '#ce1126' }}>ĐẢNG ỦY TRƯỜNG</Title>
          <Typography.Text type="secondary">Cổng thông tin quản lý cấp cao</Typography.Text>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#ce1126', borderColor: '#ce1126' }}>
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;