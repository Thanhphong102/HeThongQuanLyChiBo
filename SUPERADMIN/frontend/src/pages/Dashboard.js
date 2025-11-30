// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { UsergroupAddOutlined, BankOutlined, DollarCircleOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalBranches: 0, totalFund: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Lỗi lấy thống kê:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2>Tổng quan</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Tổng số Chi bộ" 
              value={stats.totalBranches} 
              prefix={<BankOutlined />} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Tổng số Đảng viên" 
              value={stats.totalUsers} 
              prefix={<UsergroupAddOutlined />} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Tổng Quỹ Đảng (VNĐ)" 
              value={stats.totalFund} 
              prefix={<DollarCircleOutlined />} 
              groupSeparator="."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;