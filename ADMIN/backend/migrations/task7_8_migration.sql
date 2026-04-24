-- =====================================================================
-- MIGRATION: Task 7 & 8 - Hybrid Attendance QR + Activity Management
-- Chạy script này trực tiếp trên Supabase SQL Editor
-- =====================================================================

-- ── TASK 7: Thêm 3 cột vào bảng lichsinhhoat ──────────────────────
-- lat: Vĩ độ hội trường (Admin khai báo khi mở điểm danh)
-- lng: Kinh độ hội trường
-- qr_token: UUID ngẫu nhiên, tạo mới mỗi lần Admin mở điểm danh
--           (tránh User dùng lại token cũ)
-- diem_danh_open: Trạng thái mở/đóng cổng điểm danh QR

ALTER TABLE public.lichsinhhoat
  ADD COLUMN IF NOT EXISTS lat         double precision,
  ADD COLUMN IF NOT EXISTS lng         double precision,
  ADD COLUMN IF NOT EXISTS qr_token    uuid,
  ADD COLUMN IF NOT EXISTS diem_danh_open boolean DEFAULT false;

-- ── TASK 8: Thêm cột ma_chi_bo vào bảng hoat_dong ─────────────────
-- Để Admin chỉ xem/quản lý hoạt động thuộc Chi bộ của mình
ALTER TABLE public.hoat_dong
  ADD COLUMN IF NOT EXISTS ma_chi_bo integer REFERENCES public.chibo(ma_chi_bo);

-- Thêm INDEX cho tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_hoatdong_chibo ON public.hoat_dong(ma_chi_bo);
CREATE INDEX IF NOT EXISTS idx_dangky_hoatdong ON public.dang_ky_hoat_dong(hoat_dong_id);
CREATE INDEX IF NOT EXISTS idx_dangky_user ON public.dang_ky_hoat_dong(user_id);

-- Xác nhận
SELECT 'Migration Task 7 & 8 completed successfully!' AS result;
