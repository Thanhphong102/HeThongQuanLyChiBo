import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Spin, message, Typography, Upload } from 'antd';
import { QrcodeOutlined, EnvironmentOutlined, CheckCircleOutlined, PictureOutlined, CameraOutlined } from '@ant-design/icons';
import { Html5Qrcode } from 'html5-qrcode';
import userApi from '../api/userApi';

const { Text } = Typography;

const AttendanceScannerModal = ({ isOpen, onClose, meetingId, meetingTitle, attendanceType }) => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('SCANNING'); // 'SCANNING', 'GEOLOCATING', 'SUCCESS', 'ERROR'
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    if (isOpen && status === 'SCANNING') {
      const html5QrCode = new Html5Qrcode("qr-reader-modern");
      html5QrCodeRef.current = html5QrCode;
      
      const config = { fps: 10 }; // Remove qrbox to hide default ugly border
      
      // Tự động quét camera sau
      setTimeout(() => {
        if (!isMounted) return;
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch((err) => {
           console.warn("Lỗi bật camera sau:", err);
           // Fallback nếu không có cam sau (ví dụ chạy trên laptop)
           if(isMounted) {
             html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure)
             .catch(e => {
                message.error("Không thể mở Camera tự động. Hãy dùng tính năng tải ảnh lên.");
             });
           }
        });
      }, 500); // Đợi DOM render xong thẻ div
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, status]);

  const stopCamera = async () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          try { 
            await html5QrCodeRef.current.stop(); 
            html5QrCodeRef.current.clear();
          } catch(e){}
      }
  }

  const onScanSuccess = async (decodedText) => {
      await stopCamera();
      setScanResult(decodedText);

      // Parse JSON từ nội dung QR: { meetingId, token, type: 'ATTENDANCE_QR' }
      let parsedToken = decodedText;
      let parsedMeetingId = meetingId;
      try {
          const parsed = JSON.parse(decodedText);
          if (parsed.type === 'ATTENDANCE_QR' && parsed.token) {
              parsedToken = parsed.token;
              parsedMeetingId = parsed.meetingId || meetingId;
          }
      } catch (e) {}
      
      if (attendanceType === 'Online') {
          setStatus('GEOLOCATING');
          submitOnlineAttendance(parsedToken, parsedMeetingId);
      } else {
          setStatus('GEOLOCATING');
          getLocationAndSubmit(parsedToken, parsedMeetingId);
      }
  };

  const onScanFailure = (error) => {
      // Bỏ qua lỗi ko tìm thấy QR trong frame
  };

  const handleFileUpload = async (file) => {
      if (!file) return false;

      if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode("qr-reader-modern");
      }
      
      try {
          await stopCamera();
          setLoading(true);
          const decodedText = await html5QrCodeRef.current.scanFile(file, true);
          onScanSuccess(decodedText);
      } catch (err) {
          message.error("Không tìm thấy mã QR trong ảnh. Vui lòng chọn ảnh khác rõ nét hơn.");
          setStatus('SCANNING'); // Khởi động lại quét cam
      } finally {
          setLoading(false);
      }
      return false; // Ngăn Upload component tự gửi request
  };

  const submitOnlineAttendance = async (qrToken, resolvedMeetingId) => {
      try {
          setLoading(true);
          const res = await userApi.submitAttendance(resolvedMeetingId, {
              qr_token: qrToken,
              lat: null,
              lng: null
          });
          
          if (res.data.success) {
              setStatus('SUCCESS');
              message.success("Điểm danh trực tuyến thành công!");
          } else {
              setStatus('ERROR');
              message.error(res.data.message || "Điểm danh thất bại");
          }
      } catch (error) {
          console.error(error);
          setStatus('ERROR');
          message.error(error.response?.data?.message || "Mã QR đã hết hạn");
      } finally {
          setLoading(false);
      }
  };

  const getLocationAndSubmit = (qrToken, resolvedMeetingId) => {
      if (!navigator.geolocation) {
          message.error("Trình duyệt không hỗ trợ định vị");
          setStatus('ERROR');
          return;
      }
      
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              
              try {
                  setLoading(true);
                  const res = await userApi.submitAttendance(resolvedMeetingId, {
                      qr_token: qrToken,
                      lat,
                      lng
                  });
                  
                  if (res.data.success) {
                      setStatus('SUCCESS');
                      message.success("Điểm danh thành công!");
                  } else {
                      setStatus('ERROR');
                      message.error(res.data.message || "Điểm danh thất bại");
                  }
              } catch (error) {
                  console.error(error);
                  setStatus('ERROR');
                  message.error(error.response?.data?.message || "Mã QR đã hết hạn hoặc định vị không hợp lệ");
              } finally {
                  setLoading(false);
              }
          },
          (error) => {
              console.error("Geolocation error:", error);
              message.error("Không thể lấy vị trí. Vui lòng cấp quyền định vị GPS cho trình duyệt.");
              setStatus('ERROR');
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
  };

  const handleClose = () => {
      stopCamera();
      setStatus('SCANNING');
      setScanResult(null);
      onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      closable={false}
      centered
      className="backdrop-blur-sm"
      styles={{ body: { padding: 0, borderRadius: '16px', overflow: 'hidden' } }}
    >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden backdrop-blur-md bg-opacity-90">
            <div className="bg-red-dang p-4 text-center">
                <h3 className="text-yellow-sao text-xl font-bold m-0 uppercase flex items-center justify-center">
                    <QrcodeOutlined className="mr-2" /> Điểm Danh
                </h3>
                <p className="text-white opacity-90 mt-1 m-0 truncate text-sm">{meetingTitle}</p>
            </div>
            
            <div className="p-6">
                {status === 'SCANNING' && (
                    <div className="flex flex-col items-center">
                        <div className="relative w-full overflow-hidden rounded-xl bg-gray-900 shadow-inner flex items-center justify-center min-h-[300px]">
                            {/* Khu vực camera */}
                            <div id="qr-reader-modern" className="w-full h-full object-cover"></div>
                            
                            {/* Khung quét giả lập (Scanner Frame) */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-56 h-56 border-2 border-red-500 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500 rounded-tl"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-500 rounded-tr"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-500 rounded-bl"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-500 rounded-br"></div>
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-50 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-gray-500 mt-4 text-sm font-medium flex items-center">
                            <CameraOutlined className="mr-2 text-lg text-red-dang" /> 
                            Hãy đưa mã QR vào trong khung hình
                        </p>

                        <div className="w-full flex items-center justify-center my-3 relative">
                            <div className="w-full h-px bg-gray-200"></div>
                            <span className="bg-white px-3 text-gray-400 text-xs absolute uppercase font-bold tracking-widest">Hoặc</span>
                        </div>

                        <Upload
                            accept="image/*"
                            showUploadList={false}
                            beforeUpload={handleFileUpload}
                        >
                            <Button 
                                type="dashed" 
                                icon={<PictureOutlined />} 
                                size="large" 
                                loading={loading}
                                className="w-full border-red-300 text-red-600 hover:text-red-700 hover:border-red-400 font-semibold"
                            >
                                Tải ảnh QR từ Thư viện
                            </Button>
                        </Upload>
                    </div>
                )}
                
                {status === 'GEOLOCATING' && (
                    <div className="text-center py-10">
                        <Spin size="large" />
                        <h4 className="text-lg font-semibold text-blue-600 mt-4 flex items-center justify-center">
                            {attendanceType === 'Online' ? <CheckCircleOutlined className="mr-2" /> : <EnvironmentOutlined className="mr-2" />} 
                            {attendanceType === 'Online' ? 'Đang gửi yêu cầu điểm danh...' : 'Đang lấy tọa độ GPS...'}
                        </h4>
                        <p className="text-gray-500 text-sm mt-2">
                            {attendanceType === 'Online' ? 'Vui lòng kiên nhẫn chờ trong giây lát.' : 'Vui lòng kiên nhẫn chờ trong giây lát. Đảm bảo bạn đã bật GPS.'}
                        </p>
                    </div>
                )}
                
                {status === 'SUCCESS' && (
                    <div className="text-center py-10">
                        <CheckCircleOutlined className="text-6xl text-green-500 animate-bounce shadow-green-100" />
                        <h4 className="text-2xl font-bold text-green-600 mt-4">THÀNH CÔNG!</h4>
                        <p className="text-gray-600">Hệ thống đã ghi nhận sự có mặt của bạn.</p>
                        <Button type="primary" onClick={handleClose} className="mt-6 bg-red-dang hover:!bg-red-800 h-10 px-8 font-bold rounded-lg shadow-md">
                            HOÀN TẤT
                        </Button>
                    </div>
                )}
                
                {status === 'ERROR' && (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl text-red-500 font-bold">!</span>
                        </div>
                        <h4 className="text-xl font-bold text-red-600 mt-2">ĐIỂM DANH THẤT BẠI</h4>
                        <p className="text-gray-600 mb-6 px-4">
                            {attendanceType === 'Online' ? 'Mã QR không hợp lệ hoặc đã hết hạn.' : 'Khoảng cách quá xa so với địa điểm tổ chức, hoặc mã QR hết hạn.'}
                        </p>
                        <div className="flex justify-center flex-row gap-4">
                            <Button className="h-10 px-6 rounded-lg font-semibold" onClick={() => setStatus('SCANNING')}>Quét lại</Button>
                            <Button type="primary" danger className="h-10 px-6 rounded-lg font-semibold bg-red-dang" onClick={handleClose}>Đóng</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </Modal>
  );
};

export default AttendanceScannerModal;
