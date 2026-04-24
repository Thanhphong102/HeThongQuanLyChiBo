import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, DatePicker, Select, message, Tabs, Spin, Divider, Upload, Avatar } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CameraOutlined, IdcardOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';

const { Title, Text } = Typography;

const ProfilePage = () => {
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState({});
    
    // [NEW] State for avatar upload
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);

    // Load initial data
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const res = await userApi.getProfile();
                const fetchedUser = res.data || res; // Phụ thuộc cấu trúc axios
                
                setUser(fetchedUser);
                setAvatarUrl(fetchedUser.anh_the);
                
                // Điền dữ liệu vào Form
                profileForm.setFieldsValue({
                    ho_ten: fetchedUser.ho_ten,
                    chuc_vu_dang: fetchedUser.chuc_vu_dang,
                    ten_chi_bo: fetchedUser.ten_chi_bo,
                    ngay_sinh: fetchedUser.ngay_sinh ? dayjs(fetchedUser.ngay_sinh) : null,
                    gioi_tinh: fetchedUser.gioi_tinh,
                    que_quan: fetchedUser.que_quan,
                    dia_chi_hien_tai: fetchedUser.dia_chi_hien_tai,
                    so_dien_thoai: fetchedUser.so_dien_thoai,
                    email: fetchedUser.email,
                    ngay_vao_dang: fetchedUser.ngay_vao_dang ? dayjs(fetchedUser.ngay_vao_dang) : null,
                    ngay_chinh_thuc: fetchedUser.ngay_chinh_thuc ? dayjs(fetchedUser.ngay_chinh_thuc) : null,
                    lop: fetchedUser.lop,
                    nganh_hoc: fetchedUser.nganh_hoc,
                    ma_so_sinh_vien: fetchedUser.ma_so_sinh_vien,
                    so_dinh_danh: fetchedUser.so_dinh_danh,
                    so_dinh_danh: fetchedUser.so_dinh_danh,
                    so_the_dang_vien: fetchedUser.so_the_dang_vien,
                });
            } catch (error) {
                console.error("Lỗi lấy thông tin cá nhân:", error);
                message.error('Không thể tải thông tin hồ sơ');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [profileForm]);

    // Handle Cập nhật Profile
    const onFinishProfile = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                ngay_sinh: values.ngay_sinh ? values.ngay_sinh.format('YYYY-MM-DD') : null,
                ngay_vao_dang: values.ngay_vao_dang ? values.ngay_vao_dang.format('YYYY-MM-DD') : null,
                ngay_chinh_thuc: values.ngay_chinh_thuc ? values.ngay_chinh_thuc.format('YYYY-MM-DD') : null,
            };
            const res = await userApi.updateProfile(payload);
            const updatedUser = res.data?.user || res.user;

            if (updatedUser) {
                setUser(updatedUser);
                localStorage.setItem('user_info', JSON.stringify(updatedUser));
                message.success('Cập nhật hồ sơ thành công!');
            }
        } catch (error) {
            console.error(error);
            message.error('Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Cập nhật Password
    const onFinishPassword = async (values) => {
        if (values.new_password !== values.confirm_password) {
            return message.error('Mật khẩu xác nhận không khớp!');
        }
        setSubmitting(true);
        try {
            await userApi.resetPassword(user.ma_dang_vien, values.new_password);
            message.success('Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới!');
            passwordForm.resetFields();
        } catch (error) {
            console.error(error);
            message.error('Đổi mật khẩu thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Cập nhật ảnh đại diện (Avatar)
    const handleAvatarUpload = async (options) => {
        const { file, onSuccess, onError } = options;
        setUploadingAvatar(true);
        try {
            const res = await userApi.uploadAvatar(file);
            setAvatarUrl(res.data.url);
            
            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user_info', JSON.stringify(updatedUser)); // update global cache
            
            message.success('Cập nhật ảnh thẻ thành công!');
            onSuccess("Ok");
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi tải ảnh lên. Vui lòng thử lại!');
            onError(error);
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <Spin size="large" />
                <div className="mt-4 text-gray-500 font-medium">Đang tải hồ sơ...</div>
            </div>
        );
    }

    const tabItems = [
        {
            key: '1',
            label: <span className="font-semibold px-4 text-base"><UserOutlined /> Thông Tin Cá Nhân</span>,
            children: (
                <div className="p-6 max-w-6xl mx-auto">
                    <Row gutter={[32, 32]}>
                        {/* --- CỘT TRÁI: ẢNH ĐẠI DIỆN --- */}
                        <Col xs={24} lg={8}>
                            <div className="bg-white p-6 shadow-sm rounded-xl w-full flex flex-col items-center border border-gray-100">
                                <Avatar 
                                    size={180} 
                                    src={avatarUrl || user.anh_the} 
                                    icon={<UserOutlined />} 
                                    className="shadow-sm border-4 border-gray-50 mb-6 bg-gray-100 object-cover"
                                />
                                <Upload
                                    name="file"
                                    customRequest={handleAvatarUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button type="primary" icon={<CameraOutlined />} loading={uploadingAvatar} className="bg-blue-600 hover:!bg-blue-700 font-semibold px-6 h-10 rounded-lg">
                                        Tải ảnh thẻ lên
                                    </Button>
                                </Upload>
                                <div className="text-gray-400 text-sm mt-4 text-center leading-relaxed">
                                    Định dạng: JPG, PNG, JPEG.<br/>Dung lượng tối đa: 5MB.<br/>Nên dùng ảnh thẻ 3x4 hoặc 4x6.
                                </div>
                            </div>
                        </Col>

                        {/* --- CỘT PHẢI: FORM THÔNG TIN --- */}
                        <Col xs={24} lg={16}>
                            <Form
                                form={profileForm}
                                layout="vertical"
                                onFinish={onFinishProfile}
                                className="bg-white p-8 mb-8 shadow-sm rounded-xl border border-gray-100"
                            >
                        {/* Nhóm Thông tin Cố định (Không được sửa) */}
                        <Divider titlePlacement="left"><Text type="secondary" className="text-sm">Thông tin nội bộ (Chỉ xem)</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item name="ho_ten" label="Họ và tên">
                                    <Input disabled className="bg-gray-50 text-gray-700 font-semibold" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="chuc_vu_dang" label="Chức vụ Đảng">
                                    <Input disabled className="bg-gray-50 text-gray-700 font-semibold" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="ten_chi_bo" label="Sinh hoạt tại">
                                    <Input disabled className="bg-gray-50 text-gray-700 font-semibold" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Nhóm Thông tin Sửa được */}
                        <Divider titlePlacement="left"><Text className="text-red-dang text-sm font-semibold">Thông tin Liên hệ & Cá nhân</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="ngay_sinh" label="Ngày sinh">
                                    <DatePicker format="DD/MM/YYYY" className="w-full h-10 border-gray-300 rounded-lg" placeholder="Chọn ngày sinh" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="gioi_tinh" label="Giới tính">
                                    <Select placeholder="Chọn giới tính" className="h-10"
                                        options={[
                                            { value: 'Nam', label: 'Nam' },
                                            { value: 'Nữ', label: 'Nữ' },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="so_dien_thoai" label="Số điện thoại"
                                    rules={[{ pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải gồm 10 chữ số' }]}
                                >
                                    <Input prefix={<PhoneOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập SĐT" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="email" label="Email"
                                    rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                                >
                                    <Input prefix={<MailOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập địa chỉ email" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider titlePlacement="left"><Text className="text-blue-500 text-sm font-semibold">Thông tin Sinh hoạt & Sinh viên</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="ngay_vao_dang" label="Ngày Kết nạp (Vào Đảng)">
                                    <DatePicker format="DD/MM/YYYY" className="w-full h-10 border-gray-300 rounded-lg" placeholder="Ngày kết nạp" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="ngay_chinh_thuc" label="Ngày Chính thức">
                                    <DatePicker format="DD/MM/YYYY" className="w-full h-10 border-gray-300 rounded-lg" placeholder="Ngày chính thức" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="ma_so_sinh_vien" label="Mã Số Sinh Viên (MSSV)">
                                    <Input className="h-10 border-gray-300 rounded-lg" placeholder="Nhập MSSV" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="lop" label="Lớp">
                                    <Input className="h-10 border-gray-300 rounded-lg" placeholder="VD: KTPM01" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item name="nganh_hoc" label="Ngành học">
                                    <Input className="h-10 border-gray-300 rounded-lg" placeholder="Nhập ngành học" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider titlePlacement="left"><Text className="text-purple-600 text-sm font-semibold"><IdcardOutlined /> Giấy tờ & Thẻ Đảng viên</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="so_dinh_danh" label="Số định danh công dân (CCCD)">
                                    <Input prefix={<IdcardOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập số CCCD 12 chữ số" maxLength={12} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="so_the_dang_vien" label="Số thẻ Đảng viên">
                                    <Input prefix={<SafetyCertificateOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập số thẻ Đảng viên" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider titlePlacement="left"><Text className="text-green-600 text-sm font-semibold">Địa chỉ</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24}>
                                <Form.Item name="que_quan" label="Quê quán">
                                    <Input.TextArea rows={2} className="border-gray-300 rounded-lg" placeholder="Nhập quê quán" />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item name="dia_chi_hien_tai" label="Địa chỉ hiện tại">
                                    <Input prefix={<EnvironmentOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập địa chỉ đang ở" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="flex justify-end mt-8 border-t pt-6">
                            <Button type="primary" htmlType="submit" loading={submitting} 
                                className="bg-red-dang hover:!bg-red-800 border-none h-11 px-8 font-bold rounded-lg shadow-md text-base transition-transform hover:scale-105"
                                icon={<SaveOutlined />}
                            >
                                Lưu Thay Đổi
                            </Button>
                        </div>
                    </Form>
                  </Col>
                </Row>
                </div>
            )
        },
        {
            key: '2',
            label: <span className="font-semibold px-4 text-base"><LockOutlined /> Đổi Mật Khẩu</span>,
            children: (
                <div className="p-8 max-w-lg mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-6 text-sm text-center font-medium">
                        Lưu ý: Mật khẩu mới bảo vệ tài khoản cá nhân của bạn. Xin vui lòng không chia sẻ cho người lạ.
                    </div>
                    <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={onFinishPassword}
                    >
                        <Form.Item
                            name="new_password"
                            label="Mật khẩu mới"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' }]}
                        >
                            <Input.Password className="h-10 rounded-lg" placeholder="Nhập mật khẩu mới" />
                        </Form.Item>
                        
                        <Form.Item
                            name="confirm_password"
                            label="Xác nhận mật khẩu"
                            dependencies={['new_password']}
                            rules={[
                                { required: true, message: 'Vui lòng gõ lại mật khẩu xác nhận' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp!'));
                                    },
                                })
                            ]}
                        >
                            <Input.Password className="h-10 rounded-lg" placeholder="Xác nhận mật khẩu" />
                        </Form.Item>

                        <div className="mt-8">
                            <Button type="primary" htmlType="submit" loading={submitting} 
                                className="bg-red-dang hover:!bg-red-800 border-none h-10 w-full font-bold rounded-lg shadow-md"
                            >
                                Đổi Mật Khẩu
                            </Button>
                        </div>
                    </Form>
                </div>
            )
        }
    ];

    return (
        <div className="animate-fade-in">
            <Title level={2} className="text-red-dang border-b pb-2 mb-6">
                <UserOutlined className="mr-2" /> HỒ SƠ ĐẢNG VIÊN
            </Title>
            
            <Card className="shadow-lg border-none rounded-2xl overflow-hidden" styles={{ body: { padding: 0 } }}>
                <Tabs 
                    defaultActiveKey="1" 
                    items={tabItems} 
                    className="profile-tabs"
                    tabBarStyle={{ padding: '0 16px', margin: 0, backgroundColor: '#fcfcfc', borderBottom: '1px solid #f0f0f0' }}
                />
            </Card>
        </div>
    );
};

export default ProfilePage;
