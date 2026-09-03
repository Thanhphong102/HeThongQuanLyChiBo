import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, DatePicker, Select, message, Tabs, Spin, Divider, Upload, Avatar } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, CameraOutlined, IdcardOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../../utils/mediaUrl';

const { Title, Text } = Typography;

const PARTY_POSITION_LABELS = {
  'Bi thu': 'Bí thư',
  'Bi thu chi bo': 'Bí thư chi bộ',
  'Pho bi thu': 'Phó bí thư',
  'Pho bi thu chi bo': 'Phó bí thư chi bộ',
  'Chi uy vien': 'Chi ủy viên',
  'Dang vien': 'Đảng viên',
};

const formatPartyPosition = (value) => PARTY_POSITION_LABELS[value] || value;

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const MAJORS = [
  "Khoa học máy tính", "Khoa học dữ liệu", "Hệ thống thông tin", "Công nghệ thông tin", "Kỹ thuật phần mềm",
  "Kỹ thuật hệ thống công nghiệp", "Quản lý công nghiệp", "Logistics và Quản lý chuỗi cung ứng",
  "Công nghệ kỹ thuật cơ điện tử", "Công nghệ kỹ thuật điện, điện tử", "Công nghệ kỹ thuật điều khiển và tự động hóa", "Công nghệ kỹ thuật năng lượng",
  "Công nghệ thực phẩm", "Công nghệ sinh học", "Công nghệ kỹ thuật hóa học",
  "Quản lý xây dựng", "Công nghệ kỹ thuật công trình xây dựng",
  "Quản trị kinh doanh", "Kế toán", "Tài chính - Ngân hàng", "Luật", "Ngôn ngữ Anh"
];

const DEPARTMENTS = [
  "Phòng Đào tạo", "Phòng Tổ chức - Hành chính", "Phòng Kế hoạch - Tài chính", "Phòng Quản trị - Thiết bị", "Phòng Khảo thí - Đảm bảo chất lượng", "Phòng Công tác chính trị - Quản lý sinh viên - Khởi nghiệp", "Phòng Quản lý khoa học công nghệ - Đổi mới sáng tạo - Hợp tác quốc tế",
  "Khoa Công nghệ thông tin", "Khoa Điện - Điện tử", "Khoa Kinh tế - Quản lý công nghiệp", "Khoa Kỹ thuật xây dựng", "Khoa Công nghệ Sinh học - Công nghệ Thực phẩm - Hóa học", "Khoa Cơ bản"
];

