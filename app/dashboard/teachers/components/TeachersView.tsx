"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, FileSpreadsheet, Printer, 
  Eye, Trash2, X, GraduationCap, CheckCircle2, Edit
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const mockTeachers = [
  { 
    id: '1', name: 'GV. Trương B', dob: '15/05/1985', cid: '079123456789', phone: '0901234567', 
    address: 'Quận 1, TP.HCM', licenseNumber: '79123456', licenseClass: 'C',
    hireDate: '10/10/2020', expireDate: '10/10/2030', teachingClass: 'B2, C1',
    certNumber: 'GCN12345', professionalQual: 'Đại học', pedagogicalQual: 'Chứng chỉ SP',
    status: 'Đang giảng dạy', statusColor: 'bg-emerald-100 text-emerald-700' 
  },
  { 
    id: '2', name: 'GV. Nguyễn C', dob: '22/08/1990', cid: '079987654321', phone: '0912345678', 
    address: 'Quận 3, TP.HCM', licenseNumber: '79987654', licenseClass: 'B2',
    hireDate: '15/12/2021', expireDate: '15/12/2031', teachingClass: 'B1, B2',
    certNumber: 'GCN67890', professionalQual: 'Cao đẳng', pedagogicalQual: 'Chứng chỉ SP',
    status: 'Đang giảng dạy', statusColor: 'bg-emerald-100 text-emerald-700' 
  },
  { 
    id: '3', name: 'GV. Lê D', dob: '10/02/1982', cid: '079111222333', phone: '0923456789', 
    address: 'Thủ Đức, TP.HCM', licenseNumber: '79111222', licenseClass: 'A1, A',
    hireDate: '05/06/2019', expireDate: '05/06/2029', teachingClass: 'A1, A',
    certNumber: 'GCN54321', professionalQual: 'Đại học', pedagogicalQual: 'Chứng chỉ SP',
    status: 'Nghỉ phép', statusColor: 'bg-amber-100 text-amber-700' 
  },
];

