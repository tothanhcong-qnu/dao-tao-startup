"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Clock, CheckCircle2, AlertCircle, Edit, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const CURRENT_DATE = new Date('2026-06-07');

function getDeadlineCountdown(deadlineStr: string, status: string) {
  if (status === 'Hoàn thành') return { text: 'Hoàn thành', color: 'text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded' };
  
  const deadlineDate = new Date(deadlineStr);
  const diffTime = deadlineDate.getTime() - CURRENT_DATE.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `Trễ ${Math.abs(diffDays)} ngày`, color: 'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded' };
  if (diffDays === 0) return { text: 'Hết hạn hôm nay', color: 'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded' };
  if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, color: 'text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded' };
  return { text: `Còn ${diffDays} ngày`, color: 'text-slate-600' };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Hoàn thành':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành</span>;
    case 'Đang xử lý':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3.5 h-3.5" /> Đang xử lý</span>;
    case 'Trễ hạn':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3.5 h-3.5" /> Trễ hạn</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Chưa bắt đầu</span>;
  }
}

export function DocumentsView() {
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('documents').select('*').order('deadline', { ascending: true });
      if (error) throw error;
      if (data) {
        setDocumentsList(data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách công việc:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
        setDocumentsList(prev => prev.filter(d => d.id !== id));
      } catch (err: any) {
        alert('Lỗi xóa: ' + err.message);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    const fd = new FormData(e.currentTarget);
    const dbPayload = {
      name: fd.get('name') as string,
      deadline: fd.get('deadline') as string,
      status: fd.get('status') as string,
    };

    try {
      if (editingDoc && editingDoc.id) {
        const { error } = await supabase.from('documents').update(dbPayload).eq('id', editingDoc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('documents').insert([dbPayload]);
        if (error) throw error;
      }
      await fetchDocuments();
      closeModal();
    } catch (err: any) {
      alert('Lỗi lưu: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditModal = (doc: any) => {
    setEditingDoc(doc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý công việc</h1>
          <p className="text-slate-500 mt-1">Theo dõi tiến độ và hạn nộp các báo cáo, hồ sơ, và công việc khác.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          Tạo công việc mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900">
              <tr>
                <th className="px-6 py-4 font-semibold">Công việc</th>
                <th className="px-6 py-4 font-semibold">Ngày Hết Hạn (Deadline)</th>
                <th className="px-6 py-4 font-semibold">Hạn Hoàn Thành</th>
                <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Chưa có công việc nào. Hãy tạo mới!
                  </td>
                </tr>
              ) : documentsList.map((doc) => {
                const countdown = getDeadlineCountdown(doc.deadline, doc.status);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      {doc.name}
                    </td>
                    <td className="px-6 py-4">{doc.deadline}</td>
                    <td className="px-6 py-4">
                      <span className={countdown.color}>{countdown.text}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(doc)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 flex items-center justify-center transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center animate-in fade-in backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingDoc ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
              </h2>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tên công việc <span className="text-red-500">*</span></label>
                <input name="name" type="text" defaultValue={editingDoc?.name} required placeholder="Ví dụ: Báo cáo định kỳ..." className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ngày Hết Hạn (Deadline) <span className="text-red-500">*</span></label>
                <input name="deadline" type="date" required defaultValue={editingDoc?.deadline} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Trạng thái <span className="text-red-500">*</span></label>
                <select name="status" defaultValue={editingDoc?.status || 'Chưa bắt đầu'} className="w-full border border-slate-300 focus:border-[#5b21b6] focus:ring-1 focus:ring-[#5b21b6] rounded-lg px-3 py-2 text-sm outline-none transition-all bg-white">
                  <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                  <option value="Đang xử lý">Đang xử lý</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Trễ hạn">Trễ hạn</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">Hủy</button>
              <button type="submit" disabled={isSyncing} className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                {isSyncing ? 'Đang lưu...' : 'Lưu công việc'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
