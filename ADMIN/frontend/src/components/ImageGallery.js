import React, { useState, useEffect } from 'react';
import { Card, Button, Upload, Modal, message, Image, Input, Empty, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, PictureOutlined, EditOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';

const ImageGallery = () => {
    const [images, setImages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State cho Modal Sửa
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const [fileList, setFileList] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchImages = async () => {
        try {
            const res = await axios.get('/media?type=IMAGE');
            setImages(res.data);
        } catch (error) { message.error('Lỗi tải ảnh'); }
    };

    useEffect(() => { fetchImages(); }, []);

    // Upload ảnh mới
    const handleUpload = async () => {
        if (fileList.length === 0 || !title) return message.error('Thiếu thông tin');
        
        const formData = new FormData();
        formData.append('media_type', 'IMAGE');
        formData.append('title', title);
        formData.append('file', fileList[0]);

        setLoading(true);
        try {
            await axios.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            message.success('Upload thành công');
            setIsModalOpen(false);
            setFileList([]); setTitle('');
            fetchImages();
        } catch (error) { message.error('Lỗi upload'); }
        finally { setLoading(false); }
    };

    // Sửa tên ảnh (Mới)
    const handleUpdate = async () => {
        if (!editTitle) return message.error('Tiêu đề không được để trống');

        try {
            await axios.put(`/media/${editingImage.id}`, { title: editTitle });
            message.success('Đã đổi tên ảnh');
            setIsEditOpen(false);
            fetchImages();
        } catch (error) { message.error('Lỗi cập nhật'); }
    };

    // Mở modal sửa
    const openEditModal = (img) => {
        setEditingImage(img);
        setEditTitle(img.title);
        setIsEditOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/media/${id}`);
            message.success('Đã xóa ảnh');
            fetchImages();
        } catch (error) { message.error('Lỗi xóa'); }
    };

    const getDriveImage = (fileId) => `https://lh3.googleusercontent.com/d/${fileId}`;

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Thêm Ảnh Mới</Button>
            </div>

            {images.length === 0 ? <Empty description="Chưa có ảnh nào" /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {images.map(img => (
                        <Card key={img.id} hoverable bodyStyle={{ padding: 8 }} style={{ overflow: 'hidden' }}>
                            <div style={{ position: 'relative', height: 150, overflow: 'hidden', borderRadius: 4 }}>
                                <Image 
                                    height={150} width="100%" 
                                    src={getDriveImage(img.drive_file_id)} 
                                    style={{ objectFit: 'cover' }}
                                    fallback="https://via.placeholder.com/200?text=Error"
                                    referrerPolicy="no-referrer"
                                />
                                {/* Nút Sửa & Xóa */}
                                <div style={{ position: 'absolute', top: 5, right: 5, zIndex: 10, display: 'flex', gap: 5 }}>
                                    <Tooltip title="Sửa tên">
                                        <Button 
                                            size="small" icon={<EditOutlined />} 
                                            style={{ opacity: 0.9 }}
                                            onClick={() => openEditModal(img)}
                                        />
                                    </Tooltip>
                                    <Popconfirm title="Xóa ảnh này?" onConfirm={() => handleDelete(img.id)}>
                                        <Tooltip title="Xóa ảnh">
                                            <Button danger size="small" icon={<DeleteOutlined />} style={{ opacity: 0.9 }} />
                                        </Tooltip>
                                    </Popconfirm>
                                </div>
                            </div>
                            <div style={{ marginTop: 8, fontWeight: 500, fontSize: 13, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {img.title}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal Upload */}
            <Modal title="Upload Ảnh" open={isModalOpen} onOk={handleUpload} onCancel={() => setIsModalOpen(false)} confirmLoading={loading}>
                <Input placeholder="Nhập tiêu đề ảnh" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 16 }} />
                <Upload beforeUpload={file => { setFileList([file]); return false; }} onRemove={() => setFileList([])} fileList={fileList} listType="picture" maxCount={1}>
                    <Button icon={<PlusOutlined />}>Chọn ảnh</Button>
                </Upload>
            </Modal>

            {/* Modal Sửa Tên (Mới) */}
            <Modal title="Đổi tên ảnh" open={isEditOpen} onOk={handleUpdate} onCancel={() => setIsEditOpen(false)}>
                <Input placeholder="Nhập tiêu đề mới" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </Modal>
        </div>
    );
};

export default ImageGallery;