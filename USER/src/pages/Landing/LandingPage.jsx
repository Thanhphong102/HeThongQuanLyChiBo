import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  AppstoreOutlined, KeyOutlined, TeamOutlined, 
  UserOutlined, ArrowRightOutlined, DownloadOutlined 
} from '@ant-design/icons';
import { Timeline, Modal, Button } from 'antd';
import userApi from '../../api/userApi';

const LandingPage = () => {
  const navigate = useNavigate();
  const [orgData, setOrgData] = useState([]);
  const [processData, setProcessData] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  
  const [orgDetailModalOpen, setOrgDetailModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [orgRes, processRes] = await Promise.all([
          userApi.getPublicOrgChart(),
          userApi.getPublicProcesses()
        ]);
        setOrgData(orgRes.data || []);
        setProcessData(processRes.data || []);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu public:", error);
      }
    };
    fetchLandingData();
  }, []);

  const getDirectImageUrl = (url) => {
    if (!url) return '';
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = (match && match[1]) || (idParamMatch && idParamMatch[1]);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    if (id) {
      return `${apiBaseUrl}/media/proxy/${id}`;
    }
    if (url.startsWith('/uploads')) {
      return `http://localhost:5001${url}`;
    }
    return url;
  };

  // Build Org Chart structure dynamically based on 'thu_tu'
  const groupedOrgData = orgData.reduce((acc, person) => {
    const level = person.thu_tu || 99;
    if (!acc[level]) acc[level] = [];
    acc[level].push(person);
    return acc;
  }, {});
  const sortedLevels = Object.keys(groupedOrgData).sort((a, b) => Number(a) - Number(b));

  const OrgNode = ({ person }) => (
    <div 
      className="flex flex-col items-center group relative z-10 mx-4 cursor-pointer" 
      onClick={() => { setSelectedOrg(person); setOrgDetailModalOpen(true); }}
    >
      <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-3 bg-zinc-100 relative transition-transform hover:scale-105 duration-300">
        {person.anh_the ? (
          <img src={getDirectImageUrl(person.anh_the)} alt={person.ho_ten} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400"><UserOutlined className="text-3xl" /></div>
        )}
      </div>
      <div className="bg-white px-4 py-2 rounded-xl shadow-sm text-center border border-zinc-100 min-w-[140px] transition-all hover:shadow-md hover:border-[#a91f23]/30">
        <h3 className="text-sm font-bold text-zinc-900">{person.ho_ten}</h3>
        <p className="text-xs font-semibold text-[#a91f23] mt-1">{person.chuc_vu}</p>
        {person.email && <p className="text-xs font-bold text-blue-500 mt-1 truncate w-full px-2">{person.email}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#fdfdfc] font-sans text-zinc-900 selection:bg-[#a91f23] selection:text-white">
      {/* Navigation */}
      <header className="relative bg-[#fffbeb] shadow-sm overflow-hidden z-20 border-b border-yellow-200">
        <div 
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: 'url(/trong-dong.png)',
            backgroundSize: '200px',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
          }}
        />
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo-flags.png" alt="Logo" className="w-auto h-12 object-contain" onError={(e) => e.target.style.display = 'none'} />
            <span className="font-bold tracking-tight text-[#a91f23] text-sm md:text-base uppercase">
              ĐẢNG BỘ TRƯỜNG ĐẠI HỌC KỸ THUẬT - CÔNG NGHỆ CẦN THƠ
            </span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-semibold bg-[#a91f23] text-white px-6 py-2.5 rounded-full hover:bg-[#8b1517] transition-colors shadow-lg"
          >
            Đăng nhập
          </button>
        </nav>
      </header>

      {/* Hero Section with Parallax Bronze Drum */}
      <main className="relative overflow-hidden pt-10 pb-16">
        {/* Bronze drum background */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: 'url(/trong-dong.png)',
            backgroundSize: '800px',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            animation: 'spin 200s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#a91f23]/10 text-[#a91f23] text-xs font-bold uppercase tracking-widest mb-8 border border-[#a91f23]/20">
              Công Tác Đảng Trực Tuyến
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold tracking-tight leading-tight text-[#a91f23] mb-6 drop-shadow-sm">
              Hệ thống quản lý công tác đảng tại chi bộ <br />
              <span className="text-zinc-900 text-2xl md:text-3xl lg:text-[32px] block mt-2">Trường Đại học Kỹ thuật - Công nghệ Cần Thơ</span>
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto mb-12">
              Nền tảng số hoá quy trình hoạt động công tác Đảng. Đồng bộ, trực quan, bảo mật và thân thiện với thế hệ trẻ.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-3 bg-[#a91f23] text-white px-10 py-4 rounded-full font-bold hover:bg-[#8b1517] hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              Vào hệ thống
              <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="bg-white border-y border-zinc-100 py-24 relative z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <TeamOutlined className="text-3xl text-[#a91f23]" />,
                title: "Quản Lý Đảng Viên",
                desc: "Theo dõi, số hóa hồ sơ Đảng viên và quản lý sinh hoạt thuận tiện, minh bạch."
              },
              {
                icon: <AppstoreOutlined className="text-3xl text-[#a91f23]" />,
                title: "Hồ Sơ & Tài Liệu",
                desc: "Lưu trữ văn bản, biểu mẫu trực tuyến, dễ dàng tra cứu và tải xuống."
              },
              {
                icon: <KeyOutlined className="text-3xl text-[#a91f23]" />,
                title: "Bảo Mật Tối Đa",
                desc: "Cấp quyền rõ ràng giữa Bí thư, Quản trị viên và người dùng cơ bản."
              }
            ].map((f, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center p-8 rounded-[2rem] hover:bg-zinc-50 transition-colors"
              >
                <div className="w-20 h-20 rounded-full bg-[#a91f23]/5 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-4">{f.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Org Chart Tree */}
      {orgData.length > 0 && (
        <section className="py-16 bg-[#fdfdfc] relative overflow-hidden">
          {/* Decorative Red Drum */}
          <img src="/trong-dong-red.png" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] opacity-[0.12] pointer-events-none" alt="" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">Cơ cấu tổ chức</h2>
              <div className="w-16 h-1 bg-[#a91f23] mx-auto mt-6 rounded-full"></div>
            </div>

            <div className="flex flex-col items-center relative org-tree-wrapper gap-y-10 w-full">
              {sortedLevels.map((level) => (
                <div key={level} className="flex justify-center flex-wrap gap-8 md:gap-12 w-full max-w-5xl">
                  {groupedOrgData[level].map((p) => <OrgNode key={p.ma_so_do} person={p} />)}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Processes Timeline */}
      {processData.length > 0 && (
        <section className="bg-white py-16 relative overflow-hidden border-t border-zinc-100">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white to-red-50/50 opacity-50 pointer-events-none"></div>
          
          {/* Decorative Chim Lac */}
          <img src="/chim-lac.png" className="absolute top-1/4 left-0 md:left-4 w-48 md:w-72 opacity-30 pointer-events-none transform -scale-x-100" alt="Chim Lac" />
          <img src="/chim-lac.png" className="absolute top-1/4 right-0 md:right-4 w-48 md:w-72 opacity-30 pointer-events-none" alt="Chim Lac" />
          
          <div className="max-w-2xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#a91f23]">Quy trình công tác</h2>
              <div className="w-16 h-1 bg-[#fdb913] mx-auto mt-6 rounded-full"></div>
            </div>

            <Timeline 
              mode="start"
              items={processData.map((process, idx) => ({
                color: '#a91f23',
                content: (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 hover:shadow-md hover:border-red-200 transition-all text-left"
                  >
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">{process.tieu_de}</h3>
                    <Button 
                      type="link" 
                      onClick={() => { setSelectedProcess(process); setDetailModalOpen(true); }}
                      className="p-0 text-[#a91f23] hover:text-[#8b1517] font-semibold mb-4"
                    >
                      Xem chi tiết quy trình
                    </Button>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        if (!process.duong_dan_file) return null;
                        try {
                          const files = JSON.parse(process.duong_dan_file);
                          if (!Array.isArray(files) || files.length === 0) return null;
                          return files.map((f, i) => (
                            <a 
                              key={i}
                              href={getDirectImageUrl(f.url)} 
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#a91f23] hover:text-[#8b1517] transition-colors"
                            >
                              Tải {f.name} <DownloadOutlined />
                            </a>
                          ));
                        } catch(e) {
                          return (
                            <a 
                              href={getDirectImageUrl(process.duong_dan_file)} 
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#a91f23] hover:text-[#8b1517] transition-colors"
                            >
                              Tải tài liệu <DownloadOutlined />
                            </a>
                          );
                        }
                      })()}
                    </div>
                  </motion.div>
                )
              }))}
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-white/10 text-zinc-500 py-12 text-sm text-center relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="mb-1">© {new Date().getFullYear()} Hệ thống Quản lý Chi bộ Sinh viên.</p>
          <p>Thiết kế tinh gọn, bảo mật và thông minh.</p>
        </div>
      </footer>

      {/* DETAIL MODAL PROCESS */}
      <Modal 
        title={<span className="text-xl font-bold text-[#a91f23]">{selectedProcess?.tieu_de}</span>} 
        open={detailModalOpen} 
        onCancel={() => setDetailModalOpen(false)} 
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)} className="rounded-xl bg-gray-100 hover:bg-gray-200 border-0">Đóng</Button>
        ]}
        width={700}
        centered
        className="rounded-2xl"
      >
        <div className="mt-6 mb-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {selectedProcess?.mo_ta ? (
            <div 
              className="prose prose-sm max-w-none prose-red text-zinc-700 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: selectedProcess.mo_ta }} 
            />
          ) : (
            <p className="text-gray-500 italic">Chưa có chi tiết cho quy trình này.</p>
          )}
        </div>
      </Modal>

      {/* DETAIL MODAL ORG MEMBER */}
      <Modal 
        title={<span className="text-xl font-bold text-[#a91f23]">Nhiệm vụ công tác</span>} 
        open={orgDetailModalOpen} 
        onCancel={() => setOrgDetailModalOpen(false)} 
        footer={[
          <Button key="close" onClick={() => setOrgDetailModalOpen(false)} className="rounded-xl bg-gray-100 hover:bg-gray-200 border-0">Đóng</Button>
        ]}
        width={600}
        centered
        className="rounded-2xl"
      >
        <div className="mt-4 mb-2 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-100 shadow-sm">
             {selectedOrg?.anh_the ? <img src={getDirectImageUrl(selectedOrg.anh_the)} alt="avt" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400"><UserOutlined /></div>}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{selectedOrg?.ho_ten}</h3>
            <p className="text-sm font-semibold text-[#a91f23]">{selectedOrg?.chuc_vu}</p>
            {selectedOrg?.email && <p className="text-xs text-zinc-500 mt-1">{selectedOrg?.email}</p>}
          </div>
        </div>
        <hr className="my-4 border-zinc-100" />
        <div className="mb-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {selectedOrg?.nhiem_vu ? (
            <div 
              className="prose prose-sm max-w-none prose-red text-zinc-700 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: selectedOrg.nhiem_vu }} 
            />
          ) : (
            <p className="text-gray-500 italic text-sm">Chưa có nội dung mô tả nhiệm vụ công tác cho nhân sự này.</p>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default LandingPage; // Trigger Vite HMR
