create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) >= 2),
  code text,
  description text,
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

alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;

create policy "courses_select_own" on public.courses for select using ((select auth.uid()) = owner_id);
create policy "courses_insert_own" on public.courses for insert with check ((select auth.uid()) = owner_id);
create policy "courses_update_own" on public.courses for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "courses_delete_own" on public.courses for delete using ((select auth.uid()) = owner_id);

create policy "students_select_own" on public.students for select using ((select auth.uid()) = owner_id);
create policy "students_insert_own" on public.students for insert with check ((select auth.uid()) = owner_id);
create policy "students_update_own" on public.students for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "students_delete_own" on public.students for delete using ((select auth.uid()) = owner_id);

create policy "enrollments_select_own" on public.enrollments for select using ((select auth.uid()) = owner_id);
create policy "enrollments_insert_own" on public.enrollments for insert with check (
  (select auth.uid()) = owner_id
  and exists (select 1 from public.courses c where c.id = course_id and c.owner_id = (select auth.uid()))
  and exists (select 1 from public.students s where s.id = student_id and s.owner_id = (select auth.uid()))
);
create policy "enrollments_update_own" on public.enrollments for update using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "enrollments_delete_own" on public.enrollments for delete using ((select auth.uid()) = owner_id);

create index if not exists idx_courses_owner on public.courses(owner_id);
create index if not exists idx_students_owner on public.students(owner_id);
create index if not exists idx_enrollments_owner on public.enrollments(owner_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_enrollments_student on public.enrollments(student_id);
