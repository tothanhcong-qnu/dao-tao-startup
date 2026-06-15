"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  CalendarCheck, 
  CreditCard,
  TrendingUp,
  MessageSquare,
  Settings,
  CarFront,
  LogOut,
  Menu,
  Bell,
  UserCircle,
  GraduationCap
} from 'lucide-react';

const sidebarLinks = [
  { href: '/dashboard', label: 'Tổng quan', icon: Home },
  { href: '/dashboard/students', label: 'Học viên', icon: Users, badge: 15 },
  { href: '/dashboard/exams', label: 'Lịch thi', icon: CalendarCheck, badge: 2 },
  { href: '/dashboard/courses', label: 'Khóa học', icon: BookOpenIcon },
  { href: '/dashboard/teachers', label: 'Giáo viên', icon: GraduationCap },
  { href: '/dashboard/vehicles', label: 'Phương tiện', icon: CarFront },
  { href: '/dashboard/documents', label: 'Quản lý công việc', icon: FileTextIcon },
  { href: '/dashboard/finance', label: 'Học phí', icon: CreditCard },
  { href: '/dashboard/reports', label: 'Kết quả KD', icon: TrendingUp },
  { href: '/dashboard/messages', label: 'BOT Thông báo', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Cài đặt', icon: Settings },
];

function BookOpenIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}

function FileTextIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeLink = sidebarLinks.find(link => pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard'));
  const ActiveIcon = activeLink?.icon || Home;
  const activeLabel = activeLink?.label || 'Tổng quan';

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-slate-900 font-sans">
      {/* Sidebar - Yellow Theme */}
      <aside className={`bg-[#fbdf00] text-slate-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-[280px]' : 'w-20'} overflow-hidden shadow-xl z-20`}>
        <div className="h-24 flex items-center justify-center px-4 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-orange-500 flex-shrink-0 shadow-sm border border-orange-100">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full" />
              </div>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-black font-bold text-sm tracking-wide uppercase">Trường CĐ Kon Tum</span>
                <span className="text-slate-700 text-xs">Khoa Đào tạo &<br/>Sát hạch lái xe</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard');
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-[#eab308] text-black shadow-sm font-bold' 
                    : 'hover:bg-[#facc15] hover:text-black text-slate-700'
                }`}
                title={!isSidebarOpen ? link.label : undefined}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-slate-600 group-hover:text-black'}`} />
                  {isSidebarOpen && <span className="text-sm">{link.label}</span>}
                </div>
                {isSidebarOpen && link.badge && (
                  <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-white`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {isSidebarOpen && (
          <div className="p-4 bg-[#eab308]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold">A</div>
                <div className="flex flex-col">
                  <span className="text-black text-xs font-bold">Admin Đào Tạo</span>
                  <span className="text-slate-800 text-[10px]">Quản trị viên</span>
                </div>
              </div>
              <button className="text-slate-700 hover:text-black transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white flex items-center justify-between px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ActiveIcon className="w-5 h-5 text-indigo-600" />
              <span>{activeLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#f8fafc] p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
