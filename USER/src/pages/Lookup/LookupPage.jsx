// src/pages/Lookup/LookupPage.jsx
import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Tabs, message, Input, Select, Space, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';

const LookupPage = () => {
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho tìm kiếm và bộ lọc
  const [feeSearch, setFeeSearch] = useState('');
  const [feeMonthFilter, setFeeMonthFilter] = useState(null);
  
  const [attSearch, setAttSearch] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Lấy dữ liệu Đảng phí
            const resFee = await userApi.getMyFees();
            console.log("Dữ liệu phí nhận được:", resFee.data); // Debug xem nó là gì

            // KIỂM TRA DỮ LIỆU TRƯỚC KHI SET STATE
            // Nếu resFee.data là mảng thì dùng luôn, nếu không thì thử tìm trong .data hoặc trả về rỗng
            const feeArray = Array.isArray(resFee.data) ? resFee.data 
                           : (resFee.data && Array.isArray(resFee.data.data)) ? resFee.data.data 
                           : []; 
            setFees(feeArray);

            // 2. Lấy dữ liệu Điểm danh (Tạm thời để rỗng để tránh lỗi tương tự)
            const resAtt = await userApi.getMyAttendance();
            setAttendance(Array.isArray(resAtt.data) ? resAtt.data : []);
            
        } catch (error) {
            console.error("Lỗi tra cứu:", error);
            message.error("Không tải được dữ liệu tra cứu");
            // Nếu lỗi, set về mảng rỗng để Table không bị crash
            setFees([]);
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Cột cho bảng Đảng phí
  const feeCols = [
      { 
        title: 'Ngày giao dịch', 
        dataIndex: 'ngay_giao_dich', 
        key: 'date', 
        render: d => d ? dayjs(d).format('DD/MM/YYYY') : 'N/A' 
      },
      { 
        title: 'Số tiền', 
        dataIndex: 'so_tien', 
        key: 'amount', 
        render: v => <span className="font-bold text-red-600">{Number(v || 0).toLocaleString()} đ</span>, 
        align: 'right' 
      },
      { 
        title: 'Nội dung', 
        dataIndex: 'noi_dung_giao_dich', 
        key: 'content' 
      },
      { 
        title: 'Loại', 
        dataIndex: 'loai_giao_dich', 
        key: 'type', 
        render: t => <Tag color={t==='THU'?'green':'red'}>{t || 'KHÁC'}</Tag> 
      }
  ];


  const STATUS_MAP = {
    'Co mat': 'Đã điểm danh'
  };

  // Cột cho bảng Điểm danh (ĐÃ SỬA dataIndex)
  const attCols = [
      { 
        title: 'Cuộc họp', 
        dataIndex: 'tieu_de', // Sửa từ ['buoi_hop', 'tieu_de'] thành 'tieu_de'
        key: 'title' 
      }, 
      { 
        title: 'Thời gian', 
        dataIndex: 'thoi_gian', // Sửa từ ['buoi_hop', 'thoi_gian'] thành 'thoi_gian'
        key: 'time', 
        render: d => d ? dayjs(d).format('HH:mm DD/MM/YYYY') : '' 
      },
      { 
        title: 'Trạng thái', 
        dataIndex: 'trang_thai_tham_gia', 
        key: 'status', 
        render: t => {
          const isPresent = t === 'Co mat';
          const displayStatus = isPresent ? 'Đã điểm danh' : 'Vắng họp';
          const color = isPresent ? 'green' : 'red';
          return <Tag color={color} className="font-semibold px-2 py-1 rounded">{displayStatus}</Tag>;
        }
      },
      { title: 'Ghi chú', dataIndex: 'ghi_chu', key: 'note' }
  ];

  // Bộ lọc Đảng phí
  const filteredFees = fees.filter(f => {
    const matchSearch = f.noi_dung_giao_dich?.toLowerCase().includes(feeSearch.toLowerCase());
    const matchMonth = feeMonthFilter ? dayjs(f.ngay_giao_dich).format('MM/YYYY') === feeMonthFilter.format('MM/YYYY') : true;
    return matchSearch && matchMonth;
  });

  // Bộ lọc Điểm danh
  const filteredAttendance = attendance.filter(a => {
    const matchSearch = a.tieu_de?.toLowerCase().includes(attSearch.toLowerCase()) || a.ghi_chu?.toLowerCase().includes(attSearch.toLowerCase());
    
    let matchStatus = true;
    if (attStatusFilter === 'Co mat') {
      matchStatus = a.trang_thai_tham_gia === 'Co mat';
    } else if (attStatusFilter === 'Vang hop') {
      matchStatus = a.trang_thai_tham_gia !== 'Co mat';
    }
    
    return matchSearch && matchStatus;
  });

  const items = [
    {
      key: '1',
      label: 'LỊCH SỬ ĐÓNG ĐẢNG PHÍ',
      children: (
        <div className="space-y-4 pt-2">
          <Space wrap>
            <Input 
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm kiếm nội dung..." 
              allowClear 
              onChange={e => setFeeSearch(e.target.value)} 
              style={{ width: 400, borderRadius: 8 }} 
            />
            <DatePicker 
              picker="month" 
              placeholder="Tháng / Năm" 
              format="MM/YYYY"
              style={{ width: 180, borderRadius: 8 }} 
              onChange={date => setFeeMonthFilter(date)}
              allowClear
            />
          </Space>
          <Table dataSource={filteredFees} columns={feeCols} rowKey="ma_giao_dich" loading={loading} pagination={{ pageSize: 5 }} />
        </div>
      )
    },
    {
      key: '2',
      label: 'LỊCH SỬ ĐIỂM DANH',
      children: (
        <div className="space-y-4 pt-2">
          <Space wrap>
            <Input 
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm kiếm cuộc họp..." 
              allowClear 
              onChange={e => setAttSearch(e.target.value)} 
              style={{ width: 400, borderRadius: 8 }} 
            />
            <Select 
              value={attStatusFilter} 
              style={{ width: 200, borderRadius: 8 }} 
              onChange={value => setAttStatusFilter(value)}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'Co mat', label: 'Đã điểm danh' },
                { value: 'Vang hop', label: 'Vắng họp' }
              ]}
            />
          </Space>
          <Table dataSource={filteredAttendance} columns={attCols} rowKey="id" locale={{ emptyText: 'Chưa có dữ liệu điểm danh' }} pagination={{ pageSize: 5 }} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
       <Card 
        variant="borderless" 
        className="shadow-md"
       >
           <Tabs defaultActiveKey="1" items={items} type="card" />
       </Card>
    </div>
  );
};

export default LookupPage;