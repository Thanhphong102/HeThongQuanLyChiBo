// src/pages/Documents/DocumentsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Tag, Input, Select, Space, Popover,
  Badge, Typography, Spin, Empty, Breadcrumb, Segmented
} from 'antd';
import {
  DownloadOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined,
  SearchOutlined, FilterOutlined, FolderOutlined, FileOutlined,
  ArrowLeftOutlined, HomeOutlined, AppstoreOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import userApi from '../../api/userApi';
import dayjs from 'dayjs';
import { removeAccents, fuzzyMatch } from '../../utils/stringUtils';

const { Text, Title } = Typography;
const COLOR_RED = '#a91f23';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getFileIcon = (filename = '', size = 18) => {
  const n = filename.toLowerCase();
  if (n.endsWith('.pdf'))  return <FilePdfOutlined  style={{ color: '#ef4444', fontSize: size }} />;
  if (n.endsWith('.doc') || n.endsWith('.docx'))
                            return <FileWordOutlined  style={{ color: '#3b82f6', fontSize: size }} />;
  if (n.endsWith('.xls') || n.endsWith('.xlsx'))
                            return <FileExcelOutlined style={{ color: '#22c55e', fontSize: size }} />;
  return <FileOutlined style={{ color: '#6b7280', fontSize: size }} />;
};

// ─── Tab Biểu mẫu Chi bộ (Folder Tree) ──────────────────────────────────────
const FolderBrowser = ({ branchId }) => {
  // Navigation: mảng breadcrumb
  const [breadcrumb, setBreadcrumb] = useState([]); // [] = root
  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : null;

  const [subfolders, setSubfolders] = useState([]);
  const [files, setFiles]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('date_desc');
  const [viewMode, setViewMode]     = useState('grid');

  const fetchContent = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      if (currentFolderId === null) {
        // Root: lấy danh sách thư mục gốc
        const res = await userApi.getFolderTree(branchId);
        const rootFolders = res.data.filter(f => f.parent_folder_id === null);
        setSubfolders(rootFolders);
        setFiles([]);
      } else {
        // Trong folder: lấy subfolders + files
        const res = await userApi.getFolderContents(currentFolderId);
        setSubfolders(res.data.subfolders || []);
        setFiles(res.data.files || []);
      }
    } catch {
      // lỗi load yên lặng
    } finally {
      setLoading(false);
    }
  }, [branchId, currentFolderId]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const openFolder = (folder) => {
    setSearch('');
    setBreadcrumb(prev => [...prev, { id: folder.ma_folder, name: folder.ten_folder }]);
  };

  const goToRoot = () => { setSearch(''); setBreadcrumb([]); };

  const goToBreadcrumb = (index) => {
    setSearch('');
    setBreadcrumb(prev => prev.slice(0, index + 1));
  };

  // Lọc theo search
  const sortItems = (items, nameField, dateField) => [...items].sort((a, b) => {
    if (sortBy === 'name_asc' || sortBy === 'name_desc') {
      const result = String(a[nameField] || '').localeCompare(
        String(b[nameField] || ''), 'vi', { sensitivity: 'base', numeric: true }
      );
      return sortBy === 'name_asc' ? result : -result;
    }
    const aTime = new Date(a[dateField] || a.ngay_tao || 0).getTime();
    const bTime = new Date(b[dateField] || b.ngay_tao || 0).getTime();
    return sortBy === 'date_asc' ? aTime - bTime : bTime - aTime;
  });
  const filteredFolders = sortItems(
    subfolders.filter(f => fuzzyMatch(f.ten_folder, search)),
    'ten_folder', 'ngay_cap_nhat'
  );
  const filteredFiles = sortItems(
    files.filter(f => fuzzyMatch(f.tieu_de, search)),
    'tieu_de', 'ngay_tao'
  );

  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        background: '#f9fafb', borderRadius: 8, padding: '8px 14px',
        marginBottom: 14, border: '1px solid #e5e7eb'
      }}>
        <Breadcrumb
          items={[
            {
              title: (
                <span onClick={goToRoot} style={{ cursor: 'pointer', color: COLOR_RED }}>
                  <HomeOutlined /> Biểu mẫu Chi bộ
                </span>
              )
            },
            ...breadcrumb.map((b, i) => ({
              title: (
                <span
                  onClick={() => i < breadcrumb.length - 1 ? goToBreadcrumb(i) : undefined}
                  style={{
                    cursor: i < breadcrumb.length - 1 ? 'pointer' : 'default',
                    color: i < breadcrumb.length - 1 ? COLOR_RED : '#111827',
                    fontWeight: i === breadcrumb.length - 1 ? 700 : 400
                  }}
                >
                  📁 {b.name}
                </span>
              )
            }))
          ]}
        />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <Space>
          {breadcrumb.length > 0 && (
            <Button size="small" icon={<ArrowLeftOutlined />}
              onClick={() => { setSearch(''); setBreadcrumb(prev => prev.slice(0, -1)); }}
              style={{ borderRadius: 6 }}>
              Quay lại
            </Button>
          )}
        </Space>
        <Space wrap>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            aria-label="Kiểu hiển thị"
            options={[
              { value: 'grid', icon: <AppstoreOutlined />, label: 'Lưới' },
              { value: 'list', icon: <UnorderedListOutlined />, label: 'Danh sách' },
            ]}
          />
          <Select
            aria-label="Sắp xếp biểu mẫu"
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 165 }}
            options={[
              { value: 'date_desc', label: 'Mới nhất trước' },
              { value: 'date_asc', label: 'Cũ nhất trước' },
              { value: 'name_asc', label: 'Tên A → Z' },
              { value: 'name_desc', label: 'Tên Z → A' },
            ]}
          />
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Tìm gần đúng tên thư mục hoặc file..."
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 220, borderRadius: 8 }}
          />
        </Space>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
      ) : isEmpty ? (
        <Empty description={search ? 'Không tìm thấy thư mục hoặc file phù hợp' : (currentFolderId ? 'Thư mục trống' : 'Chưa có biểu mẫu nào')} />
      ) : (
        <div>
          {/* Thư mục con */}
          {filteredFolders.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                THƯ MỤC
              </Text>
              <div style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : '1fr',
                gap: 10, marginTop: 8
              }}>
                {filteredFolders.map(folder => (
                  <div
                    key={folder.ma_folder}
                    onClick={() => openFolder(folder)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10,
                      border: '1.5px solid #e5e7eb', cursor: 'pointer',
                      background: '#fff', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = COLOR_RED}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <FolderOutlined style={{ fontSize: 22, color: '#D97706', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111827',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {folder.ten_folder}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {folder.so_luong_file || 0} file
                        {folder.so_luong_thu_muc_con > 0 && ` · ${folder.so_luong_thu_muc_con} thư mục`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File */}
          {filteredFiles.length > 0 && (
            <div>
              <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                TÀI LIỆU
              </Text>
              <div style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(240px, 1fr))' : undefined,
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gap: 8, marginTop: 8
              }}>
                {filteredFiles.map(file => (
                  <div key={file.ma_bieu_mau} style={{
                    display: 'flex', alignItems: viewMode === 'grid' ? 'flex-start' : 'center', gap: 12,
                    flexWrap: viewMode === 'grid' ? 'wrap' : 'nowrap',
                    padding: '10px 14px', borderRadius: 10,
                    border: '1px solid #f3f4f6', background: '#fff'
                  }}>
                    {getFileIcon(file.tieu_de)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={file.duong_dan_file} target="_blank" rel="noreferrer"
                        style={{ fontWeight: 600, fontSize: 13, color: '#111827',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {file.tieu_de}
                      </a>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {dayjs(file.ngay_tao).format('DD/MM/YYYY')}
                        {file.nguoi_dang ? ` · ${file.nguoi_dang}` : ''}
                      </div>
                    </div>
                    <Button type="primary" ghost size="small"
                      href={file.duong_dan_file} target="_blank"
                      icon={<DownloadOutlined />}
                      style={{
                        borderRadius: 6, borderColor: COLOR_RED, color: COLOR_RED, flexShrink: 0,
                        marginLeft: viewMode === 'grid' ? 30 : 0
                      }}>
                      Tải về
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Trang chính ─────────────────────────────────────────────────────────────
const DocumentsPage = () => {
  const [schoolDocs, setSchoolDocs] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [schoolSearch, setSchoolSearch]       = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('ALL');
  const [activeTab, setActiveTab]   = useState('forms');

  const user = JSON.parse(localStorage.getItem('user_info') || '{}');

  useEffect(() => {
    const fetchSchool = async () => {
      setLoading(true);
      try {
        const res = await userApi.getSchoolDocuments();
        setSchoolDocs(res.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchSchool();
  }, []);

  const getFileIcon2 = (filename) => {
    if (!filename) return <FilePdfOutlined />;
    if (filename.endsWith('.doc') || filename.endsWith('.docx')) return <FileWordOutlined className="text-blue-600" />;
    if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) return <FileExcelOutlined className="text-green-600" />;
    return <FilePdfOutlined className="text-red-600" />;
  };

  const schoolDocColumns = [
    { title: 'Tên Văn bản', dataIndex: 'ten_tai_lieu', render: text => <span className="font-semibold text-red-800">{getFileIcon2(text)} {text}</span> },
    { title: 'Loại', dataIndex: 'loai_tai_lieu', render: t => <Tag color="blue">{t || 'Văn bản'}</Tag> },
    { title: 'Ngày ban hành', dataIndex: 'ngay_tai_len', render: d => dayjs(d).format('DD/MM/YYYY') },
    { title: 'Tải về', render: (_, record) => (
        <Button type="primary" ghost size="small" href={record.duong_dan} target="_blank" icon={<DownloadOutlined />}>Xem/Tải</Button>
    )},
  ];

  const DOC_TYPES = ['Nghị quyết', 'Quyết định', 'Thông báo', 'Báo cáo', 'Kế hoạch', 'Hướng dẫn', 'Công văn', 'Biên bản', 'Tờ trình', 'Chương trình', 'Khác'];

  const filteredSchoolDocs = schoolDocs.filter(d => {
    const matchSearch = removeAccents(d.ten_tai_lieu).includes(removeAccents(schoolSearch));
    const matchType   = schoolTypeFilter === 'ALL' ? true : d.loai_tai_lieu === schoolTypeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card variant="borderless" className="shadow-md">
        <h2 className="text-2xl font-bold text-red-dang mb-4 uppercase border-b pb-2">
          Kho Tài liệu & Văn bản
        </h2>

        {/* Tab custom */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'forms',  label: '📁 BIỂU MẪU CHI BỘ' },
            { key: 'school', label: '🏫 VĂN BẢN CẤP TRƯỜNG' },
          ].map(tab => (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? 'primary' : 'default'}
              onClick={() => setActiveTab(tab.key)}
              style={{
                borderRadius: 8, fontWeight: 600,
                ...(activeTab === tab.key
                  ? { background: COLOR_RED, borderColor: COLOR_RED }
                  : { borderColor: '#e5e7eb' })
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab: Biểu mẫu Chi bộ — Folder Browser */}
        {activeTab === 'forms' && (
          <FolderBrowser branchId={user?.ma_chi_bo} />
        )}

        {/* Tab: Văn bản cấp trường */}
        {activeTab === 'school' && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Input
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="Tìm kiếm văn bản..."
                allowClear
                onChange={e => setSchoolSearch(e.target.value)}
                style={{ width: '100%', maxWidth: 400, borderRadius: 8 }}
              />
              <Popover
                content={
                  <div className="flex flex-col gap-4 w-64 p-2">
                    <div>
                      <Typography.Text strong className="block mb-1 text-gray-700">Loại văn bản</Typography.Text>
                      <Select value={schoolTypeFilter} style={{ width: '100%' }}
                        onChange={v => setSchoolTypeFilter(v)}
                        options={[
                          { value: 'ALL', label: 'Tất cả loại văn bản' },
                          ...DOC_TYPES.map(t => ({ value: t, label: t }))
                        ]}
                      />
                    </div>
                    {schoolTypeFilter !== 'ALL' && (
                      <Button type="link" danger onClick={() => setSchoolTypeFilter('ALL')} className="p-0 text-left">
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                }
                title={<span className="font-bold text-gray-800">Bộ lọc nâng cao</span>}
                trigger="click" placement="bottomRight"
              >
                <Badge count={schoolTypeFilter !== 'ALL' ? 1 : 0} size="small" color={COLOR_RED}>
                  <Button icon={<FilterOutlined />} className="font-semibold text-gray-700">Bộ lọc</Button>
                </Badge>
              </Popover>
            </div>
            <Table
              dataSource={filteredSchoolDocs}
              columns={schoolDocColumns}
              rowKey="ma_tai_lieu"
              loading={loading}
              pagination={{ pageSize: 5, position: ['bottomCenter'], showSizeChanger: false }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default DocumentsPage;
