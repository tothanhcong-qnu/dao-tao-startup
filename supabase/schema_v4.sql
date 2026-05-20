-- Bổ sung trường thông tin cho xe tập lái và giáo viên

-- Thêm các cột cho bảng vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS imei text,
ADD COLUMN IF NOT EXISTS serial_number text,
ADD COLUMN IF NOT EXISTS document_image_url text,
ADD COLUMN IF NOT EXISTS certificate_number text,
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS practice_license_number text;

-- Thêm cột cho bảng teachers
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS teaching_scope text check (teaching_scope in ('Lý thuyết', 'Thực hành', 'Cả hai')),
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS teacher_cert_number text,
ADD COLUMN IF NOT EXISTS professional_level text,
ADD COLUMN IF NOT EXISTS pedagogical_level text,
ADD COLUMN IF NOT EXISTS license_number text;

-- Bỏ các cột không sử dụng (Tuỳ chọn: Nếu bạn muốn xóa hoàn toàn dữ liệu cũ của 2 cột này)
ALTER TABLE public.teachers
DROP COLUMN IF EXISTS teaching_cert_expiry,
DROP COLUMN IF EXISTS contract_expiry;
