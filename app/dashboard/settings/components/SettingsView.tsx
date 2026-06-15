"use client";

import React, { useState } from 'react';
import { 
  Settings, CreditCard, Save, CheckCircle2, AlertTriangle, Info
} from 'lucide-react';

const initialTuitionSettings = [
  { class: 'A1', fee: 2000000 },
  { class: 'A', fee: 4000000 },
  { class: 'B số tự động', fee: 15000000 },
  { class: 'B số cơ khí', fee: 14000000 },
  { class: 'C1', fee: 18000000 },
];

export function SettingsView() {
  const [tuitionSettings, setTuitionSettings] = useState(initialTuitionSettings);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('tuitionSettings');
    if (saved) {
      try {
        setTuitionSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('tuitionSettings', JSON.stringify(tuitionSettings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFeeChange = (index: number, newFee: string) => {
    const numericFee = parseInt(newFee.replace(/\D/g, ''), 10) || 0;
    const newSettings = [...tuitionSettings];
    newSettings[index].fee = numericFee;
    setTuitionSettings(newSettings);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#5b21b6] text-white rounded-full flex items-center justify-center shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cài đặt hệ thống</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý cấu hình chung và định mức học phí cho các hạng bằng</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#5b21b6] hover:bg-[#4c1d95] text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm"
        >
          <Save className="w-4 h-4" /> Lưu cài đặt
        </button>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">Lưu cài đặt học phí thành công!</span>
          <span className="text-sm ml-auto">Hệ thống BOT và phần mềm đã cập nhật dữ liệu mới.</span>
        </div>
      )}

      {/* Tuition Config Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-[#5b21b6]" />
          <h2 className="text-lg font-bold text-slate-800">Cài đặt Học phí các Hạng Bằng</h2>
        </div>
        
        <div className="p-6">
          <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3 mb-6">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Liên kết dữ liệu tự động:</p>
              <p className="mt-1">Định mức học phí dưới đây sẽ được <strong>BOT Thông báo</strong> và <strong>Phân hệ Học phí</strong> sử dụng để đối soát (kiểm tra học viên đã hoàn thành học phí, nộp thiếu hay nộp thừa). Vui lòng cập nhật chính xác.</p>
            </div>
          </div>

          <div className="space-y-4 max-w-2xl">
            {tuitionSettings.map((item, index) => (
              <div key={item.class} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-[#5b21b6] transition-colors bg-slate-50/30">
                <div className="w-32 flex-shrink-0">
                  <span className="font-bold text-slate-700">Hạng {item.class}</span>
                </div>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={item.fee.toLocaleString('vi-VN')}
                    onChange={(e) => handleFeeChange(index, e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 font-bold outline-none focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">VNĐ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
