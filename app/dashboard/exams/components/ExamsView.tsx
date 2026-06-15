"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, FileSpreadsheet, Layers, Clock, CalendarCheck2, 
  CheckCircle2, Users, MapPin, Calendar, Edit, Trash2, ChevronDown, UserPlus, X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const mockExams = [
  {
    id: 1,
    name: 'Đợt thi B2 - Tháng 2/2026',
    status: 'Đã hoàn thành',
    statusColor: 'bg-emerald-100 text-emerald-700',
    borderColor: 'border-l-emerald-500',
    class: 'B số tự động',
    area: 'Tất cả khu vực',
    expectedDate: '28/02/2026',
    officialDate: '01/03/2026',
    location: 'Trung tâm sát hạch quận 1',
    stats: { students: 0, passed: 0, failed: 0 }
  },
  {
    id: 2,
    name: 'Đợt thi B số tự động - Tháng 3/2026',
    status: 'Sắp diễn ra',
    statusColor: 'bg-amber-100 text-amber-700',
    borderColor: 'border-l-amber-500',
    class: 'B số tự động',
    area: 'Tất cả khu vực',
    expectedDate: '04/04/2026',
    officialDate: 'Chưa có lịch chính thức',
    location: 'Trung tâm sát hạch quận 1',
    stats: { students: 3 }
  },
  {
    id: 3,
    name: 'Đợt thi A2 - Cuối tháng 3',
    status: 'Đã xác nhận',
    statusColor: 'bg-blue-100 text-blue-700',
    borderColor: 'border-l-blue-500',
    class: 'A2',
    area: 'Tất cả khu vực',
    expectedDate: '12/04/2026',
    officialDate: '13/04/2026',
    location: 'Trung tâm sát hạch quận 7',
    stats: { students: 2 }
  }
];


function getExamStatusColor(status: string) {
  if (status === 'Đã hoàn thành') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Sắp diễn ra') return 'bg-amber-100 text-amber-700';
  if (status === 'Đã xác nhận') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-700';
}
function getExamBorderColor(status: string) {
  if (status === 'Đã hoàn thành') return 'border-l-emerald-500';
  if (status === 'Sắp diễn ra') return 'border-l-amber-500';
  if (status === 'Đã xác nhận') return 'border-l-blue-500';
  return 'border-l-slate-500';
}

