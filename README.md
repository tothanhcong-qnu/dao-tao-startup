# Đào Tạo Startup SaaS

Dự án Next.js + Supabase production-style: Auth, route protection, dashboard, courses, students, enrollments, RLS security, UI đẹp.

## Cài đặt local
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase
Chạy file `supabase/schema.sql` trong SQL Editor.

Authentication → URL Configuration:
- Site URL local: `http://localhost:3000`
- Redirect URL local: `http://localhost:3000/auth/callback`
- Sau deploy: `https://ten-app.vercel.app/auth/callback`

## Deploy Vercel
```bash
npm i -g vercel
vercel
```
Thêm Environment Variables trên Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
