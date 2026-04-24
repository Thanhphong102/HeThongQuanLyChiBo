## 🗄️ Database Schema (PostgreSQL/Supabase)
> [!IMPORTANT]
> Đây là cấu trúc bảng dữ liệu thực tế. Hãy dựa vào đây để viết các câu lệnh Query/API.

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chibo (
  ma_chi_bo integer NOT NULL DEFAULT nextval('chibo_ma_chi_bo_seq'::regclass),
  ten_chi_bo character varying NOT NULL,
  ngay_thanh_lap date,
  mo_ta text,
  trang_thai boolean DEFAULT true,
  CONSTRAINT chibo_pkey PRIMARY KEY (ma_chi_bo)
);
CREATE TABLE public.chitieu (
  ma_chi_tieu integer NOT NULL DEFAULT nextval('chitieu_ma_chi_tieu_seq'::regclass),
  ma_chi_bo integer NOT NULL,
  ten_chi_tieu character varying NOT NULL,
  nam_hoc character varying NOT NULL,
  so_luong_muc_tieu integer DEFAULT 0,
  so_luong_dat_duoc integer DEFAULT 0,
  trang_thai character varying,
  CONSTRAINT chitieu_pkey PRIMARY KEY (ma_chi_tieu),
  CONSTRAINT fk_chitieu_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.dang_ky_hoat_dong (
  id integer NOT NULL DEFAULT nextval('dang_ky_hoat_dong_id_seq'::regclass),
  hoat_dong_id integer,
  user_id integer,
  thoi_gian_dang_ky timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  trang_thai_tham_gia boolean DEFAULT false,
  minh_chung_url text,
  xac_nhan_admin boolean DEFAULT false,
  ghi_chu text,
  CONSTRAINT dang_ky_hoat_dong_pkey PRIMARY KEY (id),
  CONSTRAINT dang_ky_hoat_dong_hoat_dong_id_fkey FOREIGN KEY (hoat_dong_id) REFERENCES public.hoat_dong(id)
);
CREATE TABLE public.dangvien (
  ma_dang_vien integer NOT NULL DEFAULT nextval('dangvien_ma_dang_vien_seq'::regclass),
  ma_chi_bo integer,
  ho_ten character varying NOT NULL,
  ma_so_sinh_vien character varying,
  ngay_sinh date,
  gioi_tinh character varying,
  que_quan character varying,
  dia_chi_hien_tai character varying,
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
  muc_dong_phi numeric DEFAULT 50000,
  CONSTRAINT dangvien_pkey PRIMARY KEY (ma_dang_vien),
  CONSTRAINT fk_dangvien_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.diemdanh (
  ma_lich integer NOT NULL,
  ma_dang_vien integer NOT NULL,
  trang_thai_tham_gia character varying DEFAULT 'Co mat'::character varying,
  ghi_chu text,
  CONSTRAINT diemdanh_pkey PRIMARY KEY (ma_lich, ma_dang_vien),
  CONSTRAINT fk_diemdanh_lich FOREIGN KEY (ma_lich) REFERENCES public.lichsinhhoat(ma_lich),
  CONSTRAINT fk_diemdanh_dangvien FOREIGN KEY (ma_dang_vien) REFERENCES public.dangvien(ma_dang_vien)
);
CREATE TABLE public.forms (
  id integer NOT NULL DEFAULT nextval('forms_id_seq'::regclass),
  title character varying NOT NULL,
  file_url text NOT NULL,
  drive_file_id character varying,
  party_cell_id integer NOT NULL,
  uploaded_by integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT forms_pkey PRIMARY KEY (id),
  CONSTRAINT fk_forms_chibo FOREIGN KEY (party_cell_id) REFERENCES public.chibo(ma_chi_bo),
  CONSTRAINT fk_forms_user FOREIGN KEY (uploaded_by) REFERENCES public.dangvien(ma_dang_vien)
);
CREATE TABLE public.hoat_dong (
  id integer NOT NULL DEFAULT nextval('hoat_dong_id_seq'::regclass),
  ten_hoat_dong character varying NOT NULL,
  mo_ta text,
  thoi_gian_bat_dau timestamp without time zone,
  thoi_gian_ket_thuc timestamp without time zone,
  dia_diem character varying,
  so_luong_toi_da integer,
  trang_thai character varying DEFAULT 'Dang mo'::character varying,
  CONSTRAINT hoat_dong_pkey PRIMARY KEY (id)
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
  CONSTRAINT lichsinhhoat_pkey PRIMARY KEY (ma_lich),
  CONSTRAINT fk_lich_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.media_library (
  id integer NOT NULL DEFAULT nextval('media_library_id_seq'::regclass),
  party_cell_id integer NOT NULL,
  media_type USER-DEFINED NOT NULL,
  title character varying,
  url text NOT NULL,
  drive_file_id character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT media_library_pkey PRIMARY KEY (id),
  CONSTRAINT fk_media_chibo FOREIGN KEY (party_cell_id) REFERENCES public.chibo(ma_chi_bo)
);
CREATE TABLE public.news (
  id integer NOT NULL DEFAULT nextval('news_id_seq'::regclass),
  title text NOT NULL,
  content text,
  image_url text,
  drive_file_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT news_pkey PRIMARY KEY (id)
);
CREATE TABLE public.quytrinh_dang (
  id integer NOT NULL DEFAULT nextval('quytrinh_dang_id_seq'::regclass),
  tieu_de character varying NOT NULL,
  mo_ta text,
  file_url text NOT NULL,
  thu_tu integer DEFAULT 0,
  ngay_tao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quytrinh_dang_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sodo_tochuc (
  id integer NOT NULL DEFAULT nextval('sodo_tochuc_id_seq'::regclass),
  ho_ten character varying NOT NULL,
  chuc_vu character varying NOT NULL,
  anh_the text,
  parent_id integer,
  thu_tu integer DEFAULT 0,
  trang_thai boolean DEFAULT true,
  ngay_tao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sodo_tochuc_pkey PRIMARY KEY (id),
  CONSTRAINT sodo_tochuc_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.sodo_tochuc(id)
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
  CONSTRAINT taichinh_pkey PRIMARY KEY (ma_giao_dich),
  CONSTRAINT fk_taichinh_chibo FOREIGN KEY (ma_chi_bo) REFERENCES public.chibo(ma_chi_bo),
  CONSTRAINT fk_taichinh_dangvien FOREIGN KEY (ma_dang_vien) REFERENCES public.dangvien(ma_dang_vien)
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