create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) >= 2),
  code text,
  description text,
  start_date date,
  exam_date date,
  theory_exam_date date,
  practical_exam_date date,
  completion_date date,
  status text not null default 'active' check (status in ('active','draft','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) >= 2),
  email text,
  phone text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'enrolled' check (status in ('enrolled','completed','dropped')),
  enrolled_at timestamptz not null default now(),
  unique(course_id, student_id)
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  full_name text not null check (char_length(full_name) >= 2),
  cccd text,
  phone text,
  license_class text,
  license_expiry date,
  teaching_cert_expiry date,
  contract_expiry date,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  plate_number text not null,
  vehicle_class text,
  name text,
  license_expiry date,
  registry_expiry date,
  insurance_expiry date,
  contract_expiry date,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.teachers enable row level security;
alter table public.vehicles enable row level security;

-- Policies for courses
create policy "courses_select_own" on public.courses for select using ((select auth.uid()) = owner_id);
create policy "courses_insert_own" on public.courses for insert with check ((select auth.uid()) = owner_id);
create policy "courses_update_own" on public.courses for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "courses_delete_own" on public.courses for delete using ((select auth.uid()) = owner_id);

-- Policies for students
create policy "students_select_own" on public.students for select using ((select auth.uid()) = owner_id);
create policy "students_insert_own" on public.students for insert with check ((select auth.uid()) = owner_id);
create policy "students_update_own" on public.students for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "students_delete_own" on public.students for delete using ((select auth.uid()) = owner_id);

-- Policies for enrollments
create policy "enrollments_select_own" on public.enrollments for select using ((select auth.uid()) = owner_id);
create policy "enrollments_insert_own" on public.enrollments for insert with check (
  (select auth.uid()) = owner_id
  and exists (select 1 from public.courses c where c.id = course_id and c.owner_id = (select auth.uid()))
  and exists (select 1 from public.students s where s.id = student_id and s.owner_id = (select auth.uid()))
);
create policy "enrollments_update_own" on public.enrollments for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "enrollments_delete_own" on public.enrollments for delete using ((select auth.uid()) = owner_id);

-- Policies for teachers
create policy "teachers_select_own" on public.teachers for select using ((select auth.uid()) = owner_id);
create policy "teachers_insert_own" on public.teachers for insert with check ((select auth.uid()) = owner_id);
create policy "teachers_update_own" on public.teachers for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "teachers_delete_own" on public.teachers for delete using ((select auth.uid()) = owner_id);

-- Policies for vehicles
create policy "vehicles_select_own" on public.vehicles for select using ((select auth.uid()) = owner_id);
create policy "vehicles_insert_own" on public.vehicles for insert with check ((select auth.uid()) = owner_id);
create policy "vehicles_update_own" on public.vehicles for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "vehicles_delete_own" on public.vehicles for delete using ((select auth.uid()) = owner_id);

-- Indexes
create index if not exists idx_courses_owner on public.courses(owner_id);
create index if not exists idx_students_owner on public.students(owner_id);
create index if not exists idx_enrollments_owner on public.enrollments(owner_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_enrollments_student on public.enrollments(student_id);
create index if not exists idx_teachers_owner on public.teachers(owner_id);
create index if not exists idx_vehicles_owner on public.vehicles(owner_id);
