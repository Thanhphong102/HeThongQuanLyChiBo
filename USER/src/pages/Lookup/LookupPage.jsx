// src/pages/Lookup/LookupPage.jsx
import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Tabs, message, Input, Select, Space, DatePicker, Popover, Badge, Button, Typography } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';
import { removeAccents } from '../../utils/stringUtils';

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

        // 1. Lấy dữ liệu Đảng phí
        try {
            const resFee = await userApi.getMyFees();
            console.log("Dữ liệu phí nhận được:", resFee.data);
            const feeArray = Array.isArray(resFee.data) ? resFee.data 
                           : (resFee.data && Array.isArray(resFee.data.data)) ? resFee.data.data 
                           : []; 
            setFees(feeArray);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu phí:", error);
            setFees([]);
        }

        // 2. Lấy dữ liệu Điểm danh
        try {
            const resAtt = await userApi.getMyAttendance();
            setAttendance(Array.isArray(resAtt.data) ? resAtt.data : []);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu điểm danh:", error);
            setAttendance([]);
            // message.error("Không tải được dữ liệu điểm danh");
        }

        setLoading(false);
    };
    fetchData();
  }, []);

  // Cột cho bảng Đảng phí
  const feeCols = [
      { 
        title: 'Ngày nộp (thực tế)', 
        key: 'date', 
        width: '25%',
        render: (_, record) => {
            const dateStr = record.thoi_gian_tao || record.ngay_giao_dich;
            return dateStr ? dayjs(dateStr).format('HH:mm DD/MM/YYYY') : 'N/A';
        }
      },
      { 
        title: 'Nội dung', 
        dataIndex: 'noi_dung_giao_dich', 
        key: 'content',
        width: '45%'
      },
      { 
        title: 'Loại', 
        dataIndex: 'loai_giao_dich', 
        key: 'type', 
        width: '15%',
        align: 'center',
        render: t => <Tag color={t==='THU'?'green':'red'} className="px-3 py-1 font-semibold text-sm">{t || 'KHÁC'}</Tag> 
      },
      { 
        title: 'Số tiền', 
        dataIndex: 'so_tien', 
        key: 'amount', 
        width: '15%',
        render: v => <span className="font-bold text-red-600 text-base">{Number(v || 0).toLocaleString()} đ</span>, 
        align: 'right' 
      }
  ];

  const STATUS_MAP = {
    'Co mat': 'Đã điểm danh'
  };

  // Cột cho bảng Điểm danh
  const attCols = [
      { 
        title: 'Cuộc họp', 
        dataIndex: 'tieu_de', 
        key: 'title',
        width: '50%',
        render: t => <span className="font-medium text-gray-800">{t}</span>
      }, 
      { 
        title: 'Thời gian', 
        dataIndex: 'thoi_gian', 
        key: 'time', 
        width: '25%',
        render: d => d ? dayjs(d).format('HH:mm DD/MM/YYYY') : '' 
      },
      { 
        title: 'Trạng thái', 
        dataIndex: 'trang_thai_tham_gia', 
        key: 'status', 
        width: '25%',
        align: 'right',
        render: t => {
          const isPresent = t === 'Co mat';
          const displayStatus = isPresent ? 'Đã điểm danh' : 'Vắng họp';
          const color = isPresent ? 'success' : 'error';
          return <Tag color={color} className="font-semibold px-3 py-1 rounded-md text-sm">{displayStatus}</Tag>;
        }
      }
  ];

  // Bộ lọc Đảng phí
  const filteredFees = fees.filter(f => {
    const matchSearch = removeAccents(f.noi_dung_giao_dich).includes(removeAccents(feeSearch));
    const matchMonth = feeMonthFilter ? dayjs(f.ngay_giao_dich).format('MM/YYYY') === feeMonthFilter.format('MM/YYYY') : true;
    return matchSearch && matchMonth;
  });

  // Bộ lọc Điểm danh
  const filteredAttendance = attendance.filter(a => {
    const matchSearch = removeAccents(a.tieu_de).includes(removeAccents(attSearch)) || removeAccents(a.ghi_chu).includes(removeAccents(attSearch));
    
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
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input 
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm kiếm nội dung..." 
              allowClear 
              onChange={e => setFeeSearch(e.target.value)} 
              style={{ width: '100%', maxWidth: 400, borderRadius: 8 }} 
            />
            <Popover 
                content={
                    <div className="flex flex-col gap-4 w-64 p-2">
                        <div>
                            <Typography.Text strong className="block mb-1 text-gray-700">Tháng / Năm</Typography.Text>
                            <DatePicker 
                              picker="month" 
                              placeholder="Tháng / Năm" 
                              format="MM/YYYY"
                              style={{ width: '100%', borderRadius: 8 }} 
                              onChange={date => setFeeMonthFilter(date)}
                              value={feeMonthFilter}
                              allowClear
                            />
                        </div>
                        {feeMonthFilter && (
                            <Button type="link" danger onClick={() => setFeeMonthFilter(null)} className="p-0 text-left">
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                } 
                title={<span className="font-bold text-gray-800 border-b pb-2 block">Bộ lọc nâng cao</span>} 
                trigger="click" 
                placement="bottomRight"
            >
                <Badge count={feeMonthFilter ? 1 : 0} size="small" color="#a91f23">
                    <Button icon={<FilterOutlined />} className="font-semibold text-gray-700 flex items-center gap-2">
                        Bộ lọc
                    </Button>
                </Badge>
            </Popover>
          </div>
          <Table dataSource={filteredFees} columns={feeCols} rowKey="ma_giao_dich" loading={loading} pagination={{ pageSize: 5, position: ['bottomCenter'], showSizeChanger: false }} />
        </div>
      )
    },
    {
      key: '2',
      label: 'LỊCH SỬ ĐIỂM DANH',
      children: (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input 
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Tìm kiếm cuộc họp..." 
              allowClear 
              onChange={e => setAttSearch(e.target.value)} 
              style={{ width: '100%', maxWidth: 400, borderRadius: 8 }} 
            />
            <Popover 
                content={
                    <div className="flex flex-col gap-4 w-64 p-2">
                        <div>
                            <Typography.Text strong className="block mb-1 text-gray-700">Trạng thái điểm danh</Typography.Text>
                            <Select 
                              value={attStatusFilter} 
                              style={{ width: '100%', borderRadius: 8 }} 
                              onChange={value => setAttStatusFilter(value)}
                              options={[
                                { value: 'ALL', label: 'Tất cả trạng thái' },
                                { value: 'Co mat', label: 'Đã điểm danh' },
                                { value: 'Vang hop', label: 'Vắng họp' }
                              ]}
                            />
                        </div>
                        {attStatusFilter !== 'ALL' && (
                            <Button type="link" danger onClick={() => setAttStatusFilter('ALL')} className="p-0 text-left">
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                } 
                title={<span className="font-bold text-gray-800 border-b pb-2 block">Bộ lọc nâng cao</span>} 
                trigger="click" 
                placement="bottomRight"
            >
                <Badge count={attStatusFilter !== 'ALL' ? 1 : 0} size="small" color="#a91f23">
                    <Button icon={<FilterOutlined />} className="font-semibold text-gray-700 flex items-center gap-2">
                        Bộ lọc
                    </Button>
                </Badge>
            </Popover>
          </div>
          <Table dataSource={filteredAttendance} columns={attCols} rowKey="id" locale={{ emptyText: 'Chưa có dữ liệu điểm danh' }} pagination={{ pageSize: 5, position: ['bottomCenter'], showSizeChanger: false }} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
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