import React, { useEffect, useState } from 'react';
import { Modal, Button, Spin, message, Typography } from 'antd';
import { QrcodeOutlined, EnvironmentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import userApi from '../api/userApi';

const { Text } = Typography;

const AttendanceScannerModal = ({ isOpen, onClose, meetingId, meetingTitle }) => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('SCANNING'); // 'SCANNING', 'GEOLOCATING', 'SUCCESS', 'ERROR'
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (isOpen && status === 'SCANNING') {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: {width: 250, height: 250}, formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ] },
        /* verbose= */ false
      );
      
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setScanner(html5QrcodeScanner);

      return () => {
         try {
             html5QrcodeScanner.clear().catch(error => {
                 console.error("Failed to clear html5QrcodeScanner. ", error);
             });
         } catch(e) { console.error(e); }
      };
    }
  }, [isOpen, status]);

  const onScanSuccess = (decodedText, decodedResult) => {
      // Dừng quét
      if (scanner) {
          try { scanner.clear(); } catch(e){}
      }
      setScanResult(decodedText);
      setStatus('GEOLOCATING');
      getLocationAndSubmit(decodedText);
  };

  const onScanFailure = (error) => {
      // Bỏ qua lỗi quét
  };

  const getLocationAndSubmit = (qrToken) => {
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
                  // Gọi API qua function submitAttendance (sẽ code ở userApi)
                  const res = await userApi.submitAttendance(meetingId, {
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
      if (scanner) {
          try { scanner.clear().catch(e => console.error(e)); } catch(e){}
      }
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
                    <QrcodeOutlined className="mr-2" /> ĐIỂM DANH
                </h3>
                <p className="text-white opacity-90 mt-1 m-0 truncate text-sm">{meetingTitle}</p>
            </div>
            
            <div className="p-6">
                {status === 'SCANNING' && (
                    <div>
                        <div id="qr-reader" className="w-full border-2 border-dashed border-red-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[250px]"></div>
                        <p className="text-center text-gray-500 mt-4 text-sm"><QrcodeOutlined /> Hãy đưa camera hướng vào mã QR của Chi ủy để quét</p>
                    </div>
                )}
                
                {status === 'GEOLOCATING' && (
                    <div className="text-center py-10">
                        <Spin size="large" />
                        <h4 className="text-lg font-semibold text-blue-600 mt-4 flex items-center justify-center"><EnvironmentOutlined className="mr-2" /> Đang lấy vị trí phân tích...</h4>
                        <p className="text-gray-500 text-sm mt-2">Vui lòng kiên nhẫn chờ trong giây lát. Đảm bảo bạn đã bật GPS.</p>
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
                        <h4 className="text-xl font-bold text-red-600 mt-2">VỊ TRÍ HOẶC QR KHÔNG HỢP LỆ</h4>
                        <p className="text-gray-600 mb-6 px-4">Khoảng cách quét hoặc mã QR cung cấp không khớp với Server.</p>
                        <div className="flex justify-center flex-row gap-4">
                            <Button className="h-10 px-6 rounded-lg font-semibold" onClick={() => setStatus('SCANNING')}>Thử Lại</Button>
                            <Button type="primary" danger className="h-10 px-6 rounded-lg font-semibold bg-red-dang" onClick={handleClose}>Huỷ</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </Modal>
  );
};

export default AttendanceScannerModal;
