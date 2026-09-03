import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Card, Col, Empty, Row, Space, Tag, Typography, message } from 'antd';
import { CustomerServiceOutlined, MailOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import userApi from '../../api/userApi';

const { Title, Text } = Typography;
const ROLES = ['Bí thư', 'Phó bí thư', 'Chi ủy viên'];

const ContactPage = () => {
  const [contact, setContact] = useState({ dau_moi: [] });

  useEffect(() => {
    userApi.getBranchContact()
      .then((response) => setContact(response.data || { dau_moi: [] }))
      .catch((error) => message.error(error.response?.data?.message || 'Lỗi tải danh bạ Chi ủy'));
  }, []);

  const sorted = useMemo(
    () => [...(contact.dau_moi || [])].sort(
      (a, b) => ROLES.indexOf(a.chuc_vu) - ROLES.indexOf(b.chuc_vu),
    ),
    [contact.dau_moi],
  );

  return (
    <div className="contact-page">
      <div className="contact-page__hero">
        <Title level={2}>
          <CustomerServiceOutlined /> Liên hệ Chi ủy
        </Title>
        <Text>
          Danh bạ Chi ủy của <strong>{contact.ten_chi_bo || 'Chi bộ'}</strong>
        </Text>
      </div>

      <Card
        className="contact-page__directory"
        title={(
          <span className="contact-page__branch-name">
            <TeamOutlined />
            <span>Chi ủy {contact.ten_chi_bo || ''}</span>
          </span>
        )}
      >
        {sorted.length ? (
          <Row gutter={[16, 16]}>
            {sorted.map((person, index) => (
              <Col xs={24} md={12} lg={person.chuc_vu === 'Bí thư' ? 24 : 12} key={`${person.chuc_vu}-${index}`}>
                <Card
                  size="small"
                  className="contact-page__person"
                  style={{ background: person.chuc_vu === 'Bí thư' ? '#fffaf0' : '#fff' }}
                >
                  <Space align="start" size={14}>
                    <Avatar shape="square" size={52} style={{ background: '#a91f23', flexShrink: 0 }}>
                      {person.ho_ten?.[0] || 'C'}
                    </Avatar>
                    <div className="contact-page__person-info">
                      <Tag color={person.chuc_vu === 'Bí thư' ? 'red' : person.chuc_vu === 'Phó bí thư' ? 'gold' : 'blue'}>
                        {person.chuc_vu || 'Chi ủy viên'}
                      </Tag>
                      <Title level={5}>{person.ho_ten}</Title>
                      <Space direction="vertical" size={3}>
                        {person.so_dien_thoai && <a href={`tel:${person.so_dien_thoai}`}><PhoneOutlined /> {person.so_dien_thoai}</a>}
                        {person.email && <a href={`mailto:${person.email}`}><MailOutlined /> {person.email}</a>}
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Chi ủy chưa cập nhật danh bạ" />
        )}
      </Card>
    </div>
  );
};

export default ContactPage;