const ProfilePage = () => {
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const navigate = useNavigate();
    
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
                
                // Dữ liệu sẽ được điền vào form qua useEffect riêng biệt để tránh lỗi 'useForm is not connected'
            } catch (error) {
                console.error("Lỗi lấy thông tin cá nhân:", error);
                message.error('Không thể tải thông tin hồ sơ');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [profileForm]);

    // [NEW] Điền dữ liệu vào Form sau khi component đã render xong Form
    useEffect(() => {
        if (!loading && user && Object.keys(user).length > 0) {
            profileForm.setFieldsValue({
                ho_ten: user.ho_ten,
                chuc_vu_dang: formatPartyPosition(user.chuc_vu_dang),
                ten_chi_bo: user.ten_chi_bo,
                ngay_sinh: user.ngay_sinh ? dayjs(user.ngay_sinh) : null,
                gioi_tinh: user.gioi_tinh,
                que_quan: user.que_quan,
                dia_chi_thuong_tru: user.dia_chi_thuong_tru,
                dia_chi_tam_tru: user.dia_chi_tam_tru,
                dia_chi_chi_bo_lien_he: user.dia_chi_chi_bo_lien_he,
                so_dien_thoai: user.so_dien_thoai,
                email: user.email,
                ngay_vao_dang: user.ngay_vao_dang ? dayjs(user.ngay_vao_dang) : null,
                ngay_chinh_thuc: user.ngay_chinh_thuc ? dayjs(user.ngay_chinh_thuc) : null,
                lop: user.lop,
                nganh_hoc: user.nganh_hoc,
                ma_so_sinh_vien: user.ma_so_sinh_vien,
                khoa_hoc: user.khoa_hoc,
                ma_can_bo: user.ma_can_bo,
                don_vi_cong_tac: user.don_vi_cong_tac,
                chuc_vu_chuyen_mon: user.chuc_vu_chuyen_mon,
                doi_tuong: user.doi_tuong === 'Can bo' ? 'Cán bộ' : (user.doi_tuong === 'Sinh vien' ? 'Sinh viên' : user.doi_tuong),
                so_dinh_danh: user.so_dinh_danh,
                so_the_dang_vien: user.so_the_dang_vien,
            });
        }
    }, [loading, user, profileForm]);

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
                window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));
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
            message.success('Đổi mật khẩu thành công. Hệ thống sẽ tự động đăng xuất sau 2 giây...', 2);
            passwordForm.resetFields();
            setTimeout(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
                navigate('/login');
            }, 2000);
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
        const actualFile = file.originFileObj || file;
        setUploadingAvatar(true);
        try {
            const res = await userApi.uploadAvatar(actualFile);
            setAvatarUrl(res.data.url);
            
            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user_info', JSON.stringify(updatedUser)); // update global cache
            window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));
            
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
            label: <span className="profile-tab-label font-semibold text-base"><UserOutlined /> Thông Tin Cá Nhân</span>,
            children: (
                <div className="profile-tab-content p-6 max-w-6xl mx-auto">
                    <Row gutter={[32, 32]}>
                        {/* --- CỘT TRÁI: ẢNH ĐẠI DIỆN --- */}
                        <Col xs={24} lg={8}>
                            <div className="bg-white p-6 shadow-sm rounded-xl w-full flex flex-col items-center border border-gray-100">
                                <Avatar 
                                    size={180} 
                                    src={getMediaUrl(avatarUrl || user.anh_the)}
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
                                className="profile-form bg-white p-8 mb-8 shadow-sm rounded-xl border border-gray-100"
                            >
                        <Divider titlePlacement="left"><Text type="secondary" className="text-sm">Thông tin nội bộ (Chỉ xem)</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={6}>
                                <Form.Item name="doi_tuong" label="Đối tượng">
                                    <Input.TextArea disabled autoSize={{ minRows: 1, maxRows: 3 }} className="bg-gray-50 text-gray-700 font-semibold" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name="ho_ten" label="Họ và tên">
                                    <Input.TextArea disabled autoSize={{ minRows: 1, maxRows: 3 }} className="bg-gray-50 text-gray-700 font-semibold" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name="chuc_vu_dang" label="Chức vụ Đảng">
                                    <Input.TextArea disabled autoSize={{ minRows: 1, maxRows: 3 }} className="bg-gray-50 text-gray-700 font-semibold" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <Form.Item name="ten_chi_bo" label="Sinh hoạt tại">
                                    <Input.TextArea disabled autoSize={{ minRows: 1, maxRows: 3 }} className="bg-gray-50 text-gray-700 font-semibold" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Tùy biến thông tin theo đối tượng Cán bộ / Sinh viên (Được phép sửa) */}
                        {user.doi_tuong === 'Can bo' ? (
                            <>
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="ma_can_bo" label="Mã Cán bộ">
                                            <Input className="h-10 border-gray-300 rounded-lg" placeholder="Nhập Mã Cán bộ" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="chuc_vu_chuyen_mon" label="Chuyên môn">
                                            <Input className="h-10 border-gray-300 rounded-lg" placeholder="Nhập Chuyên môn" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col xs={24}>
                                        <Form.Item name="don_vi_cong_tac" label="Đơn vị công tác">
                                            <Select 
                                                showSearch 
                                                className="select-wrap-text" 
                                                placeholder="Chọn đơn vị công tác"
                                                popupMatchSelectWidth={false}
                                            >
                                                {DEPARTMENTS.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </>
                        ) : (
                            <>
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="ma_so_sinh_vien" label="MSSV">
                                            <Input className="h-10 border-gray-300 rounded-lg" placeholder="Nhập MSSV" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="lop" label="Lớp">
                                            <Input className="h-10 border-gray-300 rounded-lg" placeholder="Nhập Lớp" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="nganh_hoc" label="Ngành học">
                                            <Select 
                                                showSearch 
                                                className="select-wrap-text" 
                                                placeholder="Chọn ngành học"
                                                popupMatchSelectWidth={false}
                                            >
                                                {MAJORS.map(m => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name="khoa_hoc" label="Khóa học">
                                            <Input className="h-10 border-gray-300 rounded-lg" placeholder="2022" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </>
                        )}

                        <Divider titlePlacement="left"><Text className="text-red-dang text-sm font-semibold">Thông tin Liên hệ (Được phép sửa)</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="so_dien_thoai" label="Số điện thoại"
                                    rules={[{ pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0' }]}
                                >
                                    <Input prefix={<PhoneOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập SĐT" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="email" label="Email"
                                    rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                                >
                                    <Input disabled prefix={<MailOutlined className="text-gray-400" />} className="h-10 bg-gray-50 text-gray-700 font-semibold" placeholder="Nhập địa chỉ email" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider titlePlacement="left"><Text className="text-green-600 text-sm font-semibold">Địa chỉ (Được phép sửa)</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24}>
                                <Form.Item name="dia_chi_thuong_tru" label="Địa chỉ thường trú">
                                    <Input prefix={<EnvironmentOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập địa chỉ thường trú" />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item name="dia_chi_tam_tru" label="Địa chỉ hiện tại/Tạm trú">
                                    <Input prefix={<EnvironmentOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập địa chỉ tạm trú" />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item name="dia_chi_chi_bo_lien_he" label="Địa chỉ chi bộ đang giữ mối liên hệ">
                                    <Input prefix={<EnvironmentOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập địa chỉ chi bộ" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider titlePlacement="left"><Text className="text-blue-500 text-sm font-semibold">Thông tin Cơ bản (Được phép sửa)</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="ngay_sinh" label="Ngày sinh">
                                    <DatePicker format="DD/MM/YYYY" className="w-full h-10 border-gray-300 rounded-lg" placeholder="Chọn ngày sinh" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="gioi_tinh" label="Giới tính">
                                    <Input className="h-10 border-gray-300 rounded-lg" placeholder="Nhập giới tính" />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item name="que_quan" label="Quê quán (Tỉnh/Thành)">
                                    <Select 
                                        showSearch 
                                        className="select-wrap-text" 
                                        placeholder="Chọn tỉnh thành"
                                        popupMatchSelectWidth={false}
                                    >
                                        {PROVINCES.map(p => <Select.Option key={p} value={p}>{p}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>


                        <Divider className="profile-section-title" titlePlacement="left"><Text className="text-blue-500 text-sm font-semibold">Thông tin Sinh hoạt (Được phép sửa)</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="ngay_vao_dang" label="Ngày Kết nạp (Vào Đảng)">
                                    <DatePicker format="DD/MM/YYYY" className="w-full h-10 border-gray-300 rounded-lg" placeholder="Chọn ngày vào Đảng" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="ngay_chinh_thuc" label="Ngày Chính thức">
                                    <DatePicker format="DD/MM/YYYY" className="w-full h-10 border-gray-300 rounded-lg" placeholder="Chọn ngày chính thức" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider className="profile-section-title" titlePlacement="left"><Text className="text-purple-600 text-sm font-semibold"><IdcardOutlined /> Giấy tờ & Thẻ Đảng viên (Được phép sửa)</Text></Divider>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="so_dinh_danh" label="Số định danh công dân (CCCD)">
                                    <Input prefix={<IdcardOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập CCCD" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="so_the_dang_vien" label="Số thẻ Đảng viên">
                                    <Input prefix={<SafetyCertificateOutlined className="text-gray-400" />} className="h-10 border-gray-300 rounded-lg" placeholder="Nhập số thẻ" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <div className="profile-actions flex justify-end mt-8 border-t pt-6">
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
            label: <span className="profile-tab-label font-semibold text-base"><LockOutlined /> Đổi Mật Khẩu</span>,
            children: (
                <div className="profile-password-content p-8 max-w-lg mx-auto">
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
        <div className="user-profile-page animate-fade-in">
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
