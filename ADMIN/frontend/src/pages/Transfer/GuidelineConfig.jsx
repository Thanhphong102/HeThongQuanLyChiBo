import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, Upload, message, Typography, Space } from 'antd';
import { UploadOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosConfig';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Title } = Typography;
const { Option } = Select;

const GuidelineConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const navigate = useNavigate();

  const fetchGuideline = async (type) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/transfer-requests/guideline?loai_chuyen=${type}`);
      if (res.data) {
        setContent(res.data.noi_dung || '');
        
        // Cập nhật danh sách file đính kèm hiện tại
        if (res.data.documents && res.data.documents.length > 0) {
          const files = res.data.documents.map((doc, index) => ({
            uid: `-${index}`,
            name: doc.name,
            status: 'done',
            url: doc.url,
          }));
          setFileList(files);
        } else {
          setFileList([]);
        }
      }
    } catch (error) {
      console.error(error);
      message.error('Lỗi tải hướng dẫn');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    fetchGuideline(value);
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const onFinish = async (values) => {
    if (!selectedType) {
      message.warning('Vui lòng chọn loại chuyển sinh hoạt');
      return;
    }
    
    setLoading(true);
    try {
      const documents = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.originFileObj) {
          const base64 = await getBase64(file.originFileObj);
          documents.push({
            name: file.name,
            url: base64
          });
        } else {
          documents.push({
            name: file.name,
            url: file.url
          });
        }
      }

      await axiosClient.post('/transfer-requests/guideline', {
        loai_chuyen: selectedType,
        noi_dung: content,
        documents: documents
      });
      message.success('Đã lưu hướng dẫn thành công!');
    } catch (error) {
      console.error(error);
      message.error('Lỗi lưu hướng dẫn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={<Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} type="text" /><Title level={3} style={{ margin: 0 }}>Cấu hình Hướng dẫn Hồ sơ</Title></Space>}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Chọn loại hồ sơ để cấu hình"
          required
        >
          <Select placeholder="Chọn loại chuyển" onChange={handleTypeChange} style={{ width: 300 }}>
            <Option value="Kết nạp Đảng">Kết nạp Đảng</Option>
            <Option value="Chuyển Đảng chính thức">Chuyển Đảng chính thức</Option>
            <Option value="Chuyển sinh hoạt Đảng">Chuyển sinh hoạt Đảng</Option>
          </Select>
        </Form.Item>

        {selectedType && (
          <>
            <Form.Item label="Nội dung hướng dẫn chi tiết">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                style={{ height: 200, marginBottom: 50 }}
              />
            </Form.Item>

            <Form.Item label="Đính kèm biểu mẫu (Template)">
              <Upload
                multiple
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={() => false} // Ngăn upload tự động
              >
                <Button icon={<UploadOutlined />}>Chọn File Template</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} style={{ marginTop: 20 }}>
                Lưu Cấu Hình
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </Card>
  );
};

export default GuidelineConfig;