export function ExamsView() {
  const [activeTab, setActiveTab] = useState('Đợt thi');
  const [examsList, setExamsList] = useState<any[]>(mockExams);
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [examToAssign, setExamToAssign] = useState<any>(null);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setIsSyncing(true);
    try {
      try {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).is('exam_id', null);
        setUnassignedCount(count || 0);
      } catch (e) {
        setUnassignedCount(0);
      }

      const { data, error } = await supabase.from('exams').select('*');
      if (error) throw error;
      if (data) {
        const mapped = data.map((e: any) => ({
          id: e.id,
          name: e.name,
          status: e.status,
          statusColor: getExamStatusColor(e.status),
          borderColor: getExamBorderColor(e.status),
          class: Array.isArray(e.exam_classes) ? e.exam_classes.join(', ') : e.exam_classes,
          area: 'Tất cả khu vực',
          expectedDate: e.exam_date,
          officialDate: e.exam_date,
          location: e.council,
          stats: { students: (Number(e.new_test_count) || 0) + (Number(e.re_test_count) || 0) }
        }));
        setExamsList(mapped);
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ Supabase bảng exams. Sử dụng mock data.", err);
      setExamsList(mockExams);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Bạn có chắc chắn muốn xóa đợt thi này?')) {
      setExamsList(prev => prev.filter(e => e.id !== id));
      if (typeof id === 'string' && id.length > 10) {
        try {
          const { error } = await supabase.from('exams').delete().eq('id', id);
          if (error) {
            console.error('Delete error:', error);
            alert('Lỗi xóa: ' + error.message);
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const examClasses = fd.getAll('exam_classes');
    
    const dbPayload = {
      name: fd.get('name') as string,
      exam_date: fd.get('officialDate') as string || null,
      council: fd.get('location') as string,
      new_test_count: Number(fd.get('newTestCount')) || 0,
      re_test_count: Number(fd.get('reTestCount')) || 0,
      exam_classes: examClasses,
      status: 'Sắp diễn ra'
    };

    try {
      if (editingExam && typeof editingExam.id === 'string' && editingExam.id.length > 10) {
        const { error } = await supabase.from('exams').update(dbPayload).eq('id', editingExam.id);
        if (error) {
          console.error('Update error:', error);
          alert('Lỗi cập nhật: ' + error.message);
          return;
        }
      } else {
        const { error } = await supabase.from('exams').insert([dbPayload]);
        if (error) {
          console.error('Insert error:', error);
          alert('Lỗi thêm mới: ' + error.message);
          return;
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Lỗi không xác định: ' + err.message);
      return;
    }
    
    await fetchExams();
    closeModals();
  };

  const openEditModal = (exam: any) => {
    setEditingExam(exam);
    setIsCreateExamModalOpen(true);
  };

  const openAssignModal = async (exam: any) => {
    setExamToAssign(exam);
    setSelectedStudentIds([]);
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('students').select('id, full_name, phone').is('exam_id', null);
      if (error) {
        alert('Lỗi CSDL: Vui lòng chạy lệnh SQL sau trong Supabase SQL Editor để bật tính năng này: ALTER TABLE public.students ADD COLUMN exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL;');
        throw error;
      }
      if (data) setUnassignedStudents(data);
      setIsAssignModalOpen(true);
    } catch(err: any) {
      console.error(err);
    }
    setIsSyncing(false);
  };

  const handleAssignStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('students').update({ exam_id: examToAssign.id }).in('id', selectedStudentIds);
      if (error) throw error;
      
      const newCount = (examToAssign.stats.students || 0) + selectedStudentIds.length;
      setExamsList(prev => prev.map(c => c.id === examToAssign.id ? { ...c, stats: { ...c.stats, students: newCount } } : c));
      alert(`Đã gán ${selectedStudentIds.length} học viên vào đợt thi.`);
      setIsAssignModalOpen(false);
      setSelectedStudentIds([]);
      fetchExams();
    } catch (err: any) {
      alert("Lỗi gán học viên: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const closeModals = () => {
    setIsCreateExamModalOpen(false);
    setEditingExam(null);
  };

  const totalExams = examsList.length;
  const upcoming = examsList.filter(e => e.status === 'Sắp diễn ra').length;
  const confirmed = examsList.filter(e => e.status === 'Đã xác nhận').length;
  const completed = examsList.filter(e => e.status === 'Đã hoàn thành').length;

  const dynamicSummaryCards = [
    { title: 'Tổng đợt thi', value: totalExams, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Sắp diễn ra', value: upcoming, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Đã xác nhận', value: confirmed, icon: CalendarCheck2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Đã hoàn thành', value: completed, icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-50' },
    { title: 'HV chưa có lịch', value: unassignedCount, icon: Users, color: 'text-[#5b21b6]', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lịch thi</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý đợt thi, gán học viên và theo dõi kết quả</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
            <FileSpreadsheet className="w-4 h-4" /> Xuất
          </button>
          <button 
            onClick={() => setIsCreateExamModalOpen(true)}
            className="flex items-center gap-2 bg-[#5b21b6] hover:bg-[#4c1d95] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Tạo đợt thi
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {dynamicSummaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bg} ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-800">{card.value}</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-0.5">{card.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex items-center gap-8 px-6 pt-4 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('Đợt thi')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'Đợt thi' ? 'border-[#5b21b6] text-[#5b21b6]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Layers className="w-4 h-4" /> Đợt thi
          </button>
          <button 
            onClick={() => setActiveTab('HV chưa có lịch')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HV chưa có lịch' ? 'border-[#5b21b6] text-[#5b21b6]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4" /> HV chưa có lịch
            {unassignedCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unassignedCount}</span>}
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 bg-slate-50/50 flex flex-wrap gap-4 items-end border-b border-slate-100">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Từ ngày</label>
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Đến ngày</label>
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Hạng bằng</label>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]">
              <option>Tất cả hạng</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Trạng thái</label>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]">
              <option>Tất cả</option>
            </select>
          </div>
          <button className="text-slate-500 hover:text-red-500 text-sm font-medium px-2 py-2 transition-colors">
            x Xóa lọc
          </button>
        </div>

        {/* Exam Cards List */}
        <div className="p-6 space-y-4 bg-slate-50/30">
          {examsList.map((exam) => (
            <div key={exam.id} className={`bg-white rounded-xl border border-slate-200 border-l-[6px] ${exam.borderColor} p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow`}>
              
              {/* Left Info */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-bold text-slate-800">{exam.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${exam.statusColor}`}>
                    {exam.status}
                  </span>
                  <span className="font-bold text-[#5b21b6] bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{exam.class}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Dự kiến: <strong>{exam.expectedDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarCheck2 className={`w-4 h-4 ${exam.officialDate.includes('Chưa') ? 'text-amber-400' : 'text-emerald-500'}`} />
                    <span>Chính thức: <strong className={exam.officialDate.includes('Chưa') ? 'text-amber-500' : 'text-emerald-600'}>{exam.officialDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{exam.location}</span>
                  </div>
                </div>
              </div>

              {/* Right Stats & Actions */}
              <div className="flex items-center gap-6 md:gap-8 md:pl-6 md:border-l border-slate-100">
                {/* Stats */}
                <div className="flex items-center gap-6 text-center">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-800">{exam.stats.students}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Học viên</span>
                  </div>
                  
                  {exam.stats.passed !== undefined && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-emerald-500">{exam.stats.passed}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Đậu</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-red-500">{exam.stats.failed}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Trượt</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {exam.status === 'Sắp diễn ra' && (
                    <button onClick={() => openAssignModal(exam)} className="w-9 h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center transition-colors" title="Gán học viên">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => openEditModal(exam)} className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors" title="Chỉnh sửa">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(exam.id)} className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 flex items-center justify-center transition-colors" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-white hover:bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center transition-colors ml-1" title="Khác">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Modal Tạo / Sửa đợt thi */}
      {isCreateExamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingExam ? 'Chỉnh sửa đợt thi' : 'Tạo đợt thi mới'}
              </h2>
              <button type="button" onClick={closeModals} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tên đợt thi <span className="text-red-500">*</span></label>
                <input 
                  name="name"
                  type="text" 
                  defaultValue={editingExam ? editingExam.name : ''}
                  required
                  placeholder="Ví dụ: Đợt thi B2 - Tháng 4/2026" 
                  className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" 
                />
              </div>
              
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạng bằng (Có thể chọn nhiều) <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {['A1', 'A', 'B số tự động', 'B số cơ khí', 'C1'].map(cls => (
                    <label key={cls} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors">
                      <input name="exam_classes" value={cls} type="checkbox" defaultChecked={editingExam?.class?.includes(cls)} className="rounded text-[#5b21b6] focus:ring-[#5b21b6]" />
                      <span className="text-sm font-medium text-slate-700">{cls}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số lượng thi mới</label>
                <input name="newTestCount" type="number" defaultValue={editingExam?.stats?.newTests} placeholder="Ví dụ: 50" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số lượng thi lại</label>
                <input name="reTestCount" type="number" defaultValue={editingExam?.stats?.reTests} placeholder="Ví dụ: 10" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày chính thức <span className="text-red-500">*</span></label>
                <input name="officialDate" type="date" required defaultValue={editingExam?.officialDate} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Địa điểm sát hạch <span className="text-red-500">*</span></label>
                <input name="location" type="text" required defaultValue={editingExam?.location} placeholder="Nhập địa điểm..." className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={closeModals} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
              <button type="submit" disabled={isSyncing} className="px-5 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors flex items-center gap-2">
                {isSyncing ? 'Đang lưu...' : 'Lưu đợt thi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Students Modal */}
      {isAssignModalOpen && examToAssign && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleAssignStudents} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                Gán học viên vào: <span className="text-[#5b21b6]">{examToAssign.name}</span>
              </h2>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-500 mb-4">Chọn các học viên chưa có lịch thi bên dưới để đưa vào đợt thi này.</p>
              
              {unassignedStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                  Tất cả học viên đều đã có lịch thi.
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
