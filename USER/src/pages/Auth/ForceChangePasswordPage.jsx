import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Alert } from 'antd';
import { LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';

const { Title, Text } = Typography;

/**
 * ForceChangePasswordPage
 * Hiển thị khi Đảng viên đăng nhập lần đầu với mật khẩu tạm (buoc_doi_mat_khau = true).
 * Yêu cầu nhập mật khẩu mới → gọi API → xóa cờ → chuyển về Dashboard.
 */
const ForceChangePasswordPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authApi.changePasswordForced(values);
      message.success('✅ Đổi mật khẩu thành công! Chào mừng bạn đến với hệ thống!', 3);
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0a0a 0%, #3b0000 40%, #a91f23 100%)',
      padding: 24,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Icon + Tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #a91f23, #c0392b)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(169,31,35,0.4)',
          }}>
            <SafetyCertificateOutlined style={{ color: '#fff1aa', fontSize: 32 }} />
          </div>
          <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700 }}>
            Đổi Mật Khẩu Bắt Buộc
          </Title>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            Xin chào, <strong>{userInfo.ho_ten || 'Đảng viên'}</strong>
          </Text>
        </div>

        {/* Cảnh báo */}
        <Alert
          message="Bạn đang sử dụng mật khẩu tạm thời"
          description="Vui lòng đặt mật khẩu cá nhân mới để bảo vệ tài khoản. Bạn không thể bỏ qua bước này."
          type="warning"
          showIcon
          style={{ marginBottom: 24, borderRadius: 10 }}
        />

        {/* Form */}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="new_password"
            label={<span style={{ fontWeight: 600 }}>Mật khẩu mới</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label={<span style={{ fontWeight: 600 }}>Xác nhận mật khẩu</span>}
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Nhập lại mật khẩu mới"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            style={{
              marginTop: 8,
              height: 50,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #a91f23, #c0392b)',
              border: 'none',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 0.5,
              boxShadow: '0 4px 16px rgba(169,31,35,0.4)',
            }}
          >
            🔐 Xác nhận Đổi Mật Khẩu
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Sau khi đổi thành công, bạn sẽ được chuyển vào hệ thống tự động.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
