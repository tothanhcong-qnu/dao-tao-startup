"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, X, Download, FileSpreadsheet, Eye, Printer, ArrowRight, CheckCircle2, DollarSign, CreditCard, AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const mockStudents: any[] = [];

const initialTuitionSettings = [
  { class: 'A1', fee: 500000 },
  { class: 'A2', fee: 1500000 },
  { class: 'A', fee: 1000000 },
  { class: 'B1', fee: 15000000 },
  { class: 'B2', fee: 15000000 },
  { class: 'B số tự động', fee: 16000000 },
  { class: 'B số cơ khí', fee: 15000000 },
  { class: 'C', fee: 18000000 },
  { class: 'C1', fee: 18000000 },
];

const nextStatusMap: Record<string, string> = {
  'Chờ KSK': 'Đã KSK',
  'Đã KSK': 'Nộp HS',
  'Nộp HS': 'Đang học',
  'Đang học': 'Đang thi',
  'Đang thi': 'Đã đậu',
};

function getStatusColor(status: string) {
  if (status === 'Chờ KSK') return 'bg-yellow-100 text-yellow-700';
  if (status === 'Đang thi') return 'bg-purple-100 text-purple-700';
  if (status === 'Đã đậu') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Thi lại') return 'bg-red-100 text-red-700';
  if (status === 'Nghỉ học') return 'bg-slate-200 text-slate-700';
  return 'bg-blue-100 text-blue-700';
}

