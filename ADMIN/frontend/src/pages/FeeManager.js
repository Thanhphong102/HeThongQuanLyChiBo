import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Select, message, Checkbox, Tag, Typography, Row, Col, Space, Tabs, Statistic, InputNumber, Modal, Form, Input, DatePicker, Popconfirm, Tooltip 
} from 'antd';
import { 
  DollarCircleOutlined, CalendarOutlined, FileExcelOutlined, PlusOutlined, DeleteOutlined, EditOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined 
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title } = Typography;

const FeeManager = () => {
  const [data, setData] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState([]);
  const [expenses, setExpenses] = useState([]);
  // Khởi tạo giá trị mặc định an toàn
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(dayjs().year());

  // State Modal chỉnh mức phí
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newFee, setNewFee] = useState(0);

  // State Modal Phiếu Chi (Dùng chung Thêm & Sửa)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // Lưu phiếu đang sửa
  const [formExpense] = Form.useForm();

  // 1. Lấy dữ liệu
  const fetchFees = async (selectedYear) => {
    setLoading(true);
    try {
      const res = await axios.get('/fees', { params: { year: selectedYear } });
      
      setData(res.data.matrix || []);
      setMonthlyTotal(res.data.monthlyTotal || []);
      setExpenses(res.data.expenses || []);
      setSummary(res.data.summary || { totalIncome: 0, totalExpense: 0, balance: 0 });

    } catch (error) {
      message.error('Lỗi tải dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(year); }, [year]);

  // 2. Toggle Thu
  const handleToggle = async (memberId, month, currentStatus) => {
    try {
      await axios.post('/fees/toggle', { ma_dang_vien: memberId, month, year });
      message.success(!currentStatus ? `Đã thu T${month}` : `Hủy thu T${month}`, 1);
      fetchFees(year); 
    } catch (error) { message.error('Lỗi cập nhật'); }
  };

  // 3. Cập nhật mức đóng
  const handleUpdateFeeLevel = async () => {
    try {
        await axios.put('/fees/fee-level', { 
            ma_dang_vien: selectedMember.ma_dang_vien, 
            muc_dong_phi: newFee 
        });
        message.success(`Đã cập nhật mức đóng`);
        setIsFeeModalOpen(false);
        fetchFees(year);
    } catch (error) { message.error('Cập nhật thất bại'); }
  };

  // --- LOGIC QUẢN LÝ CHI TIÊU ---

  // Mở Modal Chi (Phân biệt Thêm / Sửa)
  const openExpenseModal = (record = null) => {
    setEditingExpense(record);
    if (record) {
        // Sửa: Fill dữ liệu cũ
        formExpense.setFieldsValue({
            noi_dung_giao_dich: record.noi_dung_giao_dich,
            so_tien: Number(record.so_tien),
            ngay_giao_dich: dayjs(record.ngay_giao_dich)
        });
    } else {
        // Thêm: Reset form
        formExpense.resetFields();
        formExpense.setFieldsValue({ ngay_giao_dich: dayjs() }); // Mặc định ngày hôm nay
    }
    setIsExpenseModalOpen(true);
  };

  // Lưu Phiếu Chi (Xử lý cả Create & Update)
  const handleSaveExpense = async (values) => {
    const payload = {
        ...values,
        ngay_giao_dich: values.ngay_giao_dich.format('YYYY-MM-DD')
    };

    try {
        if (editingExpense) {
            // Gọi API Sửa
            await axios.put(`/fees/expense/${editingExpense.ma_giao_dich}`, payload);
            message.success('Cập nhật phiếu chi thành công');
        } else {
            // Gọi API Thêm
            await axios.post('/fees/expense', payload);
            message.success('Tạo phiếu chi thành công');
        }
        setIsExpenseModalOpen(false);
        formExpense.resetFields();
        fetchFees(year);
    } catch (error) {
        message.error('Thao tác thất bại');
    }
  };

  // Xóa Phiếu Chi
  const handleDeleteExpense = async (id) => {
    try {
        await axios.delete(`/fees/expense/${id}`);
        message.success('Đã xóa phiếu chi');
        fetchFees(year);
    } catch (error) { message.error('Lỗi xóa'); }
  };

  // Xuất Excel
  const handleExport = () => {
    if (data.length === 0 && expenses.length === 0) return message.warning('Không có dữ liệu');
    // ... (Code export giữ nguyên như cũ) ...
    const dataExport = data.map(m => {
        const row = { 'Đảng viên': m.ho_ten, 'Mức đóng': m.muc_dong_phi };
        for (let i=1; i<=12; i++) row[`Tháng ${i}`] = m.months && m.months[i] ? 'x' : '';
        return row;
    });
    const ws1 = XLSX.utils.json_to_sheet(dataExport);
    const expenseExport = expenses.map(e => ({
        'Ngày': dayjs(e.ngay_giao_dich).format('DD/MM/YYYY'),
        'Nội dung': e.noi_dung_giao_dich,
        'Số tiền': e.so_tien,
        'Người tạo': e.nguoi_tao
    }));
    const ws2 = XLSX.utils.json_to_sheet(expenseExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Thu_Dang_Phi");
    XLSX.utils.book_append_sheet(wb, ws2, "Danh_Sach_Chi");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {type: "application/octet-stream"});
    saveAs(blob, `TaiChinh_DangBo_${year}.xlsx`);
  };

  // Columns Bảng Thu
  const columns = [
    {
      title: 'Đảng viên', dataIndex: 'ho_ten', key: 'ho_ten', fixed: 'left', width: 220,
      render: (t, r) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ color: '#003a8c', fontWeight: 'bold' }}>{t}</div>
                <div style={{ fontSize: 11, color: '#666' }}>Mức: <span style={{ color: '#cf1322' }}>{Number(r.muc_dong_phi || 50000).toLocaleString()} đ</span></div>
            </div>
            <Tooltip title="Sửa mức đóng">
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setSelectedMember(r); setNewFee(r.muc_dong_phi || 50000); setIsFeeModalOpen(true); }}/></Tooltip>
        </div>
      )
    },
    ...Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return {
            title: `T${month}`, dataIndex: 'months', key: `month_${month}`, align: 'center', width: 60,
            render: (months, record) => (<Checkbox checked={months && months[month]} onChange={() => handleToggle(record.ma_dang_vien, month, months[month])} />)
        };
    }),
    { title: 'Tổng', key: 'summary', fixed: 'right', width: 80, align: 'center', render: (_, r) => <Tag color="blue">{r.months ? Object.values(r.months).filter(Boolean).length : 0}/12</Tag> }
  ];

  // Columns Bảng Chi (Đã thêm nút Sửa)
  const expenseColumns = [
    { title: 'Ngày chi', dataIndex: 'ngay_giao_dich', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Nội dung', dataIndex: 'noi_dung_giao_dich', width: '40%' },
    { title: 'Số tiền', dataIndex: 'so_tien', align: 'right', render: v => <span style={{color: 'red', fontWeight: 'bold'}}>-{Number(v).toLocaleString()} đ</span> },
    {
        title: 'Hành động', key: 'action', align: 'center',
        render: (_, r) => (
            <Space>
                <Tooltip title="Sửa phiếu chi">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openExpenseModal(r)} />
                </Tooltip>
                <Popconfirm title="Xóa phiếu này?" onConfirm={() => handleDeleteExpense(r.ma_giao_dich)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </Space>
        )
    }
  ];

  const footerRow = () => (
    <div style={{ display: 'flex', overflow: 'auto', paddingLeft: 220 }}>
        {Array.from({ length: 12 }, (_, i) => (
             <div key={i} style={{ width: 60, flexShrink: 0, textAlign: 'center', fontSize: 10, color: '#3f8600', fontWeight: 'bold' }}>{monthlyTotal && monthlyTotal[i+1] > 0 ? (monthlyTotal[i+1]/1000) + 'k' : '-'}</div>
        ))}
    </div>
  );

  return (
    <div style={{ padding: 0 }}>
        <Card style={{ marginBottom: 16 }}>
            <Row justify="space-between" align="middle">
                <Col>
                    <Space size="large" wrap>
                        <Statistic title="Tổng Thu" value={summary?.totalIncome || 0} precision={0} valueStyle={{ color: '#3f8600' }} prefix={<ArrowUpOutlined />} suffix="đ" />
                        <Statistic title="Tổng Chi" value={summary?.totalExpense || 0} precision={0} valueStyle={{ color: '#cf1322' }} prefix={<ArrowDownOutlined />} suffix="đ" />
                        <Statistic title="Quỹ hiện tại" value={summary?.balance || 0} precision={0} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} prefix={<WalletOutlined />} suffix="đ" />
                    </Space>
                </Col>
                <Col>
                    <Space>
                        <Select defaultValue={year} style={{ width: 100 }} onChange={setYear}>
                            <Select.Option value={2024}>2024</Select.Option>
                            <Select.Option value={2025}>2025</Select.Option>
                            <Select.Option value={2026}>2026</Select.Option>
                        </Select>
                        <Button icon={<FileExcelOutlined />} onClick={handleExport} style={{ color: 'green', borderColor: 'green' }}>Xuất Báo cáo</Button>
                    </Space>
                </Col>
            </Row>
        </Card>

        <Card bodyStyle={{ padding: 0 }}>
            <Tabs type="card" size="large" tabBarStyle={{ marginBottom: 0, paddingLeft: 16, paddingTop: 8 }}>
                <Tabs.TabPane tab="THU ĐẢNG PHÍ" key="1">
                    <Table columns={columns} dataSource={data} rowKey="ma_dang_vien" loading={loading} pagination={false} scroll={{ x: 1200 }} footer={footerRow} bordered />
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="QUẢN LÝ CHI TIÊU" key="2">
                    <div style={{ padding: 16 }}>
                        {/* NÚT THÊM MỚI PHIẾU CHI */}
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openExpenseModal(null)} style={{ marginBottom: 16 }}>Lập phiếu chi</Button>
                        <Table columns={expenseColumns} dataSource={expenses} rowKey="ma_giao_dich" pagination={{ pageSize: 5 }} />
                    </div>
                </Tabs.TabPane>
            </Tabs>
        </Card>

        {/* Modal Mức đóng */}
        <Modal title={`Cài đặt mức đóng: ${selectedMember?.ho_ten}`} open={isFeeModalOpen} onCancel={() => setIsFeeModalOpen(false)} onOk={handleUpdateFeeLevel} okText="Lưu lại">
            <p>Nhập mức đóng Đảng phí hằng tháng (VNĐ):</p>
            <InputNumber value={newFee} onChange={setNewFee} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')} step={1000} min={0} />
        </Modal>

        {/* Modal Phiếu Chi (Thêm/Sửa) */}
        <Modal 
            title={editingExpense ? "Chỉnh sửa Phiếu chi" : "Lập Phiếu chi mới"} 
            open={isExpenseModalOpen} 
            onCancel={() => setIsExpenseModalOpen(false)} 
            footer={null}
        >
            <Form form={formExpense} layout="vertical" onFinish={handleSaveExpense}>
                <Form.Item name="noi_dung_giao_dich" label="Nội dung chi" rules={[{ required: true, message: 'Nhập nội dung' }]}><Input /></Form.Item>
                <Form.Item name="so_tien" label="Số tiền (VNĐ)" rules={[{ required: true, message: 'Nhập số tiền' }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="ngay_giao_dich" label="Ngày chi" rules={[{ required: true, message: 'Chọn ngày' }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                <Button type="primary" htmlType="submit" block>{editingExpense ? "Lưu thay đổi" : "Xác nhận chi"}</Button>
            </Form>
        </Modal>
    </div>
  );
};

export default FeeManager;