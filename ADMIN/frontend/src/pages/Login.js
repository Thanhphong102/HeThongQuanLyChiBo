import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axiosConfig';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // SỬA QUAN TRỌNG: Gửi đúng tên biến mà Backend yêu cầu
      const response = await axios.post('/auth/login', {
        ten_dang_nhap: values.ten_dang_nhap, // Map từ form
        mat_khau: values.mat_khau,           // Map từ form
      });

      const { token, user, message: msg } = response.data;

      // Kiểm tra quyền Cấp 2 (Admin Chi bộ)
      if (user.cap_quyen !== 2) {
        message.error('Tài khoản này không có quyền quản trị Chi bộ!');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      message.success(msg || 'Đăng nhập thành công!');
      navigate('/dashboard');

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', 
      backgroundColor: '#f0f2f5', 
      background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' 
    }}>
      {/* SỬA: Thay bordered={false} bằng variant="borderless" để hết cảnh báo vàng */}
      <Card 
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} 
        variant="borderless"
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ color: '#0050b3' }}>QUẢN LÝ CHI BỘ</Title>
          <Text type="secondary">Dành cho Bí thư & Chi ủy</Text>
        </div>

        <Form name="login_form" onFinish={onFinish} size="large">
          {/* SỬA: Đổi name thành ten_dang_nhap */}
          <Form.Item 
            name="ten_dang_nhap" 
            rules={[{ required: true, message: 'Nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>

          {/* SỬA: Đổi name thành mat_khau */}
          <Form.Item 
            name="mat_khau" 
            rules={[{ required: true, message: 'Nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#0050b3' }}>
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

// import React, { useState } from 'react';
// import { Form, Input, Button, Checkbox, Card, Typography, message } from 'antd';
// import { UserOutlined, LockOutlined } from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
// import axios from '../services/axiosConfig';

// const { Title, Text } = Typography;

// const Login = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);

//   const onFinish = async (values) => {
//     setLoading(true);
//     try {
//       const response = await axios.post('/auth/login', {
//         username: values.username,
//         password: values.password,
//       });

//       const { token, user, message: msg } = response.data;

//       // SỬA: Kiểm tra quyền Cấp 2
//       if (user.cap_quyen !== 2) {
//         message.error('Tài khoản này không có quyền quản trị Chi bộ!');
//         setLoading(false);
//         return;
//       }

//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(user));

//       message.success(msg || 'Đăng nhập thành công!');
//       navigate('/dashboard');

//     } catch (error) {
//       console.error(error);
//       const errorMsg = error.response?.data?.message || 'Đăng nhập thất bại';
//       message.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ 
//       display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', 
//       backgroundColor: '#f0f2f5', 
//       // Background khác biệt chút để dễ nhận diện (Ví dụ tông xanh)
//       background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' 
//     }}>
//       <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} bordered={false}>
//         <div style={{ textAlign: 'center', marginBottom: 24 }}>
//           <Title level={3} style={{ color: '#0050b3' }}>QUẢN LÝ CHI BỘ</Title>
//           <Text type="secondary">Dành cho Bí thư & Chi ủy</Text>
//         </div>

//         <Form name="login_form" onFinish={onFinish} size="large">
//           <Form.Item name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập!' }]}>
//             <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
//           </Form.Item>

//           <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
//             <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
//           </Form.Item>

//           <Form.Item>
//             <Button type="primary" htmlType="submit" block loading={loading} style={{ background: '#0050b3' }}>
//               ĐĂNG NHẬP
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default Login;