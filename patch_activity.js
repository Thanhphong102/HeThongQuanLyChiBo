const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'ADMIN/frontend/src/pages/ActivityManager.js');
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// === 1. Thay thế openAttendance + saveAttendance ===
const old1 = `  // 3. Điểm danh thủ công
  const openAttendance = async (activity) => {
    setCurrentActivity(activity);
    setAttendanceSearch('');
    try {
      const res = await axios.get(\`/activities/\${activity.ma_lich}/attendance\`);
      setAttendanceList(res.data.map(m => ({
        ...m,
        status: m.trang_thai_tham_gia || 'Co mat',
        note: m.ghi_chu || ''
      })));
      setIsAttendanceOpen(true);
    } catch { message.error('Không tải được danh sách điểm danh'); }
  };

  const handleStatusChange    = (memberId, val) =>
    setAttendanceList(prev => prev.map(item =>
      item.ma_dang_vien === memberId ? { ...item, status: val } : item
    ));

  const saveAttendance = async () => {
    try {
      await axios.post(\`/activities/\${currentActivity.ma_lich}/attendance\`, {
        attendanceData: attendanceList.map(m => ({
          ma_dang_vien: m.ma_dang_vien, status: m.status, note: m.note
        }))
      });
      message.success('Đã lưu kết quả điểm danh');
      setIsAttendanceOpen(false);
      fetchActivities();
    } catch { message.error('Lỗi lưu điểm danh'); }
  };`;

const new1 = `  // Helper: map dữ liệu điểm danh từ server (không tự gán vắng)
  const mapAttendanceData = (data) => {
    return data.map(m => {
      const isQR = m.nguon_diem_danh === 'QR';
      const status = m.trang_thai_tham_gia || null;
      return { ...m, status, note: m.ghi_chu || '', nguon: m.nguon_diem_danh || null, isQR };
    });
  };

  // 3. Điểm danh thủ công
  const openAttendance = async (activity) => {
    setCurrentActivity(activity);
    setAttendanceSearch('');
    try {
      const res = await axios.get(\`/activities/\${activity.ma_lich}/attendance\`);
      setAttendanceList(mapAttendanceData(res.data));
      setIsAttendanceOpen(true);
    } catch { message.error('Không tải được danh sách điểm danh'); }
  };

  const refreshAttendance = async () => {
    if (!currentActivity) return;
    try {
      const res = await axios.get(\`/activities/\${currentActivity.ma_lich}/attendance\`);
      setAttendanceList(mapAttendanceData(res.data));
      message.success('Đã tải lại danh sách!');
    } catch { message.error('Lỗi tải lại'); }
  };

  const handleStatusChange    = (memberId, val) =>
    setAttendanceList(prev => prev.map(item =>
      item.ma_dang_vien === memberId ? { ...item, status: val } : item
    ));

  const saveAttendance = async () => {
    try {
      // Chỉ lưu những người Admin đã tích thủ công
      const dataToSave = attendanceList
        .filter(m => !m.isQR && m.status === 'Co mat')
        .map(m => ({ ma_dang_vien: m.ma_dang_vien, status: 'Co mat', note: m.note }));
      if (dataToSave.length === 0) {
        message.info('Không có điểm danh thủ công nào cần lưu.');
        return;
      }
      await axios.post(\`/activities/\${currentActivity.ma_lich}/attendance\`, { attendanceData: dataToSave });
      message.success(\`Đã lưu \${dataToSave.length} điểm danh thủ công!\`);
      setIsAttendanceOpen(false);
      fetchActivities();
    } catch { message.error('Lỗi lưu điểm danh'); }
  };`;

if (!content.includes(old1)) {
  console.error('BLOCK 1 NOT FOUND');
  process.exit(1);
}
content = content.replace(old1, new1);
console.log('Block 1 replaced OK');

// === 2. Thay thế attendanceColumns ===
const old2 = `  const attendanceColumns = [
    { title: 'Đảng viên', dataIndex: 'ho_ten', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
    { title: 'Chức vụ', dataIndex: 'chuc_vu_dang' },
    {
      title: 'Trạng thái', key: 'status',
      render: (_, record) => (
        <Radio.Group value={record.status} onChange={(e) => handleStatusChange(record.ma_dang_vien, e.target.value)} buttonStyle="solid">
          <Radio.Button value="Co mat">✅ Có mặt</Radio.Button>
          <Radio.Button value="Vang co phep">🟡 Có phép</Radio.Button>
          <Radio.Button value="Vang khong phep">❌ K.Phép</Radio.Button>
        </Radio.Group>
      )
    }
  ];`;

const new2 = `  const attendanceColumns = [
    { title: 'Đảng viên', dataIndex: 'ho_ten', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
    { title: 'Chức vụ', dataIndex: 'chuc_vu_dang' },
    {
      title: 'Nguồn', key: 'nguon', width: 160, align: 'left',
      render: (_, record) => {
        if (record.isQR) return <Tag color="green" style={{ fontWeight: 600 }}>📱 QR</Tag>;
        if (record.status === 'Co mat') return <Tag color="blue" style={{ fontWeight: 600 }}>✏️ Thủ công</Tag>;
        return <Tag color="default" style={{ color: '#6b7280' }}>Chưa điểm danh</Tag>;
      }
    },
    {
      title: 'Trạng thái', key: 'status', align: 'center',
      render: (_, record) => {
        if (record.isQR) {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />} style={{ padding: '4px 14px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
              ĐÃ ĐIỂM DANH (QR)
            </Tag>
          );
        }
        if (record.status === 'Co mat') {
          return (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record.ma_dang_vien, null)}
              style={{ borderRadius: 8, fontWeight: 600, background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
            >
              ✅ Đã điểm danh
            </Button>
          );
        }
        return (
          <Button
            onClick={() => handleStatusChange(record.ma_dang_vien, 'Co mat')}
            style={{ borderRadius: 8, fontWeight: 600, borderColor: '#f87171', color: '#dc2626', background: '#fff5f5' }}
          >
            ❌ Vắng họp
          </Button>
        );
      }
    }
  ];`;

if (!content.includes(old2)) {
  console.error('BLOCK 2 NOT FOUND');
  process.exit(1);
}
content = content.replace(old2, new2);
console.log('Block 2 replaced OK');

// === 3. Sửa tiêu đề Modal - thêm nút Làm mới ===
const old3 = `            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ color: COLOR_GREEN, borderColor: COLOR_GREEN, borderRadius: 8 }}>Xuất BC</Button>`;
const new3 = `            <Space>
              <Button icon={<ReloadOutlined />} onClick={refreshAttendance} style={{ borderRadius: 8 }}>Làm mới</Button>
              <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ color: COLOR_GREEN, borderColor: COLOR_GREEN, borderRadius: 8 }}>Xuất BC</Button>
            </Space>`;

if (!content.includes(old3)) {
  console.error('BLOCK 3 NOT FOUND');
  process.exit(1);
}
content = content.replace(old3, new3);
console.log('Block 3 replaced OK');

// Restore CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(file, content, 'utf8');
console.log('File written successfully. Total lines:', content.split('\r\n').length);
