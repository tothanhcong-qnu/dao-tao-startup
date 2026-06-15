"use client";

import React from 'react';
import { UserPlus, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';

// Mock Data
const mockInstructors = [
  { id: '1', name: 'Nguyễn Văn A', license: 'B2, C', licenseExpiry: '2026-06-25', certExpiry: '2027-01-10', status: 'Active' }, // 18 days (Yellow)
  { id: '2', name: 'Trần Thị B', license: 'B1, B2', licenseExpiry: '2028-05-12', certExpiry: '2028-08-20', status: 'Active' },
  { id: '3', name: 'Lê Văn C', license: 'C', licenseExpiry: '2026-06-15', certExpiry: '2026-06-20', status: 'Active' }, // 8 days (Red)
  { id: '4', name: 'Phạm Thị D', license: 'B2', licenseExpiry: '2029-11-01', certExpiry: '2029-12-01', status: 'Inactive' },
];


function getExpiryColor(expiryDateStr: string) {
  const expiryDate = new Date(expiryDateStr);
  expiryDate.setHours(0, 0, 0, 0);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 15) return 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded';
  if (diffDays <= 30) return 'text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded';
  return 'text-slate-900';
}

function getDaysRemaining(expiryDateStr: string) {
  const expiryDate = new Date(expiryDateStr);
  expiryDate.setHours(0, 0, 0, 0);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - currentDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function InstructorsView() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Giáo Viên</h1>
          <p className="text-slate-500 mt-1">Hồ sơ giáo viên và thời hạn giấy tờ.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">
          <UserPlus className="w-5 h-5" />
          Thêm Giáo Viên
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Tìm kiếm giáo viên..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold">Họ và Tên</th>
                <th className="px-6 py-4 font-semibold">Hạng Giảng Dạy</th>
                <th className="px-6 py-4 font-semibold">Hạn GPLX</th>
                <th className="px-6 py-4 font-semibold">Hạn Chứng Chỉ Sư Phạm</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockInstructors.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{instructor.name}</td>
                  <td className="px-6 py-4 font-semibold text-indigo-700">{instructor.license}</td>
                  <td className="px-6 py-4">
                    <span className={getExpiryColor(instructor.licenseExpiry)}>
                      {instructor.licenseExpiry} 
                      {getDaysRemaining(instructor.licenseExpiry) <= 30 && ` (${getDaysRemaining(instructor.licenseExpiry)} ngày)`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getExpiryColor(instructor.certExpiry)}>
                      {instructor.certExpiry}
                      {getDaysRemaining(instructor.certExpiry) <= 30 && ` (${getDaysRemaining(instructor.certExpiry)} ngày)`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      instructor.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {instructor.status === 'Active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {instructor.status}
                    </span>
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
