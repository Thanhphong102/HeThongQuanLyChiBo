import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Descriptions, Button, List, Tag, Spin, Space, Upload, message, Modal, Input, Select, Popconfirm } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import transferApi from '../../api/transferApi';
import TransferTimeline from './TransferTimeline';

const { Title, Text } = Typography;

const TransferRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ loai_chuyen: '', noi_chuyen_den: '' });

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await transferApi.getRequestDetail(id);
      setData(res.data);
    } catch (error) {
      console.error(error);
      message.error('Không thể tải dữ liệu chi tiết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const getStatusTag = (status) => {
    switch (status) {
      case 'Da_Gui': return <Tag color="blue">Đã gửi</Tag>;
      case 'Dang_Tham_Dinh': return <Tag color="orange">Đang thẩm định</Tag>;
      case 'Can_Bo_Sung': return <Tag color="red">Cần bổ sung</Tag>;
      case 'Cho_Ky_Giay': return <Tag color="cyan">Chờ ký giấy</Tag>;
      case 'Hoan_Tat': return <Tag color="green">Hoàn tất</Tag>;
      case 'Da_Huy': return <Tag color="default">Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleAddDocuments = async () => {
    if (fileList.length === 0) return message.warning('Vui lòng chọn file');
    setUploading(true);
    try {
      const documents = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i].originFileObj;
        const base64 = await getBase64(file);
        documents.push({
          ten_tai_lieu: file.name,
          file_url: base64
        });
      }
      
      await transferApi.addDocuments(id, { documents });
      message.success('Đã nộp bổ sung hồ sơ');
      setFileList([]);
      fetchDetail(); // Reload
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi nộp bổ sung hồ sơ');
    } finally {
      setUploading(false);
    }
  };

  const handleEditRequest = async () => {
    try {
      await transferApi.updateRequest(id, editData);
      message.success('Cập nhật thông tin thành công');
      setIsEditing(false);
      fetchDetail();
    } catch (error) {
      console.error(error);
      message.error('Lỗi cập nhật thông tin');
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await transferApi.deleteDocument(id, docId);
      message.success('Đã xóa tài liệu');
      fetchDetail();
    } catch (error) {
      console.error(error);
      message.error('Lỗi xóa tài liệu');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data) return <div>Không tìm thấy dữ liệu</div>;

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
      </Space>

      <Row gutter={[24, 24]}>
        {/* Left Col: Info & Docs */}
        <Col xs={24} md={14}>
          <Card 
            title={<Title level={4} style={{ margin: 0 }}>Chi tiết yêu cầu</Title>}
            extra={
              <Space>
                {getStatusTag(data.trang_thai)}
                {data.trang_thai === 'Da_Gui' && (
                  <Button type="primary" ghost icon={<EditOutlined />} onClick={() => {
                    setEditData({ loai_chuyen: data.loai_chuyen, noi_chuyen_den: data.noi_chuyen_den });
                    setIsEditing(true);
                  }}>Sửa thông tin</Button>
                )}
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Loại chuyển">{data.loai_chuyen}</Descriptions.Item>
              <Descriptions.Item label="Nơi chuyển đến">{data.noi_chuyen_den}</Descriptions.Item>
              {data.ghi_chu_chi_uy && (
                <Descriptions.Item label="Ghi chú từ Chi ủy">
                  <Text type="danger">{data.ghi_chu_chi_uy}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title={<Title level={5} style={{ margin: 0 }}>Tài liệu đính kèm</Title>}>
            <List
              itemLayout="horizontal"
              dataSource={data.documents || []}
              renderItem={(doc) => (
                <List.Item
                  actions={[
                    <a href={doc.file_url} download={doc.ten_tai_lieu}><DownloadOutlined /> Tải xuống</a>,
                    (data.trang_thai === 'Da_Gui' || data.trang_thai === 'Can_Bo_Sung') && (
                      <Popconfirm title="Bạn có chắc muốn xóa tài liệu này?" onConfirm={() => handleDeleteDoc(doc.id)}>
                        <Button danger type="text" icon={<DeleteOutlined />}>Xóa</Button>
                      </Popconfirm>
                    )
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={doc.ten_tai_lieu}
                    description={
                      <>
                        <Tag color={doc.trang_thai_tai_lieu === 'Hop_Le' ? 'success' : doc.trang_thai_tai_lieu === 'Khong_Hop_Le' ? 'error' : 'default'}>
                          {doc.trang_thai_tai_lieu}
                        </Tag>
                        {doc.ghi_chu && <Text type="secondary" style={{ marginLeft: 8 }}>- {doc.ghi_chu}</Text>}
                      </>
                    }
                  />
                </List.Item>
              )}
            />

            {(data.trang_thai === 'Can_Bo_Sung' || data.trang_thai === 'Da_Gui') && (
              <div style={{ marginTop: 24, padding: 16, background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8 }}>
                <Typography.Title level={5}>Nộp bổ sung/thêm hồ sơ</Typography.Title>
                <Upload
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  multiple
                >
                  <Button icon={<UploadOutlined />}>Chọn File bổ sung</Button>
                </Upload>
                <Button 
                  type="primary" 
                  style={{ marginTop: 16 }} 
                  onClick={handleAddDocuments}
                  loading={uploading}
                  disabled={fileList.length === 0}
                >
                  Nộp bổ sung
                </Button>
              </div>
            )}
          </Card>
        </Col>

        {/* Right Col: Timeline */}
        <Col xs={24} md={10}>
          <TransferTimeline logs={data.logs} />
        </Col>
      </Row>

      <Modal
        title="Sửa thông tin yêu cầu"
        open={isEditing}
        onOk={handleEditRequest}
        onCancel={() => setIsEditing(false)}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Loại chuyển sinh hoạt:</Text>
          <Select 
            style={{ width: '100%', marginTop: 8 }}
            value={editData.loai_chuyen}
            onChange={(val) => setEditData({...editData, loai_chuyen: val})}
          >
            <Select.Option value="Kết nạp Đảng">Kết nạp Đảng</Select.Option>
            <Select.Option value="Chuyển Đảng chính thức">Chuyển Đảng chính thức</Select.Option>
            <Select.Option value="Chuyển sinh hoạt Đảng">Chuyển sinh hoạt Đảng</Select.Option>
          </Select>
        </div>
        <div>
          <Text strong>Nơi chuyển đến:</Text>
          <Input 
            style={{ marginTop: 8 }}
            value={editData.noi_chuyen_den}
            onChange={(e) => setEditData({...editData, noi_chuyen_den: e.target.value})}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TransferRequestDetail;
