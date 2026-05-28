-- Bổ sung trường thông tin cho luồng xếp lớp (Danh sách chờ)

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS registered_license_class text,
ADD COLUMN IF NOT EXISTS existing_license_number text,
ADD COLUMN IF NOT EXISTS document_receiver text,
ADD COLUMN IF NOT EXISTS submission_date date;
