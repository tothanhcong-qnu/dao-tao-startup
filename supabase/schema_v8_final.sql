-- Schema for Driving School Management System (v8 Final)

-- Drop existing tables to ensure clean slate (Be careful in production!)
DROP TABLE IF EXISTS public.exam_session_students CASCADE;
DROP TABLE IF EXISTS public.exam_sessions CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.instructors CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;

-- 1. Instructors (Giáo viên)
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    dob DATE,
    cid TEXT,
    phone TEXT,
    address TEXT,
    license_number TEXT,
    license_class TEXT,
    license_expiry_date DATE,
    cert_number TEXT,
    teaching_class TEXT,
    professional_qual TEXT,
    pedagogical_qual TEXT,
    hire_date DATE,
    status TEXT DEFAULT 'Đang giảng dạy', -- Đang giảng dạy, Nghỉ phép, Đã nghỉ việc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vehicles (Xe)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_plate TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL, -- A1, B1, B2, C
    registration_expiry_date DATE, -- Hạn đăng kiểm
    permit_expiry_date DATE,       -- Hạn xe tập lái
    contract_expiry_date DATE,     -- Hạn hợp đồng
    status TEXT DEFAULT 'Active',  -- Active, Maintenance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students (Học viên)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    dob DATE,
    cid TEXT,
    phone TEXT,
    address TEXT,
    license_class TEXT NOT NULL,
    enrollment_date DATE,
    tuition_paid NUMERIC DEFAULT 0,
    progress_status TEXT, -- Array of booleans stored as text/json or just rely on status
    status TEXT DEFAULT 'Đang học', 
    instructor_name TEXT, -- Keeping name for simplicity or mapping from instructors table
    referrer_name TEXT,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL, -- Liên kết với khóa học
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Exams (Lịch thi)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    exam_classes TEXT[],
    council TEXT,
    new_test_count INTEGER DEFAULT 0,
    re_test_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Chưa bắt đầu',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Courses (Khóa học)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    theory_test_date DATE,
    practice_test_date DATE,
    graduation_test_date DATE,
    enrolled_students INTEGER DEFAULT 0,
    max_students INTEGER DEFAULT 50,
    status TEXT DEFAULT 'Mới khai giảng',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Documents / Tasks (Công việc)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    deadline DATE NOT NULL,
    status TEXT DEFAULT 'Chưa hoàn thành',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bật RLS và Thêm Policy cho phép tất cả các thao tác (để tránh lỗi vi phạm RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Courses" ON public.courses;
CREATE POLICY "Allow_All_Courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Documents" ON public.documents;
CREATE POLICY "Allow_All_Documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instructors_modtime BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vehicles_modtime BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_exams_modtime BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_modtime BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- HẾT LỆNH --
