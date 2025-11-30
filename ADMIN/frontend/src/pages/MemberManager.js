import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Modal, Form, Input, Select, message, Tooltip, Avatar, DatePicker, Space, Row, Col, Descriptions, Popconfirm 
} from 'antd';
import { 
  UserOutlined, EditOutlined, SearchOutlined, LockOutlined, UnlockOutlined, KeyOutlined, UserAddOutlined, FileExcelOutlined, EyeOutlined,
  ManOutlined, WomanOutlined // <--- Import Icon giới tính
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const MemberManager = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // --- STATE BỘ LỌC ---
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchText, setSearchText] = useState('');

  // --- STATE MODAL ---
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [doiTuong, setDoiTuong] = useState('Sinh vien');

  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();
  const [formPass] = Form.useForm();

  // 1. HÀM LẤY DỮ LIỆU
  const fetchMembers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('/branch-members', {
        params: { 
            page, 
            pageSize: 10, 
            status: filterStatus,
            search: searchText 
        }
      });
      setMembers(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) { 
      message.error('Lỗi tải danh sách'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchMembers(1);
  }, [filterStatus, searchText]);

  // 2. XUẤT EXCEL
  const handleExportExcel = () => {
    if (members.length === 0) return message.warning('Không có dữ liệu để xuất');

    const dataToExport = members.map((m, index) => ({
        STT: index + 1,
        'Họ tên': m.ho_ten,
        'Giới tính': m.gioi_tinh,
        'Đối tượng': m.doi_tuong,
        'Mã số': m.doi_tuong === 'Sinh vien' ? m.ma_so_sinh_vien : m.ma_can_bo,
        'Ngày sinh': m.ngay_sinh ? dayjs(m.ngay_sinh).format('DD/MM/YYYY') : '',
        'SĐT': m.so_dien_thoai,
        'Email': m.email,
        'Trạng thái': m.trang_thai_dang_vien === 'Chinh thuc' ? 'Chính thức' : 'Dự bị',
        'Tài khoản': m.hoat_dong ? 'Hoạt động' : 'Đã khóa'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachDangVien");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `DS_DangVien_${dayjs().format('DD-MM-YYYY')}.xlsx`);
  };

  // 3. CÁC HÀM CRUD
  const handleCreate = async (values) => {
    try {
      const payload = {
        ...values,
        ngay_vao_dang: values.ngay_vao_dang ? values.ngay_vao_dang.format('YYYY-MM-DD') : null,
        ngay_sinh: values.ngay_sinh ? values.ngay_sinh.format('YYYY-MM-DD') : null
      };
      await axios.post('/branch-members', payload);
      message.success('Thêm hồ sơ thành công');
      setIsAddOpen(false);
      formAdd.resetFields();
      fetchMembers(1);
    } catch (error) {
      message.error(error.response?.data?.message || 'Thêm thất bại');
    }
  };

  const handleUpdate = async (values) => {
    try {
      const payload = {
        ...values,
        ngay_chinh_thuc: values.ngay_chinh_thuc ? values.ngay_chinh_thuc.format('YYYY-MM-DD') : null,
        ngay_sinh: values.ngay_sinh ? values.ngay_sinh.format('YYYY-MM-DD') : null
      };
      await axios.put(`/branch-members/${selectedMember.ma_dang_vien}`, payload);
      message.success('Cập nhật hồ sơ thành công');
      setIsEditOpen(false);
      fetchMembers(pagination.current);
    } catch (error) { message.error('Cập nhật thất bại'); }
  };

  const handleToggleStatus = async (id) => {
    try {
        const res = await axios.put(`/branch-members/${id}/status`);
        message.success(res.data.message);
        setMembers(prev => prev.map(m => m.ma_dang_vien === id ? {...m, hoat_dong: res.data.status} : m));
    } catch (error) { message.error('Lỗi'); }
  };

  const handleResetPassword = async (values) => {
    try {
        await axios.put(`/branch-members/${selectedMember.ma_dang_vien}/password`, values);
        message.success('Đã cấp lại mật khẩu');
        setIsPassOpen(false);
        formPass.resetFields();
    } catch (error) { message.error('Lỗi'); }
  };

  const renderDynamicFields = (formType) => {
    if (doiTuong === 'Sinh vien') {
      return (
        <Row gutter={16}>
          <Col span={6}><Form.Item name="ma_so_sinh_vien" label="MSSV"><Input /></Form.Item></Col>
          <Col span={6}><Form.Item name="lop" label="Lớp"><Input /></Form.Item></Col>
          <Col span={6}><Form.Item name="nganh_hoc" label="Ngành học"><Input /></Form.Item></Col>
          <Col span={6}><Form.Item name="khoa_hoc" label="Khóa học"><Input /></Form.Item></Col>
        </Row>
      );
    } else {
      return (
        <Row gutter={16}>
          <Col span={8}><Form.Item name="ma_can_bo" label="Mã Cán bộ"><Input /></Form.Item></Col>
          <Col span={8}><Form.Item name="don_vi_cong_tac" label="Đơn vị công tác"><Input /></Form.Item></Col>
          <Col span={8}><Form.Item name="chuc_vu_chuyen_mon" label="Chuyên môn"><Input /></Form.Item></Col>
        </Row>
      );
    }
  };

  // --- CẤU HÌNH CỘT BẢNG (Đã thêm cột Giới tính) ---
  const columns = [
    { 
      title: '#', width: 50, align: 'center', 
      render: (t, r, i) => (pagination.current - 1) * pagination.pageSize + i + 1 
    },
    {
      title: 'Hồ sơ Đảng viên', dataIndex: 'ho_ten',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size="large" style={{ backgroundColor: record.hoat_dong ? '#1890ff' : '#ccc' }} icon={<UserOutlined />} />
            <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{text}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                   {record.ten_dang_nhap ? `@${record.ten_dang_nhap}` : (record.doi_tuong === 'Sinh vien' ? record.ma_so_sinh_vien : 'Cán bộ')}
                </div>
            </div>
        </div>
      )
    },
    // --- CỘT MỚI: GIỚI TÍNH ---
    {
        title: 'Giới tính', 
        dataIndex: 'gioi_tinh',
        align: 'center',
        width: 100,
        render: (gender) => (
            <div style={{ color: gender === 'Nam' ? '#1890ff' : '#eb2f96', fontWeight: 500 }}>
                {gender === 'Nam' ? <ManOutlined /> : <WomanOutlined />} {gender}
            </div>
        )
    },
    { 
        title: 'Ngày sinh', 
        dataIndex: 'ngay_sinh', 
        width: 150,
        align: 'center',
        render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Trạng thái', dataIndex: 'trang_thai_dang_vien', align: 'center', width: 150,
      render: (status) => (
        <Tag color={status === 'Chinh thuc' ? 'green' : 'orange'} style={{ minWidth: 90, textAlign: 'center' }}>
            {status === 'Chinh thuc' ? 'Chính thức' : 'Dự bị'}
        </Tag>
      )
    },
    {
      title: 'Hành động', key: 'action', align: 'center', width: 120,
      render: (_, record) => (
        <Space size="small">
            {/* Nút Xem Chi tiết */}
            <Tooltip title="Xem chi tiết">
                <Button size="small" icon={<EyeOutlined />} onClick={() => {
                    setSelectedMember(record);
                    setIsViewOpen(true);
                }} />
            </Tooltip>
            
            {/* Nút Sửa */}
            <Tooltip title="Sửa hồ sơ">
                <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => {
                    setSelectedMember(record);
                    setDoiTuong(record.doi_tuong || 'Sinh vien');
                    formEdit.setFieldsValue({
                        ...record,
                        ngay_sinh: record.ngay_sinh ? dayjs(record.ngay_sinh) : null,
                        ngay_chinh_thuc: record.ngay_chinh_thuc ? dayjs(record.ngay_chinh_thuc) : null
                    });
                    setIsEditOpen(true);
                }} />
            </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 0 }}>
        <Card bodyStyle={{ padding: '16px' }} style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle" justify="space-between">
                <Col span={12} style={{ display: 'flex', gap: 10 }}>
                    <Input 
                        placeholder="Tìm tên, username, MSSV..." 
                        prefix={<SearchOutlined />} 
                        onChange={e => setSearchText(e.target.value)} 
                        style={{ flex: 2 }} 
                    />
                    <Select 
                        placeholder="Lọc trạng thái" 
                        allowClear 
                        style={{ flex: 1 }} 
                        onChange={setFilterStatus}
                    >
                        <Select.Option value="Chinh thuc">Chính thức</Select.Option>
                        <Select.Option value="Du bi">Dự bị</Select.Option>
                    </Select>
                </Col>
                
                <Col>
                    <Space>
                        <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ color: 'green', borderColor: 'green' }}>Xuất Excel</Button>
                        <Button type="primary" icon={<UserAddOutlined />} onClick={() => { setIsAddOpen(true); formAdd.resetFields(); }}>Thêm Hồ sơ</Button>
                    </Space>
                </Col>
            </Row>
        </Card>

        <Card>
            <Table 
                columns={columns} 
                dataSource={members} 
                rowKey="ma_dang_vien" 
                loading={loading}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onChange: (p) => fetchMembers(p),
                    showSizeChanger: false
                }}
            />
        </Card>

        {/* CÁC MODAL GIỮ NGUYÊN NHƯ CŨ */}
        <Modal title="Hồ sơ chi tiết Đảng viên" open={isViewOpen} onCancel={() => setIsViewOpen(false)} footer={null} width={750}>
            {selectedMember && (
                <Descriptions bordered column={2} size="small" labelStyle={{ width: '150px', fontWeight: '500' }}>
                    <Descriptions.Item label="Họ và tên" span={2}><b style={{fontSize: 16, color: '#1890ff'}}>{selectedMember.ho_ten}</b></Descriptions.Item>
                    <Descriptions.Item label="Tài khoản">{selectedMember.ten_dang_nhap || 'Chưa cấp'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái TK">{selectedMember.hoat_dong ? <Tag color="success">Hoạt động</Tag> : <Tag color="error">Đã khóa</Tag>}</Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">{selectedMember.ngay_sinh ? dayjs(selectedMember.ngay_sinh).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Giới tính">{selectedMember.gioi_tinh}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{selectedMember.so_dien_thoai}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedMember.email}</Descriptions.Item>
                    <Descriptions.Item label="Quê quán" span={2}>{selectedMember.que_quan}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ hiện tại" span={2}>{selectedMember.dia_chi_hien_tai}</Descriptions.Item>
                    <Descriptions.Item label="Ngày vào Đảng" labelStyle={{color:'#cf1322'}}>{selectedMember.ngay_vao_dang ? dayjs(selectedMember.ngay_vao_dang).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày chính thức" labelStyle={{color:'#cf1322'}}>{selectedMember.ngay_chinh_thuc ? dayjs(selectedMember.ngay_chinh_thuc).format('DD/MM/YYYY') : 'Chưa'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái Đảng"><Tag color={selectedMember.trang_thai_dang_vien === 'Chinh thuc' ? 'green' : 'orange'}>{selectedMember.trang_thai_dang_vien}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Chức vụ">{selectedMember.chuc_vu_dang}</Descriptions.Item>
                    <Descriptions.Item label="Đối tượng" span={2} style={{ background: '#fafafa' }}><b>{selectedMember.doi_tuong}</b></Descriptions.Item>
                    {selectedMember.doi_tuong === 'Sinh vien' ? (
                        <>
                            <Descriptions.Item label="MSSV">{selectedMember.ma_so_sinh_vien}</Descriptions.Item>
                            <Descriptions.Item label="Lớp">{selectedMember.lop}</Descriptions.Item>
                            <Descriptions.Item label="Ngành học">{selectedMember.nganh_hoc}</Descriptions.Item>
                            <Descriptions.Item label="Khóa học">{selectedMember.khoa_hoc}</Descriptions.Item>
                        </>
                    ) : (
                        <>
                            <Descriptions.Item label="Mã Cán bộ">{selectedMember.ma_can_bo}</Descriptions.Item>
                            <Descriptions.Item label="Đơn vị">{selectedMember.don_vi_cong_tac}</Descriptions.Item>
                            <Descriptions.Item label="Chuyên môn" span={2}>{selectedMember.chuc_vu_chuyen_mon}</Descriptions.Item>
                        </>
                    )}
                </Descriptions>
            )}
            <div style={{ textAlign: 'right', marginTop: 20 }}>
                <Button onClick={() => setIsViewOpen(false)}>Đóng</Button>
            </div>
        </Modal>

        <Modal title="Thêm Hồ sơ mới" open={isAddOpen} onCancel={() => setIsAddOpen(false)} footer={null} width={800} destroyOnClose={true}>
            <Form form={formAdd} layout="vertical" onFinish={handleCreate} autoComplete="off">
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="doi_tuong" label="Đối tượng" initialValue="Sinh vien">
                            <Select onChange={setDoiTuong}><Select.Option value="Sinh vien">Sinh viên</Select.Option><Select.Option value="Can bo">Cán bộ</Select.Option></Select>
                        </Form.Item>
                    </Col>
                    <Col span={16}><Form.Item name="ho_ten" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item></Col>
                </Row>
                <div style={{ background: '#f5f5f5', padding: '15px 15px 0 15px', marginBottom: 15, borderRadius: 6 }}>{renderDynamicFields('add')}</div>
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="ngay_sinh" label="Ngày sinh"><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={8}><Form.Item name="gioi_tinh" label="Giới tính"><Select><Select.Option value="Nam">Nam</Select.Option><Select.Option value="Nu">Nữ</Select.Option></Select></Form.Item></Col>
                    <Col span={8}><Form.Item name="que_quan" label="Quê quán"><Input /></Form.Item></Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item name="so_dien_thoai" label="Số điện thoại"><Input /></Form.Item></Col>
                </Row>
                <Form.Item name="dia_chi_hien_tai" label="Địa chỉ hiện tại"><Input /></Form.Item>
                {/* <div style={{ borderTop: '1px dashed #ccc', paddingTop: 10, marginBottom: 10 }}><b>Tài khoản</b></div>
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="ten_dang_nhap" label="Username" rules={[{ required: true }]}><Input autoComplete="new-username"/></Form.Item></Col>
                    <Col span={12}><Form.Item name="mat_khau" label="Password" rules={[{ required: true }]}><Input.Password autoComplete="new-password"/></Form.Item></Col>
                </Row> */}
                <Form.Item name="ngay_vao_dang" label="Ngày vào Đảng (Dự bị)"><DatePicker format="DD/MM/YYYY" /></Form.Item>
                <Button type="primary" htmlType="submit" block size="large">Lưu hồ sơ</Button>
            </Form>
        </Modal>

        <Modal title="Cập nhật Hồ sơ" open={isEditOpen} onCancel={() => setIsEditOpen(false)} footer={null} width={800} destroyOnClose={true}>
            <Form form={formEdit} layout="vertical" onFinish={handleUpdate}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="doi_tuong" label="Đối tượng">
                            <Select onChange={setDoiTuong}><Select.Option value="Sinh vien">Sinh viên</Select.Option><Select.Option value="Can bo">Cán bộ</Select.Option></Select>
                        </Form.Item>
                    </Col>
                    <Col span={16}><Form.Item name="ho_ten" label="Họ và tên" rules={[{ required: true }]}><Input /></Form.Item></Col>
                </Row>
                <div style={{ background: '#f5f5f5', padding: '15px 15px 0 15px', marginBottom: 15, borderRadius: 6 }}>{renderDynamicFields('edit')}</div>
                <Row gutter={16}>
                    <Col span={8}><Form.Item name="ngay_sinh" label="Ngày sinh"><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={8}><Form.Item name="gioi_tinh" label="Giới tính"><Select><Select.Option value="Nam">Nam</Select.Option><Select.Option value="Nu">Nữ</Select.Option></Select></Form.Item></Col>
                    <Col span={8}><Form.Item name="que_quan" label="Quê quán"><Input /></Form.Item></Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item name="so_dien_thoai" label="Số điện thoại"><Input /></Form.Item></Col>
                </Row>
                <Form.Item name="dia_chi_hien_tai" label="Địa chỉ"><Input /></Form.Item>
                <div style={{ borderTop: '1px solid #eee', paddingTop: 10, marginTop: 10 }}>
                    <Row gutter={16}>
                         <Col span={12}><Form.Item name="trang_thai_dang_vien" label="Trạng thái Đảng"><Select><Select.Option value="Du bi">Dự bị</Select.Option><Select.Option value="Chinh thuc">Chính thức</Select.Option><Select.Option value="Chuyen di">Đã chuyển đi</Select.Option></Select></Form.Item></Col>
                         <Col span={12}><Form.Item name="ngay_chinh_thuc" label="Ngày chính thức"><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                </div>
                <Button type="primary" htmlType="submit" block>Lưu thay đổi</Button>
            </Form>
        </Modal>
    </div>
  );
};

export default MemberManager;