export function TeachersView() {
  const [teachersList, setTeachersList] = useState<any[]>(mockTeachers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('instructors').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map((t: any) => ({
          id: t.id,
          name: t.full_name,
          dob: t.dob,
          cid: t.cid,
          phone: t.phone,
          address: t.address,
          licenseNumber: t.license_number,
          licenseClass: t.license_class,
          expireDate: t.license_expiry_date,
          hireDate: t.hire_date,
          teachingClass: t.teaching_class,
          certNumber: t.cert_number,
          professionalQual: t.professional_qual,
          pedagogicalQual: t.pedagogical_qual,
          status: t.status,
          statusColor: t.status === 'Đang giảng dạy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }));
        setTeachersList(mapped);
      }
    } catch (err) {
      console.warn("Lỗi đồng bộ Supabase bảng instructors.", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) {
      setTeachersList(prev => prev.filter(t => t.id !== id));
      if (id.length > 10) {
        await supabase.from('instructors').delete().eq('id', id);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const dbPayload = {
      full_name: fd.get('name') as string,
      dob: fd.get('dob') as string || null,
      phone: fd.get('phone') as string,
      cid: fd.get('cid') as string,
      address: fd.get('address') as string,
      license_number: fd.get('licenseNumber') as string,
      license_class: fd.get('licenseClass') as string,
      license_expiry_date: fd.get('expireDate') as string || null,
      hire_date: fd.get('hireDate') as string || null,
      cert_number: fd.get('certNumber') as string,
      teaching_class: fd.get('teachingClass') as string,
      professional_qual: fd.get('professionalQual') as string,
      pedagogical_qual: fd.get('pedagogicalQual') as string,
      status: fd.get('status') as string,
    };

    try {
      if (editingTeacher && editingTeacher.id.length > 10) {
        await supabase.from('instructors').update(dbPayload).eq('id', editingTeacher.id);
      } else {
        await supabase.from('instructors').insert([dbPayload]);
      }
    } catch (err) {
      console.error(err);
    }
    
    await fetchTeachers();
    closeModals();
  };

  const openEditModal = (teacher: any) => {
    setEditingTeacher(teacher);
    setIsAddModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setEditingTeacher(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Giáo viên</h1>
          <p className="text-sm text-slate-500 mt-1">{teachersList.length} nhà giáo đang quản lý</p>
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
            <Plus className="w-4 h-4" /> Thêm giáo viên
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Search & Filters */}
        <div className="p-6 bg-slate-50/50 flex flex-wrap gap-4 items-end border-b border-slate-100">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Họ tên / SĐT / CCCD / Số GCN..." className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Hạng giảng dạy</label>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]">
              <option>Tất cả</option>
              <option>A1</option>
              <option>B1</option>
              <option>B2</option>
              <option>C</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Trạng thái</label>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#5b21b6]">
              <option>Tất cả</option>
              <option>Đang giảng dạy</option>
              <option>Nghỉ phép</option>
              <option>Đã nghỉ việc</option>
            </select>
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
                <th className="px-6 py-4 font-semibold">Họ và Tên / SĐT</th>
                <th className="px-6 py-4 font-semibold">Số GCN</th>
                <th className="px-6 py-4 font-semibold">Hạng dạy</th>
                <th className="px-6 py-4 font-semibold">Ngày trúng tuyển</th>
                <th className="px-6 py-4 font-semibold">Trình độ CM</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teachersList.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                        {teacher.name.split(' ').pop()?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{teacher.name}</p>
                        <p className="text-xs text-slate-500">{teacher.phone} • {teacher.cid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{teacher.certNumber}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#5b21b6] bg-indigo-50 px-2 py-1 rounded-md text-xs">{teacher.teachingClass}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{teacher.hireDate}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{teacher.professionalQual}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold ${teacher.statusColor}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(teacher)}
                        className="p-1.5 text-slate-400 hover:text-[#5b21b6] hover:bg-indigo-50 rounded-md transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedTeacherForDetail(teacher)}
                        className="p-1.5 text-[#5b21b6] hover:bg-indigo-50 rounded-md transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(teacher.id)}
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

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Modal Thêm / Sửa giáo viên */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {editingTeacher ? 'Chỉnh sửa thông tin nhà giáo' : 'Thêm nhà giáo mới'}
              </h2>
              <button type="button" onClick={closeModals} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                
                {/* Thông tin cá nhân */}
                <div>
                  <h3 className="text-sm font-bold text-[#5b21b6] mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Thông tin cá nhân
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Họ tên nhà giáo <span className="text-red-500">*</span></label>
                      <input name="name" type="text" defaultValue={editingTeacher?.name} required placeholder="Nhập họ và tên" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày sinh</label>
                      <input name="dob" type="date" defaultValue={editingTeacher?.dob} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số điện thoại</label>
                      <input name="phone" type="text" defaultValue={editingTeacher?.phone} placeholder="09xxxxxxxx" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số CCCD / CMND <span className="text-red-500">*</span></label>
                      <input name="cid" type="text" defaultValue={editingTeacher?.cid} placeholder="Số CCCD" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nơi cư trú</label>
                      <input name="address" type="text" defaultValue={editingTeacher?.address} placeholder="Địa chỉ thường trú" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>

                {/* Chuyên môn - Nghiệp vụ */}
                <div>
                  <h3 className="text-sm font-bold text-[#5b21b6] mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" /> Bằng cấp & Chuyên môn
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số GPLX <span className="text-red-500">*</span></label>
                      <input name="licenseNumber" type="text" defaultValue={editingTeacher?.licenseNumber} placeholder="Số Giấy phép lái xe" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạng GPLX</label>
                      <input name="licenseClass" type="text" defaultValue={editingTeacher?.licenseClass} placeholder="VD: B2, C..." className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày hết hạn GPLX</label>
                      <input name="expireDate" type="date" defaultValue={editingTeacher?.expireDate} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày trúng tuyển</label>
                      <input name="hireDate" type="date" defaultValue={editingTeacher?.hireDate} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số GCN (Chứng chỉ)</label>
                      <input name="certNumber" type="text" defaultValue={editingTeacher?.certNumber} placeholder="Số Giấy chứng nhận" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạng GP giảng dạy <span className="text-red-500">*</span></label>
                      <input name="teachingClass" type="text" defaultValue={editingTeacher?.teachingClass} placeholder="VD: B1, B2..." className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trình độ chuyên môn</label>
                      <input name="professionalQual" type="text" defaultValue={editingTeacher?.professionalQual} placeholder="VD: Đại học, Cao đẳng..." className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trình độ sư phạm</label>
                      <input name="pedagogicalQual" type="text" defaultValue={editingTeacher?.pedagogicalQual} placeholder="VD: Chứng chỉ SP" className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trạng thái làm việc</label>
                      <select name="status" defaultValue={editingTeacher?.status || 'Đang giảng dạy'} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all">
                        <option value="Đang giảng dạy">Đang giảng dạy</option>
                        <option value="Nghỉ phép">Nghỉ phép</option>
                        <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 flex-shrink-0">
              <button type="button" onClick={closeModals} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
              <button type="submit" disabled={isSyncing} className="px-5 py-2 text-sm font-bold bg-[#5b21b6] text-white rounded-lg shadow-sm hover:bg-[#4c1d95] transition-colors flex items-center gap-2">
                {isSyncing ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Slide Over Chi Tiết */}
      {selectedTeacherForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTeacherForDetail(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col slide-in-from-right-full duration-300">
            
            {/* Slide Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#5b21b6] text-white flex items-center justify-center text-xl font-bold">
                  {selectedTeacherForDetail.name.split(' ').pop()?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedTeacherForDetail.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[#5b21b6] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      Hạng dạy: {selectedTeacherForDetail.teachingClass}
                    </span>
                    <span className="text-sm text-slate-500">{selectedTeacherForDetail.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedTeacherForDetail.statusColor}`}>
                  {selectedTeacherForDetail.status}
                </span>
                <button onClick={() => setSelectedTeacherForDetail(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">Thông tin liên hệ & Cá nhân</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Ngày sinh</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.dob}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Số CCCD</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.cid}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block mb-0.5">Nơi cư trú</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.address}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">Bằng cấp & Giấy phép</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Số GPLX</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.licenseNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Hạng GPLX</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.licenseClass}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Ngày hết hạn GPLX</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.expireDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Số GCN sư phạm</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.certNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Trình độ chuyên môn</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.professionalQual}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Trình độ sư phạm</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.pedagogicalQual}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Ngày trúng tuyển</span>
                    <span className="font-semibold text-slate-800">{selectedTeacherForDetail.hireDate}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
