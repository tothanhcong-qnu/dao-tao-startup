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
    if (mode === "register") {
      if (result.data?.session) {
        window.location.href = "/dashboard";
      } else {
        setMessage("Đăng ký thành công. Vui lòng kiểm tra email để xác thực (nếu không thấy, hãy kiểm tra mục Thư rác/Spam). Hoặc tắt tính năng 'Confirm email' trong Supabase.");
      }
    } else {
      window.location.href = "/dashboard";
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Logo */}
        <div className="md:w-1/2 bg-slate-100 flex items-center justify-center p-12">
          <img src="/logo.png" alt="Logo Trường" className="max-w-full h-auto object-contain drop-shadow-xl" />
        </div>
        
        {/* Right Side: Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <form onSubmit={submit} className="w-full max-w-sm mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
            <p className="text-sm text-slate-500 mb-8">{mode === "login" ? "Vào dashboard quản lý đào tạo." : "Tạo tài khoản quản trị mới."}</p>
            
            <div className="space-y-4">
              <div>
                <label className="label block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input className="input w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required/>
              </div>
              <div>
                <label className="label block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
                <input className="input w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" minLength={6} required/>
              </div>
            </div>

            {message && <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700 border border-blue-100">{message}</div>}
            
            <button disabled={loading} className="w-full mt-8 bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50">
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
            
            <div className="mt-8 text-center text-sm text-slate-500">
              {mode === "login" ? 
                <>Chưa có tài khoản? <Link className="font-semibold text-blue-600 hover:underline" href="/register">Đăng ký ngay</Link></> : 
                <>Đã có tài khoản? <Link className="font-semibold text-blue-600 hover:underline" href="/login">Đăng nhập</Link></>
              }
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
