import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, message, Empty, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, YoutubeOutlined, EditOutlined } from '@ant-design/icons';
import axios from '../services/axiosConfig';

const VideoGallery = () => {
    const [videos, setVideos] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State Sửa
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchVideos = async () => {
        try {
            const res = await axios.get('/media?type=VIDEO');
            setVideos(res.data);
        } catch (error) { message.error('Lỗi tải video'); }
    };

    useEffect(() => { fetchVideos(); }, []);

    const handleAdd = async () => {
        if (!url || !title) return message.error('Thiếu thông tin');
        setLoading(true);
        try {
            await axios.post('/media', { media_type: 'VIDEO', title, video_url: url });
            message.success('Thêm video thành công');
            setIsModalOpen(false);
            setTitle(''); setUrl('');
            fetchVideos();
        } catch (error) { message.error('Lỗi thêm video'); }
        finally { setLoading(false); }
    };

    // Sửa tên Video (Mới)
    const handleUpdate = async () => {
        if (!editTitle) return message.error('Tiêu đề không được để trống');
        try {
            await axios.put(`/media/${editingVideo.id}`, { title: editTitle });
            message.success('Đã đổi tên video');
            setIsEditOpen(false);
            fetchVideos();
        } catch (error) { message.error('Lỗi cập nhật'); }
    };

    const openEditModal = (vid) => {
        setEditingVideo(vid);
        setEditTitle(vid.title);
        setIsEditOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/media/${id}`);
            message.success('Đã xóa video');
            fetchVideos();
        } catch (error) { message.error('Lỗi xóa'); }
    };

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" danger icon={<YoutubeOutlined />} onClick={() => setIsModalOpen(true)}>Thêm Video Youtube</Button>
            </div>

            {videos.length === 0 ? <Empty description="Chưa có video nào" /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {videos.map(vid => {
                        const videoId = getYoutubeId(vid.url);
                        return (
                            <Card key={vid.id} hoverable bodyStyle={{ padding: 0 }}>
                                {videoId ? (
                                    <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${videoId}`} title={vid.title} frameBorder="0" allowFullScreen style={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
                                ) : <div style={{ height: 200, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Link lỗi</div>}
                                
                                <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                        {vid.title}
                                    </div>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <Tooltip title="Sửa tên">
                                            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(vid)} />
                                        </Tooltip>
                                        <Popconfirm title="Xóa video?" onConfirm={() => handleDelete(vid.id)}>
                                            <Button danger size="small" icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal title="Thêm Video Youtube" open={isModalOpen} onOk={handleAdd} onCancel={() => setIsModalOpen(false)} confirmLoading={loading}>
                <Input placeholder="Tiêu đề video" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 16 }} />
                <Input placeholder="Dán link Youtube vào đây" value={url} onChange={e => setUrl(e.target.value)} prefix={<YoutubeOutlined style={{color:'red'}}/>} />
            </Modal>

            {/* Modal Sửa Tên (Mới) */}
            <Modal title="Đổi tên Video" open={isEditOpen} onOk={handleUpdate} onCancel={() => setIsEditOpen(false)}>
                <Input placeholder="Nhập tiêu đề mới" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </Modal>
        </div>
    );
};

export default VideoGallery;