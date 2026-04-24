import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Table, Button, Select, message, Checkbox, Tag, Typography,
  Row, Col, Space, Tabs, Statistic, InputNumber, Modal, Form, Input,
  DatePicker, Popconfirm, Tooltip
} from 'antd';
import {
  DollarCircleOutlined, CalendarOutlined, FileExcelOutlined, PlusOutlined,
  DeleteOutlined, EditOutlined, WalletOutlined, ArrowUpOutlined,
  ArrowDownOutlined, SearchOutlined, FilterOutlined
} from '@ant-design/icons';
import axios from '../services/axiosConfig';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;

const COLOR_RED   = '#CE1126';
const COLOR_GREEN = '#22c55e';
const COLOR_BLUE  = '#3b82f6';

const FeeManager = () => {
  const [data, setData]               = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState([]);
  const [expenses, setExpenses]       = useState([]);
  const [summary, setSummary]         = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading]         = useState(false);
  const [year, setYear]               = useState(dayjs().year());

  // [MỚI] Search & Filter cho tab Thu Đảng phí
  const [searchFee, setSearchFee]     = useState('');
  const [filterPaid, setFilterPaid]   = useState('all'); // 'all' | 'paid' | 'unpaid'
  const [filterMonth, setFilterMonth] = useState(0);     // 0: Tất cả, 1-12: Tháng cụ thể

  // State Modal mức đóng
  const [isFeeModalOpen, setIsFeeModalOpen]   = useState(false);
  const [selectedMember, setSelectedMember]   = useState(null);
  const [newFee, setNewFee]                   = useState(0);

  // State Modal Phiếu Chi
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense]          = useState(null);
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
    } catch {
      message.error('Lỗi tải dữ liệu tài chính');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(year); }, [year]);

  // [MỚI] Filter dữ liệu theo Search + Trạng thái đóng + Tháng
  const filteredData = useMemo(() => {
    let result = data;

    // 1. Lọc theo tên search
    if (searchFee.trim()) {
      result = result.filter(m =>
        m.ho_ten.toLowerCase().includes(searchFee.toLowerCase())
      );
    }

    // 2. Logic kết hợp Trạng thái và Tháng
    if (filterMonth === 0) {
      // Lọc tổng quát cả năm
      if (filterPaid === 'paid') {
        result = result.filter(m => m.months && Object.values(m.months).some(Boolean));
      } else if (filterPaid === 'unpaid') {
        result = result.filter(m => !m.months || !Object.values(m.months).some(Boolean));
      }
    } else {
      // Lọc chính xác theo tháng được chọn
      if (filterPaid === 'paid') {
        result = result.filter(m => m.months && m.months[filterMonth] === true);
      } else if (filterPaid === 'unpaid') {
        result = result.filter(m => !m.months || !m.months[filterMonth]);
      }
    }

    return result;
  }, [data, searchFee, filterPaid, filterMonth]);

  // 2. Toggle Thu
  const handleToggle = async (memberId, month, currentStatus) => {
    try {
      await axios.post('/fees/toggle', { ma_dang_vien: memberId, month, year });
      message.success(!currentStatus ? `Đã thu T${month}` : `Hủy thu T${month}`, 1);
      fetchFees(year);
    } catch { message.error('Lỗi cập nhật'); }
  };

  // 3. Cập nhật mức đóng
  const handleUpdateFeeLevel = async () => {
    try {
      await axios.put('/fees/fee-level', {
        ma_dang_vien: selectedMember.ma_dang_vien,
        muc_dong_phi: newFee
      });
      message.success('Đã cập nhật mức đóng');
      setIsFeeModalOpen(false);
      fetchFees(year);
    } catch { message.error('Cập nhật thất bại'); }
  };

  // 4. Modal Phiếu Chi
  const openExpenseModal = (record = null) => {
    setEditingExpense(record);
    if (record) {
      formExpense.setFieldsValue({
        noi_dung_giao_dich: record.noi_dung_giao_dich,
        so_tien: Number(record.so_tien),
        ngay_giao_dich: dayjs(record.ngay_giao_dich)
      });
    } else {
      formExpense.resetFields();
      formExpense.setFieldsValue({ ngay_giao_dich: dayjs() });
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (values) => {
    const payload = { ...values, ngay_giao_dich: values.ngay_giao_dich.format('YYYY-MM-DD') };
    try {
      if (editingExpense) {
        await axios.put(`/fees/expense/${editingExpense.ma_giao_dich}`, payload);
        message.success('Cập nhật phiếu chi thành công');
      } else {
        await axios.post('/fees/expense', payload);
        message.success('Tạo phiếu chi thành công');
      }
      setIsExpenseModalOpen(false);
      formExpense.resetFields();
      fetchFees(year);
    } catch { message.error('Thao tác thất bại'); }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`/fees/expense/${id}`);
      message.success('Đã xóa phiếu chi');
      fetchFees(year);
    } catch { message.error('Lỗi xóa'); }
  };

  // 5. Xuất Excel
  const handleExport = () => {
    if (data.length === 0 && expenses.length === 0) return message.warning('Không có dữ liệu');
    const dataExport = data.map(m => {
      const row = { 'Đảng viên': m.ho_ten, 'Mức đóng': m.muc_dong_phi };
      for (let i = 1; i <= 12; i++) row[`Tháng ${i}`] = m.months && m.months[i] ? 'x' : '';
      return row;
    });
    const ws1 = XLSX.utils.json_to_sheet(dataExport);
    const expenseExport = expenses.map(e => ({
      'Ngày': dayjs(e.ngay_giao_dich).format('DD/MM/YYYY'),
      'Nội dung': e.noi_dung_giao_dich,
      'Số tiền': e.so_tien,
    }));
    const ws2 = XLSX.utils.json_to_sheet(expenseExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Thu_Dang_Phi');
    XLSX.utils.book_append_sheet(wb, ws2, 'Danh_Sach_Chi');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `TaiChinh_DangBo_${year}.xlsx`);
  };

  // Columns bảng Thu
  const columns = [
    {
      title: 'Đảng viên', dataIndex: 'ho_ten', key: 'ho_ten', fixed: 'left', width: 230,
      render: (t, r) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#111827', fontFamily: 'Be Vietnam Pro, sans-serif' }}>{t}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              Mức: <span style={{ color: COLOR_RED, fontWeight: 600 }}>{Number(r.muc_dong_phi || 50000).toLocaleString()} đ</span>
            </div>
          </div>
          <Tooltip title="Sửa mức đóng">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setSelectedMember(r); setNewFee(r.muc_dong_phi || 50000); setIsFeeModalOpen(true); }} />
          </Tooltip>
        </div>
      )
    },
    ...Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        title: `T${month}`, dataIndex: 'months', key: `month_${month}`, align: 'center', width: 52,
        render: (months, record) => (
          <Checkbox
            checked={months && months[month]}
            onChange={() => handleToggle(record.ma_dang_vien, month, months && months[month])}
          />
        )
      };
    }),
    {
      title: 'Tổng', key: 'summary', fixed: 'right', width: 72, align: 'center',
      render: (_, r) => {
        const count = r.months ? Object.values(r.months).filter(Boolean).length : 0;
        return <Tag color={count === 12 ? 'green' : count > 0 ? 'blue' : 'red'}>{count}/12</Tag>;
      }
    }
  ];

  // Columns Phiếu Chi
  const expenseColumns = [
    { title: 'Ngày chi', dataIndex: 'ngay_giao_dich', width: 110, render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Nội dung', dataIndex: 'noi_dung_giao_dich', width: '45%' },
    {
      title: 'Số tiền', dataIndex: 'so_tien', align: 'right',
      render: v => <span style={{ color: COLOR_RED, fontWeight: 700 }}>-{Number(v).toLocaleString()} đ</span>
    },
    {
      title: 'Hành động', key: 'action', align: 'center',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openExpenseModal(r)} />
          <Popconfirm title="Xóa phiếu này?" onConfirm={() => handleDeleteExpense(r.ma_giao_dich)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const footerRow = () => (
    <div style={{ display: 'flex', overflow: 'auto', paddingLeft: 230 }}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ width: 52, flexShrink: 0, textAlign: 'center', fontSize: 10, color: COLOR_GREEN, fontWeight: 700 }}>
          {monthlyTotal && monthlyTotal[i + 1] > 0 ? (monthlyTotal[i + 1] / 1000) + 'k' : '-'}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 700, color: '#111827' }}>
          Quản lý Đảng phí & Tài chính
        </Title>
        <Text style={{ color: '#6b7280' }}>Theo dõi thu chi và quản lý quỹ Chi bộ</Text>
      </div>

      {/* Summary Cards */}
      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: 16 }}>
        <Row justify="space-between" align="middle" wrap>
          <Col>
            <Space size="large" wrap>
              <Statistic title="Tổng Thu" value={summary?.totalIncome || 0}
                valueStyle={{ color: COLOR_GREEN, fontWeight: 700 }}
                prefix={<ArrowUpOutlined />} suffix="đ" />
              <Statistic title="Tổng Chi" value={summary?.totalExpense || 0}
                valueStyle={{ color: COLOR_RED, fontWeight: 700 }}
                prefix={<ArrowDownOutlined />} suffix="đ" />
              <Statistic title="Quỹ hiện tại" value={summary?.balance || 0}
                valueStyle={{ color: COLOR_BLUE, fontWeight: 700 }}
                prefix={<WalletOutlined />} suffix="đ" />
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Select value={year} style={{ width: 100, borderRadius: 8 }} onChange={setYear}>
                {[2024, 2025, 2026].map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
              </Select>
              <Button icon={<FileExcelOutlined />} onClick={handleExport}
                style={{ color: COLOR_GREEN, borderColor: COLOR_GREEN, borderRadius: 8 }}>
                Xuất Báo cáo
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }} styles={{ body: { padding: 0 } }}>
        <Tabs type="card" size="large" tabBarStyle={{ marginBottom: 0, paddingLeft: 16, paddingTop: 8 }}
          items={[
            {
              key: '1',
              label: '💰 THU ĐẢNG PHÍ',
              children: (
                <>
                  {/* [MỚI] Search + Filter */}
                  <div style={{ padding: '12px 16px', display: 'flex', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid #f3f4f6' }}>
                    <Input
                      placeholder="Tìm theo tên Đảng viên..."
                      prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                      value={searchFee}
                      onChange={e => setSearchFee(e.target.value)}
                      style={{ width: 220, borderRadius: 8 }}
                      allowClear
                    />
                    <Select
                      value={filterMonth}
                      onChange={setFilterMonth}
                      style={{ width: 140, borderRadius: 8 }}
                      popupMatchSelectWidth={false}
                    >
                      <Select.Option value={0}>📅 Cả năm</Select.Option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <Select.Option key={i + 1} value={i + 1}>Tháng {i + 1}</Select.Option>
                      ))}
                    </Select>
                    <Select
                      value={filterPaid}
                      onChange={setFilterPaid}
                      style={{ width: 180, borderRadius: 8 }}
                      prefix={<FilterOutlined />}
                      popupMatchSelectWidth={false}
                    >
                      <Select.Option value="all">🔍 Tất cả đảng viên</Select.Option>
                      <Select.Option value="paid">✅ Đã đóng {filterMonth > 0 ? `T${filterMonth}` : '(có tháng)'}</Select.Option>
                      <Select.Option value="unpaid">❌ Chưa đóng {filterMonth > 0 ? `T${filterMonth}` : 'tháng nào'}</Select.Option>
                    </Select>
                    <Text style={{ color: '#6b7280', alignSelf: 'center', fontSize: 13 }}>
                      Hiển thị <strong>{filteredData.length}</strong> / {data.length} đảng viên
                    </Text>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="ma_dang_vien"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 1200 }}
                    footer={footerRow}
                    bordered
                    style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
                  />
                </>
              )
            },
            {
              key: '2',
              label: '📋 QUẢN LÝ CHI TIÊU',
              children: (
                <div style={{ padding: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openExpenseModal(null)}
                    style={{ marginBottom: 16, background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600 }}>
                    Lập phiếu chi
                  </Button>
                  <Table
                    columns={expenseColumns}
                    dataSource={expenses}
                    rowKey="ma_giao_dich"
                    pagination={{ pageSize: 6 }}
                    style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Modal Mức đóng */}
      <Modal
        title={<span style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>⚙️ Mức đóng: {selectedMember?.ho_ten}</span>}
        open={isFeeModalOpen}
        onCancel={() => setIsFeeModalOpen(false)}
        onOk={handleUpdateFeeLevel}
        okText="Lưu lại"
        okButtonProps={{ style: { background: COLOR_RED, borderColor: COLOR_RED } }}
      >
        <p>Nhập mức đóng Đảng phí hằng tháng (VNĐ):</p>
        <InputNumber
          value={newFee}
          onChange={setNewFee}
          style={{ width: '100%', borderRadius: 8 }}
          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={v => v.replace(/\$\s?|(,*)/g, '')}
          step={1000}
          min={0}
        />
      </Modal>

      {/* Modal Phiếu Chi */}
      <Modal
        title={
          <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
            {editingExpense ? '✏️ Chỉnh sửa Phiếu chi' : '➕ Lập Phiếu chi mới'}
          </span>
        }
        open={isExpenseModalOpen}
        onCancel={() => setIsExpenseModalOpen(false)}
        footer={null}
      >
        <Form form={formExpense} layout="vertical" onFinish={handleSaveExpense}>
          <Form.Item name="noi_dung_giao_dich" label="Nội dung chi" rules={[{ required: true, message: 'Nhập nội dung' }]}>
            <Input style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="so_tien" label="Số tiền (VNĐ)" rules={[{ required: true, message: 'Nhập số tiền' }]}>
            <InputNumber style={{ width: '100%', borderRadius: 8 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="ngay_giao_dich" label="Ngày chi" rules={[{ required: true, message: 'Chọn ngày' }]}>
            <DatePicker style={{ width: '100%', borderRadius: 8 }} format="DD/MM/YYYY" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block
            style={{ background: COLOR_RED, borderColor: COLOR_RED, borderRadius: 8, fontWeight: 600, height: 40 }}>
            {editingExpense ? 'Lưu thay đổi' : 'Xác nhận chi'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default FeeManager;