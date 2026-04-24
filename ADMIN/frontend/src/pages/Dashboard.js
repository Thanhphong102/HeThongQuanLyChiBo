import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Spin, Space, Empty } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from '../services/axiosConfig';

const { Title, Text } = Typography;

// ──────────────────────────────────────────────
//  Design Tokens (theo ADMIN_CONTEXT.md)
// ──────────────────────────────────────────────
const COLOR_RED = '#CE1126';
const COLOR_GREEN = '#22c55e';
const COLOR_BLUE = '#3b82f6';
const COLOR_PURPLE = '#8b5cf6';
const COLOR_GOLD = '#f59e0b';

// Màu cho Donut Giới tính
const GENDER_COLORS = { Nam: '#3b82f6', Nữ: '#f472b6', Other: '#a3e635' };
const GENDER_FALLBACK_COLORS = ['#3b82f6', '#f472b6', '#a3e635'];

// Màu gradient Bar chart
const BAR_COLORS = [
  '#CE1126', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#22c55e', '#06b6d4', '#f97316', '#ec4899',
  '#10b981', '#6366f1',
];

// Format tiền VNĐ
const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// ──────────────────────────────────────────────
//  Custom Label Donut
// ──────────────────────────────────────────────
const renderCustomDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ──────────────────────────────────────────────
//  Card Thống kê (dùng lại)
// ──────────────────────────────────────────────
const StatCard = ({ icon, title, value, suffix, color, sub, isMoney }) => (
  <Card
    variant="borderless"
    style={{
      borderRadius: 16,
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      borderTop: `4px solid ${color}`,
      height: '100%',
    }}
    styles={{ body: { padding: '20px 24px' } }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {React.cloneElement(icon, { style: { fontSize: 22, color } })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: '#6b7280', fontFamily: 'Be Vietnam Pro, sans-serif',
          marginBottom: 4,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: isMoney ? 18 : (typeof value === 'string' && value.length > 5 ? 16 : 24), fontWeight: 700, color: '#111827',
          fontFamily: 'Be Vietnam Pro, sans-serif',
          lineHeight: 1.2,
          wordBreak: 'break-word',
        }}>
          {isMoney ? formatVND(value) : value}
          {suffix && <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4 }}>{suffix}</span>}
        </div>
        {sub && (
          <div style={{ marginTop: 4, fontSize: 11, color: '#9ca3af', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  </Card>
);

// ──────────────────────────────────────────────
//  Dashboard Component
// ──────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/branch-admin/dashboard-stats');
        setStats(res.data);
      } catch (error) {
        console.error('Lỗi tải dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{
          marginTop: 12, color: '#6b7280',
          fontFamily: 'Be Vietnam Pro, sans-serif',
        }}>
          Đang tải dữ liệu tổng quan...
        </div>
      </div>
    );
  }

  // Safe defaults
  const safeStats = stats || {
    totalMembers: 0,
    officialMembers: 0,
    reserveMembers: 0,
    nextMeeting: null,
    tongQuy: 0,
    tongThu: 0,
    tongChi: 0,
    recentDocs: [],
    genderStats: [],
    hometownStats: [],
    ageStats: {},
  };

  // ── Dữ liệu Donut Giới tính ──
  const genderData = (safeStats.genderStats || []).map((row) => ({
    name: row.gioi_tinh,
    value: parseInt(row.so_luong),
  }));

  // ── Dữ liệu Donut Tỷ lệ Chính thức / Dự bị ──
  const memberStatusData = [
    { name: 'Chính thức', value: safeStats.officialMembers || 0 },
    { name: 'Dự bị', value: safeStats.reserveMembers || 0 },
  ].filter(d => d.value > 0);

  // ── Dữ liệu Bar Quê quán ──
  const hometownData = (safeStats.hometownStats || []).map((row) => ({
    name: row.que_quan,
    'Đảng viên': parseInt(row.so_luong),
  }));

  // ── Dữ liệu Bar Phân bố độ tuổi ──
  const ageData = [
    { name: 'Dưới 22', 'Đảng viên': parseInt(safeStats.ageStats?.duoi_22) || 0 },
    { name: '22 - 25', 'Đảng viên': parseInt(safeStats.ageStats?.t22_25) || 0 },
    { name: '26 - 30', 'Đảng viên': parseInt(safeStats.ageStats?.t26_30) || 0 },
    { name: 'Trên 30', 'Đảng viên': parseInt(safeStats.ageStats?.tren_30) || 0 },
    { name: 'Chưa CN', 'Đảng viên': parseInt(safeStats.ageStats?.chua_cap_nhat) || 0 },
  ];

  return (
    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      {/* ── TIÊU ĐỀ TRANG ── */}
      <div style={{ marginBottom: 28 }}>
        <Title
          level={3}
          style={{
            margin: 0,
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Tổng quan Tình hình Chi bộ
        </Title>
        <Text style={{ color: '#6b7280', fontSize: 14 }}>
          Cập nhật thời gian thực · Chi bộ của bạn
        </Text>
      </div>

      {/* ── HÀNG 1: 4 THẺ THỐNG KÊ ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<UserOutlined />}
            title="Tổng số Đảng viên"
            value={safeStats.totalMembers}
            suffix="đv"
            color={COLOR_GREEN}
            sub="Nhân sự hiện tại của chi bộ"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<TeamOutlined />}
            title="Đảng viên Chính thức"
            value={safeStats.officialMembers}
            suffix="đv"
            color={COLOR_BLUE}
            sub={`Dự bị: ${safeStats.reserveMembers} đồng chí`}
          />
        </Col>

        {/* [ĐÃ THAY] Card Tổng quỹ Chi bộ */}
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<BankOutlined />}
            title="Tổng quỹ Chi bộ"
            value={safeStats.tongQuy}
            color={COLOR_RED}
            isMoney={true}
            sub={`Thu: ${formatVND(safeStats.tongThu)} · Chi: ${formatVND(safeStats.tongChi)}`}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CalendarOutlined />}
            title="Họp Chi bộ sắp tới"
            value={
              safeStats.nextMeeting
                ? new Date(safeStats.nextMeeting.thoi_gian).toLocaleDateString('vi-VN')
                : '—'
            }
            color={COLOR_PURPLE}
            sub={safeStats.nextMeeting?.dia_diem || 'Chưa có lịch họp mới'}
          />
        </Col>
      </Row>

      <div style={{ height: 24 }} />

      {/* ── HÀNG 2: 2 DONUT CHART ── */}
      <Row gutter={[16, 16]}>
        {/* Donut Chart: Giới tính */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
                🧑‍🤝‍🧑 Cơ cấu Giới tính
              </span>
            }
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', height: '100%' }}
          >
            {genderData.length === 0 ? (
              <Empty description="Chưa có dữ liệu giới tính" style={{ paddingTop: 40 }} />
            ) : (
              <div style={{ height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomDonutLabel}
                    >
                      {genderData.map((entry, index) => (
                        <Cell
                          key={`gender-${index}`}
                          fill={GENDER_COLORS[entry.name] || GENDER_FALLBACK_COLORS[index % GENDER_FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name) => [`${value} đảng viên`, name]}
                      contentStyle={{ borderRadius: 10, fontFamily: 'Be Vietnam Pro, sans-serif' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* Donut Chart: Tỷ lệ Chính thức / Dự bị */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
                🏅 Tỷ lệ Đảng viên
              </span>
            }
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', height: '100%' }}
          >
            {memberStatusData.length === 0 ? (
              <Empty description="Chưa có dữ liệu" style={{ paddingTop: 40 }} />
            ) : (
              <div style={{ height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memberStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomDonutLabel}
                    >
                      {memberStatusData.map((entry, index) => (
                        <Cell
                          key={`status-${index}`}
                          fill={entry.name === 'Chính thức' ? COLOR_BLUE : COLOR_GOLD}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name) => [`${value} đảng viên`, name]}
                      contentStyle={{ borderRadius: 10, fontFamily: 'Be Vietnam Pro, sans-serif' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

      </Row>

      <div style={{ height: 24 }} />

      {/* ── HÀNG 3: QUÊ QUÁN (full width) ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
                🗺️ Đảng viên theo Quê quán
              </span>
            }
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
          >
            {hometownData.length === 0 ? (
              <Empty description="Chưa có dữ liệu quê quán" style={{ paddingTop: 40 }} />
            ) : (
              <div style={{ height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hometownData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fontFamily: 'Be Vietnam Pro, sans-serif', fill: '#6b7280' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fontFamily: 'Be Vietnam Pro, sans-serif', fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value) => [`${value} đảng viên`, 'Số lượng']}
                      contentStyle={{ borderRadius: 10, fontFamily: 'Be Vietnam Pro, sans-serif' }}
                    />
                    <Bar dataKey="Đảng viên" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {hometownData.map((_, index) => (
                        <Cell key={`bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <div style={{ height: 24 }} />

      {/* ── HÀNG 4: PHÂN BỐ ĐỘ TUỔI (full width) ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
                🎂 Phân bố Độ tuổi Đảng viên
              </span>
            }
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
          >
            {ageData.length === 0 ? (
              <Empty description="Chưa có dữ liệu" style={{ paddingTop: 40 }} />
            ) : (
              <div style={{ height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 13, fontFamily: 'Be Vietnam Pro, sans-serif', fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fontFamily: 'Be Vietnam Pro, sans-serif', fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value) => [`${value} đảng viên`, 'Số lượng']}
                      contentStyle={{ borderRadius: 10, fontFamily: 'Be Vietnam Pro, sans-serif' }}
                    />
                    <Bar dataKey="Đảng viên" fill={COLOR_PURPLE} radius={[8, 8, 0, 0]} maxBarSize={80} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <div style={{ height: 24 }} />

      {/* ── HÀNG 3: VĂN BẢN MỚI NHẤT ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title={
              <span style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontWeight: 600 }}>
                📄 Văn bản &amp; Thông báo Mới nhất
              </span>
            }
            variant="borderless"
            extra={
              <a href="#" style={{ color: COLOR_RED, fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13 }}>
                Xem tất cả <ArrowRightOutlined />
              </a>
            }
            style={{ borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
          >
            {safeStats.recentDocs.length === 0 ? (
              <Empty description="Chưa có văn bản nào" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={safeStats.recentDocs}
                renderItem={(item) => (
                  <List.Item
                    style={{ padding: '12px 4px', borderBottom: '1px solid #f3f4f6' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: '#fef2f2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <FileTextOutlined style={{ fontSize: 18, color: COLOR_RED }} />
                        </div>
                      }
                      title={
                        <a
                          href={item.duong_dan}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontWeight: 600, color: '#111827',
                            fontFamily: 'Be Vietnam Pro, sans-serif',
                            fontSize: 14,
                          }}
                        >
                          {item.ten_tai_lieu}
                        </a>
                      }
                      description={
                        <Space size="small">
                          <Tag color="red" style={{ borderRadius: 6 }}>{item.loai_tai_lieu || 'Tài liệu'}</Tag>
                          <Text type="secondary" style={{ fontSize: 12, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                            {new Date(item.ngay_tai_len).toLocaleDateString('vi-VN')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;