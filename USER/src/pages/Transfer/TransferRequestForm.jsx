import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Upload, message, Typography, Space, Alert } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import transferApi from '../../api/transferApi';

const { Title, Text } = Typography;
const { Option } = Select;

const TransferRequestForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [guideline, setGuideline] = useState({ noi_dung: 'Vui lòng chọn Loại chuyển sinh hoạt để xem hướng dẫn chi tiết.', documents: [] });
  const navigate = useNavigate();

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleTypeChange = async (value) => {
    try {
      const res = await transferApi.getGuideline(value);
      if (res && res.noi_dung) {
        setGuideline(res);
      } else {
        setGuideline({ noi_dung: 'Chưa có hướng dẫn cho loại hồ sơ này.', documents: [] });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Chuyển file sang base64 để lưu vào DB (Cách đơn giản cho prototype)
      const documents = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i].originFileObj;
        const base64 = await getBase64(file);
        documents.push({
          ten_tai_lieu: file.name,
          file_url: base64
        });
      }

      const payload = {
        loai_chuyen: values.loai_chuyen,
        noi_chuyen_den: values.noi_chuyen_den,
        documents: documents
      };

      await transferApi.createRequest(payload);
      message.success('Đã gửi yêu cầu thành công!');
      navigate('/transfer-requests');
    } catch (error) {
      console.error(error);
      message.error('Gửi yêu cầu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={<Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} type="text" /><Title level={3} style={{ margin: 0 }}>Tạo Yêu Cầu Chuyển Đảng</Title></Space>}
    >
      <Alert 
        title="Hướng dẫn hồ sơ" 
        description={
          <div>
            <div dangerouslySetInnerHTML={{ __html: guideline.noi_dung }} />
            {guideline.documents && guideline.documents.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>Biểu mẫu đính kèm:</strong>
                <ul>
                  {guideline.documents.map((doc, index) => (
                    <li key={index}>
                      <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer">{doc.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        } 
        type="info" 
        showIcon 
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="loai_chuyen"
          label="Loại chuyển sinh hoạt"
          rules={[{ required: true, message: 'Vui lòng chọn loại chuyển sinh hoạt' }]}
        >
          <Select placeholder="Chọn loại chuyển" onChange={handleTypeChange}>
            <Option value="Kết nạp Đảng">Kết nạp Đảng</Option>
            <Option value="Chuyển Đảng chính thức">Chuyển Đảng chính thức</Option>
            <Option value="Chuyển sinh hoạt Đảng">Chuyển sinh hoạt Đảng</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="noi_chuyen_den"
          label="Nơi chuyển đến (Tên Chi bộ/Đảng bộ tiếp nhận)"
          rules={[{ required: true, message: 'Vui lòng nhập nơi chuyển đến' }]}
        >
          <Input placeholder="Nhập tên chi bộ/đảng bộ nơi bạn sẽ chuyển đến" />
        </Form.Item>

        <Form.Item
          label="Đính kèm hồ sơ"
        >
          <Upload
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false} // Không tự động upload
            multiple
          >
            <Button icon={<UploadOutlined />}>Chọn File (PDF/Doc/Ảnh)</Button>
          </Upload>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">Vui lòng đính kèm các tài liệu theo hướng dẫn bên trên.</Text>
          </div>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Gửi Yêu Cầu
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TransferRequestForm;
