import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { 
  title: "Đào Tạo SaaS", 
  description: "Hệ thống quản lý đào tạo production-ready",
  manifest: "/manifest.json"
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="vi"><body>{children}</body></html>; }
