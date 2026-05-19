-- =====================================================================
-- MIGRATION: Audit Logs - Trình truy vết dữ liệu
-- Chạy script này trên Supabase SQL Editor
-- =====================================================================

-- 1. Thêm cột Audit vào bảng chibo
ALTER TABLE public.chibo
  ADD COLUMN IF NOT EXISTS thoi_gian_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS thoi_gian_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS nguoi_tao INTEGER,
  ADD COLUMN IF NOT EXISTS nguoi_cap_nhat INTEGER;

-- 2. Thêm cột Audit vào bảng dangvien
ALTER TABLE public.dangvien
  ADD COLUMN IF NOT EXISTS thoi_gian_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS thoi_gian_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS nguoi_tao INTEGER,
  ADD COLUMN IF NOT EXISTS nguoi_cap_nhat INTEGER;

-- 3. Thêm cột Audit vào bảng taichinh
ALTER TABLE public.taichinh
  ADD COLUMN IF NOT EXISTS thoi_gian_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS thoi_gian_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS nguoi_cap_nhat INTEGER; -- nguoi_tao đã có sẵn

-- 4. Thêm cột Audit vào bảng hoatdong
ALTER TABLE public.hoatdong
  ADD COLUMN IF NOT EXISTS thoi_gian_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS thoi_gian_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS nguoi_tao INTEGER,
  ADD COLUMN IF NOT EXISTS nguoi_cap_nhat INTEGER;

-- 5. Thêm cột Audit vào bảng lichsinhhoat
ALTER TABLE public.lichsinhhoat
  ADD COLUMN IF NOT EXISTS thoi_gian_tao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS thoi_gian_cap_nhat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS nguoi_tao INTEGER,
  ADD COLUMN IF NOT EXISTS nguoi_cap_nhat INTEGER,
  ADD COLUMN IF NOT EXISTS hinh_thuc_diem_danh VARCHAR(20) DEFAULT 'Offline'; -- 'Offline' hoặc 'Online'

-- 6. Trigger tự động cập nhật thoi_gian_cap_nhat
CREATE OR REPLACE FUNCTION update_thoi_gian_cap_nhat_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.thoi_gian_cap_nhat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Áp dụng trigger cho các bảng
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_thoi_gian_cap_nhat_chibo') THEN
        CREATE TRIGGER trg_update_thoi_gian_cap_nhat_chibo BEFORE UPDATE ON public.chibo FOR EACH ROW EXECUTE FUNCTION update_thoi_gian_cap_nhat_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_thoi_gian_cap_nhat_dangvien') THEN
        CREATE TRIGGER trg_update_thoi_gian_cap_nhat_dangvien BEFORE UPDATE ON public.dangvien FOR EACH ROW EXECUTE FUNCTION update_thoi_gian_cap_nhat_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_thoi_gian_cap_nhat_taichinh') THEN
        CREATE TRIGGER trg_update_thoi_gian_cap_nhat_taichinh BEFORE UPDATE ON public.taichinh FOR EACH ROW EXECUTE FUNCTION update_thoi_gian_cap_nhat_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_thoi_gian_cap_nhat_hoatdong') THEN
        CREATE TRIGGER trg_update_thoi_gian_cap_nhat_hoatdong BEFORE UPDATE ON public.hoatdong FOR EACH ROW EXECUTE FUNCTION update_thoi_gian_cap_nhat_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_thoi_gian_cap_nhat_lichsinhhoat') THEN
        CREATE TRIGGER trg_update_thoi_gian_cap_nhat_lichsinhhoat BEFORE UPDATE ON public.lichsinhhoat FOR EACH ROW EXECUTE FUNCTION update_thoi_gian_cap_nhat_column();
    END IF;
END $$;

SELECT 'Audit Logs Migration completed successfully!' AS result;
