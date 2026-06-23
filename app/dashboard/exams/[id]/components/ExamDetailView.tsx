"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { ArrowLeft, Search, Plus, Trash2, Calendar, MapPin, Users, CheckSquare, Square, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ExamDetailView({ examId }: { examId: string }) {
  const [exam, setExam] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  
  // Data lists
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  
  // Selection
  const [selectedUnassigned, setSelectedUnassigned] = useState<string[]>([]);
  const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);
  
  // Filters for unassigned
  const [filterCourseId, setFilterCourseId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all' or 'retake'
  const [searchUnassigned, setSearchUnassigned] = useState('');
  
  // Search for assigned
  const [searchAssigned, setSearchAssigned] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch exam
      const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (examData) setExam(examData);

      // Fetch courses
      const { data: coursesData } = await supabase.from('courses').select('id, name');
      if (coursesData) setCourses(coursesData);

      await fetchStudents();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    // Assigned
    const { data: assigned } = await supabase.from('students').select('id, full_name, phone, course_id, status, license_class').eq('exam_id', examId);
    if (assigned) setAssignedStudents(assigned);

    // Unassigned
    const { data: unassigned } = await supabase.from('students').select('id, full_name, phone, course_id, status, license_class').is('exam_id', null);
    if (unassigned) setUnassignedStudents(unassigned);
  };

  // Filtered lists
  const filteredUnassigned = unassignedStudents.filter(s => {
    if (filterCourseId !== 'all' && s.course_id !== filterCourseId) return false;
    if (filterStatus === 'retake' && s.status !== 'Thi lại' && s.status !== 'Sát hạch lại') return false;
    if (searchUnassigned && !s.full_name.toLowerCase().includes(searchUnassigned.toLowerCase()) && !s.phone.includes(searchUnassigned)) return false;
    return true;
  });

  const filteredAssigned = assignedStudents.filter(s => {
    if (searchAssigned && !s.full_name.toLowerCase().includes(searchAssigned.toLowerCase()) && !s.phone.includes(searchAssigned)) return false;
    return true;
  });

  // Actions
  const handleAssign = async () => {
    if (selectedUnassigned.length === 0) return;
    setIsSyncing(true);
    try {
      await supabase.from('students').update({ exam_id: examId }).in('id', selectedUnassigned);
      
      // Update exam stats
      const newCount = (exam?.stats?.students || exam?.new_test_count || 0) + selectedUnassigned.length;
      await supabase.from('exams').update({ new_test_count: newCount }).eq('id', examId);

      setSelectedUnassigned([]);
      await fetchStudents();
      // Refetch exam to update count
      const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (examData) setExam(examData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemove = async () => {
    if (selectedAssigned.length === 0) return;
    if (!confirm('Bạn có chắc muốn loại các học viên này khỏi kỳ thi?')) return;
    setIsSyncing(true);
    try {
      await supabase.from('students').update({ exam_id: null }).in('id', selectedAssigned);
      setSelectedAssigned([]);
      await fetchStudents();
      // Refetch exam to update count
      const { data: examData } = await supabase.from('exams').select('*').eq('id', examId).single();
      if (examData) setExam(examData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectAllUnassigned = () => {
    if (selectedUnassigned.length === filteredUnassigned.length) {
      setSelectedUnassigned([]);
    } else {
      setSelectedUnassigned(filteredUnassigned.map(s => s.id));
    }
  };

  const handleSelectAllAssigned = () => {
    if (selectedAssigned.length === filteredAssigned.length) {
      setSelectedAssigned([]);
    } else {
      setSelectedAssigned(filteredAssigned.map(s => s.id));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu kỳ thi...</div>;
  }

  if (!exam) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <p>Không tìm thấy kỳ thi.</p>
        <Link href="/dashboard/exams" className="text-[#5b21b6] font-medium hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exams" className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{exam.name}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {exam.exam_date || 'Chưa chốt ngày'}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {exam.council || 'Chưa rõ địa điểm'}</span>
              <span className="flex items-center gap-1.5 font-medium text-[#5b21b6] bg-indigo-50 px-2 py-0.5 rounded-full"><Users className="w-4 h-4" /> {assignedStudents.length} Học viên</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel: Unassigned Students (Assign interface) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[700px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">Học viên chưa có lịch <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{unassignedStudents.length}</span></h2>
              <p className="text-xs text-slate-500 mt-1">Lọc và gán học viên vào đợt thi này</p>
            </div>
            <button 
              onClick={handleAssign}
              disabled={selectedUnassigned.length === 0 || isSyncing}
              className="px-4 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {isSyncing ? 'Đang xử lý...' : `Gán ${selectedUnassigned.length > 0 ? `(${selectedUnassigned.length})` : ''}`}
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={filterCourseId} 
                onChange={e => setFilterCourseId(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] font-medium text-slate-700 bg-slate-50"
              >
                <option value="all">-- Từ tất cả Khóa học --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="sm:w-48 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] font-medium text-slate-700 bg-slate-50"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="retake">Chỉ HV thi rớt (Thi lại)</option>
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm tên hoặc SĐT..." 
                value={searchUnassigned}
                onChange={e => setSearchUnassigned(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] outline-none transition-all"
              />
            </div>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filteredUnassigned.length > 0 && selectedUnassigned.length === filteredUnassigned.length}
                onChange={handleSelectAllUnassigned}
                className="w-4 h-4 rounded border-slate-300 text-[#5b21b6] focus:ring-[#5b21b6]"
              />
              <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">Chọn tất cả ({filteredUnassigned.length})</span>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/20">
            {filteredUnassigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <CheckCircle2 className="w-8 h-8 opacity-20" />
                <p className="text-sm">Không có học viên nào phù hợp.</p>
              </div>
            ) : (
              filteredUnassigned.map(student => (
                <label key={student.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedUnassigned.includes(student.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-[#5b21b6]/30'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedUnassigned.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUnassigned(prev => [...prev, student.id]);
                      else setSelectedUnassigned(prev => prev.filter(id => id !== student.id));
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#5b21b6] focus:ring-[#5b21b6]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-slate-800 truncate">{student.full_name}</span>
                      {student.status && (
                         <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${student.status.includes('lại') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{student.status}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{student.phone}</span>
                      <span>•</span>
                      <span className="truncate">{courses.find(c => c.id === student.course_id)?.name || 'Chưa có lớp'}</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Assigned Students */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[700px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
            <div>
              <h2 className="text-lg font-bold text-[#5b21b6] flex items-center gap-2">Danh sách thi <span className="text-xs font-semibold bg-indigo-100 text-[#5b21b6] px-2 py-0.5 rounded-full">{assignedStudents.length}</span></h2>
              <p className="text-xs text-slate-500 mt-1">Học viên đã được xếp vào đợt này</p>
            </div>
            <button 
              onClick={handleRemove}
              disabled={selectedAssigned.length === 0 || isSyncing}
              className="px-4 py-2 text-sm font-bold bg-white text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              {isSyncing ? 'Đang xử lý...' : `Loại bỏ ${selectedAssigned.length > 0 ? `(${selectedAssigned.length})` : ''}`}
            </button>
          </div>

          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm tên hoặc SĐT..." 
                value={searchAssigned}
                onChange={e => setSearchAssigned(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] outline-none transition-all"
              />
            </div>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filteredAssigned.length > 0 && selectedAssigned.length === filteredAssigned.length}
                onChange={handleSelectAllAssigned}
                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
              />
              <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">Chọn tất cả ({filteredAssigned.length})</span>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/20">
            {filteredAssigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Users className="w-8 h-8 opacity-20" />
                <p className="text-sm">Kỳ thi này chưa có học viên nào.</p>
              </div>
            ) : (
              filteredAssigned.map(student => (
                <label key={student.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAssigned.includes(student.id) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedAssigned.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAssigned(prev => [...prev, student.id]);
                      else setSelectedAssigned(prev => prev.filter(id => id !== student.id));
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-slate-800 truncate">{student.full_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">{student.license_class || 'B2'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{student.phone}</span>
                      <span>•</span>
                      <span className="truncate">{courses.find(c => c.id === student.course_id)?.name || 'Chưa có lớp'}</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
