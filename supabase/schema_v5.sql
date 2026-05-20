-- Bổ sung trường thông tin cho học viên

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS address text;
