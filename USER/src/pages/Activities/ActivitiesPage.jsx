import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Spin, Tag, Input, Modal, Upload, message, Empty, Divider, DatePicker, Space, Pagination, Popover, Select, Badge } from 'antd';
import { ThunderboltOutlined, EnvironmentOutlined, CalendarOutlined, UploadOutlined, CheckCircleOutlined, SyncOutlined, TeamOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';
import { removeAccents } from '../../utils/stringUtils';

const { Title, Text, Paragraph } = Typography;

const ActivitiesPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedRegId, setSelectedRegId] = useState(null);
    const [fileList, setFileList] = useState([]);

    // Filter & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [participationFilter, setParticipationFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter, statusFilter, participationFilter]);

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
            const errorMsg = error.response?.data?.message || 'Lỗi tải minh chứng. Vui lòng thử lại.';
            
            // Xử lý lỗi EXIF đặc thù (Ảnh chụp trước sự kiện)
            if (errorMsg.includes('chụp trước thời gian diễn ra')) {
                Modal.error({
                    title: 'HÌNH ẢNH KHÔNG HỢP LỆ',
                    content: (
                        <div>
                            <p className="font-bold text-red-600 mb-2">Hệ thống phân tích ảnh (EXIF) đã từ chối tệp của bạn!</p>
                            <p>{errorMsg}</p>
                            <p className="mt-2 text-gray-500 italic">Vui lòng tải lên ảnh chụp thực tế tại thời điểm diễn ra hoạt động để đảm bảo tính minh bạch.</p>
                        </div>
                    ),
                    okText: 'Đã hiểu',
                    okButtonProps: { danger: true },
                    centered: true
                });
            } else {
                message.error(errorMsg);
            }
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
            const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
            
            if (!isImage && !isHeic) {
                message.error('Bạn chỉ có thể tải lên file hình ảnh (kể cả HEIC)!');
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

    const filterContent = (
        <div className="flex flex-col gap-4 w-64 p-2">
            <div>
                <Text strong className="block mb-1 text-gray-700">Lọc theo tháng</Text>
                <DatePicker 
                    picker="month" 
                    placeholder="Chọn tháng/năm" 
                    format="MM/YYYY"
                    style={{ width: '100%', borderRadius: 8 }} 
                    onChange={date => setDateFilter(date)}
                    value={dateFilter}
                    allowClear
                />
            </div>
            <div>
                <Text strong className="block mb-1 text-gray-700">Trạng thái hoạt động</Text>
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: '100%' }}
                    options={[
                        { value: 'ALL', label: 'Tất cả' },
                        { value: 'Dang mo', label: 'Đang mở đăng ký' },
                        { value: 'Da ket thuc', label: 'Đã kết thúc' }
                    ]}
                />
            </div>
            <div>
                <Text strong className="block mb-1 text-gray-700">Trạng thái tham gia</Text>
                <Select
                    value={participationFilter}
                    onChange={setParticipationFilter}
                    style={{ width: '100%' }}
                    options={[
                        { value: 'ALL', label: 'Tất cả' },
                        { value: 'NOT_REGISTERED', label: 'Chưa tham gia' },
                        { value: 'REGISTERED', label: 'Đã đăng ký (Chờ duyệt)' },
                        { value: 'CONFIRMED', label: 'Đã hoàn thành' }
                    ]}
                />
            </div>
            {(dateFilter || statusFilter !== 'ALL' || participationFilter !== 'ALL') && (
                <Button 
                    type="link" 
                    danger 
                    onClick={() => {
                        setDateFilter(null);
                        setStatusFilter('ALL');
                        setParticipationFilter('ALL');
                    }}
                    className="p-0 text-left"
                >
                    Xóa tất cả bộ lọc
                </Button>
            )}
        </div>
    );

    const activeFiltersCount = (dateFilter ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0) + (participationFilter !== 'ALL' ? 1 : 0);

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
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <Input 
                    prefix={<SearchOutlined className="text-gray-400" />}
                    placeholder="Tìm kiếm hoạt động..." 
                    allowClear 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={{ width: '100%', maxWidth: 400, borderRadius: 8 }} 
                    size="large"
                />
                <Popover 
                    content={filterContent} 
                    title={<span className="font-bold text-gray-800 border-b pb-2 block">Bộ lọc nâng cao</span>} 
                    trigger="click" 
                    placement="bottomRight"
                >
                    <Badge count={activeFiltersCount} size="small" color="#a91f23">
                        <Button size="large" icon={<FilterOutlined />} className="font-semibold text-gray-700 flex items-center gap-2">
                            Bộ lọc
                        </Button>
                    </Badge>
                </Popover>
            </div>

            <Row gutter={[24, 24]}>
                {(() => {
                    const filteredEvents = events.filter(ev => {
                        const matchSearch = removeAccents(ev.ten_hoat_dong).includes(removeAccents(searchTerm));
                        const matchDate = dateFilter ? dayjs(ev.thoi_gian_bat_dau).format('MM/YYYY') === dateFilter.format('MM/YYYY') : true;
                        
                        let matchStatus = true;
                        if (statusFilter === 'Dang mo') matchStatus = ev.trang_thai === 'Dang mo';
                        else if (statusFilter === 'Da ket thuc') matchStatus = ev.trang_thai !== 'Dang mo';
                        
                        let matchParticipation = true;
                        const isRegistered = !!ev.registration_id;
                        const isConfirmed = ev.xac_nhan_admin;
                        
                        if (participationFilter === 'NOT_REGISTERED') matchParticipation = !isRegistered;
                        else if (participationFilter === 'REGISTERED') matchParticipation = isRegistered && !isConfirmed;
                        else if (participationFilter === 'CONFIRMED') matchParticipation = isConfirmed;

                        return matchSearch && matchDate && matchStatus && matchParticipation;
                    });
                    const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

                    if (filteredEvents.length === 0) {
                        return (
                            <Col span={24} className="flex justify-center mt-10">
                                <Empty description="Không tìm thấy hoạt động nào phù hợp!" />
                            </Col>
                        );
                    }

                    return paginatedEvents.map(ev => {
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
                    });
                })()}
            </Row>

            {events.filter(ev => {
                const matchSearch = removeAccents(ev.ten_hoat_dong).includes(removeAccents(searchTerm));
                const matchDate = dateFilter ? dayjs(ev.thoi_gian_bat_dau).format('MM/YYYY') === dateFilter.format('MM/YYYY') : true;
                
                let matchStatus = true;
                if (statusFilter === 'Dang mo') matchStatus = ev.trang_thai === 'Dang mo';
                else if (statusFilter === 'Da ket thuc') matchStatus = ev.trang_thai !== 'Dang mo';
                
                let matchParticipation = true;
                const isRegistered = !!ev.registration_id;
                const isConfirmed = ev.xac_nhan_admin;
                
                if (participationFilter === 'NOT_REGISTERED') matchParticipation = !isRegistered;
                else if (participationFilter === 'REGISTERED') matchParticipation = isRegistered && !isConfirmed;
                else if (participationFilter === 'CONFIRMED') matchParticipation = isConfirmed;

                return matchSearch && matchDate && matchStatus && matchParticipation;
            }).length > 0 && (
                <div className="mt-10 flex justify-center">
                    <Pagination 
                        current={currentPage} 
                        pageSize={pageSize} 
                        total={events.filter(ev => {
                            const matchSearch = removeAccents(ev.ten_hoat_dong).includes(removeAccents(searchTerm));
                            const matchDate = dateFilter ? dayjs(ev.thoi_gian_bat_dau).format('MM/YYYY') === dateFilter.format('MM/YYYY') : true;
                            
                            let matchStatus = true;
                            if (statusFilter === 'Dang mo') matchStatus = ev.trang_thai === 'Dang mo';
                            else if (statusFilter === 'Da ket thuc') matchStatus = ev.trang_thai !== 'Dang mo';
                            
                            let matchParticipation = true;
                            const isRegistered = !!ev.registration_id;
                            const isConfirmed = ev.xac_nhan_admin;
                            
                            if (participationFilter === 'NOT_REGISTERED') matchParticipation = !isRegistered;
                            else if (participationFilter === 'REGISTERED') matchParticipation = isRegistered && !isConfirmed;
                            else if (participationFilter === 'CONFIRMED') matchParticipation = isConfirmed;

                            return matchSearch && matchDate && matchStatus && matchParticipation;
                        }).length} 
                        onChange={page => setCurrentPage(page)} 
                        showSizeChanger={false}
                    />
                </div>
            )}

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
                    <Upload {...uploadProps} maxCount={1} accept="image/*,.heic,.HEIC,.heif,.HEIF">
                        <Button icon={<UploadOutlined />}>Nhấp để Chọn File Ảnh</Button>
                    </Upload>
                </div>
            </Modal>
        </div>
    );
};

export default ActivitiesPage;
