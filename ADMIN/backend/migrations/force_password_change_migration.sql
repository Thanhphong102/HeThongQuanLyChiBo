-- =====================================================================
-- MIGRATION: Force Password Change
-- Thêm cột buoc_doi_mat_khau vào bảng dangvien
-- Chạy script này trên Supabase SQL Editor SAU KHI đã chạy audit_logs_migration.sql
-- =====================================================================

-- Thêm cột cờ buộc đổi mật khẩu
ALTER TABLE public.dangvien
  ADD COLUMN IF NOT EXISTS buoc_doi_mat_khau BOOLEAN DEFAULT false;

-- Đặt comment giải thích
COMMENT ON COLUMN public.dangvien.buoc_doi_mat_khau IS 
  'Cờ buộc người dùng đổi mật khẩu ngay sau lần đăng nhập đầu tiên với mật khẩu tạm thời';

SELECT 'Force Password Change Migration completed!' AS result;
