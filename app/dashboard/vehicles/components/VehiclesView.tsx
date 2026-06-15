"use client";

import React, { useState, useEffect } from 'react';
import { CarFront, Search, Plus, CheckCircle2, Edit, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

// Mock Data
const mockVehicles = [
  { id: '1', plate: '51H-123.45', type: 'B2 (Số sàn)', regExpiry: '2026-06-12', permitExpiry: '2026-10-15', contractExpiry: '2027-01-01', status: 'Active' }, // 5 days (Red)
  { id: '2', plate: '51H-987.65', type: 'B1 (Số tự động)', regExpiry: '2027-02-20', permitExpiry: '2027-02-20', contractExpiry: '2028-05-10', status: 'Active' },
  { id: '3', plate: '51C-456.78', type: 'C (Tải)', regExpiry: '2026-06-25', permitExpiry: '2026-06-17', contractExpiry: '2026-06-30', status: 'Active' }, // Reg 18d (Yellow), Permit 10d (Red)
  { id: '4', plate: '51H-111.22', type: 'B2 (Số sàn)', regExpiry: '2028-01-05', permitExpiry: '2028-01-05', contractExpiry: '2029-01-05', status: 'Maintenance' },
];

const CURRENT_DATE = new Date('2026-06-07');

function getExpiryColor(expiryDateStr: string) {
  const expiryDate = new Date(expiryDateStr);
  const diffTime = expiryDate.getTime() - CURRENT_DATE.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 15) return 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded';
  if (diffDays <= 30) return 'text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded';
  return 'text-slate-900';
}

function getDaysRemaining(expiryDateStr: string) {
  const expiryDate = new Date(expiryDateStr);
  const diffTime = expiryDate.getTime() - CURRENT_DATE.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function VehiclesView() {
  const [vehiclesList, setVehiclesList] = useState<any[]>(mockVehicles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('vehicles').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map((v: any) => ({
          id: v.id,
          plate: v.license_plate,
          type: v.vehicle_type,
          regExpiry: v.registration_expiry_date,
          permitExpiry: v.permit_expiry_date,
          contractExpiry: v.contract_expiry_date,
          status: v.status
        }));
        setVehiclesList(mapped);
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ Supabase bảng vehicles.", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phương tiện này?')) {
      // Local UI update first for speed
      setVehiclesList(prev => prev.filter(v => v.id !== id));
      // Sync delete
      if (id.length > 10) { // Check if UUID (real from supabase)
        await supabase.from('vehicles').delete().eq('id', id);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const dbPayload = {
      license_plate: fd.get('plate') as string,
      vehicle_type: fd.get('type') as string,
      registration_expiry_date: fd.get('regExpiry') as string || null,
      permit_expiry_date: fd.get('permitExpiry') as string || null,
      contract_expiry_date: fd.get('contractExpiry') as string || null,
      status: fd.get('status') as string,
    };

    try {
      if (editingVehicle && editingVehicle.id.length > 10) {
        // Update existing in supabase
        await supabase.from('vehicles').update(dbPayload).eq('id', editingVehicle.id);
      } else {
        // Insert new into supabase
        const { error } = await supabase.from('vehicles').insert([dbPayload]);
        if (error) {
          // If error (e.g. table doesn't exist), just do local update
          console.warn("Lỗi lưu Supabase:", error.message);
        }
      }
    } catch (err) {
      console.error(err);
    }
    
    // Always refresh data
    await fetchVehicles();
    closeModals();
  };

  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Xe Tập Lái</h1>
          <p className="text-slate-500 mt-1">Danh sách phương tiện và quản lý thời hạn giấy tờ xe.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors shadow-sm text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Tải file mẫu CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors shadow-sm text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Nhập file CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Xe Mới
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Tìm kiếm biển số xe..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold">Biển Số Xe</th>
                <th className="px-6 py-4 font-semibold">Loại Xe</th>
                <th className="px-6 py-4 font-semibold">Hạn Đăng Kiểm</th>
                <th className="px-6 py-4 font-semibold">Hạn GP Tập Lái</th>
                <th className="px-6 py-4 font-semibold">Hạn Hợp Đồng</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehiclesList.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{vehicle.plate}</td>
                  <td className="px-6 py-4 font-medium text-indigo-700">{vehicle.type}</td>
                  <td className="px-6 py-4">
                    <span className={getExpiryColor(vehicle.regExpiry)}>
                      {vehicle.regExpiry} 
                      {getDaysRemaining(vehicle.regExpiry) <= 30 && ` (${getDaysRemaining(vehicle.regExpiry)} ngày)`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getExpiryColor(vehicle.permitExpiry)}>
                      {vehicle.permitExpiry}
                      {getDaysRemaining(vehicle.permitExpiry) <= 30 && ` (${getDaysRemaining(vehicle.permitExpiry)} ngày)`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getExpiryColor(vehicle.contractExpiry)}>
                      {vehicle.contractExpiry}
                      {getDaysRemaining(vehicle.contractExpiry) <= 30 && ` (${getDaysRemaining(vehicle.contractExpiry)} ngày)`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      vehicle.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {vehicle.status === 'Active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(vehicle)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
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

      {/* Modal Thêm / Sửa Xe */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingVehicle ? 'Chỉnh sửa phương tiện' : 'Thêm xe mới'}
              </h2>
              <button type="button" onClick={closeModals} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Biển số xe <span className="text-red-500">*</span></label>
                <input name="plate" type="text" defaultValue={editingVehicle?.plate} required placeholder="51H-123.45" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Loại xe <span className="text-red-500">*</span></label>
                <select name="type" defaultValue={editingVehicle?.type || 'B2 (Số sàn)'} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all bg-white">
                  <option value="A1 (Mô tô)">A1 (Mô tô)</option>
                  <option value="B1 (Số tự động)">B1 (Số tự động)</option>
                  <option value="B2 (Số sàn)">B2 (Số sàn)</option>
                  <option value="C (Tải)">C (Tải)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạn đăng kiểm</label>
                <input name="regExpiry" type="date" defaultValue={editingVehicle?.regExpiry} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạn GP tập lái</label>
                <input name="permitExpiry" type="date" defaultValue={editingVehicle?.permitExpiry} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạn hợp đồng</label>
                <input name="contractExpiry" type="date" defaultValue={editingVehicle?.contractExpiry} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trạng thái</label>
                <select name="status" defaultValue={editingVehicle?.status || 'Active'} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all bg-white">
                  <option value="Active">Đang hoạt động</option>
                  <option value="Maintenance">Đang bảo trì</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={closeModals} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
              <button type="submit" disabled={isSyncing} className="px-5 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors flex items-center gap-2">
                {isSyncing ? 'Đang lưu...' : 'Lưu phương tiện'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
