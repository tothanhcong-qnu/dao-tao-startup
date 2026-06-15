-- Schema for Driving School Management System

-- 1. Courses (Khóa học)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    opening_date DATE NOT NULL,
    closing_date DATE NOT NULL,
    theory_ktm_date DATE,
    practice_ktm_date DATE,
    graduation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Instructors (Giáo viên)
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    dob DATE NOT NULL,
    cid TEXT NOT NULL UNIQUE,
    license_number TEXT NOT NULL UNIQUE,
    license_class TEXT NOT NULL,
    license_expiry_date DATE NOT NULL,
    cert_number TEXT,
    cert_expiry_date DATE,
    certified_vehicles TEXT[], -- Array of vehicle types they can teach (e.g., ['B1', 'B2', 'C'])
    status TEXT DEFAULT 'Active', -- Active, Inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vehicles (Xe)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_plate TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL, -- Manual, Automatic, Class C
    dat_imei TEXT,
    dat_serial TEXT,
    registration_expiry_date DATE NOT NULL, -- Hạn đăng kiểm
    permit_expiry_date DATE NOT NULL,       -- Hạn xe tập lái
    contract_expiry_date DATE,              -- Hạn hợp đồng
    owner_name TEXT NOT NULL,
    vehicle_cert_number TEXT,
    status TEXT DEFAULT 'Active',           -- Active, Maintenance, Inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Students (Học viên)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    dob DATE NOT NULL,
    cid TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    health_cert_status TEXT DEFAULT 'Pending',
    license_class TEXT NOT NULL, -- B1, B2, C
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tuition_status TEXT DEFAULT 'Pending', -- Paid, Pending
    instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    profile_status TEXT DEFAULT 'Processing', -- Processing, Ready for Exam, Passed, Failed
    -- Exam Statuses
    theory_status TEXT DEFAULT 'Not Started',
    simulation_status TEXT DEFAULT 'Not Started',
    yard_status TEXT DEFAULT 'Not Started',
    road_status TEXT DEFAULT 'Not Started',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Exam Sessions (Kỳ sát hạch)
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_date DATE NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Exam Session Students (Gộp lịch sát hạch - Many-to-Many)
CREATE TABLE IF NOT EXISTS public.exam_session_students (
    exam_session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (exam_session_id, student_id)
);

-- 7. Documents (Văn bản)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_name TEXT NOT NULL,
    deadline DATE NOT NULL,
    status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Submitted to DoT, Completed
    attached_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_modtime BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_instructors_modtime BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vehicles_modtime BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_exam_sessions_modtime BEFORE UPDATE ON public.exam_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
