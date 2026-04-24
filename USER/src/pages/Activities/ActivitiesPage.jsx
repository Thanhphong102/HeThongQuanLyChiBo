import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Spin, Tag, Input, Modal, Upload, message, Empty, Divider } from 'antd';
import { ThunderboltOutlined, EnvironmentOutlined, CalendarOutlined, UploadOutlined, CheckCircleOutlined, SyncOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';

const { Title, Text, Paragraph } = Typography;

const ActivitiesPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedRegId, setSelectedRegId] = useState(null);
    const [fileList, setFileList] = useState([]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await userApi.getEvents();
            setEvents(res.data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh sách hoạt động');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // 1. Logic Đăng ký tham gia
    const handleRegister = async (eventId) => {
        try {
            await userApi.registerEvent(eventId);
            message.success('Đăng ký tham gia thành công! Vui lòng nộp minh chứng sau khi hoàn thành.');
            fetchEvents(); // Reload
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi đăng ký hoạt động');
        }
    };

    // 2. Logic Up file
    const handleUploadEvidence = async () => {
        if (fileList.length === 0) {
            return message.warning('Vui lòng chọn một hình ảnh!');
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            const actualFile = fileList[0].originFileObj || fileList[0];
            formData.append('file', actualFile);

            await userApi.submitEvidence(selectedRegId, formData);
            message.success('Tải minh chứng lên thành công! Vui lòng chờ Cán bộ duyệt.');
            setIsUploadModalOpen(false);
            setFileList([]);
            fetchEvents(); // Reload dể cập nhật UI
        } catch (error) {
            message.error('Lỗi tải minh chứng. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const uploadProps = {
        onRemove: () => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Bạn chỉ có thể tải lên file hình ảnh!');
                return Upload.LIST_IGNORE;
            }
            setFileList([file]);
            return false; // Chặn upload mặc định của antd
        },
        fileList,
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <Spin size="large" />
                <div className="mt-4 text-gray-500 font-medium">Đang tải danh sách hoạt động...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Page Header Premium */}
            <div className="mb-8 p-6 rounded-2xl text-white relative overflow-hidden" 
                 style={{ background: 'linear-gradient(135deg, #a91f23 0%, #8b1517 100%)', boxShadow: '0 8px 32px rgba(169,31,35,0.35)' }}>
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-white m-0 flex items-center gap-3">
                        <ThunderboltOutlined /> HOẠT ĐỘNG NGOẠI KHÓA
                    </h1>
                    <p className="text-white/75 mt-1 m-0 text-sm">Theo dõi và ghi dấu ấn của bạn trong từng hoạt động</p>
                </div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full"></div>
            </div>
            <Row gutter={[24, 24]}>
                {events.length === 0 ? (
                    <Col span={24} className="flex justify-center mt-10">
                        <Empty description="Hiện chưa có hoạt động nào được mở!" />
                    </Col>
                ) : events.map(ev => {
                    const isRegistered = !!ev.registration_id;
                    const hasEvidence = !!ev.minh_chung_url;
                    const isConfirmed = ev.xac_nhan_admin;
                    
                    return (
                        <Col xs={24} sm={12} lg={8} key={ev.id}>
                        <Card 
                            hoverable 
                            className={`h-full flex flex-col justify-between ${isConfirmed ? 'border-t-4 border-t-green-500' : 'border-t-4 border-t-red-dang'}`}
                            styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                        >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        {(() => {
                                            const mapStatus = {
                                                'Dang mo':   { color: 'blue',   label: 'Đang mở ĐK' },
                                                'Da dong':   { color: 'orange', label: 'Đã đóng ĐK' },
                                                'Da ket thuc':{ color: 'default',label: 'Đã kết thúc' },
                                                'Huy':       { color: 'error',  label: 'Đã hủy' },
                                            };
                                            const st = mapStatus[ev.trang_thai] || { color: 'default', label: ev.trang_thai };
                                            return <Tag color={st.color}>{st.label}</Tag>;
                                        })()}
                                        {isConfirmed && <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn thành</Tag>}
                                    </div>
                                    <Title level={5} className="mb-2 line-clamp-2" style={{ color: '#a91f23' }}>
                                        {ev.ten_hoat_dong}
                                    </Title>
                                    <div className="text-sm text-gray-500 mb-3 space-y-1">
                                        <div><CalendarOutlined className="mr-2"/>{dayjs(ev.thoi_gian_bat_dau).format('DD/MM/YYYY')} - {dayjs(ev.thoi_gian_ket_thuc).format('DD/MM/YYYY')}</div>
                                        <div><EnvironmentOutlined className="mr-2"/>{ev.dia_diem || 'Chưa cập nhật'}</div>
                                        {ev.so_luong_toi_da && <div><TeamOutlined className="mr-2"/>Giới hạn: {ev.so_luong_toi_da} người</div>}
                                    </div>
                                    <Paragraph className="text-sm text-gray-600 line-clamp-3 mb-4">
                                        {ev.mo_ta || 'Không có mô tả chi tiết.'}
                                    </Paragraph>
                                </div>

                                <div className="mt-auto">
                                    <Divider className="my-3"/>
                                    {/* Khối Nút Trạng Thái */}
                                    {!isRegistered ? (
                                        <Button 
                                            type="primary" 
                                            block 
                                            className={`font-bold h-10 transition-colors ${ev.trang_thai === 'Dang mo' ? 'bg-blue-600 hover:!bg-blue-700' : '!bg-gray-500 !border-gray-500 !text-white opacity-80'}`}
                                            disabled={ev.trang_thai !== 'Dang mo'}
                                            onClick={() => handleRegister(ev.id)}
                                        >
                                            Đăng ký tham gia
                                        </Button>
                                    ) : (
                                        <div>
                                            {isConfirmed ? (
                                                <Button block disabled className="bg-green-50 border-green-200 text-green-700 font-bold">
                                                    ĐÃ DUYỆT THAM GIA
                                                </Button>
                                            ) : hasEvidence ? (
                                                <Button 
                                                    block 
                                                    type="dashed" 
                                                    className="text-orange-500 border-orange-300 bg-orange-50 font-bold hover:!text-orange-600 hover:!border-orange-500 hover:!bg-orange-100" 
                                                    icon={<SyncOutlined spin />}
                                                    onClick={() => {
                                                        setSelectedRegId(ev.registration_id);
                                                        setIsUploadModalOpen(true);
                                                    }}
                                                >
                                                    ĐANG CHỜ DUYỆT (Nhấn để Tải Lại)
                                                </Button>
                                            ) : dayjs(ev.thoi_gian_bat_dau).isAfter(dayjs()) ? (
                                                <Button block disabled className="bg-gray-100 text-gray-500 font-bold border-gray-300">
                                                    ĐỢI ĐẾN NGÀY TỔ CHỨC
                                                </Button>
                                            ) : (
                                                <Button 
                                                    type="primary" 
                                                    block 
                                                    className="bg-orange-500 font-bold hover:!bg-orange-600 h-10"
                                                    icon={<UploadOutlined />}
                                                    onClick={() => {
                                                        setSelectedRegId(ev.registration_id);
                                                        setIsUploadModalOpen(true);
                                                    }}
                                                >
                                                    Nộp Minh Chứng
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                            <UploadOutlined className="text-red-dang" />
                        </div>
                        <span className="text-red-dang font-bold text-lg">NỘP MINH CHỨNG HOẠT ĐỘNG</span>
                    </div>
                }
                open={isUploadModalOpen}
                onCancel={() => {
                    setIsUploadModalOpen(false);
                    setFileList([]);
                }}
                footer={[
                    <Button key="back" onClick={() => setIsUploadModalOpen(false)} className="!rounded-xl">
                        Hủy bỏ
                    </Button>,
                    <Button key="submit" type="primary" loading={submitting} onClick={handleUploadEvidence}>
                        Tải lên &amp; Lưu
                    </Button>
                ]}
                width={480}
            >
                <div className="py-4">
                    <p className="text-gray-600 mb-4">Vui lòng tải lên bức ảnh minh chứng sự tham gia của bạn. Kích thước file không vượt quá 5MB.</p>
                    <Upload {...uploadProps} maxCount={1} accept="image/*">
                        <Button icon={<UploadOutlined />}>Nhấp để Chọn File Ảnh</Button>
                    </Upload>
                </div>
            </Modal>
        </div>
    );
};

export default ActivitiesPage;
