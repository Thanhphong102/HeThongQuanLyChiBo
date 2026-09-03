import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Descriptions, Drawer, Form, Input, Modal, Popconfirm, Row, Select, Space, Statistic, Table, Tag, Tooltip, message } from 'antd';
import { CheckOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileDoneOutlined, PlusOutlined, ReloadOutlined, SendOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import axios from '../services/axiosConfig';
import PageHeader from '../components/PageHeader';
import RichTextEditor, { RichTextContent } from '../components/RichTextEditor';

const statusMeta = {
  Nhap: ['default','Nháp'], Dang_mo: ['processing','Đang mở'], Da_dong: ['success','Đã đóng'], Da_huy: ['error','Đã hủy'],
  Chua_xem: ['default','Chưa xem'], Chua_nop: ['warning','Chưa nộp'], Da_nop: ['blue','Đã nộp'], Nop_tre: ['orange','Nộp trễ'], Can_bo_sung: ['volcano','Cần bổ sung'], Da_duyet: ['green','Đã duyệt'], Khong_dat: ['red','Không đạt'],
};
const StatusTag = ({ value }) => <Tag color={statusMeta[value]?.[0]}>{statusMeta[value]?.[1] || value}</Tag>;

const TaskManager = () => {
  const [tasks,setTasks] = useState([]);
  const [members,setMembers] = useState([]);
  const [loading,setLoading] = useState(false);
  const [createOpen,setCreateOpen] = useState(false);
  const [editingTask,setEditingTask] = useState(null);
  const [detail,setDetail] = useState(null);
  const [detailOpen,setDetailOpen] = useState(false);
  const [reviewing,setReviewing] = useState(null);
  const [filter,setFilter] = useState('all');
  const [search,setSearch] = useState('');
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [taskRes,memberRes] = await Promise.all([
        axios.get('/tasks'),
        axios.get('/branch-members', { params: { page: 1, pageSize: 1000 } }),
      ]);
      setTasks(taskRes.data || []);
      const memberRows = Array.isArray(memberRes.data) ? memberRes.data : memberRes.data?.data;
      setMembers((memberRows || []).filter(item => Number(item.cap_quyen) === 3 && item.hoat_dong !== false));
    } catch (error) { message.error(error.response?.data?.message || 'Lỗi tải nhiệm vụ'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => tasks.filter(item => (filter==='all'||item.trang_thai===filter) && item.tieu_de.toLowerCase().includes(search.toLowerCase())),[tasks,filter,search]);
  const stats = { open: tasks.filter(x=>x.trang_thai==='Dang_mo').length, recipients: tasks.reduce((sum,x)=>sum+(x.tong_nguoi_nhan||0),0), done: tasks.reduce((sum,x)=>sum+(x.da_duyet||0),0) };

  const saveTask = async values => {
    try {
      const payload = { ...values, thoi_gian_bat_dau: values.thoi_gian?.[0]?.toISOString(), han_nop: values.thoi_gian?.[1]?.toISOString(), thoi_gian: undefined, recipient_ids: values.assign_all ? [] : values.recipient_ids };
      if (editingTask) {
        await axios.put(`/tasks/${editingTask.ma_nhiem_vu}`,payload);
        message.success('Đã cập nhật nhiệm vụ');
      } else {
        await axios.post('/tasks',payload);
        message.success('Đã tạo và giao nhiệm vụ');
      }
      setCreateOpen(false); setEditingTask(null); form.resetFields(); load();
    } catch (error) { message.error(error.response?.data?.message || 'Lỗi lưu nhiệm vụ'); }
  };
  const openCreate = () => { setEditingTask(null); form.resetFields(); setCreateOpen(true); };
  const openEdit = row => {
    setEditingTask(row);
    form.setFieldsValue({
      tieu_de: row.tieu_de, mo_ta: row.mo_ta, loai_nhiem_vu: row.loai_nhiem_vu,
      thoi_gian: row.thoi_gian_bat_dau || row.han_nop ? [dayjs(row.thoi_gian_bat_dau || new Date()), dayjs(row.han_nop || row.thoi_gian_bat_dau || new Date())] : undefined,
      link_huong_dan: row.link_huong_dan, bat_buoc: row.bat_buoc,
    });
    setCreateOpen(true);
  };
  const openDetail = async id => { try { const res=await axios.get(`/tasks/${id}`); setDetail(res.data); setDetailOpen(true); } catch(error){ message.error(error.response?.data?.message||'Lỗi tải chi tiết'); } };
  const review = async values => { try { await axios.put(`/tasks/recipients/${reviewing.ma_nguoi_nhan}/review`,values); message.success('Đã cập nhật bài nộp'); setReviewing(null); reviewForm.resetFields(); openDetail(detail.task.ma_nhiem_vu); load(); } catch(error){ message.error(error.response?.data?.message||'Lỗi duyệt'); } };
  const setStatus = async (id,status) => { try { await axios.put(`/tasks/${id}/status`,{trang_thai:status}); message.success('Đã cập nhật trạng thái'); load(); } catch(error){ message.error(error.response?.data?.message||'Lỗi cập nhật'); } };
  const remove = async id => { try { await axios.delete(`/tasks/${id}`); message.success('Đã xóa nhiệm vụ'); load(); } catch(error){ message.error(error.response?.data?.message||'Lỗi xóa'); } };
  const remind = async id => { try { const res=await axios.post(`/tasks/${id}/remind`); message.success(res.data.message); } catch(error){ message.error(error.response?.data?.message||'Lỗi gửi nhắc'); } };
  const exportExcel = () => {
    if (!detail) return;
    const rows = detail.recipients.map(x=>({'Họ tên':x.ho_ten,'MSSV':x.ma_so_sinh_vien||'','Trạng thái':statusMeta[x.trang_thai]?.[1]||x.trang_thai,'Ngày nộp':x.ngay_nop?dayjs(x.ngay_nop).format('DD/MM/YYYY HH:mm'):'','Điểm':x.diem_so??'','Kết quả':x.ket_qua||''}));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [{wch:28},{wch:16},{wch:18},{wch:20},{wch:10},{wch:36}];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,sheet,'Tiến độ');
    XLSX.writeFile(workbook,`bao-cao-nhiem-vu-${detail.task.ma_nhiem_vu}.xlsx`);
  };

  const columns = [
    {title:'Nhiệm vụ',dataIndex:'tieu_de',render:(text,row)=><div><b>{text}</b><div style={{fontSize:12,color:'#8c8c8c'}}>{row.loai_nhiem_vu?.replaceAll('_',' ')} · hạn {row.han_nop?dayjs(row.han_nop).format('DD/MM/YYYY HH:mm'):'Không giới hạn'}</div></div>},
    {title:'Trạng thái',dataIndex:'trang_thai',width:110,render:value=><StatusTag value={value}/>},
    {title:'Tiến độ',width:165,render:(_,row)=><span><b>{row.da_nop||0}</b>/{row.tong_nguoi_nhan||0} đã nộp · <b>{row.da_duyet||0}</b> duyệt</span>},
    {title:'Thao tác',width:270,render:(_,row)=><Space wrap><Tooltip title="Chi tiết"><Button icon={<EyeOutlined/>} onClick={()=>openDetail(row.ma_nhiem_vu)}/></Tooltip><Tooltip title="Sửa nhiệm vụ"><Button icon={<EditOutlined/>} onClick={()=>openEdit(row)}/></Tooltip><Tooltip title="Nhắc chưa nộp"><Button icon={<SendOutlined/>} onClick={()=>remind(row.ma_nhiem_vu)}/></Tooltip>{row.trang_thai==='Dang_mo'?<Button onClick={()=>setStatus(row.ma_nhiem_vu,'Da_dong')}>Đóng</Button>:<Button onClick={()=>setStatus(row.ma_nhiem_vu,'Dang_mo')}>Mở</Button>}<Popconfirm title="Xóa nhiệm vụ?" onConfirm={()=>remove(row.ma_nhiem_vu)}><Button danger icon={<DeleteOutlined/>}/></Popconfirm></Space>},
  ];
  const recipientColumns = [
    {title:'Đảng viên',dataIndex:'ho_ten',render:(text,row)=><div><b>{text}</b><div style={{fontSize:12,color:'#8c8c8c'}}>{row.ma_so_sinh_vien||row.email}</div></div>},
    {title:'Trạng thái',dataIndex:'trang_thai',render:value=><StatusTag value={value}/>},
    {title:'Minh chứng',render:(_,row)=><Space direction="vertical" size={2}>{(row.minh_chung||[]).map(file=><a key={file.ma_minh_chung} href={file.file_url} target="_blank" rel="noreferrer">{file.ten_file}</a>)}{!row.minh_chung?.length&&'—'}</Space>},
    {title:'Thao tác',width:110,render:(_,row)=><Button disabled={!['Da_nop','Nop_tre','Can_bo_sung'].includes(row.trang_thai)} onClick={()=>{setReviewing(row);reviewForm.setFieldsValue({trang_thai:'Da_duyet',diem_so:row.diem_so,phan_hoi_chi_uy:row.phan_hoi_chi_uy})}}>Duyệt</Button>},
  ];

  return <div style={{fontFamily:'Be Vietnam Pro, sans-serif'}}>
    <PageHeader icon={<FileDoneOutlined/>} title="Nhiệm vụ & Minh chứng" subtitle="Giao nhiệm vụ, theo dõi tiến độ và tổng hợp minh chứng của Đảng viên"/>
    <Row gutter={[16,16]} style={{marginBottom:18}}><Col xs={24} md={8}><Card><Statistic title="Nhiệm vụ đang mở" value={stats.open} prefix={<ClockCircleOutlined/>}/></Card></Col><Col xs={24} md={8}><Card><Statistic title="Lượt được giao" value={stats.recipients} prefix={<TeamOutlined/>}/></Card></Col><Col xs={24} md={8}><Card><Statistic title="Đã duyệt" value={stats.done} prefix={<CheckOutlined/>}/></Card></Col></Row>
    <Card style={{borderRadius:16,boxShadow:'0 2px 16px rgba(0,0,0,.07)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:18}}><Space wrap><Input.Search placeholder="Tìm nhiệm vụ..." allowClear onChange={e=>setSearch(e.target.value)} style={{width:240}}/><Select value={filter} onChange={setFilter} style={{width:145}} options={[{value:'all',label:'Tất cả'},{value:'Nhap',label:'Nháp'},{value:'Dang_mo',label:'Đang mở'},{value:'Da_dong',label:'Đã đóng'},{value:'Da_huy',label:'Đã hủy'}]}/><Button icon={<ReloadOutlined/>} onClick={load}/></Space><Button type="primary" icon={<PlusOutlined/>} onClick={openCreate}>Giao nhiệm vụ</Button></div>
      <Table rowKey="ma_nhiem_vu" loading={loading} dataSource={filtered} columns={columns} scroll={{x:850}}/>
    </Card>

    <Modal title={editingTask?'Sửa nhiệm vụ':'Giao nhiệm vụ mới'} open={createOpen} onCancel={()=>{setCreateOpen(false);setEditingTask(null);form.resetFields();}} footer={null} width={680}><Form form={form} layout="vertical" onFinish={saveTask} initialValues={{loai_nhiem_vu:'Khac',bat_buoc:true,trang_thai:'Dang_mo',assign_all:true}}><Form.Item name="tieu_de" label="Tiêu đề" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="mo_ta" label="Mô tả/Hướng dẫn"><RichTextEditor minHeight={150}/></Form.Item><Row gutter={12}><Col span={12}><Form.Item name="loai_nhiem_vu" label="Loại"><Select options={[['Cuoc_thi','Cuộc thi'],['Hoc_tap','Học tập'],['Bao_cao','Báo cáo'],['Phong_trao','Phong trào'],['Khac','Khác']].map(([value,label])=>({value,label}))}/></Form.Item></Col><Col span={12}><Form.Item name="thoi_gian" label="Thời gian"><DatePicker.RangePicker showTime style={{width:'100%'}}/></Form.Item></Col></Row><Form.Item name="link_huong_dan" label="Link hướng dẫn"><Input/></Form.Item>{!editingTask&&<><Form.Item name="assign_all" label="Đối tượng"><Select options={[{value:true,label:'Toàn bộ Đảng viên'},{value:false,label:'Chọn Đảng viên'}]}/></Form.Item><Form.Item noStyle shouldUpdate={(a,b)=>a.assign_all!==b.assign_all}>{({getFieldValue})=>!getFieldValue('assign_all')&&<Form.Item name="recipient_ids" label="Đảng viên nhận" rules={[{required:true}]}><Select mode="multiple" showSearch optionFilterProp="label" options={members.map(x=>({value:x.ma_dang_vien,label:`${x.ho_ten}${x.ma_so_sinh_vien?` · ${x.ma_so_sinh_vien}`:''}`}))}/></Form.Item>}</Form.Item></>}<Button type="primary" htmlType="submit" block size="large">{editingTask?'Lưu thay đổi':'Tạo và giao nhiệm vụ'}</Button></Form></Modal>
    <Drawer title={detail?.task?.tieu_de} open={detailOpen} onClose={()=>setDetailOpen(false)} width={900} extra={<Button onClick={exportExcel}>Xuất Excel</Button>}>{detail&&<><Descriptions bordered size="small" column={2} style={{marginBottom:18}}><Descriptions.Item label="Loại">{detail.task.loai_nhiem_vu?.replaceAll('_',' ')}</Descriptions.Item><Descriptions.Item label="Trạng thái"><StatusTag value={detail.task.trang_thai}/></Descriptions.Item><Descriptions.Item label="Hạn nộp">{detail.task.han_nop?dayjs(detail.task.han_nop).format('DD/MM/YYYY HH:mm'):'Không giới hạn'}</Descriptions.Item><Descriptions.Item label="Tổng người nhận">{detail.recipients.length}</Descriptions.Item><Descriptions.Item label="Mô tả" span={2}>{detail.task.mo_ta?<RichTextContent html={detail.task.mo_ta}/>:'—'}</Descriptions.Item></Descriptions><Table rowKey="ma_nguoi_nhan" dataSource={detail.recipients} columns={recipientColumns} scroll={{x:700}}/></>}</Drawer>
    <Modal title={`Duyệt bài nộp · ${reviewing?.ho_ten||''}`} open={Boolean(reviewing)} onCancel={()=>setReviewing(null)} footer={null}><Form form={reviewForm} layout="vertical" onFinish={review}><Form.Item name="trang_thai" label="Kết quả" rules={[{required:true}]}><Select options={[{value:'Da_duyet',label:'Đã duyệt'},{value:'Can_bo_sung',label:'Cần bổ sung'},{value:'Khong_dat',label:'Không đạt'}]}/></Form.Item><Form.Item name="diem_so" label="Điểm/Kết quả số"><Input type="number"/></Form.Item><Form.Item name="phan_hoi_chi_uy" label="Phản hồi"><RichTextEditor minHeight={110}/></Form.Item><Button type="primary" htmlType="submit" block>Lưu kết quả</Button></Form></Modal>
  </div>;
};
export default TaskManager;
