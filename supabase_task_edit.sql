-- ============================================================
-- HeThongQuanLyChiBo - Nhiệm vụ/Minh chứng + Liên hệ/Góp ý
-- Chạy thủ công trong Supabase SQL Editor.
-- Script KHÔNG được Codex tự động thực thi.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.nhiemvu (
  ma_nhiem_vu       BIGSERIAL PRIMARY KEY,
  ma_chi_bo         INTEGER NOT NULL REFERENCES public.chibo(ma_chi_bo) ON DELETE CASCADE,
  tieu_de           VARCHAR(255) NOT NULL,
  mo_ta             TEXT,
  loai_nhiem_vu     VARCHAR(30) NOT NULL DEFAULT 'Khac'
                     CHECK (loai_nhiem_vu IN ('Cuoc_thi','Hoc_tap','Bao_cao','Phong_trao','Khac')),
  thoi_gian_bat_dau TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  han_nop           TIMESTAMPTZ,
  bat_buoc          BOOLEAN NOT NULL DEFAULT TRUE,
  trang_thai        VARCHAR(20) NOT NULL DEFAULT 'Nhap'
                     CHECK (trang_thai IN ('Nhap','Dang_mo','Da_dong','Da_huy')),
  link_huong_dan    TEXT,
  nguoi_tao         INTEGER REFERENCES public.dangvien(ma_dang_vien),
  nguoi_cap_nhat    INTEGER REFERENCES public.dangvien(ma_dang_vien),
  thoi_gian_tao     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.nhiemvu_nguoinhan (
  ma_nguoi_nhan     BIGSERIAL PRIMARY KEY,
  ma_nhiem_vu       BIGINT NOT NULL REFERENCES public.nhiemvu(ma_nhiem_vu) ON DELETE CASCADE,
  ma_dang_vien      INTEGER NOT NULL REFERENCES public.dangvien(ma_dang_vien) ON DELETE CASCADE,
  trang_thai        VARCHAR(25) NOT NULL DEFAULT 'Chua_xem'
                     CHECK (trang_thai IN ('Chua_xem','Chua_nop','Da_nop','Nop_tre','Can_bo_sung','Da_duyet','Khong_dat')),
  da_xem_luc        TIMESTAMPTZ,
  ngay_nop          TIMESTAMPTZ,
  ngay_duyet        TIMESTAMPTZ,
  nguoi_duyet       INTEGER REFERENCES public.dangvien(ma_dang_vien),
  ket_qua           VARCHAR(255),
  diem_so           NUMERIC(10,2),
  ghi_chu_dang_vien TEXT,
  phan_hoi_chi_uy   TEXT,
  nhac_han_luc      TIMESTAMPTZ,
  thoi_gian_tao     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ma_nhiem_vu, ma_dang_vien)
);

ALTER TABLE public.nhiemvu_nguoinhan
  ADD COLUMN IF NOT EXISTS nhac_han_luc TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.nhiemvu_minhchung (
  ma_minh_chung     BIGSERIAL PRIMARY KEY,
  ma_nguoi_nhan     BIGINT NOT NULL REFERENCES public.nhiemvu_nguoinhan(ma_nguoi_nhan) ON DELETE CASCADE,
  ten_file          VARCHAR(500) NOT NULL,
  file_url          TEXT NOT NULL,
  ma_file_drive     VARCHAR(255) NOT NULL,
  mime_type         VARCHAR(150),
  kich_thuoc        BIGINT,
  thoi_gian_tao     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nhiemvu_chibo_trangthai
  ON public.nhiemvu(ma_chi_bo, trang_thai, han_nop DESC);
CREATE INDEX IF NOT EXISTS idx_nhiemvu_nguoinhan_user
  ON public.nhiemvu_nguoinhan(ma_dang_vien, trang_thai);
CREATE INDEX IF NOT EXISTS idx_nhiemvu_nguoinhan_task
  ON public.nhiemvu_nguoinhan(ma_nhiem_vu, trang_thai);
CREATE INDEX IF NOT EXISTS idx_nhiemvu_minhchung_recipient
  ON public.nhiemvu_minhchung(ma_nguoi_nhan);

CREATE TABLE IF NOT EXISTS public.chibo_lienhe (
  ma_lien_he         BIGSERIAL PRIMARY KEY,
  ma_chi_bo          INTEGER NOT NULL UNIQUE REFERENCES public.chibo(ma_chi_bo) ON DELETE CASCADE,
  ten_don_vi         VARCHAR(255),
  dia_chi            TEXT,
  so_dien_thoai      VARCHAR(30),
  email              VARCHAR(255),
  gio_ho_tro         VARCHAR(255),
  mo_ta              TEXT,
  dau_moi            JSONB NOT NULL DEFAULT '[]'::jsonb,
  cong_khai          BOOLEAN NOT NULL DEFAULT TRUE,
  nguoi_cap_nhat     INTEGER REFERENCES public.dangvien(ma_dang_vien),
  thoi_gian_tao      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.gopy (
  ma_gop_y           BIGSERIAL PRIMARY KEY,
  ma_chi_bo          INTEGER NOT NULL REFERENCES public.chibo(ma_chi_bo) ON DELETE CASCADE,
  ma_dang_vien       INTEGER NOT NULL REFERENCES public.dangvien(ma_dang_vien) ON DELETE CASCADE,
  tieu_de            VARCHAR(255) NOT NULL,
  noi_dung           TEXT NOT NULL,
  chu_de             VARCHAR(30) NOT NULL DEFAULT 'Khac'
                      CHECK (chu_de IN ('Ho_tro','He_thong','Hoat_dong','Dang_phi','Tai_lieu','Khac')),
  an_danh             BOOLEAN NOT NULL DEFAULT FALSE,
  trang_thai         VARCHAR(25) NOT NULL DEFAULT 'Moi'
                      CHECK (trang_thai IN ('Moi','Da_tiep_nhan','Dang_xu_ly','Da_phan_hoi','Da_dong')),
  nguoi_xu_ly        INTEGER REFERENCES public.dangvien(ma_dang_vien),
  thoi_gian_tao      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  thoi_gian_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.gopy_phanhoi (
  ma_phan_hoi        BIGSERIAL PRIMARY KEY,
  ma_gop_y           BIGINT NOT NULL REFERENCES public.gopy(ma_gop_y) ON DELETE CASCADE,
  nguoi_gui          INTEGER NOT NULL REFERENCES public.dangvien(ma_dang_vien),
  vai_tro            VARCHAR(10) NOT NULL CHECK (vai_tro IN ('Admin','User')),
  noi_dung           TEXT NOT NULL,
  thoi_gian_tao      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gopy_chibo_trangthai
  ON public.gopy(ma_chi_bo, trang_thai, thoi_gian_cap_nhat DESC);
CREATE INDEX IF NOT EXISTS idx_gopy_user
  ON public.gopy(ma_dang_vien, thoi_gian_cap_nhat DESC);
CREATE INDEX IF NOT EXISTS idx_gopy_phanhoi_thread
  ON public.gopy_phanhoi(ma_gop_y, thoi_gian_tao);

COMMIT;

-- Kiểm tra nhanh sau khi chạy:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('nhiemvu','nhiemvu_nguoinhan','nhiemvu_minhchung','chibo_lienhe','gopy','gopy_phanhoi');
