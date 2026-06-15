"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Plus, Search, Calendar, ChevronRight, Edit, Trash2, FileUp, Download, X, AlertCircle, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

export function CoursesView() {
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<any>(null);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          class: c.class,
          startDate: c.start_date,
          endDate: c.end_date,
          theoryTestDate: c.theory_test_date,
          practiceTestDate: c.practice_test_date,
          graduationTestDate: c.graduation_test_date,
          status: c.status,
          studentsCount: c.enrolled_students || 0,
          maxStudents: c.max_students || 50
        }));
        
        // Auto update status if end_date has passed
        const today = new Date();
        today.setHours(0,0,0,0);
        for (const course of mapped) {
          if (course.endDate && new Date(course.endDate) < today && course.status !== 'Đã hoàn thành') {
            await supabase.from('courses').update({ status: 'Đã hoàn thành' }).eq('id', course.id);
            course.status = 'Đã hoàn thành';
          }
        }
        
        setCoursesList(mapped);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách khóa học:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa khóa học này?')) {
      try {
        const { error } = await supabase.from('courses').delete().eq('id', id);
        if (error) {
          alert('Lỗi xóa: ' + error.message);
          return;
        }
        setCoursesList(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        alert('Lỗi không xác định: ' + err.message);
      }
    }
  };

  const openAssignModal = async (e: React.MouseEvent, course: any) => {
    e.preventDefault();
    e.stopPropagation();
    setCourseToAssign(course);
    setSelectedStudentIds([]);
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('students').select('id, full_name, phone').is('course_id', null);
      if (error) {
        alert('Lỗi CSDL: Vui lòng chạy lệnh SQL sau trong Supabase SQL Editor: ALTER TABLE public.students ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;');
        throw error;
      }
      if (data) setUnassignedStudents(data);
    } catch(err) {
      console.error(err);
    }
    setIsSyncing(false);
    setIsAssignModalOpen(true);
  };

  const handleAssignStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      setIsAssignModalOpen(false);
      return;
    }
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('students').update({ course_id: courseToAssign.id }).in('id', selectedStudentIds);
      if (error) throw error;
      
      const newCount = (courseToAssign.studentsCount || 0) + selectedStudentIds.length;
      await supabase.from('courses').update({ enrolled_students: newCount }).eq('id', courseToAssign.id);
      
      setCoursesList(prev => prev.map(c => c.id === courseToAssign.id ? { ...c, studentsCount: newCount } : c));
      alert(`Đã gán ${selectedStudentIds.length} học viên vào khóa học.`);
      setIsAssignModalOpen(false);
      setSelectedStudentIds([]);
    } catch (err: any) {
      alert("Lỗi gán học viên: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    const fd = new FormData(e.currentTarget);
    const dbPayload: any = {
      name: fd.get('name') as string,
      class: fd.get('class') as string,
      start_date: fd.get('startDate') as string,
      max_students: Number(fd.get('maxStudents')) || 50,
      status: fd.get('status') as string || 'Mới khai giảng',
      enrolled_students: Number(fd.get('studentsCount')) || 0,
    };
    
    if (fd.get('endDate')) dbPayload.end_date = fd.get('endDate');
    else dbPayload.end_date = null;
    if (fd.get('theoryTestDate')) dbPayload.theory_test_date = fd.get('theoryTestDate');
    else dbPayload.theory_test_date = null;
    if (fd.get('practiceTestDate')) dbPayload.practice_test_date = fd.get('practiceTestDate');
    else dbPayload.practice_test_date = null;
    if (fd.get('graduationTestDate')) dbPayload.graduation_test_date = fd.get('graduationTestDate');
    else dbPayload.graduation_test_date = null;

    try {
      if (editingCourse && editingCourse.id) {
        const { error } = await supabase.from('courses').update(dbPayload).eq('id', editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('courses').insert([dbPayload]);
        if (error) throw error;
      }
      await fetchCourses();
      closeModal();
    } catch (err: any) {
      alert('Lỗi lưu: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditModal = (e: React.MouseEvent, course: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const downloadCSVTemplate = () => {
    const headers = "Tên khóa học,Hạng bằng,Ngày khai giảng (YYYY-MM-DD),Số lượng học viên,Số lượng tối đa,Trạng thái\n";
    const sampleRow = "Khóa 48 - B2,B số cơ khí,2026-04-15,0,50,Mới khai giảng\n";
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + sampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mau_nhap_khoa_hoc.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) return alert('File CSV trống hoặc không đúng định dạng!');
      
      const newCourses = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 6) {
          newCourses.push({
            name: cols[0],
            class: cols[1],
            start_date: cols[2],
            enrolled_students: Number(cols[3]) || 0,
            max_students: Number(cols[4]) || 50,
            status: cols[5],
          });
        }
      }

      if (newCourses.length > 0) {
        try {
          const { error } = await supabase.from('courses').insert(newCourses);
          if (error) throw error;
          alert(`Đã nhập thành công ${newCourses.length} khóa học!`);
          fetchCourses();
        } catch (err: any) {
          alert('Lỗi nhập CSV: ' + err.message);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getUpcomingAlerts = () => {
    const alerts: string[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    coursesList.forEach(c => {
      if (c.status === 'Đã hoàn thành') return;
      
      const dates = [
        { name: 'KTM Lý thuyết', val: c.theoryTestDate },
        { name: 'KTM Thực hành', val: c.practiceTestDate },
        { name: 'Thi Tốt nghiệp', val: c.graduationTestDate },
        { name: 'Bế giảng', val: c.endDate }
      ];

      dates.forEach(d => {
        if (d.val) {
          const dDate = new Date(d.val);
          if (dDate >= today && dDate <= in7Days) {
            const diff = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            alerts.push(`Khóa ${c.name} sắp ${d.name} sau ${diff} ngày nữa (${new Date(d.val).toLocaleDateString('vi-VN')})`);
          }
        }
      });
    });
    return alerts;
  };

  const upcomingAlerts = getUpcomingAlerts();

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {upcomingAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-800 text-sm mb-1">Cảnh báo sự kiện sắp tới (trong 7 ngày)</h3>
            <ul className="list-disc pl-4 text-sm text-amber-700 space-y-0.5">
              {upcomingAlerts.map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý Khóa Học</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách các lớp học hiện tại và số lượng học viên.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm">
            <FileUp className="w-4 h-4" /> Nhập CSV
          </button>
          <button onClick={downloadCSVTemplate} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm">
            <Download className="w-4 h-4" /> Tải CSV mẫu
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#5b21b6] hover:bg-[#4c1d95] text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            Mở Khóa Mới
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Tìm kiếm khóa học..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 focus:bg-white transition-all text-sm"
          />
        </div>
        <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50">
          <option value="">Tất cả hạng</option>
          <option value="A1">Hạng A1</option>
          <option value="A">Hạng A</option>
          <option value="B số tự động">Hạng B tự động</option>
          <option value="B số cơ khí">Hạng B cơ khí</option>
          <option value="C1">Hạng C1</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {coursesList.map((course) => (
          <Link href={`/dashboard/courses/${course.id}`} key={course.id} className="group relative block">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-lg transition-all hover:border-[#5b21b6]/30 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 text-[#5b21b6] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#5b21b6] transition-colors pr-16">{course.name}</h3>
                    <span className="text-xs font-bold text-[#5b21b6] bg-indigo-50 px-2 py-0.5 rounded-md mt-1 inline-block">Hạng {course.class}</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-6 right-6 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => openAssignModal(e, course)} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center transition-colors" title="Gán học viên">
                  <UserPlus className="w-4 h-4" />
                </button>
                <button onClick={(e) => openEditModal(e, course)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors" title="Chỉnh sửa">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={(e) => handleDelete(e, course.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 flex items-center justify-center transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mt-auto pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-500 gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Khai giảng: <strong className="text-slate-700">{course.startDate}</strong></span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    course.status === 'Đang học' ? 'bg-blue-50 text-blue-600' :
                    course.status === 'Sắp thi' ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {course.status}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Học viên:</span>
                    <span className="font-bold text-slate-800">{course.studentsCount}/{course.maxStudents}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#5b21b6] group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="bg-[#5b21b6] h-1.5 rounded-full" 
                    style={{ width: `${Math.min((course.studentsCount / (course.maxStudents || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingCourse ? 'Chỉnh sửa khóa học' : 'Mở khóa học mới'}
              </h2>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tên khóa học <span className="text-red-500">*</span></label>
                <input name="name" type="text" defaultValue={editingCourse?.name} required placeholder="Ví dụ: Khóa 48 - B2" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạng bằng <span className="text-red-500">*</span></label>
                  <select name="class" defaultValue={editingCourse?.class || 'B số tự động'} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all bg-white">
                    <option value="A1">Hạng A1</option>
                    <option value="A">Hạng A</option>
                    <option value="B số tự động">Hạng B tự động</option>
                    <option value="B số cơ khí">Hạng B cơ khí</option>
                    <option value="C1">Hạng C1</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trạng thái <span className="text-red-500">*</span></label>
                  <select name="status" defaultValue={editingCourse?.status || 'Mới khai giảng'} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all bg-white">
                    <option value="Mới khai giảng">Mới khai giảng</option>
                    <option value="Đang học">Đang học</option>
                    <option value="Sắp thi">Sắp thi</option>
                    <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày khai giảng <span className="text-red-500">*</span></label>
                  <input name="startDate" type="date" required defaultValue={editingCourse?.startDate} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số lượng tối đa <span className="text-red-500">*</span></label>
                  <input name="maxStudents" type="number" required defaultValue={editingCourse?.maxStudents || 50} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày bế giảng</label>
                  <input name="endDate" type="date" defaultValue={editingCourse?.endDate || ''} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lịch KTM Lý thuyết</label>
                  <input name="theoryTestDate" type="date" defaultValue={editingCourse?.theoryTestDate || ''} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lịch KTM Thực hành</label>
                  <input name="practiceTestDate" type="date" defaultValue={editingCourse?.practiceTestDate || ''} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lịch thi Tốt nghiệp</label>
                  <input name="graduationTestDate" type="date" defaultValue={editingCourse?.graduationTestDate || ''} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số lượng đang có (Thủ công)</label>
                <input name="studentsCount" type="number" defaultValue={editingCourse?.studentsCount || 0} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
              <button type="submit" disabled={isSyncing} className="px-5 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors">
                {isSyncing ? 'Đang lưu...' : 'Lưu khóa học'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isAssignModalOpen && courseToAssign && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleAssignStudents} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                Gán học viên vào lớp: <span className="text-[#5b21b6]">{courseToAssign.name}</span>
              </h2>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-500 mb-4">Chọn các học viên chưa có lớp bên dưới để đưa vào khóa học này.</p>
              
              {unassignedStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  Tất cả học viên đều đã có lớp.
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedStudents.map(student => (
                    <label key={student.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-[#5b21b6] focus:ring-[#5b21b6]"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStudentIds(prev => [...prev, student.id]);
                          else setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800">{student.full_name}</span>
                        <span className="text-xs text-slate-500">{student.phone}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
              <span className="text-sm font-medium text-slate-500">Đã chọn: {selectedStudentIds.length} học viên</span>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
                <button type="submit" disabled={isSyncing || selectedStudentIds.length === 0} className="px-5 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors disabled:opacity-50">
                  {isSyncing ? 'Đang lưu...' : 'Lưu học viên'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

