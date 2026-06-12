import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload } from 'antd';
import { UploadOutlined, CloseCircleOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const NewsForm = ({ isEditMode, initialData, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [titleLength, setTitleLength] = useState(0);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        tieu_de: initialData.tieu_de,
        content: initialData.noi_dung
      });
      setTitleLength(initialData.tieu_de?.length || 0);
      
      if (initialData.ma_file_drive) {
         setPreviewUrl(`https://drive.google.com/thumbnail?id=${initialData.ma_file_drive}&sz=w500`);
      } else if (initialData.duong_dan_anh) {
         setPreviewUrl(initialData.duong_dan_anh);
      } else {
         setPreviewUrl(null);
      }
    } else {
      form.resetFields();
      setFileList([]);
      setPreviewUrl(null);
      setTitleLength(0);
    }
    setImageError('');
    
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, form]);

  const handleTitleChange = (e) => {
    setTitleLength(e.target.value.length);
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const validateContent = (_, value) => {
    if (!value) return Promise.reject('Vui lòng nhập nội dung chi tiết!');
    const plainText = stripHtml(value).trim();
    if (plainText.length < 50) {
      return Promise.reject('Nội dung bài viết quá ngắn (tối thiểu 50 ký tự thuần)');
    }
    return Promise.resolve();
  };

  const validateTitle = (_, value) => {
    if (!value) return Promise.reject('Vui lòng nhập tiêu đề!');
    if (value.trim().length < 10) {
      return Promise.reject('Tiêu đề phải từ 10 đến 150 ký tự');
    }
    return Promise.resolve();
  };

  const handleFinish = (values) => {
    // Validate image manually
    if (fileList.length === 0 && !initialData?.duong_dan_anh && !initialData?.ma_file_drive && !previewUrl) {
      setImageError('Vui lòng chọn ảnh bìa!');
      return;
    }
    setImageError('');

    const sanitizedContent = DOMPurify.sanitize(values.content);
    const formData = new FormData();
    formData.append('tieu_de', values.tieu_de);
    formData.append('content', sanitizedContent);
    if (fileList.length > 0) {
      formData.append('image', fileList[0]);
    }
    onSubmit(formData);
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(initialData?.duong_dan_anh || null);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setImageError('');
      return false; // Prevent automatic upload
    },
    fileList,
    maxCount: 1,
    showUploadList: false, // Handle preview manually
  };

  const removePreview = () => {
    setFileList([]);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['clean']
    ]
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-4">
      <Form.Item 
        name="tieu_de" 
        label={<span className="font-semibold">Tiêu đề tin</span>} 
        rules={[{ validator: validateTitle }]}
      >
        <div className="relative">
          <Input 
            size="large" 
            placeholder="Ví dụ: Lễ kết nạp Đảng viên mới..." 
            className="rounded-lg pr-16" 
            maxLength={150}
            onChange={handleTitleChange}
          />
          <div 
            className={`absolute right-3 top-2.5 text-xs font-medium ${titleLength >= 140 ? 'text-red-500' : 'text-gray-400'}`}
          >
            {titleLength}/150
          </div>
        </div>
      </Form.Item>
      
      <Form.Item 
        name="content" 
        label={<span className="font-semibold text-gray-800 after:content-['*'] after:ml-1 after:text-red-500">Nội dung chi tiết</span>}
        rules={[{ validator: validateContent }]}
      >
        <ReactQuill 
          theme="snow" 
          modules={modules} 
          placeholder="Nhập nội dung bài viết..." 
          className="bg-white rounded-lg"
          style={{ height: '200px', marginBottom: '50px' }}
        />
      </Form.Item>

      <Form.Item 
        label={<span className="font-semibold text-gray-800 after:content-['*'] after:ml-1 after:text-red-500">Ảnh bìa (Thumbnail)</span>}
        validateStatus={imageError ? 'error' : ''}
        help={imageError}
      >
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} className="rounded-lg h-10 px-4">Chọn ảnh (JPG/PNG)</Button>
        </Upload>
        
        {previewUrl && (
          <div className="mt-3 relative inline-block">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-48 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
            />
            <button 
              type="button"
              onClick={removePreview}
              className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 shadow-md p-0.5 transition-colors cursor-pointer"
            >
              <CloseCircleOutlined className="text-xl" />
            </button>
          </div>
        )}
      </Form.Item>

      <div className="flex gap-3 mt-6">
        <Button 
          onClick={onCancel} 
          size="large" 
          className="rounded-xl h-12 font-bold text-base flex-1"
        >
          Hủy bỏ
        </Button>
        <Button 
          type="primary" 
          htmlType="submit" 
          size="large" 
          className="rounded-xl h-12 font-bold text-base bg-red-600 hover:bg-red-700 border-0 shadow-lg shadow-red-200 flex-1"
        >
          {isEditMode ? "Lưu thay đổi" : "Đăng xuất bản"}
        </Button>
      </div>
    </Form>
  );
};

export default NewsForm;
