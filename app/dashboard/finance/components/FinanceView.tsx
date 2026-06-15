"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, CreditCard, CheckCircle2, AlertCircle, UserX, Search, Eye, DollarSign, X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const initialTuitionSettings = [
  { class: 'A1', fee: 2000000 },
  { class: 'A', fee: 4000000 },
  { class: 'B số tự động', fee: 15000000 },
  { class: 'B số cơ khí', fee: 14000000 },
  { class: 'C1', fee: 18000000 },
];

export function FinanceView() {
  const [students, setStudents] = useState<any[]>([]);
  const [tuitionMap, setTuitionMap] = useState<Record<string, number>>({});
  const supabase = createClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tuitionSettings');
    let settings = initialTuitionSettings;
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch (e) {}
    }
    const map: Record<string, number> = {};
    settings.forEach(s => { map[s.class] = s.fee; });
    // alias
    map['B1'] = map['B số tự động'] || 15000000;
    map['B2'] = map['B số cơ khí'] || 14000000;
    map['C'] = map['C1'] || 18000000;
    setTuitionMap(map);

    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('created_at', { ascending: false });
    if (data) setStudents(data);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !paymentAmount) return;
    
    const amountToPay = Number(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert("Số tiền không hợp lệ");
      return;
    }

    setIsSyncing(true);
    try {
      const newPaid = Number(selectedStudent.tuition_paid || 0) + amountToPay;
      const { error } = await supabase.from('students').update({ tuition_paid: newPaid }).eq('id', selectedStudent.id);
      if (error) throw error;
      
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, tuition_paid: newPaid } : s));
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setSelectedStudent(null);
    } catch (err: any) {
      alert("Lỗi thanh toán: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  let totalTuitionAll = 0;
  let totalPaidAll = 0;
  let totalDebtAll = 0;
  let countDebt = 0;

  const processedStudents = students.map(s => {
    const total = tuitionMap[s.license_class] || 12000000;
    const paid = Number(s.tuition_paid || 0);
    const debt = Math.max(0, total - paid);
    const progress = total > 0 ? Math.round((paid / total) * 100) : 0;
    
    totalTuitionAll += total;
    totalPaidAll += paid;
    totalDebtAll += debt;
    if (debt > 0) countDebt++;

    return { ...s, total, paid, debt, progress };
  });

  const filteredStudents = processedStudents.filter(s => {
    if (filterStatus === 'Còn nợ' && s.debt <= 0) return false;
    if (filterStatus === 'Đã hoàn thành' && s.debt > 0) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!s.full_name?.toLowerCase().includes(lower) && !s.phone?.includes(lower)) return false;
    }
    return true;
  });

  const summaryCards = [
    { title: 'Tổng học phí', value: `${totalTuitionAll.toLocaleString('vi-VN')}đ`, icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Đã thu', value: `${totalPaidAll.toLocaleString('vi-VN')}đ`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Còn nợ', value: `${totalDebtAll.toLocaleString('vi-VN')}đ`, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'HV còn nợ', value: countDebt.toString(), icon: UserX, color: 'text-[#5b21b6]', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Học phí</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi thu, nợ học phí của tất cả học viên</p>
        </div>
        <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm">
          <FileSpreadsheet className="w-4 h-4" /> Xuất báo cáo
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${card.bg} ${card.color}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">{card.value}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{card.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Filters */}
        <div className="p-6 bg-slate-50/50 flex flex-wrap gap-4 items-end border-b border-slate-100">
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái nợ</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]"
            >
              <option>Tất cả</option>
              <option>Còn nợ</option>
              <option>Đã hoàn thành</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[300px]">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tìm học viên</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên / SĐT..." 
                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]" 
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-2">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr className="text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Học viên</th>
                <th className="px-6 py-4 font-semibold text-center">Hạng</th>
                <th className="px-6 py-4 font-semibold">Tổng HP</th>
                <th className="px-6 py-4 font-semibold">Đã đóng</th>
                <th className="px-6 py-4 font-semibold">Còn nợ</th>
                <th className="px-6 py-4 font-semibold">Tiến độ</th>
                <th className="px-6 py-4 font-semibold">Lần cuối</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy học viên nào.
                  </td>
                </tr>
              ) : filteredStudents.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{item.full_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-[#5b21b6] bg-indigo-50 px-2 py-1 rounded-md text-xs">{item.license_class}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {item.total.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-500">
                    {item.paid.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 font-bold text-red-500">
                    {item.debt.toLocaleString('vi-VN')}đ
                  </td>
                  
                  {/* Progress Bar */}
                  <td className="px-6 py-4 min-w-[150px]">
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex-1">
                        <div 
                          className="bg-[#2563eb] h-1.5 rounded-full" 
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500 w-8">{item.progress}%</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Date(item.updated_at || item.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors shadow-sm" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedStudent(item);
                          setPaymentAmount('');
                          setIsPaymentModalOpen(true);
                        }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md border border-emerald-100 transition-colors shadow-sm" title="Nộp bổ sung học phí">
                        <DollarSign className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
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
                <p className="font-bold text-slate-800 text-base">{selectedStudent.full_name}</p>
                <div className="mt-3 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Đã đóng:</span>
                  <span className="font-bold text-emerald-600">{selectedStudent.paid.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="mt-1 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Còn nợ:</span>
                  <span className="font-bold text-red-500">{selectedStudent.debt.toLocaleString('vi-VN')}đ</span>
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

              <div className="flex gap-3 pt-4">
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
