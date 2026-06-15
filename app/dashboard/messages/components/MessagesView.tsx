"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bot, CheckCircle2, AlertTriangle, Info, CreditCard
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const initialTuitionSettings = [
  { id: 1, class: 'A1', fee: 2000000, description: 'Bằng lái xe máy hạng A1' },
  { id: 2, class: 'A', fee: 4000000, description: 'Bằng lái xe máy hạng A' },
  { id: 3, class: 'B số tự động', fee: 15000000, description: 'Bằng lái xe ô tô hạng B tự động' },
  { id: 4, class: 'B số cơ khí', fee: 14000000, description: 'Bằng lái xe ô tô hạng B cơ khí' },
  { id: 5, class: 'C1', fee: 18000000, description: 'Bằng lái xe ô tô tải hạng C1' },
];

export function MessagesView() {
  const [students, setStudents] = useState<any[]>([]);
  const [tuitionMap, setTuitionMap] = useState<Record<string, number>>({});
  const supabase = createClient();
  
  useEffect(() => {
    let settings = initialTuitionSettings;
    const saved = localStorage.getItem('tuitionSettings');
    if (saved) {
      try { settings = JSON.parse(saved); } catch(e) {}
    }
    const map: Record<string, number> = {};
    settings.forEach(s => { map[s.class] = s.fee; });
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
  
  // Logic processing for bot notifications
  const notifications = useMemo(() => {
    return students.map(student => {
      const total = tuitionMap[student.license_class] || 12000000;
      const paid = Number(student.tuition_paid || 0);
      const diff = paid - total;
      
      let statusType = 'ok';
      let message = '';
      
      if (diff === 0) {
        statusType = 'success';
        message = `Hoàn thành học phí.`;
      } else if (diff < 0) {
        statusType = 'warning';
        message = `Còn nợ (thiếu) ${Math.abs(diff).toLocaleString('vi-VN')}đ.`;
      } else {
        statusType = 'info';
        message = `Nộp thừa, cần trả lại ${diff.toLocaleString('vi-VN')}đ.`;
      }

      return {
        id: student.id,
        name: student.full_name,
        class: student.license_class,
        total: total,
        paid: paid,
        diff,
        statusType,
        message,
        timestamp: new Date(student.created_at).toLocaleDateString('vi-VN')
      };
    });
  }, [students, tuitionMap]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#5b21b6] text-white rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">BOT Thông báo</h1>
            <p className="text-sm text-slate-500 mt-1">Cập nhật tự động tình trạng học phí (A1, A, B số tự động, B số cơ khí, C1)</p>
          </div>
        </div>
        <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Hệ thống đang hoạt động
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((noti) => (
          <div key={noti.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            
            {/* Icon based on status */}
            <div className="mt-1 flex-shrink-0">
              {noti.statusType === 'success' && (
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              {noti.statusType === 'warning' && (
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              {noti.statusType === 'info' && (
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base">{noti.name}</h3>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Hạng {noti.class}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{noti.timestamp}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Tổng HP: <strong>{noti.total.toLocaleString('vi-VN')}đ</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Đã nộp: <strong>{noti.paid.toLocaleString('vi-VN')}đ</strong></span>
                </div>
              </div>

              {/* Bot Message Box */}
              <div className={`mt-3 p-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 ${
                noti.statusType === 'success' ? 'bg-emerald-50 text-emerald-700' :
                noti.statusType === 'warning' ? 'bg-orange-50 text-orange-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {noti.statusType === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {noti.statusType === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {noti.statusType === 'info' && <Info className="w-4 h-4" />}
                {noti.message}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
