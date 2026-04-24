-- =====================================================================
-- MIGRATION: Thêm trường Số định danh công dân, Số thẻ Đảng viên, Ảnh thẻ vào bảng dangvien
-- Chạy script này trực tiếp trên Supabase SQL Editor
-- =====================================================================

ALTER TABLE public.dangvien
  ADD COLUMN IF NOT EXISTS so_dinh_danh   character varying,
  ADD COLUMN IF NOT EXISTS so_the_dang_vien character varying,
  ADD COLUMN IF NOT EXISTS anh_the         text;

-- Xác nhận
SELECT 'Migration: Thêm so_dinh_danh, so_the_dang_vien, anh_the vào bảng dangvien - THÀNH CÔNG!' AS result;
