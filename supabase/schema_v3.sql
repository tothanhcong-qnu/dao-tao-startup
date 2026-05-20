-- Thêm cột CCCD vào bảng students nếu chưa có
alter table public.students add column if not exists cccd text;

-- Thêm các cột điểm thi vào bảng enrollments nếu chưa có
alter table public.enrollments add column if not exists theory_result text;
alter table public.enrollments add column if not exists simulation_result text;
alter table public.enrollments add column if not exists track_result text;
alter table public.enrollments add column if not exists road_result text;
alter table public.enrollments add column if not exists final_result text default 'Chưa thi' check (final_result in ('Đạt', 'Trượt', 'Chưa thi'));
