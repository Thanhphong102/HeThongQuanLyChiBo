import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, DatePicker, Select, message, Tag, Space, Radio, Upload, Row, Col, Statistic, Popconfirm 
} from 'antd';
import { 
  CalendarOutlined, PlusOutlined, CheckSquareOutlined, UploadOutlined, FilePdfOutlined, ClockCircleOutlined, FileExcelOutlined,
  EditOutlined, DeleteOutlined, SearchOutlined 
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ActivityManager = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(''); // State tìm kiếm
  
  // State Modal (Dùng chung cho Tạo mới và Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null); // Lưu lịch đang sửa
  
  // State Modal Điểm danh
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]); 
  const [stats, setStats] = useState({ present: 0, absent: 0, excused: 0, total: 0 });

  const [form] = Form.useForm();

  // 1. Lấy danh sách (Có tìm kiếm)
  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Truyền param keyword để tìm kiếm
      const res = await axios.get('/activities', { params: { keyword: searchText } });
      setActivities(res.data);
    } catch (error) {
      message.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Debounce tìm kiếm (đợi người dùng gõ xong mới tìm)
  useEffect(() => {
    const timeout = setTimeout(() => {
        fetchActivities();
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchText]);

  useEffect(() => {
    if (attendanceList.length > 0) {
        const present = attendanceList.filter(m => m.status === 'Co mat').length;
        const excused = attendanceList.filter(m => m.status === 'Vang co phep').length;
        const absent = attendanceList.filter(m => m.status === 'Vang khong phep').length;
        setStats({ present, excused, absent, total: attendanceList.length });
    }
  }, [attendanceList]);

  // 2. Xử lý Submit Form (Tạo mới hoặc Cập nhật)
  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        thoi_gian: values.thoi_gian.format('YYYY-MM-DD HH:mm:ss')
      };

      if (editingActivity) {
        // UPDATE
        await axios.put(`/activities/${editingActivity.ma_lich}`, payload);
        message.success('Cập nhật thành công');
      } else {
        // CREATE
        await axios.post('/activities', payload);
        message.success('Đã lên lịch họp thành công');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingActivity(null);
      fetchActivities();
    } catch (error) {
      message.error('Lỗi lưu thông tin');
    }
  };

  // 3. Mở Modal Sửa
  const handleEdit = (record) => {
      setEditingActivity(record);
      form.setFieldsValue({
          ...record,
          thoi_gian: dayjs(record.thoi_gian)
      });
      setIsModalOpen(true);
  };

  // 4. Xử lý Xóa
  const handleDelete = async (id) => {
      try {
          await axios.delete(`/activities/${id}`);
          message.success('Đã hủy lịch họp');
          fetchActivities();
      } catch (error) {
          message.error('Lỗi xóa lịch');
      }
  };

  // ... (Các hàm openAttendance, saveAttendance, exportExcel, uploadMinutes GIỮ NGUYÊN)
  const openAttendance = async (activity) => {
    setCurrentActivity(activity);
    try {
      const res = await axios.get(`/activities/${activity.ma_lich}/attendance`);
      const formattedList = res.data.map(m => ({
        ...m,
        status: m.trang_thai_tham_gia || 'Co mat',
        note: m.ghi_chu || ''
      }));
      setAttendanceList(formattedList);
      setIsAttendanceOpen(true);
    } catch (error) {
      message.error('Không tải được danh sách điểm danh');
    }
  };

  const handleStatusChange = (memberId, val) => {
    setAttendanceList(prev => prev.map(item => 
      item.ma_dang_vien === memberId ? { ...item, status: val } : item
    ));
  };

  const saveAttendance = async () => {
    try {
      const payload = {
        attendanceData: attendanceList.map(m => ({
          ma_dang_vien: m.ma_dang_vien,
          status: m.status,
          note: m.note
        }))
      };
      await axios.post(`/activities/${currentActivity.ma_lich}/attendance`, payload);
      message.success('Đã lưu kết quả điểm danh');
      setIsAttendanceOpen(false);
      fetchActivities(); 
    } catch (error) {
      message.error('Lỗi lưu điểm danh');
    }
  };

  const handleExportExcel = () => {
    if (attendanceList.length === 0) return message.warning('Không có dữ liệu');
    const dataToExport = attendanceList.map((m, index) => ({
        STT: index + 1,
        'Họ và tên': m.ho_ten,
        'Chức vụ': m.chuc_vu_dang,
        'Trạng thái': m.status === 'Co mat' ? 'Có mặt' : (m.status === 'Vang co phep' ? 'Có phép' : 'Không phép'),
        'Ghi chú': m.note
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DiemDanh");
    XLSX.utils.sheet_add_aoa(worksheet, [[""], ["TỔNG HỢP:", `Có mặt: ${stats.present}`, `Có phép: ${stats.excused}`, `Không phép: ${stats.absent}`]], { origin: -1 });
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `DiemDanh_${dayjs(currentActivity.thoi_gian).format('DD-MM-YYYY')}.xlsx`);
  };

  const handleUploadMinutes = async (file, activityId) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`/activities/${activityId}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      message.success('Upload biên bản thành công');
      fetchActivities();
    } catch (error) {
      message.error('Upload thất bại');
    }
    return false;
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'thoi_gian',
      render: (t) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{dayjs(t).format('DD/MM/YYYY')}</div>
          <div style={{ color: '#888' }}><ClockCircleOutlined /> {dayjs(t).format('HH:mm')}</div>
        </div>
      ),
      width: 120
    },
    {
      title: 'Nội dung sinh hoạt',
      dataIndex: 'tieu_de',
      render: (text, record) => (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>{text}</div>
          <div style={{ fontSize: 13 }}>📍 {record.dia_diem}</div>
          <div style={{ fontSize: 12, color: '#666' }}>Loại hình: {record.loai_hinh}</div>
        </div>
      )
    },
    {
      title: 'Biên bản',
      dataIndex: 'file_dinh_kem',
      align: 'center',
      render: (url, record) => (
        url ? (
          <a href={url} target="_blank" rel="noreferrer">
            <Tag icon={<FilePdfOutlined />} color="blue">Xem biên bản</Tag>
          </a>
        ) : (
          <Upload beforeUpload={(file) => handleUploadMinutes(file, record.ma_lich)} showUploadList={false}>
            <Button size="small" icon={<UploadOutlined />}>Up biên bản</Button>
          </Upload>
        )
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trang_thai_buoi_hop',
      align: 'center',
      render: (status) => (
        status === 'Sap dien ra' ? <Tag color="warning">Sắp diễn ra</Tag> : <Tag color="success">Đã kết thúc</Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 250,
      render: (_, record) => (
        <Space>
            {/* Nút Điểm danh */}
            <Button 
                type="primary" 
                ghost={record.trang_thai_buoi_hop === 'Da ket thuc'}
                size="small"
                icon={<CheckSquareOutlined />} 
                onClick={() => openAttendance(record)}
            >
                {record.trang_thai_buoi_hop === 'Da ket thuc' ? 'KQ' : 'Đ.Danh'}
            </Button>

            {/* Nút Sửa */}
            <Button 
                size="small" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)} 
            />

            {/* Nút Xóa */}
            <Popconfirm 
                title="Bạn có chắc chắn muốn hủy lịch họp này không?"
                description="Hành động này sẽ xóa cả dữ liệu điểm danh (nếu có)."
                onConfirm={() => handleDelete(record.ma_lich)}
                okText="Đồng ý"
                cancelText="Hủy"
            >
                <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
        </Space>
      )
    }
  ];

  const attendanceColumns = [
    { title: 'Đảng viên', dataIndex: 'ho_ten', render: t => <b>{t}</b> },
    { title: 'Chức vụ', dataIndex: 'chuc_vu_dang' },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Radio.Group 
          value={record.status} 
          onChange={(e) => handleStatusChange(record.ma_dang_vien, e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="Co mat" style={{ color: 'green' }}>Có mặt</Radio.Button>
          <Radio.Button value="Vang co phep" style={{ color: 'orange' }}>Có phép</Radio.Button>
          <Radio.Button value="Vang khong phep" style={{ color: 'red' }}>K.Phép</Radio.Button>
        </Radio.Group>
      )
    }
  ];

  return (
    <div style={{ padding: 0 }}>
      <Card 
        title={<span><CalendarOutlined /> Lịch Sinh hoạt Chi bộ</span>}
        extra={
            <Space>
                {/* Ô TÌM KIẾM */}
                <Input 
                    placeholder="Tìm kiếm lịch họp..." 
                    prefix={<SearchOutlined />} 
                    onChange={e => setSearchText(e.target.value)} 
                    style={{ width: 250 }}
                />
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => { 
                        setEditingActivity(null); 
                        form.resetFields(); 
                        setIsModalOpen(true); 
                    }}
                >
                    Tạo lịch họp
                </Button>
            </Space>
        }
      >
        <Table columns={columns} dataSource={activities} rowKey="ma_lich" loading={loading} />
      </Card>

      {/* MODAL TẠO / SỬA LỊCH */}
      <Modal 
        title={editingActivity ? "Cập nhật lịch họp" : "Tạo buổi sinh hoạt mới"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="tieu_de" label="Tiêu đề cuộc họp" rules={[{ required: true }]}><Input placeholder="VD: Sinh hoạt chi bộ tháng 11" /></Form.Item>
            <Form.Item name="thoi_gian" label="Thời gian" rules={[{ required: true }]}><DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="dia_diem" label="Địa điểm"><Input /></Form.Item>
            <Form.Item name="loai_hinh" label="Loại hình" initialValue="Thuong ky">
                <Select>
                    <Select.Option value="Thuong ky">Sinh hoạt thường kỳ</Select.Option>
                    <Select.Option value="Chuyen de">Sinh hoạt chuyên đề</Select.Option>
                    <Select.Option value="Bat thuong">Họp bất thường</Select.Option>
                </Select>
            </Form.Item>
            <Form.Item name="noi_dung_du_kien" label="Nội dung dự kiến"><Input.TextArea rows={3} /></Form.Item>
            <Button type="primary" htmlType="submit" block>
                {editingActivity ? "Cập nhật" : "Lưu lịch họp"}
            </Button>
        </Form>
      </Modal>

      {/* MODAL ĐIỂM DANH (GIỮ NGUYÊN) */}
      <Modal 
        title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 30 }}>
                <span>Điểm danh: {currentActivity?.tieu_de}</span>
                <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ color: 'green', borderColor: 'green' }}>Xuất BC</Button>
            </div>
        } 
        open={isAttendanceOpen} 
        onCancel={() => setIsAttendanceOpen(false)}
        width={900}
        footer={[
            <Button key="cancel" onClick={() => setIsAttendanceOpen(false)}>Đóng</Button>,
            <Button key="submit" type="primary" onClick={saveAttendance}>Lưu kết quả</Button>
        ]}
      >
        <div style={{ marginBottom: 16, padding: 10, background: '#f5f5f5', borderRadius: 6 }}>
            <Row gutter={16} style={{ textAlign: 'center' }}>
                <Col span={6}><Statistic title="Tổng số" value={stats.total} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="Có mặt" value={stats.present} valueStyle={{ color: '#3f8600', fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="Vắng có phép" value={stats.excused} valueStyle={{ color: '#faad14', fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="Không phép" value={stats.absent} valueStyle={{ color: '#cf1322', fontSize: 16 }} /></Col>
            </Row>
        </div>
        <Table columns={attendanceColumns} dataSource={attendanceList} rowKey="ma_dang_vien" pagination={false} size="small" scroll={{ y: 400 }} />
      </Modal>
    </div>
  );
};

export default ActivityManager;