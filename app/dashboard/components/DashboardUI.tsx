"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Plus, Calendar as CalendarIcon, UserPlus, FileText,
  Stethoscope, CheckCircle2, FolderOpen, BookOpen, 
  ClipboardList, Award, RotateCcw, AlertTriangle, AlertCircle, UserCheck,
  Briefcase, Car, GraduationCap, Bell
} from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

const initialTuitionSettings = [
  { class: 'A1', fee: 2000000 },
  { class: 'A', fee: 4000000 },
  { class: 'B số tự động', fee: 15000000 },
  { class: 'B số cơ khí', fee: 14000000 },
  { class: 'C1', fee: 18000000 },
];

function getStatusColor(status: string) {
  if (status === 'Chờ KSK') return 'bg-yellow-100 text-yellow-700';
  if (status === 'Đang thi') return 'bg-purple-100 text-purple-700';
  if (status === 'Đã đậu') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Đang học') return 'bg-blue-100 text-blue-700';
  if (status === 'Thi lại') return 'bg-orange-100 text-orange-700';
  if (status === 'Nghỉ học') return 'bg-slate-100 text-slate-700';
  return 'bg-slate-100 text-slate-700';
}

export function DashboardUI() {
  const [students, setStudents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [tuitionMap, setTuitionMap] = useState<Record<string, number>>({});
  const supabase = createClient();

  useEffect(() => {
    const saved = localStorage.getItem('tuitionSettings');
    let settings = initialTuitionSettings;
    if (saved) {
      try { settings = JSON.parse(saved); } catch (e) {}
    }
    const map: Record<string, number> = {};
    settings.forEach(s => { map[s.class] = s.fee; });
    map['B1'] = map['B số tự động'] || 15000000;
    map['B2'] = map['B số cơ khí'] || 14000000;
    map['C'] = map['C1'] || 18000000;
    setTuitionMap(map);

    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: sData }, { data: dData }, { data: cData }, { data: iData }, { data: vData }, { data: eData }] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('documents').select('*').order('deadline', { ascending: true }),
      supabase.from('courses').select('*').order('start_date', { ascending: true }),
      supabase.from('instructors').select('*'),
      supabase.from('vehicles').select('*'),
      supabase.from('exams').select('*').order('exam_date', { ascending: true })
    ]);
    if (sData) setStudents(sData);
    if (dData) setDocuments(dData);
    if (cData) setCourses(cData);
    if (iData) setInstructors(iData);
    if (vData) setVehicles(vData);
    if (eData) setExams(eData);
  };

  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentDate);

  // Compute stats
  const stats = { total: students.length, choKSK: 0, daKSK: 0, nopHS: 0, dangHoc: 0, dangThi: 0, daDau: 0, thiLai: 0, debt: 0 };
  students.forEach(s => {
    if (s.status === 'Chờ KSK') stats.choKSK++;
    else if (s.status === 'Đã KSK') stats.daKSK++;
    else if (s.status === 'Nộp HS') stats.nopHS++;
    else if (s.status === 'Đang học') stats.dangHoc++;
    else if (s.status === 'Đang thi') stats.dangThi++;
    else if (s.status === 'Đã đậu') stats.daDau++;
    else if (s.status === 'Thi lại') stats.thiLai++;

    const totalFee = tuitionMap[s.license_class] || 12000000;
    const paid = Number(s.tuition_paid || 0);
    if (totalFee - paid > 0) stats.debt++;
  });

  const statusCards = [
    { id: 1, title: 'Tổng học viên', value: stats.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 10, title: 'Tổng giáo viên', value: instructors.length, icon: UserCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 2, title: 'Chờ KSK', value: stats.choKSK, icon: Stethoscope, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 3, title: 'Đã KSK', value: stats.daKSK, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 4, title: 'Đã nộp HS', value: stats.nopHS, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 5, title: 'Đang học', value: stats.dangHoc, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 6, title: 'Đang thi', value: stats.dangThi, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 7, title: 'Đã đậu', value: stats.daDau, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 8, title: 'Thi lại', value: stats.thiLai, icon: RotateCcw, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 9, title: 'Còn nợ học phí', value: stats.debt, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const recentRegistrations = students.slice(0, 5);
  
  const upcomingCourses = courses.filter(c => c.status !== 'Đã kết thúc').slice(0, 5);

  const documentDeadlines = documents.filter(d => d.status !== 'Đã hoàn thành').slice(0, 5).map(doc => {
    const today = new Date();
    const deadline = new Date(doc.deadline);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status = '';
    let urgent = false;
    if (diffDays < 0) {
      status = `Trễ ${Math.abs(diffDays)} ngày`;
      urgent = true;
    } else if (diffDays === 0) {
      status = 'Hôm nay';
      urgent = true;
    } else {
      status = `Còn ${diffDays} ngày`;
      if (diffDays <= 3) urgent = true;
    }
    
    return { ...doc, diffDays, displayStatus: status, urgent };
  });

  const upcomingAlerts: string[] = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  courses.forEach(c => {
    if (c.status === 'Đã hoàn thành') return;
    const dates = [
      { name: 'KTM Lý thuyết', val: c.theory_test_date },
      { name: 'KTM Thực hành', val: c.practice_test_date },
      { name: 'Thi Tốt nghiệp', val: c.graduation_test_date },
      { name: 'Bế giảng', val: c.end_date }
    ];

    dates.forEach(d => {
      if (d.val) {
        const dDate = new Date(d.val);
        if (dDate >= today && dDate <= in7Days) {
          const diff = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          upcomingAlerts.push(`Khóa ${c.name} sắp ${d.name} sau ${diff} ngày nữa (${new Date(d.val).toLocaleDateString('vi-VN')})`);
        } else if (dDate < today) {
          upcomingAlerts.push(`Khóa ${c.name} đã quá hạn ${d.name} (${new Date(d.val).toLocaleDateString('vi-VN')})`);
        }
      }
    });
  });

  vehicles.forEach(v => {
    const dates = [
      { name: 'Đăng kiểm', val: v.registration_expiry_date },
      { name: 'Xe tập lái', val: v.permit_expiry_date },
      { name: 'Hợp đồng', val: v.contract_expiry_date }
    ];
    dates.forEach(d => {
      if (d.val) {
        const dDate = new Date(d.val);
        if (dDate >= today && dDate <= in7Days) {
          const diff = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          upcomingAlerts.push(`Xe biển số ${v.license_plate} sắp hết hạn ${d.name} sau ${diff} ngày (${new Date(d.val).toLocaleDateString('vi-VN')})`);
        } else if (dDate < today) {
          upcomingAlerts.push(`Xe biển số ${v.license_plate} ĐÃ HẾT HẠN ${d.name} (${new Date(d.val).toLocaleDateString('vi-VN')})`);
        }
      }
    });
  });

  instructors.forEach(i => {
    const dates = [
      { name: 'GPLX', val: i.license_expiry_date },
      { name: 'Giấy CN GV', val: i.certification_expiry_date }
    ];
    dates.forEach(d => {
      if (d.val) {
        const dDate = new Date(d.val);
        if (dDate >= today && dDate <= in7Days) {
          const diff = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          upcomingAlerts.push(`Giáo viên ${i.full_name} sắp hết hạn ${d.name} sau ${diff} ngày (${new Date(d.val).toLocaleDateString('vi-VN')})`);
        } else if (dDate < today) {
          upcomingAlerts.push(`Giáo viên ${i.full_name} ĐÃ HẾT HẠN ${d.name} (${new Date(d.val).toLocaleDateString('vi-VN')})`);
        }
      }
    });
  });

  const upcomingExams = exams.filter(e => {
    if (e.status === 'Đã hoàn thành') return false;
    const eDate = new Date(e.exam_date);
    return eDate >= today && eDate <= in7Days;
  }).slice(0, 5);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bảng tin & Nhắc nhở</h1>
          <p className="text-sm text-slate-500 mt-1">Trường Cao đẳng Kon Tum</p>
        </div>
      </div>

      {/* Grid 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card Giáo viên */}
        <Link href="/dashboard/teachers" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium mb-1">Giáo viên</span>
            <span className="text-3xl font-bold text-slate-800">{instructors.length}</span>
          </div>
        </Link>

        {/* Card Xe tập lái */}
        <Link href="/dashboard/vehicles" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Car className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium mb-1">Xe tập lái</span>
            <span className="text-3xl font-bold text-slate-800">{vehicles.length}</span>
          </div>
        </Link>

        {/* Card Lớp học */}
        <Link href="/dashboard/courses" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium mb-1">Lớp học</span>
            <span className="text-3xl font-bold text-slate-800">{courses.length}</span>
          </div>
        </Link>

        {/* Card Học viên */}
        <Link href="/dashboard/students" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium mb-1">Học viên</span>
            <span className="text-3xl font-bold text-slate-800">{students.length}</span>
          </div>
        </Link>

      </div>

      {/* 2 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel Nhắc nhở hệ thống */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Nhắc nhở hệ thống ({upcomingAlerts.length})</h3>
          </div>
          <div className="flex-1 p-5 flex flex-col">
            {upcomingAlerts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Không có nhắc nhở nào trong thời gian tới.
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingAlerts.map((alert, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                    <span className="text-sm">{alert}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Panel Trạng thái Xe tập lái */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">Trạng thái Xe tập lái</h3>
          </div>
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Đang cập nhật trạng thái hoạt động của phương tiện.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
