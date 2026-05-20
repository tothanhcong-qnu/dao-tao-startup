"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { GraduationCap } from "lucide-react";
type Mode = "login" | "register";
export function AuthForm({ mode }: { mode: Mode }) {
  const supabase = createClient();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("12345678");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    const result = mode === "register" ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } }) : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "register") setMessage("Đăng ký thành công. Nếu bật xác minh email, hãy kiểm tra hộp thư."); else window.location.href = "/dashboard";
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white"><div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center"><div className="grid w-full gap-8 lg:grid-cols-2"><div className="flex flex-col justify-center"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><GraduationCap size={32}/></div><h1 className="text-4xl font-bold tracking-tight md:text-5xl">Nền tảng quản lý đào tạo cho trung tâm hiện đại</h1><p className="mt-5 max-w-xl text-lg text-slate-300">Quản lý khóa học, học viên, ghi danh và thống kê trong một dashboard bảo mật bằng Supabase Auth + RLS.</p><div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-bold">Auth</div><div className="text-sm text-slate-300">Đăng nhập thật</div></div><div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-bold">RLS</div><div className="text-sm text-slate-300">Bảo vệ dữ liệu</div></div><div className="rounded-2xl bg-white/10 p-4"><div className="text-2xl font-bold">SaaS</div><div className="text-sm text-slate-300">Sẵn sàng deploy</div></div></div></div><form onSubmit={submit} className="rounded-3xl bg-white p-8 text-slate-900 shadow-2xl"><h2 className="text-2xl font-bold">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2><p className="mt-2 text-sm text-slate-500">{mode === "login" ? "Vào dashboard quản lý đào tạo." : "Tạo tài khoản quản trị mới."}</p><div className="mt-6"><label className="label">Email</label><input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required/></div><div className="mt-4"><label className="label">Mật khẩu</label><input className="input" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" minLength={8} required/></div>{message && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{message}</div>}<button disabled={loading} className="btn-primary mt-6 w-full">{loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}</button><div className="mt-5 text-center text-sm text-slate-500">{mode === "login" ? <>Chưa có tài khoản? <Link className="font-semibold text-slate-900" href="/register">Đăng ký</Link></> : <>Đã có tài khoản? <Link className="font-semibold text-slate-900" href="/login">Đăng nhập</Link></>}</div></form></div></div></div>;
}
