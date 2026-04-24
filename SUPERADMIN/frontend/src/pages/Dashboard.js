// src/pages/Dashboard.js
import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Skeleton, Select, Statistic, Tag } from 'antd';
import { Users, Landmark, Wallet, UserCheck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, Sector
} from 'recharts';
import axios from '../services/axiosConfig';

const COLORS_BAR  = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
const COLORS_GENDER = ['#3b82f6', '#ec4899'];
const COLORS_STATUS = ['#10b981', '#f59e0b'];
const COLORS_AGE    = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#9ca3af'];

// Custom label bên trong Pie
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fontFamily="Be Vietnam Pro">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom XAxis tick với xuống dòng
const CustomXAxisTick = ({ x, y, payload }) => {
  const text = payload.value;
  const words = text.split(" ");
  let line = "";
  const lines = [];
  words.forEach(word => {
    if ((line + word).length > 18) { lines.push(line); line = word; }
    else { line += (line === "" ? "" : " ") + word; }
  });
  if (line) lines.push(line);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={11} fontFamily="Be Vietnam Pro">
        {lines.map((l, i) => <tspan x={0} dy={i === 0 ? 0 : 14} key={i}>{l}</tspan>)}
      </text>
    </g>
  );
};

const cardStyle = {
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  border: '1px solid #f0f0f0',
  height: '100%',
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalBranches: 0, totalFund: 0, totalChinhThuc: 0, totalDuBi: 0 });
  const [chart1, setChart1] = useState([]);
  const [chart2, setChart2] = useState([]);
  const [chart3, setChart3] = useState([]);
  const [chart4, setChart4] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/dashboard/stats');
        const d = res.data;
        setStats({
          totalUsers: d.totalUsers || 0,
          totalBranches: d.totalBranches || 0,
          totalFund: d.totalFund || 0,
          totalChinhThuc: d.totalChinhThuc || 0,
          totalDuBi: d.totalDuBi || 0,
        });
        setChart1(d.chart1 || []);
        setChart2(d.chart2 || []);
        setChart3(d.chart3 || []);
        setChart4(d.chart4 || []);
        setBranchList(d.branchList || []);
      } catch (error) {
        console.error('Lỗi lấy thống kê:', error);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    };
    fetchStats();
  }, []);

  // Tổng hợp dữ liệu chart 2 (giới tính) theo bộ lọc
  const genderData = useMemo(() => {
    const rows = selectedBranch === 'all' ? chart2 : chart2.filter(r => r.branch_id === selectedBranch);
    const total = rows.reduce((acc, r) => ({ nam: acc.nam + r.nam, nu: acc.nu + r.nu }), { nam: 0, nu: 0 });
    return [
      { name: 'Nam', value: total.nam },
      { name: 'Nữ', value: total.nu },
    ].filter(d => d.value > 0);
  }, [chart2, selectedBranch]);

  // Tổng hợp dữ liệu chart 3 (chính thức/dự bị) theo bộ lọc
  const statusData = useMemo(() => {
    const rows = selectedBranch === 'all' ? chart3 : chart3.filter(r => r.branch_id === selectedBranch);
    const total = rows.reduce((acc, r) => ({ ct: acc.ct + r.chinh_thuc, db: acc.db + r.du_bi }), { ct: 0, db: 0 });
    return [
      { name: 'Chính thức', value: total.ct },
      { name: 'Dự bị', value: total.db },
    ].filter(d => d.value > 0);
  }, [chart3, selectedBranch]);

  // Dữ liệu chart 4 (độ tuổi) theo bộ lọc
  const ageData = useMemo(() => {
    const rows = selectedBranch === 'all' ? chart4 : chart4.filter(r => r.branch_id === selectedBranch);
    const agg = rows.reduce(
      (acc, r) => ({
        duoi_22: acc.duoi_22 + r.duoi_22,
        t22_25: acc.t22_25 + r.t22_25,
        t26_30: acc.t26_30 + r.t26_30,
        tren_30: acc.tren_30 + r.tren_30,
        chua_cap_nhat: acc.chua_cap_nhat + r.chua_cap_nhat,
      }),
      { duoi_22: 0, t22_25: 0, t26_30: 0, tren_30: 0, chua_cap_nhat: 0 }
    );
    return [
      { name: 'Dưới 22', value: agg.duoi_22 },
      { name: '22 – 25', value: agg.t22_25 },
      { name: '26 – 30', value: agg.t26_30 },
      { name: 'Trên 30', value: agg.tren_30 },
      { name: 'Chưa cập nhật', value: agg.chua_cap_nhat },
    ].filter(d => d.value > 0);
  }, [chart4, selectedBranch]);

  const metricTitleStyle = { fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' };
  const metricValueStyle = { fontSize: '28px', fontWeight: '700', marginTop: '10px', color: '#1f2937' };

  const selectedBranchName = branchList.find(b => b.id === selectedBranch)?.name || 'Tất cả Chi bộ';

  return (
    <div style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Tổng quan Đảng ủy</h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Theo dõi các chỉ số quan trọng của Đảng ủy Trường</p>
        </div>
        <Select
          value={selectedBranch}
          onChange={setSelectedBranch}
          style={{ minWidth: 220, height: 40 }}
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { minWidth: 280 } } }}
        >
          <Select.Option value="all">📊 Tất cả Chi bộ</Select.Option>
          {branchList.map(b => <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>)}
        </Select>
      </div>

      {/* ===== METRIC CARDS ===== */}
      <Row gutter={[20, 20]}>
        {[
          { icon: <Landmark size={20} />, label: 'Tổng số Chi bộ', value: stats.totalBranches, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { icon: <Users size={20} />, label: 'Tổng số Đảng viên', value: stats.totalUsers, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { icon: <UserCheck size={20} />, label: 'Đảng viên Chính thức', value: stats.totalChinhThuc, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { icon: <Clock size={20} />, label: 'Đảng viên Dự bị', value: stats.totalDuBi, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { icon: <Wallet size={20} />, label: 'Tổng Quỹ Đảng', value: null, fund: stats.totalFund, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map((m, i) => (
          <Col xs={24} sm={12} lg={i < 4 ? 6 : 24} key={i}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
              <Card style={cardStyle} styles={{ body: { padding: '22px' } }} variant="borderless">
                <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                  <div style={metricTitleStyle}>
                    <div style={{ padding: '8px', background: m.bg, borderRadius: '8px', color: m.color }}>{m.icon}</div>
                    {m.label}
                  </div>
                  <div style={metricValueStyle}>
                    {m.fund !== undefined 
                      ? <>{new Intl.NumberFormat('vi-VN').format(m.fund)} <span style={{ fontSize: 15, fontWeight: 500, color: '#6b7280' }}>VNĐ</span></>
                      : m.value
                    }
                  </div>
                </Skeleton>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* ===== CHART 1: SỐ ĐẢNG VIÊN THEO CHI BỘ ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} style={{ marginTop: 24 }}>
        <Card 
          style={{ ...cardStyle }}
          title={<span style={{ fontSize: 17, fontWeight: 600 }}>📊 Số Đảng viên theo Chi bộ</span>}
          variant="borderless"
        >
          <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
            {!loading && chart1.length > 0 ? (
              <div style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart1} margin={{ top: 16, right: 24, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={<CustomXAxisTick />} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13, fontFamily: 'Be Vietnam Pro' }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Be Vietnam Pro' }} />
                    <Bar dataKey="value" name="Đảng viên" radius={[7, 7, 0, 0]} barSize={42}>
                      {chart1.map((_, index) => <Cell key={index} fill={COLORS_BAR[index % COLORS_BAR.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : !loading && <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Không có dữ liệu</div>}
          </Skeleton>
        </Card>
      </motion.div>

      {/* ===== CHART 2 + 3: PIE CHARTS (Giới tính & Trạng thái) ===== */}
      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        {/* Chart 2: Giới tính */}
        <Col xs={24} md={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
            <Card
              style={cardStyle}
              title={
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span style={{ fontSize: 16, fontWeight: 600 }}>👨‍👩‍ Tỷ lệ Giới tính</span>
                  <Tag color="blue" style={{ fontWeight: 500, fontSize: 12 }}>{selectedBranchName}</Tag>
                </div>
              }
              variant="borderless"
            >
              <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                {!loading && genderData.length > 0 ? (
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" labelLine={false} label={renderCustomLabel}>
                          {genderData.map((_, i) => <Cell key={i} fill={COLORS_GENDER[i % COLORS_GENDER.length]} />)}
                        </Pie>
                        <Legend iconType="circle" wrapperStyle={{ fontFamily: 'Be Vietnam Pro', fontSize: 13 }} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Be Vietnam Pro' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : !loading && <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 40 }}>🔍</span>
                  <span>Không có dữ liệu giới tính</span>
                </div>}
              </Skeleton>
            </Card>
          </motion.div>
        </Col>

        {/* Chart 3: Trạng thái đảng viên */}
        <Col xs={24} md={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
            <Card
              style={cardStyle}
              title={
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span style={{ fontSize: 16, fontWeight: 600 }}>🏅 Chính thức & Dự bị</span>
                  <Tag color="green" style={{ fontWeight: 500, fontSize: 12 }}>{selectedBranchName}</Tag>
                </div>
              }
              variant="borderless"
            >
              <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                {!loading && statusData.length > 0 ? (
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" labelLine={false} label={renderCustomLabel}>
                          {statusData.map((_, i) => <Cell key={i} fill={COLORS_STATUS[i % COLORS_STATUS.length]} />)}
                        </Pie>
                        <Legend iconType="circle" wrapperStyle={{ fontFamily: 'Be Vietnam Pro', fontSize: 13 }} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Be Vietnam Pro' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : !loading && <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 40 }}>🔍</span>
                  <span>Không có dữ liệu trạng thái</span>
                </div>}
              </Skeleton>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* ===== CHART 4: PHÂN BỐ ĐỘ TUỔI ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }} style={{ marginTop: 20, paddingBottom: 32 }}>
        <Card
          style={cardStyle}
          title={
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span style={{ fontSize: 17, fontWeight: 600 }}>📅 Phân bố Độ tuổi Đảng viên</span>
              <Tag color="purple" style={{ fontWeight: 500, fontSize: 12 }}>{selectedBranchName}</Tag>
            </div>
          }
          variant="borderless"
        >
          <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
            {!loading && ageData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 16, right: 24, left: 0, bottom: 10 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'Be Vietnam Pro' }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontFamily: 'Be Vietnam Pro' }} width={110} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Be Vietnam Pro' }} />
                    <Bar dataKey="value" name="Đảng viên" radius={[0, 7, 7, 0]} barSize={28}>
                      {ageData.map((_, i) => <Cell key={i} fill={COLORS_AGE[i % COLORS_AGE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : !loading && <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 40 }}>📭</span>
              <span>Chưa có dữ liệu ngày sinh để thống kê độ tuổi</span>
            </div>}
          </Skeleton>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;