export function StudentsView() {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [activeStatus, setActiveStatus] = useState('Tất cả');
  const [studentsList, setStudentsList] = useState<any[]>(mockStudents);
  const [tuitionConfig, setTuitionConfig] = useState(initialTuitionSettings);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<any>(null);
  const [studentToMoveStep, setStudentToMoveStep] = useState<any>(null);

  const supabase = createClient();
  
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      if (data) {
        const mapped = data.map(s => {
          let progress = [true, true, true, false];
          try {
            if (s.progress_status) {
              const p = typeof s.progress_status === 'string' ? JSON.parse(s.progress_status) : s.progress_status;
              if (Array.isArray(p)) progress = p;
            }
          } catch(e) {}
          
          return {
            id: s.id,
            name: s.full_name,
            phone: s.phone || '',
            class: s.license_class || 'B số tự động',
            instructor: s.instructor_name || '',
            enrollDate: s.enroll_date || new Date().toISOString().split('T')[0],
            tuitionPaid: s.tuition_paid || 0,
            status: s.status || 'Chờ KSK',
            progress: progress,
            statusColor: getStatusColor(s.status || 'Chờ KSK'),
            dob: s.dob || '',
            cid: s.cid || '',
            address: s.address || '',
            referrer: s.referrer_name || ''
          };
        });
        setStudentsList(mapped);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách học viên:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    const fd = new FormData(e.currentTarget);
    const dbPayload = {
      full_name: fd.get('name') as string,
      phone: fd.get('phone') as string,
      license_class: fd.get('class') as string,
      instructor_name: fd.get('instructor') as string,
      dob: fd.get('dob') as string || null,
      cid: fd.get('cid') as string,
      address: fd.get('address') as string,
      referrer_name: fd.get('referrer') as string,
      enroll_date: fd.get('enrollDate') as string || new Date().toISOString().split('T')[0],
      tuition_paid: Number(fd.get('tuitionPaid')) || 0,
      status: 'Đang học',
      progress_status: JSON.stringify([false, false, false, false])
    };

    try {
      const { error } = await supabase.from('students').insert([dbPayload]);
      if (error) {
        console.error('Insert error:', error);
        alert('Lỗi thêm học viên: ' + error.message);
        return;
      }
    } catch (err: any) {
      console.error(err);
      alert('Lỗi không xác định: ' + err.message);
      return;
    } finally {
      setIsSyncing(false);
    }
    
    await fetchStudents();
    setIsAddModalOpen(false);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForDetail) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('students').update({
        full_name: selectedStudentForDetail.name,
        phone: selectedStudentForDetail.phone,
        license_class: selectedStudentForDetail.class,
        instructor_name: selectedStudentForDetail.instructor,
        status: selectedStudentForDetail.status,
        dob: selectedStudentForDetail.dob,
        cid: selectedStudentForDetail.cid,
        address: selectedStudentForDetail.address,
        referrer_name: selectedStudentForDetail.referrer
      }).eq('id', selectedStudentForDetail.id);
      
      if (error) throw error;
      
      setStudentsList(prev => prev.map(s => s.id === selectedStudentForDetail.id ? {...selectedStudentForDetail, statusColor: getStatusColor(selectedStudentForDetail.status)} : s));
      setSelectedStudentForDetail(null);
    } catch (error) {
      console.error("Error updating student", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMoveStep = async () => {
    if (!studentToMoveStep) return;
    const next = nextStatusMap[studentToMoveStep.status];
    if (!next) return;
    try {
      await supabase.from('students').update({ status: next }).eq('id', studentToMoveStep.id);
      await fetchStudents();
      setStudentToMoveStep(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;
    setIsSyncing(true);
    try {
      const newTotal = selectedStudentForPayment.tuitionPaid + Number(paymentAmount);
      await supabase.from('students').update({ tuition_paid: newTotal }).eq('id', selectedStudentForPayment.id);
      await fetchStudents();
      setIsPaymentModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa học viên này?')) {
      try {
        await supabase.from('students').delete().eq('id', id);
        await fetchStudents();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredStudents = studentsList.filter(student => {
    const matchStatus = activeStatus === 'Tất cả' || student.status.includes(activeStatus) || student.status === activeStatus;
    
    let matchTab = true;
    if (activeTab === 'Xe máy') {
      matchTab = ['A1', 'A', 'A2'].includes(student.class);
    } else if (activeTab === 'Ô tô') {
      matchTab = ['B1', 'B2', 'B số tự động', 'B số cơ khí', 'C', 'C1'].includes(student.class);
    }
    
    return matchStatus && matchTab;
  });

  const calculateStatusFilters = () => {
    const counts: Record<string, number> = { 'Tất cả': studentsList.length };
    ['KSK', 'Đã KSK', 'Nộp HS', 'Đang học', 'Đang thi', 'Đã đậu', 'Thi lại', 'Nghỉ học'].forEach(status => {
      counts[status] = studentsList.filter(s => s.status === status).length;
    });
    return [
      { label: 'Tất cả', count: counts['Tất cả'] },
      { label: 'KSK', count: counts['KSK'] },
      { label: 'Đã KSK', count: counts['Đã KSK'] },
      { label: 'Nộp HS', count: counts['Nộp HS'] },
      { label: 'Đang học', count: counts['Đang học'] },
      { label: 'Đang thi', count: counts['Đang thi'] },
      { label: 'Đã đậu', count: counts['Đã đậu'] },
      { label: 'Thi lại', count: counts['Thi lại'] },
      { label: 'Nghỉ học', count: counts['Nghỉ học'] },
    ];
  };

  const dynamicStatusFilters = calculateStatusFilters();

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Học viên</h1>
          <p className="text-sm text-slate-500 mt-1">{filteredStudents.length} / {studentsList.length} học viên</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
            <FileSpreadsheet className="w-4 h-4" /> Tải file mẫu CSV
          </button>
          <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
            <FileSpreadsheet className="w-4 h-4" /> Nhập CSV
          </button>
          <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
            <FileSpreadsheet className="w-4 h-4" /> Xuất
          </button>
          <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
            <Printer className="w-4 h-4" /> In
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#5b21b6] hover:bg-[#4c1d95] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Main Tabs (Tất cả, Xe máy, Ô tô) */}
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-slate-100">
          {['Tất cả', 'Xe máy', 'Ô tô'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-[#5b21b6] text-[#5b21b6]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Status Filters (Sub-tabs) */}
        <div className="px-6 py-4 border-b border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {dynamicStatusFilters.map(filter => {
              return (
              <button
                key={filter.label}
                onClick={() => setActiveStatus(filter.label)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  activeStatus === filter.label 
                    ? 'bg-[#5b21b6] text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeStatus === filter.label ? 'bg-white/20' : 'bg-white text-slate-500'}`}>
                  {filter.count}
                </span>
              </button>
            )})}
          </div>
        </div>

        {/* Search & Date Filters */}
        <div className="p-6 bg-slate-50/50 flex flex-wrap gap-4 items-end border-b border-slate-100">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Từ ngày</label>
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Đến ngày</label>
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Hạng bằng</label>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6] min-w-[120px]">
              <option>Tất cả hạng</option>
              <option>A1</option>
              <option>A</option>
              <option>B số tự động</option>
              <option>B số cơ khí</option>
              <option>C1</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Tên / SĐT / CCCD..." className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]" />
            </div>
          </div>
          <button className="text-slate-500 hover:text-red-500 text-sm font-medium px-2 py-2 transition-colors">
            x Xóa lọc
          </button>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="px-6 py-4 font-semibold">Họ và Tên</th>
                <th className="px-6 py-4 font-semibold text-center">Hạng</th>
                <th className="px-6 py-4 font-semibold text-center">Giáo viên</th>
                <th className="px-6 py-4 font-semibold">Ngày ĐK</th>
                <th className="px-6 py-4 font-semibold">Tiến độ</th>
                <th className="px-6 py-4 font-semibold min-w-[150px]">Học phí</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-[#5b21b6] bg-indigo-50 px-2 py-1 rounded-md text-xs">{student.class}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700 whitespace-nowrap">
                    {student.instructor}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{student.enrollDate}</td>
                  
                  {/* Progress Dots */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {student.progress.map((done: boolean, idx: number) => (
                        <div key={idx} className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </td>
                  
                  {/* Tuition Progress */}
                  <td className="px-6 py-4">
                    {(() => {
                      const totalFee = tuitionConfig.find(c => c.class === student.class)?.fee || 0;
                      const debt = totalFee - student.tuitionPaid;
                      const percent = totalFee > 0 ? (student.tuitionPaid / totalFee) * 100 : 100;
                      
                      return (
                        <div className="flex flex-col gap-1.5">
                          {debt > 0 ? (
                            <span className="font-bold text-red-600">Nợ: {debt.toLocaleString('vi-VN')}đ</span>
                          ) : debt < 0 ? (
                            <span className="font-bold text-emerald-600">Thừa: {Math.abs(debt).toLocaleString('vi-VN')}đ</span>
                          ) : (
                            <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Đủ học phí</span>
                          )}
                          {totalFee > 0 && debt > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-[#5b21b6] h-1.5 rounded-full transition-all" 
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${student.statusColor}`}>
                      {student.status}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedStudentForPayment(student); setPaymentAmount(''); setIsPaymentModalOpen(true); }} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center transition-colors" title="Nộp bổ sung học phí">
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button onClick={() => setStudentToMoveStep(student)} className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors" title="Chuyển bước">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedStudentForDetail(student); }} className="w-8 h-8 rounded-lg bg-[#5b21b6]/5 hover:bg-[#5b21b6]/10 text-[#5b21b6] border border-[#5b21b6]/10 flex items-center justify-center transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteStudent(student.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 flex items-center justify-center transition-colors">
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

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Modal Thêm học viên */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Thêm học viên mới</h2>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Họ và tên <span className="text-red-500">*</span></label>
                <input name="name" type="text" required placeholder="Nhập họ và tên" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số điện thoại</label>
                <input name="phone" type="text" placeholder="09xxxxxxxx" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Người giới thiệu</label>
                <input name="referrer" type="text" placeholder="Tên người giới thiệu" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Giáo viên hướng dẫn</label>
                <input name="instructor" type="text" placeholder="Tên giáo viên" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày sinh</label>
                <input name="dob" type="date" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">CCCD / CMND</label>
                <input name="cid" type="text" placeholder="Số CCCD" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạng bằng <span className="text-red-500">*</span></label>
                <select name="class" required className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all bg-white">
                  <option value="">-- Chọn hạng --</option>
                  <option value="A1">A1</option><option value="A">A</option><option value="B số tự động">B số tự động</option><option value="B số cơ khí">B số cơ khí</option><option value="C1">C1</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày đăng ký</label>
                <input name="enrollDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Học phí (VNĐ)</label>
                <input name="tuitionPaid" type="text" placeholder="Ví dụ: 4000000" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Địa chỉ</label>
                <input name="address" type="text" placeholder="Địa chỉ chi tiết" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
              <button type="submit" disabled={isSyncing} className="px-5 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors flex items-center gap-2">
                {isSyncing ? 'Đang lưu...' : 'Lưu & Mở hồ sơ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Slide Over Chi Tiết Học Viên */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedStudentForDetail(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col slide-in-from-right-full duration-300">
            
            {/* Slide Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#5b21b6] text-white flex items-center justify-center text-xl font-bold">
                  {selectedStudentForDetail.name?.charAt(0) || 'H'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedStudentForDetail.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-white bg-[#5b21b6] px-2 py-0.5 rounded-md">{selectedStudentForDetail.class}</span>
                    <span className="text-sm text-slate-500">{selectedStudentForDetail.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedStudentForDetail.statusColor}`}>
                  {selectedStudentForDetail.status}
                </span>
                <button onClick={() => setSelectedStudentForDetail(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Tabs */}
            <div className="flex items-center gap-6 px-6 border-b border-slate-100">
              {['Hồ sơ', 'KSK', 'Tiến độ học', 'Lịch thi & KQ', 'Học phí', 'Lịch sử'].map(tab => (
                <button key={tab} className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'Hồ sơ' ? 'border-[#5b21b6] text-[#5b21b6]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Slide Body */}
            <form onSubmit={handleUpdateStudent} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Họ và tên <span className="text-red-500">*</span></label>
                  <input type="text" value={selectedStudentForDetail.name} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ngày sinh</label>
                  <input type="date" value={selectedStudentForDetail.dob || ''} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, dob: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Giới tính</label>
                  <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]">
                    <option>Nam</option><option>Nữ</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Số điện thoại</label>
                  <input type="text" value={selectedStudentForDetail.phone} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, phone: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Người giới thiệu</label>
                  <input type="text" value={selectedStudentForDetail.referrer || ''} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, referrer: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Giáo viên hướng dẫn</label>
                  <input type="text" value={selectedStudentForDetail.instructor || ''} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, instructor: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">CCCD / CMND</label>
                  <input type="text" value={selectedStudentForDetail.cid || ''} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, cid: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hạng bằng <span className="text-red-500">*</span></label>
                  <select value={selectedStudentForDetail.class} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, class: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]">
                    <option value="A1">A1</option>
                    <option value="A">A</option>
                    <option value="B số tự động">B số tự động</option>
                    <option value="B số cơ khí">B số cơ khí</option>
                    <option value="C1">C1</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ngày đăng ký</label>
                  <input type="text" disabled value={new Date(selectedStudentForDetail.enrollDate).toLocaleDateString('vi-VN')} className="w-full border border-slate-300 bg-slate-50 rounded-lg px-3 py-2 text-sm outline-none" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Địa chỉ</label>
                  <input type="text" value={selectedStudentForDetail.address || ''} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, address: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]" />
                </div>
                
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Trạng thái</label>
                  <select value={selectedStudentForDetail.status} onChange={e => setSelectedStudentForDetail({...selectedStudentForDetail, status: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5b21b6]">
                    <option value="Chờ KSK">Chờ KSK</option>
                    <option value="Đã KSK">Đã KSK</option>
                    <option value="Nộp HS">Nộp HS</option>
                    <option value="Đang học">Đang học</option>
                    <option value="Đang thi">Đang thi</option>
                    <option value="Đã đậu">Đã đậu</option>
                    <option value="Thi lại">Thi lại</option>
                    <option value="Nghỉ học">Nghỉ học</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="submit" disabled={isSyncing} className="px-6 py-2.5 bg-[#5b21b6] text-white font-bold rounded-lg shadow-md hover:bg-[#4c1d95] transition-all disabled:opacity-70 flex items-center gap-2">
                  {isSyncing ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Chuyển bước */}
      {studentToMoveStep && (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <AlertTriangle className="w-5 h-5" />
                Xác nhận
              </div>
              <button onClick={() => setStudentToMoveStep(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-5 pb-6">
              <p className="text-slate-700 text-sm mb-2">Chuyển bước học viên <strong className="text-slate-900">{studentToMoveStep.name}</strong>?</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500 font-medium">{studentToMoveStep.status}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-[#5b21b6]">{nextStatusMap[studentToMoveStep.status] || 'Hết bước'}</span>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setStudentToMoveStep(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
              <button onClick={handleMoveStep} disabled={!nextStatusMap[studentToMoveStep?.status]} className="px-4 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {nextStatusMap[studentToMoveStep?.status] ? `Chuyển sang ${nextStatusMap[studentToMoveStep?.status]}` : 'Không thể chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedStudentForPayment && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                Nộp bổ sung học phí
              </h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePayment} className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                <p className="text-sm text-slate-500 mb-1">Học viên</p>
                <p className="font-bold text-slate-800 text-base">{selectedStudentForPayment.name}</p>
                <div className="mt-3 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Đã đóng:</span>
                  <span className="font-bold text-emerald-600">{selectedStudentForPayment.tuitionPaid.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="mt-1 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Tổng học phí:</span>
                  <span className="font-bold text-slate-700">{(tuitionConfig.find(c => c.class === selectedStudentForPayment.class)?.fee || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Số tiền nộp thêm (VNĐ)</label>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-lg"
                  placeholder="Ví dụ: 1000000"
                  required
                  min={10000}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSyncing ? 'Đang lưu...' : 'Xác nhận nộp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
