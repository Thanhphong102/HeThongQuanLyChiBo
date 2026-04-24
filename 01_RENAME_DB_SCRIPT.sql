-- WARNING: Hãy sao chép toàn bộ đoạn script này dán vào SQL Editor trên Supabase và nhấn RUN.

-- 1. DANGYHOATDONG
ALTER TABLE public.dang_ky_hoat_dong RENAME TO dangkyhoatdong;
ALTER TABLE public.dangkyhoatdong RENAME COLUMN id TO ma_dang_ky;
ALTER TABLE public.dangkyhoatdong RENAME COLUMN hoat_dong_id TO ma_hoat_dong;
ALTER TABLE public.dangkyhoatdong RENAME COLUMN user_id TO ma_dang_vien;

-- 2. HOATDONG
ALTER TABLE public.hoat_dong RENAME TO hoatdong;
-- Các cột đã chuẩn

-- 3. MEDIA_LIBRARY -> thuvienanh
ALTER TABLE public.media_library RENAME TO thuvienanh;
ALTER TABLE public.thuvienanh RENAME COLUMN id TO ma_hinh_anh;
ALTER TABLE public.thuvienanh RENAME COLUMN party_cell_id TO ma_chi_bo;
ALTER TABLE public.thuvienanh RENAME COLUMN media_type TO loai_hinh_anh;
ALTER TABLE public.thuvienanh RENAME COLUMN title TO tieu_de;
ALTER TABLE public.thuvienanh RENAME COLUMN url TO duong_dan;
ALTER TABLE public.thuvienanh RENAME COLUMN drive_file_id TO ma_file_drive;
ALTER TABLE public.thuvienanh RENAME COLUMN created_at TO ngay_tao;

-- 4. NEWS -> tintuc
ALTER TABLE public.news RENAME TO tintuc;
ALTER TABLE public.tintuc RENAME COLUMN id TO ma_tin_tuc;
ALTER TABLE public.tintuc RENAME COLUMN title TO tieu_de;
ALTER TABLE public.tintuc RENAME COLUMN content TO noi_dung;
ALTER TABLE public.tintuc RENAME COLUMN image_url TO duong_dan_anh;
ALTER TABLE public.tintuc RENAME COLUMN drive_file_id TO ma_file_drive;
ALTER TABLE public.tintuc RENAME COLUMN created_at TO ngay_tao;

-- 5. QUYTRINH_DANG
ALTER TABLE public.quytrinh_dang RENAME TO quytrinhdang;
ALTER TABLE public.quytrinhdang RENAME COLUMN id TO ma_quy_trinh;
ALTER TABLE public.quytrinhdang RENAME COLUMN file_url TO duong_dan_file;

-- 6. SODO_TOCHUC
ALTER TABLE public.sodo_tochuc RENAME TO sodotochuc;
ALTER TABLE public.sodotochuc RENAME COLUMN id TO ma_so_do;
ALTER TABLE public.sodotochuc RENAME COLUMN parent_id TO ma_so_do_cha;

-- 7. THONG_BAO
ALTER TABLE public.thong_bao RENAME TO thongbao;
ALTER TABLE public.thongbao RENAME COLUMN id TO ma_thong_bao;
ALTER TABLE public.thongbao RENAME COLUMN recipient_id TO ma_nguoi_nhan;
ALTER TABLE public.thongbao RENAME COLUMN recipient_role TO quyen_nguoi_nhan;
ALTER TABLE public.thongbao RENAME COLUMN title TO tieu_de;
ALTER TABLE public.thongbao RENAME COLUMN content TO noi_dung;
ALTER TABLE public.thongbao RENAME COLUMN type TO loai_thong_bao;
ALTER TABLE public.thongbao RENAME COLUMN is_read TO da_doc;
ALTER TABLE public.thongbao RENAME COLUMN is_deleted TO da_xoa;
ALTER TABLE public.thongbao RENAME COLUMN created_at TO ngay_tao;

-- 8. FORMS -> bieumau
ALTER TABLE public.forms RENAME TO bieumau;
ALTER TABLE public.bieumau RENAME COLUMN id TO ma_bieu_mau;
ALTER TABLE public.bieumau RENAME COLUMN title TO tieu_de;
ALTER TABLE public.bieumau RENAME COLUMN file_url TO duong_dan_file;
ALTER TABLE public.bieumau RENAME COLUMN drive_file_id TO ma_file_drive;
ALTER TABLE public.bieumau RENAME COLUMN party_cell_id TO ma_chi_bo;
ALTER TABLE public.bieumau RENAME COLUMN uploaded_by TO nguoi_tai_len;
ALTER TABLE public.bieumau RENAME COLUMN created_at TO ngay_tao;
