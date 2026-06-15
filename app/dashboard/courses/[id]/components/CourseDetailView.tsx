"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, FileSpreadsheet, Search, Filter, CheckCircle2, FileUp, Download, Eye, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

export function CourseDetailView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    const { data: cData } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (cData) setCourse(cData);
    
    const { data: sData } = await supabase.from('students').select('*').eq('course_id', courseId);
    if (sData) setStudents(sData);
  };

  const downloadCSVTemplate = () => {
    const headers = "Họ và Tên,CCCD,Số điện thoại,Ngày đăng ký (YYYY-MM-DD),Trạng thái,Nhà giáo giảng dạy,Học phí đã đóng\n";
    const sampleRow = "Nguyễn Văn A,079123456789,0901234567,2025-10-10,Đang học,GV. Nguyễn B,5000000\n";
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + sampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mau_nhap_hoc_vien_khoa_hoc.csv");
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
      
      const newStudents = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 6) {
          newStudents.push({
            full_name: cols[0],
            cid: cols[1],
            phone: cols[2],
            enrollment_date: cols[3],
            status: cols[4],
            instructor_name: cols[5],
            tuition_paid: cols[6] ? Number(cols[6]) : 0,
            course_id: courseId,
            license_class: course?.class || 'B2',
          });
        }
      }

      if (newStudents.length > 0) {
        try {
          const { error } = await supabase.from('students').insert(newStudents);
          if (error) throw error;
          
          await supabase.from('courses').update({ enrolled_students: (course?.enrolled_students || 0) + newStudents.length }).eq('id', courseId);
          
          alert(`Đã nhập thành công ${newStudents.length} học viên!`);
          fetchData();
        } catch (e: any) {
          alert("Có lỗi xảy ra: " + e.message);
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Bạn có chắc chắn muốn gỡ học viên này khỏi lớp?")) return;
    try {
      const { error } = await supabase.from('students').update({ course_id: null }).eq('id', studentId);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (course) setCourse({ ...course, enrolled_students: Math.max(0, course.enrolled_students - 1) });
    } catch (e: any) {
      alert("Lỗi khi gỡ học viên: " + e.message);
    }
  };

  if (!course) return <div className="p-8 text-center text-slate-500 animate-pulse">Đang tải dữ liệu khóa học...</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Breadcrumb */}
      <div>
        <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#5b21b6] transition-colors mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khóa học
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{course.name}</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {course.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2 flex items-center gap-4">
              <span>Hạng: <strong className="text-slate-700">{course.class}</strong></span>
              <span>Khai giảng: <strong className="text-slate-700">{course.start_date}</strong></span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm">
              <FileUp className="w-4 h-4" /> Nhập học viên (CSV)
            </button>
            <button onClick={downloadCSVTemplate} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm">
              <Download className="w-4 h-4" /> Tải file mẫu
            </button>
            <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Xuất danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-[#5b21b6]" />
            Danh sách học viên ({students.length})
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm học viên..." 
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/50 text-sm"
              />
            </div>
            <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-md text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" /> Lọc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">STT</th>
                <th className="px-6 py-4 font-semibold">Họ và Tên</th>
                <th className="px-6 py-4 font-semibold">Nhà giáo giảng dạy</th>
                <th className="px-6 py-4 font-semibold">CCCD</th>
                <th className="px-6 py-4 font-semibold">Số điện thoại</th>
                <th className="px-6 py-4 font-semibold">Ngày đăng ký</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Chưa có học viên nào trong khóa này. Bấm "Nhập học viên (CSV)" để thêm.
                  </td>
                </tr>
              ) : students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{student.full_name}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium bg-slate-50/50">{student.instructor_name}</td>
                  <td className="px-6 py-4">{student.cid}</td>
                  <td className="px-6 py-4">{student.phone}</td>
                  <td className="px-6 py-4">{student.enrollment_date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      student.status === 'Đủ điều kiện thi' ? 'bg-emerald-100 text-emerald-700' :
                      student.status === 'Đang học' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {student.status === 'Đủ điều kiện thi' && <CheckCircle2 className="w-3 h-3" />}
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href="/dashboard/students" className="p-2 text-slate-400 hover:text-[#5b21b6] hover:bg-indigo-50 rounded-lg transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleRemoveStudent(student.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Gỡ khỏi lớp">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
