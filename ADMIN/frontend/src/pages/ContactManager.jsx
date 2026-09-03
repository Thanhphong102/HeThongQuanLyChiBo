import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Select, Space, Switch, message } from 'antd';
import { CustomerServiceOutlined, PlusOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';
import PageHeader from '../components/PageHeader';
import './ContactManager.css';

const ROLES = ['Bí thư', 'Phó bí thư', 'Chi ủy viên'];
const defaultContacts = ROLES.map(chuc_vu => ({ chuc_vu }));

const ContactManager = () => {
  const [form] = Form.useForm();
  const [branchName, setBranchName] = useState('Chi bộ');
  const load = async () => {
    try {
      const { data } = await axios.get('/support/contact');
      setBranchName(data.ten_chi_bo || 'Chi bộ');
      form.setFieldsValue({
        dau_moi: data.dau_moi?.length ? data.dau_moi : defaultContacts,
        cong_khai: data.cong_khai !== false,
      });
    } catch (error) { message.error(error.response?.data?.message || 'Lỗi tải danh bạ Chi ủy'); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async values => {
    try { await axios.put('/support/contact', values); message.success('Đã cập nhật danh bạ Chi ủy'); load(); }
    catch (error) { message.error(error.response?.data?.message || 'Lỗi cập nhật danh bạ'); }
  };
  return <div style={{fontFamily:'Be Vietnam Pro, sans-serif'}}>
    <PageHeader icon={<CustomerServiceOutlined/>} title="Quản lý Liên hệ" subtitle="Cập nhật danh bạ Bí thư, Phó bí thư và Chi ủy viên"/>
    <Card className="contact-directory-card">
      <div className="contact-branch-banner"><div className="contact-branch-icon"><TeamOutlined/></div><div><span>Danh bạ Chi ủy</span><h3>{branchName}</h3></div></div>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.List name="dau_moi">{(fields,{add,remove})=><>
          <div className="contact-list-heading"><div><b>Thành viên Chi ủy</b><small>Thông tin được hiển thị tại cổng Đảng viên</small></div><Button icon={<PlusOutlined/>} onClick={()=>add({chuc_vu:'Chi ủy viên'})}>Thêm thành viên</Button></div>
          <Row gutter={[0,12]}>{fields.map(({key,name,...rest},index)=><Col span={24} key={key}>
            <Card size="small" className="contact-member-row" extra={<Button danger type="text" onClick={()=>remove(name)}>Xóa</Button>} title={<span className="contact-member-index">{String(index+1).padStart(2,'0')}</span>}>
              <Row gutter={[12,0]} align="bottom">
                <Col xs={24} md={6} xl={5}><Form.Item {...rest} name={[name,'chuc_vu']} label="Chức vụ" rules={[{required:true}]}><Select options={ROLES.map(value=>({value,label:value}))}/></Form.Item></Col>
                <Col xs={24} md={18} xl={7}><Form.Item {...rest} name={[name,'ho_ten']} label="Họ và tên" rules={[{required:true,message:'Nhập họ tên'}]}><Input placeholder="Nhập họ và tên"/></Form.Item></Col>
                <Col xs={24} md={12} xl={5}><Form.Item {...rest} name={[name,'so_dien_thoai']} label="Điện thoại"><Input placeholder="Số điện thoại"/></Form.Item></Col>
                <Col xs={24} md={12} xl={7}><Form.Item {...rest} name={[name,'email']} label="Email"><Input placeholder="Email"/></Form.Item></Col>
              </Row>
            </Card>
          </Col>)}</Row>
        </>}</Form.List>
        <div className="contact-form-actions"><div><Form.Item name="cong_khai" valuePropName="checked" style={{margin:0}}><Switch/> <span className="contact-public-label">Hiển thị danh bạ cho Đảng viên</span></Form.Item><small>Chỉ công khai các thông tin thành viên ở trên</small></div><Button type="primary" htmlType="submit" icon={<SaveOutlined/>} size="large">Lưu danh bạ</Button></div>
      </Form>
    </Card>
  </div>;
};
export default ContactManager;
