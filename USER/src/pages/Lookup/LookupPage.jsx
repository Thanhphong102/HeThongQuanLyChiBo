// src/pages/Lookup/LookupPage.jsx
import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Tabs, message } from 'antd';
import dayjs from 'dayjs';
import userApi from '../../api/userApi';

const LookupPage = () => {
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

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
        render: t => (
          <Tag color={t === 'Co mat' ? 'blue' : t === 'Vang co phep' ? 'orange' : 'red'}>
              {t}
          </Tag>
      )},
      { title: 'Ghi chú', dataIndex: 'ghi_chu', key: 'note' }
  ];

  const items = [
    {
      key: '1',
      label: 'LỊCH SỬ ĐÓNG ĐẢNG PHÍ',
      // Quan trọng: dataSource phải là fees (đảm bảo là mảng ở trên rồi)
      children: <Table dataSource={fees} columns={feeCols} rowKey="ma_giao_dich" loading={loading} pagination={{ pageSize: 5 }} />
    },
    {
      key: '2',
      label: 'LỊCH SỬ ĐIỂM DANH',
      children: <Table dataSource={attendance} columns={attCols} rowKey="id" locale={{ emptyText: 'Chưa có dữ liệu điểm danh' }} />
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