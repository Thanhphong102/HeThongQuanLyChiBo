-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chibo (
  ma_chi_bo integer NOT NULL DEFAULT nextval('chibo_ma_chi_bo_seq'::regclass),
  ten_chi_bo character varying NOT NULL,
  ngay_thanh_lap date,
  mo_ta text,
  trang_thai boolean DEFAULT true,
  thoi_gian_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  nguoi_tao integer,
  nguoi_cap_nhat integer,
  CONSTRAINT chibo_pkey PRIMARY KEY (ma_chi_bo)
);
CREATE TABLE public.dangvien (
  ma_dang_vien integer NOT NULL DEFAULT nextval('dangvien_ma_dang_vien_seq'::regclass),
  ma_chi_bo integer,
  ho_ten character varying NOT NULL,
  ma_so_sinh_vien character varying,
  ngay_sinh date,
  gioi_tinh character varying,
  que_quan character varying,
  dia_chi_thuong_tru character varying,
  so_dien_thoai character varying,
  email character varying,
  ngay_vao_dang date,
  ngay_chinh_thuc date,
  trang_thai_dang_vien character varying DEFAULT 'Du bi'::character varying,
  chuc_vu_dang character varying DEFAULT 'Dang vien'::character varying,
  ten_dang_nhap character varying UNIQUE,
  mat_khau character varying,
  cap_quyen integer DEFAULT 3,
  hoat_dong boolean DEFAULT true,
  doi_tuong character varying DEFAULT 'Sinh vien'::character varying,
  ma_can_bo character varying,
  don_vi_cong_tac character varying,
  chuc_vu_chuyen_mon character varying,
  lop character varying,
  khoa_hoc character varying,
  nganh_hoc character varying,
  muc_dong_phi numeric DEFAULT 5000,
  so_dinh_danh character varying,
  so_the_dang_vien character varying,
  anh_the text,
  thoi_gian_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  nguoi_tao integer,
  nguoi_cap_nhat integer,
  buoc_doi_mat_khau boolean DEFAULT false,
  dia_chi_tam_tru character varying,
  dia_chi_chi_bo_lien_he character varying,
  CONSTRAINT dangvien_pkey PRIMARY KEY (ma_dang_vien),
  CONSTRAINT fk_dangvien_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.chitieu (
  ma_chi_tieu integer NOT NULL DEFAULT nextval('chitieu_ma_chi_tieu_seq'::regclass),
  ma_chi_bo integer NOT NULL,
  ten_chi_tieu character varying NOT NULL,
  nam_hoc character varying NOT NULL,
  so_luong_muc_tieu integer DEFAULT 0,
  so_luong_dat_duoc integer DEFAULT 0,
  trang_thai character varying,
  minh_chung_url text,
  CONSTRAINT chitieu_pkey PRIMARY KEY (ma_chi_tieu),
  CONSTRAINT fk_chitieu_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.lichsinhhoat (
  ma_lich integer NOT NULL DEFAULT nextval('lichsinhhoat_ma_lich_seq'::regclass),
  ma_chi_bo integer NOT NULL,
  tieu_de character varying NOT NULL,
  noi_dung_du_kien text,
  thoi_gian timestamp without time zone NOT NULL,
  dia_diem character varying,
  loai_hinh character varying,
  noi_dung_bien_ban text,
  danh_gia_chat_luong character varying,
  file_dinh_kem character varying,
  trang_thai_buoi_hop character varying DEFAULT 'Sap dien ra'::character varying,
  lat double precision,
  lng double precision,
  qr_token uuid,
  diem_danh_open boolean DEFAULT false,
  thoi_gian_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  nguoi_tao integer,
  nguoi_cap_nhat integer,
  hinh_thuc_diem_danh character varying DEFAULT 'Offline'::character varying,
  thoi_gian_ket_thuc timestamp without time zone,
  CONSTRAINT lichsinhhoat_pkey PRIMARY KEY (ma_lich),
  CONSTRAINT fk_lich_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.diemdanh (
  ma_lich integer NOT NULL,
  ma_dang_vien integer NOT NULL,
  trang_thai_tham_gia character varying DEFAULT 'Co mat'::character varying,
  ghi_chu text,
  nguon_diem_danh character varying DEFAULT 'Thu cong'::character varying,
  CONSTRAINT diemdanh_pkey PRIMARY KEY (ma_lich, ma_dang_vien),
  CONSTRAINT fk_diemdanh_lich FOREIGN KEY (ma_lich) REFERENCES public.lichsinhhoat(ma_lich),
  CONSTRAINT fk_diemdanh_dangvien FOREIGN KEY (ma_dang_vien) REFERENCES public.dangvien(ma_dang_vien)
);
CREATE TABLE public.taichinh (
  ma_giao_dich integer NOT NULL DEFAULT nextval('taichinh_ma_giao_dich_seq'::regclass),
  ma_chi_bo integer NOT NULL,
  ma_dang_vien integer,
  loai_giao_dich character varying NOT NULL,
  so_tien numeric NOT NULL,
  noi_dung_giao_dich text,
  ngay_giao_dich date DEFAULT CURRENT_DATE,
  nguoi_tao integer,
  thoi_gian_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  nguoi_cap_nhat integer,
  CONSTRAINT taichinh_pkey PRIMARY KEY (ma_giao_dich),
  CONSTRAINT fk_taichinh_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo),
  CONSTRAINT fk_taichinh_dangvien FOREIGN KEY (ma_dang_vien) REFERENCES public.dangvien(ma_dang_vien)
);
CREATE TABLE public.hoatdongdacbiet (
  ma_hoat_dong integer NOT NULL DEFAULT nextval('hoatdongdacbiet_ma_hoat_dong_seq'::regclass),
  ma_chi_bo integer NOT NULL,
  ten_hoat_dong character varying,
  loai_hoat_dong character varying,
  ngay_dien_ra date,
  mo_ta_chi_tiet text,
  tai_lieu_lien_quan character varying,
  CONSTRAINT hoatdongdacbiet_pkey PRIMARY KEY (ma_hoat_dong),
  CONSTRAINT fk_hddb_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.tailieu (
  ma_tai_lieu integer NOT NULL DEFAULT nextval('tailieu_ma_tai_lieu_seq'::regclass),
  ma_chi_bo integer,
  ten_tai_lieu character varying NOT NULL,
  duong_dan character varying NOT NULL,
  loai_tai_lieu character varying,
  ngay_tai_len timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  nguoi_tai_len integer,
  CONSTRAINT tailieu_pkey PRIMARY KEY (ma_tai_lieu),
  CONSTRAINT fk_tailieu_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.tintuc (
  ma_tin_tuc integer NOT NULL DEFAULT nextval('news_id_seq'::regclass),
  tieu_de text NOT NULL,
  noi_dung text,
  duong_dan_anh text,
  ma_file_drive text,
  ngay_tao timestamp with time zone DEFAULT now(),
  CONSTRAINT tintuc_pkey PRIMARY KEY (ma_tin_tuc)
);
CREATE TABLE public.bieumau (
  ma_bieu_mau integer NOT NULL DEFAULT nextval('forms_id_seq'::regclass),
  tieu_de character varying NOT NULL,
  duong_dan_file text NOT NULL,
  ma_file_drive character varying,
  ma_chi_bo integer NOT NULL,
  nguoi_tai_len integer,
  ngay_tao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ma_folder integer,
  CONSTRAINT bieumau_pkey PRIMARY KEY (ma_bieu_mau),
  CONSTRAINT fk_forms_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo),
  CONSTRAINT fk_forms_user FOREIGN KEY (nguoi_tai_len) REFERENCES public.dangvien(ma_dang_vien),
  CONSTRAINT bieumau_ma_folder_fkey FOREIGN KEY (ma_folder) REFERENCES public.bieumau_folder(ma_folder)
);
CREATE TABLE public.thuvienanh (
  ma_hinh_anh integer NOT NULL DEFAULT nextval('media_library_id_seq'::regclass),
  ma_chi_bo integer NOT NULL,
  loai_hinh_anh USER-DEFINED NOT NULL,
  tieu_de character varying,
  duong_dan text NOT NULL,
  ma_file_drive character varying,
  ngay_tao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ma_album integer,
  CONSTRAINT thuvienanh_pkey PRIMARY KEY (ma_hinh_anh),
  CONSTRAINT fk_media_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo),
  CONSTRAINT thuvienanh_ma_album_fkey FOREIGN KEY (ma_album) REFERENCES public.album(ma_album)
);
CREATE TABLE public.sodotochuc (
  ma_so_do integer NOT NULL DEFAULT nextval('sodo_tochuc_id_seq'::regclass),
  ho_ten character varying NOT NULL,
  chuc_vu character varying NOT NULL,
  anh_the text,
  ma_so_do_cha integer,
  thu_tu integer DEFAULT 0,
  trang_thai boolean DEFAULT true,
  ngay_tao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  email character varying,
  nhiem_vu text,
  CONSTRAINT sodotochuc_pkey PRIMARY KEY (ma_so_do),
  CONSTRAINT sodo_tochuc_parent_id_fkey FOREIGN KEY (ma_so_do_cha) REFERENCES public.sodotochuc(ma_so_do)
);
CREATE TABLE public.quytrinhdang (
  ma_quy_trinh integer NOT NULL DEFAULT nextval('quytrinh_dang_id_seq'::regclass),
  tieu_de character varying NOT NULL,
  mo_ta text,
  duong_dan_file text NOT NULL,
  thu_tu integer DEFAULT 0,
  ngay_tao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quytrinhdang_pkey PRIMARY KEY (ma_quy_trinh)
);
CREATE TABLE public.hoatdong (
  id integer NOT NULL DEFAULT nextval('hoat_dong_id_seq'::regclass),
  ten_hoat_dong character varying NOT NULL,
  mo_ta text,
  thoi_gian_bat_dau timestamp without time zone,
  thoi_gian_ket_thuc timestamp without time zone,
  dia_diem character varying,
  so_luong_toi_da integer,
  trang_thai character varying DEFAULT 'Dang mo'::character varying,
  ma_chi_bo integer,
  thoi_gian_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  nguoi_tao integer,
  nguoi_cap_nhat integer,
  CONSTRAINT hoatdong_pkey PRIMARY KEY (id),
  CONSTRAINT hoat_dong_ma_chi_bo_fkey FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.dangkyhoatdong (
  ma_dang_ky integer NOT NULL DEFAULT nextval('dang_ky_hoat_dong_id_seq'::regclass),
  ma_hoat_dong integer,
  ma_dang_vien integer,
  thoi_gian_dang_ky timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  trang_thai_tham_gia boolean DEFAULT false,
  minh_chung_url text,
  xac_nhan_admin boolean DEFAULT false,
  ghi_chu text,
  CONSTRAINT dangkyhoatdong_pkey PRIMARY KEY (ma_dang_ky),
  CONSTRAINT dang_ky_hoat_dong_hoat_dong_id_fkey FOREIGN KEY (ma_hoat_dong) REFERENCES public.hoatdong(id)
);
CREATE TABLE public.thongbao (
  ma_thong_bao integer NOT NULL DEFAULT nextval('thong_bao_id_seq'::regclass),
  ma_nguoi_nhan integer,
  quyen_nguoi_nhan character varying NOT NULL,
  tieu_de character varying NOT NULL,
  noi_dung text,
  loai_thong_bao character varying,
  da_doc boolean DEFAULT false,
  da_xoa boolean DEFAULT false,
  ngay_tao timestamp without time zone DEFAULT now(),
  CONSTRAINT thongbao_pkey PRIMARY KEY (ma_thong_bao)
);
CREATE TABLE public.album (
  ma_album integer NOT NULL DEFAULT nextval('album_ma_album_seq'::regclass),
  ten_album character varying NOT NULL,
  ma_chi_bo integer,
  nguoi_tao integer,
  ngay_tao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT album_pkey PRIMARY KEY (ma_album)
);
CREATE TABLE public.TransferRequests (
  id integer NOT NULL DEFAULT nextval('"TransferRequests_id_seq"'::regclass),
  ma_dang_vien integer NOT NULL,
  loai_chuyen character varying NOT NULL,
  noi_chuyen_den text NOT NULL,
  trang_thai character varying DEFAULT 'Da_Gui'::character varying,
  ghi_chu_chi_uy text,
  ngay_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT TransferRequests_pkey PRIMARY KEY (id),
  CONSTRAINT TransferRequests_ma_dang_vien_fkey FOREIGN KEY (ma_dang_vien) REFERENCES public.dangvien(ma_dang_vien)
);
CREATE TABLE public.TransferDocuments (
  id integer NOT NULL DEFAULT nextval('"TransferDocuments_id_seq"'::regclass),
  request_id integer NOT NULL,
  ten_tai_lieu character varying NOT NULL,
  file_url text,
  trang_thai_tai_lieu character varying DEFAULT 'Cho_Duyet'::character varying,
  ghi_chu text,
  ngay_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT TransferDocuments_pkey PRIMARY KEY (id),
  CONSTRAINT TransferDocuments_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.TransferRequests(id)
);
CREATE TABLE public.TransferLogs (
  id integer NOT NULL DEFAULT nextval('"TransferLogs_id_seq"'::regclass),
  request_id integer NOT NULL,
  nguoi_thuc_hien_id integer NOT NULL,
  hanh_dong character varying NOT NULL,
  chi_tiet text,
  thoi_gian timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT TransferLogs_pkey PRIMARY KEY (id),
  CONSTRAINT TransferLogs_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.TransferRequests(id)
);
CREATE TABLE public.TransferGuidelines (
  id integer NOT NULL DEFAULT nextval('"TransferGuidelines_id_seq"'::regclass),
  ma_chi_bo character varying NOT NULL,
  loai_chuyen character varying NOT NULL,
  noi_dung text,
  documents jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT TransferGuidelines_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dotneuguong (
  ma_dot integer NOT NULL DEFAULT nextval('dotneuguong_ma_dot_seq'::regclass),
  ten_dot character varying NOT NULL,
  mo_ta text,
  thang smallint NOT NULL,
  nam smallint NOT NULL,
  trang_thai character varying NOT NULL DEFAULT 'Mo'::character varying CHECK (trang_thai::text = ANY (ARRAY['Mo'::character varying, 'Da_Dong'::character varying]::text[])),
  file_mau_bao_cao text,
  ma_chi_bo integer,
  nguoi_tao integer,
  nguoi_cap_nhat integer,
  thoi_gian_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT dotneuguong_pkey PRIMARY KEY (ma_dot),
  CONSTRAINT fk_dotneuguong_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.hosoneuguong (
  ma_ho_so integer NOT NULL DEFAULT nextval('hosoneuguong_ma_ho_so_seq'::regclass),
  ma_dot integer NOT NULL,
  ma_dang_vien integer NOT NULL,
  trang_thai character varying NOT NULL DEFAULT 'Cho_Duyet'::character varying CHECK (trang_thai::text = ANY (ARRAY['Cho_Duyet'::character varying, 'Cho_Nop_Bao_Cao'::character varying, 'Dang_Xu_Ly'::character varying, 'Duoc_Cong_Nhan'::character varying, 'Bi_Tu_Choi'::character varying]::text[])),
  ghi_chu_admin text,
  file_bao_cao text,
  ngay_nop timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  ngay_duyet timestamp with time zone,
  ngay_cong_nhan timestamp with time zone,
  thoi_gian_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hosoneuguong_pkey PRIMARY KEY (ma_ho_so),
  CONSTRAINT fk_hosoneuguong_dot FOREIGN KEY (ma_dot) REFERENCES public.dotneuguong(ma_dot),
  CONSTRAINT fk_hosoneuguong_dangvien FOREIGN KEY (ma_dang_vien) REFERENCES public.dangvien(ma_dang_vien)
);
CREATE TABLE public.hoatdongneuguong (
  ma_hoat_dong integer NOT NULL DEFAULT nextval('hoatdongneuguong_ma_hoat_dong_seq'::regclass),
  ma_ho_so integer NOT NULL,
  ten_hoat_dong text NOT NULL,
  file_minh_chung text,
  ghi_chu text,
  thu_tu smallint DEFAULT 1,
  ngay_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT hoatdongneuguong_pkey PRIMARY KEY (ma_hoat_dong),
  CONSTRAINT fk_hoatdongneuguong_hoso FOREIGN KEY (ma_ho_so) REFERENCES public.hosoneuguong(ma_ho_so)
);
CREATE TABLE public.bieumau_folder (
  ma_folder integer NOT NULL DEFAULT nextval('bieumau_folder_ma_folder_seq'::regclass),
  ten_folder text NOT NULL,
  mo_ta text,
  ma_chi_bo integer,
  nguoi_tao integer,
  ngay_tao timestamp without time zone DEFAULT now(),
  ngay_cap_nhat timestamp without time zone DEFAULT now(),
  parent_folder_id integer,
  CONSTRAINT bieumau_folder_pkey PRIMARY KEY (ma_folder),
  CONSTRAINT bieumau_folder_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.bieumau_folder(ma_folder)
);