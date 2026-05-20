"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Bell, Briefcase, Car, GraduationCap, LayoutDashboard, Link2, LogOut, Plus, Users, Pencil, Trash2, Settings, Download, Search, Upload } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

type Course = { id: string; name: string; code: string | null; description: string | null; start_date: string | null; exam_date: string | null; theory_exam_date: string | null; practical_exam_date: string | null; completion_date: string | null; status: "active" | "draft" | "archived"; created_at: string };
type Student = { id: string; full_name: string; email: string | null; phone: string | null; note: string | null; cccd: string | null; date_of_birth: string | null; address: string | null; created_at: string };
type Enrollment = { id: string; course_id: string; student_id: string; status: "enrolled" | "completed" | "dropped"; theory_result: string | null; simulation_result: string | null; track_result: string | null; road_result: string | null; final_result: "Đạt" | "Trượt" | "Chưa thi"; enrolled_at: string; course?: Course; student?: Student };
type Teacher = { id: string; code: string; full_name: string; cccd: string | null; phone: string | null; license_class: string | null; license_number: string | null; license_expiry: string | null; teaching_scope: string | null; date_of_birth: string | null; teacher_cert_number: string | null; professional_level: string | null; pedagogical_level: string | null; status: "active" | "inactive"; created_at: string };
type Vehicle = { id: string; code: string; plate_number: string; vehicle_class: string | null; name: string | null; imei: string | null; serial_number: string | null; document_image_url: string | null; certificate_number: string | null; owner_name: string | null; practice_license_number: string | null; license_expiry: string | null; registry_expiry: string | null; insurance_expiry: string | null; contract_expiry: string | null; status: "active" | "inactive"; created_at: string };

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function DashboardClient({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [tab, setTab] = useState("overview");
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({ status: "active" });
  
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({ status: "active" });

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState<Partial<Course>>({ status: "active" });

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<Partial<Student>>({});

  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentForm, setEnrollmentForm] = useState<Partial<Enrollment>>({ status: "enrolled", final_result: "Chưa thi" });
  const [searchCccd, setSearchCccd] = useState("");
  const [searchTeacher, setSearchTeacher] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const supabase = createClient();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [cr, sr, er, tr, vr] = await Promise.all([
        supabase.from("courses").select("*").order("created_at", { ascending: false }),
        supabase.from("students").select("*").order("created_at", { ascending: false }),
        supabase.from("enrollments").select("*, course:courses(*), student:students(*)").order("enrolled_at", { ascending: false }),
        supabase.from("teachers").select("*").order("created_at", { ascending: false }),
        supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
      ]);
      if (cr.data) setCourses(cr.data);
      if (sr.data) setStudents(sr.data);
      if (er.data) setEnrollments(er.data);
      if (tr.data) setTeachers(tr.data);
      if (vr.data) setVehicles(vr.data);
      setLoading(false);
    };
    loadData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const remove = async (table: string, id: string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    setActionLoading(true);
    await supabase.from(table).delete().eq("id", id);
    if (table === "teachers") setTeachers(teachers.filter(t => t.id !== id));
    if (table === "vehicles") setVehicles(vehicles.filter(v => v.id !== id));
    if (table === "courses") setCourses(courses.filter(c => c.id !== id));
    if (table === "students") setStudents(students.filter(s => s.id !== id));
    if (table === "enrollments") setEnrollments(enrollments.filter(e => e.id !== id));
    showToast("Đã xóa thành công");
    setActionLoading(false);
  };

  // --- SAVE FUNCTIONS ---
  const saveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const payload = { ...teacherForm, owner_id: userId };
    if (editingTeacher) {
      const { data } = await supabase.from("teachers").update(payload).eq("id", editingTeacher.id).select().single();
      if (data) setTeachers(teachers.map(t => t.id === data.id ? data : t));
      showToast("Cập nhật thành công");
    } else {
      const { data } = await supabase.from("teachers").insert(payload).select().single();
      if (data) setTeachers([data, ...teachers]);
      showToast("Thêm mới thành công");
    }
    setEditingTeacher(null); setTeacherForm({ status: "active" }); setActionLoading(false);
  };

  const saveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const payload = { ...vehicleForm, owner_id: userId };
    if (editingVehicle) {
      const { data } = await supabase.from("vehicles").update(payload).eq("id", editingVehicle.id).select().single();
      if (data) setVehicles(vehicles.map(v => v.id === data.id ? data : v));
      showToast("Cập nhật thành công");
    } else {
      const { data } = await supabase.from("vehicles").insert(payload).select().single();
      if (data) setVehicles([data, ...vehicles]);
      showToast("Thêm mới thành công");
    }
    setEditingVehicle(null); setVehicleForm({ status: "active" }); setActionLoading(false);
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const payload = { ...courseForm, owner_id: userId };
    if (editingCourse) {
      const { data } = await supabase.from("courses").update(payload).eq("id", editingCourse.id).select().single();
      if (data) setCourses(courses.map(c => c.id === data.id ? data : c));
      showToast("Cập nhật thành công");
    } else {
      const { data } = await supabase.from("courses").insert(payload).select().single();
      if (data) setCourses([data, ...courses]);
      showToast("Thêm mới thành công");
    }
    setEditingCourse(null); setCourseForm({ status: "active" }); setActionLoading(false);
  };

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const payload = { ...studentForm, owner_id: userId };
    if (editingStudent) {
      const { data } = await supabase.from("students").update(payload).eq("id", editingStudent.id).select().single();
      if (data) setStudents(students.map(s => s.id === data.id ? data : s));
      showToast("Cập nhật thành công");
    } else {
      const { data } = await supabase.from("students").insert(payload).select().single();
      if (data) setStudents([data, ...students]);
      showToast("Thêm học viên thành công");
    }
    setEditingStudent(null); setStudentForm({}); setActionLoading(false);
  };

  const saveEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const payload = { ...enrollmentForm, owner_id: userId };
    // remove joined tables before save
    delete (payload as any).course;
    delete (payload as any).student;

    if (editingEnrollment) {
      const { data } = await supabase.from("enrollments").update(payload).eq("id", editingEnrollment.id).select("*, course:courses(*), student:students(*)").single();
      if (data) setEnrollments(enrollments.map(en => en.id === data.id ? data : en));
      showToast("Cập nhật kết quả thành công");
    } else {
      const { data, error } = await supabase.from("enrollments").insert(payload).select("*, course:courses(*), student:students(*)").single();
      if (error) showToast("Lỗi: Học viên đã có trong lớp này!");
      if (data) {
        setEnrollments([data, ...enrollments]);
        showToast("Ghi danh thành công");
      }
    }
    setEditingEnrollment(null); setEnrollmentForm({ status: "enrolled", final_result: "Chưa thi" }); setActionLoading(false);
  };

  const exportFailedStudents = () => {
    const failed = enrollments.filter(e => e.final_result === "Trượt");
    if (failed.length === 0) {
      showToast("Không có học viên thi trượt!");
      return;
    }
    const header = "Ho Ten,CCCD,Lop Hoc,Ly Thuyet,Mo Phong,Sa Hinh,Duong Truong\n";
    const rows = failed.map(e => `${e.student?.full_name || ""},${e.student?.cccd || ""},${e.course?.name || ""},${e.theory_result || ""},${e.simulation_result || ""},${e.track_result || ""},${e.road_result || ""}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(header + rows);
    const link = document.createElement("a");
    link.href = csvContent;
    link.download = "DanhSachThiTruot.csv";
    link.click();
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim());
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(separator).map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = values[i] || null);
      return obj;
    });
  };

  const normalizeDate = (d: string | null) => {
    if (!d) return null;
    const s = d.trim();
    if (s.includes('-') && s.split('-')[0].length === 4) return s;
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return null;
  };

  const handleImportTeachers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        const payloads = data.map(row => ({
          owner_id: userId,
          code: row['Mã GV'],
          full_name: row['Họ Tên'],
          date_of_birth: normalizeDate(row['Ngày Sinh']),
          cccd: row['CCCD'],
          phone: row['Điện Thoại'],
          teacher_cert_number: row['Số GCN GV'],
          professional_level: row['Trình Độ CM'],
          pedagogical_level: row['Trình Độ SP'],
          license_class: row['Hạng GPLX'],
          license_number: row['Số GPLX'],
          license_expiry: normalizeDate(row['Hạn GPLX']),
          teaching_scope: row['Bộ Phận Giảng Dạy'],
          status: 'active'
        })).filter(p => p.code && p.full_name);
        if (payloads.length === 0) return showToast("File rỗng hoặc sai định dạng!");
        setActionLoading(true);

        const newTeachers: any[] = [];
        const updatePromises: any[] = [];
        let updatedCount = 0;
        const teachersCopy = [...teachers];

        for (const p of payloads) {
          const existingIdx = teachersCopy.findIndex(t => t.code === p.code || (p.cccd && t.cccd === p.cccd) || t.full_name === p.full_name);
          if (existingIdx !== -1) {
            const existing = teachersCopy[existingIdx];
            const updatePayload: any = {};
            let hasUpdate = false;
            for (const key of Object.keys(p) as (keyof typeof p)[]) {
              if (p[key] && (!existing[key as keyof typeof existing] || existing[key as keyof typeof existing] === "—")) {
                updatePayload[key] = p[key];
                hasUpdate = true;
              }
            }
            if (hasUpdate) {
              updatePromises.push(supabase.from('teachers').update(updatePayload).eq('id', existing.id));
              updatedCount++;
              teachersCopy[existingIdx] = { ...existing, ...updatePayload };
            }
          } else {
            newTeachers.push(p);
          }
        }

        try {
          if (updatePromises.length > 0) await Promise.all(updatePromises);
          
          if (newTeachers.length > 0) {
            const { data: inserted, error } = await supabase.from('teachers').insert(newTeachers).select();
            if (error) {
              showToast("Lỗi lưu dữ liệu: " + error.message);
            } else if (inserted) {
              setTeachers([...inserted, ...teachersCopy]);
              showToast(`Đã nhập mới ${inserted.length} và bổ sung ${updatedCount} giáo viên`);
            }
          } else {
            setTeachers(teachersCopy);
            showToast(updatedCount > 0 ? `Đã bổ sung thông tin cho ${updatedCount} giáo viên` : "Không có dữ liệu mới hoặc cần bổ sung");
          }
        } catch (error) {
          showToast("Lỗi cập nhật dữ liệu!");
        }
      } catch (error) { showToast("Lỗi đọc file CSV!"); } finally { setActionLoading(false); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportVehicles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        const payloads = data.map(row => ({
          owner_id: userId,
          code: row['Mã Xe'],
          plate_number: row['Biển Số'],
          vehicle_class: row['Hạng Xe'],
          name: row['Hiệu Xe'],
          owner_name: row['Chủ Sở Hữu'],
          certificate_number: row['Số GCN'],
          practice_license_number: row['Số GPTL'],
          license_expiry: normalizeDate(row['Hạn GP']),
          registry_expiry: normalizeDate(row['Hạn Đăng Kiểm']),
          insurance_expiry: normalizeDate(row['Hạn Bảo Hiểm']),
          contract_expiry: normalizeDate(row['Hạn Hợp Đồng']),
          imei: row['IMEI'],
          serial_number: row['Số Serial'],
          status: 'active'
        })).filter(p => p.code && p.plate_number);
        if (payloads.length === 0) return showToast("File rỗng hoặc sai định dạng!");
        setActionLoading(true);
        const { data: inserted, error } = await supabase.from('vehicles').insert(payloads).select();
        if (error) {
          showToast("Lỗi lưu dữ liệu: " + error.message);
        } else if (inserted) {
          setVehicles([...inserted, ...vehicles]);
          showToast(`Đã nhập thành công ${inserted.length} xe`);
        }
      } catch (error) { showToast("Lỗi đọc file CSV!"); } finally { setActionLoading(false); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportStudentsForCourse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourseId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        const payloads = data.map(row => ({
          owner_id: userId,
          full_name: row['Họ Tên'],
          date_of_birth: normalizeDate(row['Ngày Sinh']),
          cccd: row['CCCD'],
          address: row['Nơi Cư Trú'],
          phone: row['Điện Thoại'],
          note: row['Ghi Chú']
        })).filter(p => p.full_name && p.cccd);
        
        if (payloads.length === 0) return showToast("File rỗng hoặc thiếu CCCD/Họ Tên!");
        setActionLoading(true);

        const newStudents: any[] = [];
        const updatePromises: any[] = [];
        const studentsCopy = [...students];
        let studentsToEnroll: any[] = [];

        for (const p of payloads) {
          const existingIdx = studentsCopy.findIndex(s => s.cccd === p.cccd);
          if (existingIdx !== -1) {
            const existing = studentsCopy[existingIdx];
            const updatePayload: any = {};
            let hasUpdate = false;
            for (const key of Object.keys(p) as (keyof typeof p)[]) {
              if (p[key] && (!existing[key as keyof typeof existing] || existing[key as keyof typeof existing] === "—")) {
                updatePayload[key] = p[key];
                hasUpdate = true;
              }
            }
            if (hasUpdate) {
              updatePromises.push(supabase.from('students').update(updatePayload).eq('id', existing.id));
              studentsCopy[existingIdx] = { ...existing, ...updatePayload };
            }
            studentsToEnroll.push(studentsCopy[existingIdx]);
          } else {
            newStudents.push(p);
          }
        }

        try {
          if (updatePromises.length > 0) await Promise.all(updatePromises);
          
          if (newStudents.length > 0) {
            const { data: inserted, error } = await supabase.from('students').insert(newStudents).select();
            if (error) throw error;
            if (inserted) {
              studentsToEnroll = [...studentsToEnroll, ...inserted];
              studentsCopy.push(...inserted);
            }
          }

          setStudents(studentsCopy);

          const existingEnrollments = enrollments.filter(e => e.course_id === selectedCourseId);
          const newEnrollments = studentsToEnroll
            .filter(s => !existingEnrollments.find(e => e.student_id === s.id))
            .map(s => ({
              owner_id: userId,
              course_id: selectedCourseId,
              student_id: s.id,
              status: 'enrolled',
              final_result: 'Chưa thi'
            }));

          if (newEnrollments.length > 0) {
            const { data: insertedEnrollments, error: enrollError } = await supabase.from('enrollments').insert(newEnrollments).select('*, course:courses(*), student:students(*)');
            if (enrollError) throw enrollError;
            if (insertedEnrollments) {
              setEnrollments([...insertedEnrollments, ...enrollments]);
            }
          }

          showToast(`Đã thêm ${newEnrollments.length} học viên mới vào lớp.`);
        } catch (error: any) {
          showToast("Lỗi xử lý dữ liệu: " + error.message);
        }
      } catch (error) { showToast("Lỗi đọc file CSV!"); } finally { setActionLoading(false); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadCourseStudentTemplate = () => {
    const header = "Họ Tên,Ngày Sinh,CCCD,Nơi Cư Trú,Điện Thoại,Ghi Chú\n";
    const example = "Nguyễn Văn C,1995-05-20,012345678912,Hà Nội,0987654321,Đã nộp đủ hồ sơ\n";
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(header + example);
    link.download = "MauNhapHocVienLop.csv";
    link.click();
  };

  const downloadTeacherTemplate = () => {
    const header = "Mã GV,Họ Tên,Ngày Sinh,CCCD,Điện Thoại,Số GCN GV,Trình Độ CM,Trình Độ SP,Hạng GPLX,Số GPLX,Hạn GPLX,Bộ Phận Giảng Dạy\n";
    const example = "GV01,Nguyễn Văn A,1980-01-01,001201012345,0912345678,GCN-12345,Đại học,Sư phạm bậc 1,B2,GP-987654321,2030-01-01,Cả hai\n";
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(header + example);
    link.download = "MauNhapGiaoVien.csv";
    link.click();
  };

  const downloadVehicleTemplate = () => {
    const header = "Mã Xe,Biển Số,Hạng Xe,Hiệu Xe,Chủ Sở Hữu,Số GCN,Số GPTL,IMEI,Số Serial,Hạn GP,Hạn Đăng Kiểm,Hạn Bảo Hiểm,Hạn Hợp Đồng\n";
    const example = "XE01,82A-123.45,B2,Vios 2020,Nguyễn Văn B,GCN-999,GPTL-888,123456789012345,SN987654321,2030-01-01,2025-05-15,2025-05-15,2026-12-31\n";
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(header + example);
    link.download = "MauNhapXeTapLai.csv";
    link.click();
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="text-lg font-medium text-slate-500 animate-pulse">Đang tải dữ liệu hệ thống...</div></div>;

  const tabs = [
    { id: "overview", label: "Bảng tin & Nhắc nhở", icon: LayoutDashboard, badge: 2 },
    { id: "teachers", label: "Hồ sơ Giáo viên", icon: Briefcase },
    { id: "vehicles", label: "Xe tập lái", icon: Car },
    { id: "courses", label: "Lớp học", icon: GraduationCap },
    { id: "students", label: "Học viên", icon: Users },
    { id: "enrollments", label: "Ghi danh & Kết quả", icon: Link2 },
  ];

  const activeTabName = tabs.find(t => t.id === tab)?.label;
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
  const statusBadge = (s: string) => {
    if (s==="active") return <span className="badge bg-green-100 text-green-800">Đang hoạt động</span>;
    if (s==="inactive") return <span className="badge bg-slate-100 text-slate-800">Tạm ngưng</span>;
    if (s==="draft") return <span className="badge bg-yellow-100 text-yellow-800">Dự kiến</span>;
    if (s==="Đạt") return <span className="badge bg-green-100 text-green-800 font-bold">ĐẠT</span>;
    if (s==="Trượt") return <span className="badge bg-red-100 text-red-800 font-bold">TRƯỢT</span>;
    if (s==="Chưa thi") return <span className="badge bg-slate-100 text-slate-800">Chưa thi</span>;
    return <span className="badge bg-slate-100 text-slate-800">{s}</span>;
  };

  const searchedEnrollments = searchCccd.trim() === "" ? enrollments : enrollments.filter(e => e.student?.cccd?.includes(searchCccd));
  const searchedTeachers = searchTeacher.trim() === "" ? teachers : teachers.filter(t => t.full_name.toLowerCase().includes(searchTeacher.toLowerCase()) || t.code.toLowerCase().includes(searchTeacher.toLowerCase()) || t.cccd?.includes(searchTeacher));
  const searchedVehicles = searchVehicle.trim() === "" ? vehicles : vehicles.filter(v => v.plate_number.toLowerCase().includes(searchVehicle.toLowerCase()) || v.code.toLowerCase().includes(searchVehicle.toLowerCase()) || v.name?.toLowerCase().includes(searchVehicle.toLowerCase()));

  const getReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminders: { type: 'danger' | 'warning' | 'info', title: string, message: string, date: string, rawDate: number }[] = [];

    // Xe hết hạn (còn 30 ngày)
    vehicles.forEach(v => {
      if (v.status === 'inactive') return;
      const checks = [
        { label: "Hạn GP", dateStr: v.license_expiry },
        { label: "Đăng kiểm", dateStr: v.registry_expiry },
        { label: "Bảo hiểm", dateStr: v.insurance_expiry },
      ];
      checks.forEach(c => {
        if (c.dateStr) {
          const d = new Date(c.dateStr);
          const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
          if (diffDays < 0) {
            reminders.push({ type: 'danger', title: `Xe ${v.plate_number} đã hết ${c.label}`, message: `Quá hạn ${Math.abs(diffDays)} ngày`, date: c.dateStr, rawDate: d.getTime() });
          } else if (diffDays <= 30) {
            reminders.push({ type: 'warning', title: `Xe ${v.plate_number} sắp hết ${c.label}`, message: `Còn ${diffDays} ngày`, date: c.dateStr, rawDate: d.getTime() });
          }
        }
      });
    });

    // Lớp sắp thi (trong vòng 14 ngày tới)
    courses.forEach(c => {
      if (c.status === 'archived') return;
      const checks = [
        { label: "Sát hạch chính thức", dateStr: c.exam_date },
        { label: "Thi Lý thuyết", dateStr: c.theory_exam_date },
        { label: "Thi Thực hành", dateStr: c.practical_exam_date },
      ];
      checks.forEach(chk => {
        if (chk.dateStr) {
          const d = new Date(chk.dateStr);
          const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
          if (diffDays >= 0 && diffDays <= 14) {
            reminders.push({ type: 'info', title: `Lớp ${c.code || c.name} sắp ${chk.label}`, message: diffDays === 0 ? "Hôm nay!" : `Còn ${diffDays} ngày`, date: chk.dateStr, rawDate: d.getTime() });
          }
        }
      });
    });

    return reminders.sort((a, b) => a.rawDate - b.rawDate).slice(0, 15);
  };
  const reminders = getReminders();

  return <div className="flex h-screen bg-[#f8f9fc] text-slate-800 font-sans">
    {toastMessage && <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-green-600 px-6 py-3 text-white shadow-lg animate-in fade-in slide-in-from-bottom-5">{toastMessage}</div>}

    {/* Sidebar */}
    <aside className="w-[260px] bg-[#fef08a] text-amber-950 flex flex-col shrink-0 border-r border-yellow-300/50">
      <div className="p-5 flex items-center gap-3 border-b border-yellow-400/30">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
          <img src="/logo.png" alt="Logo CĐKT" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-[13px] leading-tight text-amber-950 uppercase">Trường CĐ Kon Tum</h1>
          <p className="text-yellow-800 text-[11px] mt-1 font-semibold leading-snug">Khoa Đào tạo &<br/>Sát hạch lái xe</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === t.id 
                ? "bg-amber-400 text-amber-950 shadow-md shadow-yellow-600/10" 
                : "text-yellow-800 hover:bg-yellow-300/60 hover:text-amber-950"
            }`}
          >
            <t.icon size={20} className={tab === t.id ? "text-amber-950" : "text-yellow-700"} />
            <span className="flex-1 text-left">{t.label}</span>
            {t.badge && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t.badge}</span>}
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-yellow-400/30">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {userEmail[0].toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{userEmail}</p>
            <p className="text-xs text-yellow-700 truncate">Giáo vụ</p>
          </div>
          <button onClick={handleLogout} className="text-yellow-700 hover:text-amber-950 p-2 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>

    {/* Main Content */}
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{activeTabName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Trường Cao đẳng Kon Tum</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-slate-600 relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="text-slate-400 hover:text-slate-600"><Settings size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        
        {/* OVERVIEW TAB */}
        {tab === "overview" && <section className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Briefcase size={24}/></div>
              <div><p className="text-sm font-medium text-slate-500">Giáo viên</p><p className="text-2xl font-bold">{teachers.length}</p></div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><Car size={24}/></div>
              <div><p className="text-sm font-medium text-slate-500">Xe tập lái</p><p className="text-2xl font-bold">{vehicles.length}</p></div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><GraduationCap size={24}/></div>
              <div><p className="text-sm font-medium text-slate-500">Lớp học</p><p className="text-2xl font-bold">{courses.length}</p></div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><Users size={24}/></div>
              <div><p className="text-sm font-medium text-slate-500">Học viên</p><p className="text-2xl font-bold">{students.length}</p></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
              <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2"><Bell className="text-blue-600" size={20}/> Nhắc nhở hệ thống ({reminders.length})</h3>
              <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3">
                {reminders.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">Không có nhắc nhở nào trong thời gian tới.</div>
                ) : (
                  reminders.map((r, i) => (
                    <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 ${r.type === 'danger' ? 'bg-red-50 border-red-100' : r.type === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                      <div className={`mt-0.5 ${r.type === 'danger' ? 'text-red-500' : r.type === 'warning' ? 'text-orange-500' : 'text-blue-500'}`}>
                        {r.type === 'danger' ? <Bell size={16}/> : r.type === 'warning' ? <Bell size={16}/> : <GraduationCap size={16}/>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${r.type === 'danger' ? 'text-red-800' : r.type === 'warning' ? 'text-orange-800' : 'text-blue-800'}`}>{r.title}</p>
                        <p className={`text-xs mt-0.5 ${r.type === 'danger' ? 'text-red-600' : r.type === 'warning' ? 'text-orange-600' : 'text-blue-600'}`}>{r.message} • {formatDate(r.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Trạng thái Xe tập lái</h3>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Đang hoạt động', value: vehicles.filter(v=>v.status==='active').length },
                        { name: 'Tạm ngưng', value: vehicles.filter(v=>v.status==='inactive').length }
                      ]} cx="50%" cy="50%" innerRadius={35} outerRadius={55} fill="#8884d8" paddingAngle={5} dataKey="value">
                        {vehicles.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-lg mb-4">Trạng thái Lớp học</h3>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Đang học', value: courses.filter(c=>c.status==='active').length },
                        { name: 'Dự kiến', value: courses.filter(c=>c.status==='draft').length },
                        { name: 'Đã kết thúc', value: courses.filter(c=>c.status==='archived').length }
                      ]} cx="50%" cy="50%" innerRadius={35} outerRadius={55} fill="#8884d8" paddingAngle={5} dataKey="value">
                        {courses.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>}

        {/* TEACHERS TAB */}
        {tab === "teachers" && <section className="space-y-6">
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Tra cứu tên, mã GV, CCCD..." value={searchTeacher} onChange={e => setSearchTeacher(e.target.value)} className="input pl-10 w-[300px]" />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={downloadTeacherTemplate} className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline">Tải file mẫu (CSV)</button>
              <label className="bg-slate-900 text-white px-4 py-2 rounded-xl font-medium cursor-pointer hover:bg-slate-800 transition-colors inline-flex items-center gap-2">
                <Upload size={16}/> Nhập từ file CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleImportTeachers} />
              </label>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
            <form onSubmit={saveTeacher} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{editingTeacher ? "Chỉnh sửa" : "Thêm giáo viên"}</h2>{editingTeacher && <button type="button" onClick={() => {setEditingTeacher(null); setTeacherForm({ status: "active" });}} className="text-sm text-blue-600 font-medium">Hủy</button>}</div>
              <Field label="Mã GV"><input required className="input" value={teacherForm.code || ""} onChange={e => setTeacherForm({...teacherForm, code: e.target.value})} /></Field>
              <Field label="Họ và tên"><input required className="input" value={teacherForm.full_name || ""} onChange={e => setTeacherForm({...teacherForm, full_name: e.target.value})} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ngày sinh"><input type="date" className="input" value={teacherForm.date_of_birth || ""} onChange={e => setTeacherForm({...teacherForm, date_of_birth: e.target.value})} /></Field>
                <Field label="Số CCCD"><input className="input" value={teacherForm.cccd || ""} onChange={e => setTeacherForm({...teacherForm, cccd: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Điện thoại"><input className="input" value={teacherForm.phone || ""} onChange={e => setTeacherForm({...teacherForm, phone: e.target.value})} /></Field>
                <Field label="Số GCN GV"><input className="input" value={teacherForm.teacher_cert_number || ""} onChange={e => setTeacherForm({...teacherForm, teacher_cert_number: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Trình độ CM"><input className="input" value={teacherForm.professional_level || ""} onChange={e => setTeacherForm({...teacherForm, professional_level: e.target.value})} /></Field>
                <Field label="Trình độ SP"><input className="input" value={teacherForm.pedagogical_level || ""} onChange={e => setTeacherForm({...teacherForm, pedagogical_level: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hạng GPLX"><input className="input" value={teacherForm.license_class || ""} onChange={e => setTeacherForm({...teacherForm, license_class: e.target.value})} /></Field>
                <Field label="Số GPLX"><input className="input" value={teacherForm.license_number || ""} onChange={e => setTeacherForm({...teacherForm, license_number: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hạn GPLX"><input type="date" className="input" value={teacherForm.license_expiry || ""} onChange={e => setTeacherForm({...teacherForm, license_expiry: e.target.value})} /></Field>
                <Field label="Bộ phận GD"><select className="input" value={teacherForm.teaching_scope || ""} onChange={e => setTeacherForm({...teacherForm, teaching_scope: e.target.value})}><option value="">-- Chọn bộ phận --</option><option value="Lý thuyết">Lý thuyết</option><option value="Thực hành">Thực hành</option><option value="Cả hai">Cả hai</option></select></Field>
              </div>
              <Field label="Trạng thái"><select className="input" value={teacherForm.status} onChange={e => setTeacherForm({...teacherForm, status: e.target.value as "active"|"inactive"})}><option value="active">Hoạt động</option><option value="inactive">Nghỉ việc</option></select></Field>
              <button disabled={actionLoading} type="submit" className="w-full mt-6 bg-slate-900 text-white font-medium py-2.5 rounded-xl flex justify-center gap-2">{editingTeacher ? "Lưu thay đổi" : <><Plus size={16}/> Thêm mới</>}</button>
            </form>
            <DataTable title={searchTeacher ? `Tìm kiếm: ${searchTeacher}` : "Danh sách giáo viên"} headers={["Mã GV", "Họ tên", "CCCD", "Hạng GPLX", "Số GPLX", "Hạn GPLX", "Trạng thái", "Thao tác"]} 
              rows={searchedTeachers.map(t => [ <span key="1" className="font-semibold text-indigo-600">{t.code}</span>, t.full_name, t.cccd||"—", <span key="2" className="font-bold text-purple-600">{t.license_class||"—"}</span>, t.license_number||"—", formatDate(t.license_expiry), statusBadge(t.status), <div key="actions" className="flex gap-2"><button onClick={() => {setEditingTeacher(t);setTeacherForm(t);}} className="text-blue-600"><Pencil size={16}/></button><button onClick={() => remove("teachers", t.id)} className="text-red-600"><Trash2 size={16}/></button></div> ])} 
            />
          </div>
        </section>}

        {/* VEHICLES TAB */}
        {tab === "vehicles" && <section className="space-y-6">
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Tra cứu biển số, mã xe, hiệu xe..." value={searchVehicle} onChange={e => setSearchVehicle(e.target.value)} className="input pl-10 w-[300px]" />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={downloadVehicleTemplate} className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline">Tải file mẫu (CSV)</button>
              <label className="bg-slate-900 text-white px-4 py-2 rounded-xl font-medium cursor-pointer hover:bg-slate-800 transition-colors inline-flex items-center gap-2">
                <Upload size={16}/> Nhập từ file CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleImportVehicles} />
              </label>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
            <form onSubmit={saveVehicle} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{editingVehicle ? "Chỉnh sửa" : "Thêm xe mới"}</h2>{editingVehicle && <button type="button" onClick={() => {setEditingVehicle(null); setVehicleForm({ status: "active" });}} className="text-sm text-blue-600 font-medium">Hủy</button>}</div>
              <Field label="Mã xe"><input required className="input" value={vehicleForm.code || ""} onChange={e => setVehicleForm({...vehicleForm, code: e.target.value})} /></Field>
              <Field label="Biển số"><input required className="input" value={vehicleForm.plate_number || ""} onChange={e => setVehicleForm({...vehicleForm, plate_number: e.target.value})} /></Field>
              <Field label="Chủ sở hữu"><input className="input" value={vehicleForm.owner_name || ""} onChange={e => setVehicleForm({...vehicleForm, owner_name: e.target.value})} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hạng xe"><input className="input" value={vehicleForm.vehicle_class || ""} onChange={e => setVehicleForm({...vehicleForm, vehicle_class: e.target.value})} /></Field>
                <Field label="Hiệu xe"><input className="input" value={vehicleForm.name || ""} onChange={e => setVehicleForm({...vehicleForm, name: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Số GCN"><input className="input" value={vehicleForm.certificate_number || ""} onChange={e => setVehicleForm({...vehicleForm, certificate_number: e.target.value})} /></Field>
                <Field label="Số GPTL"><input className="input" value={vehicleForm.practice_license_number || ""} onChange={e => setVehicleForm({...vehicleForm, practice_license_number: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Mã IMEI"><input className="input" value={vehicleForm.imei || ""} onChange={e => setVehicleForm({...vehicleForm, imei: e.target.value})} /></Field>
                <Field label="Số Serial"><input className="input" value={vehicleForm.serial_number || ""} onChange={e => setVehicleForm({...vehicleForm, serial_number: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hạn GP Xe"><input type="date" className="input" value={vehicleForm.license_expiry || ""} onChange={e => setVehicleForm({...vehicleForm, license_expiry: e.target.value})} /></Field>
                <Field label="Hạn Đăng kiểm"><input type="date" className="input" value={vehicleForm.registry_expiry || ""} onChange={e => setVehicleForm({...vehicleForm, registry_expiry: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hạn Bảo hiểm"><input type="date" className="input" value={vehicleForm.insurance_expiry || ""} onChange={e => setVehicleForm({...vehicleForm, insurance_expiry: e.target.value})} /></Field>
                <Field label="Hạn Hợp đồng"><input type="date" className="input" value={vehicleForm.contract_expiry || ""} onChange={e => setVehicleForm({...vehicleForm, contract_expiry: e.target.value})} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hồ sơ ảnh (URL)"><input type="text" placeholder="https://..." className="input" value={vehicleForm.document_image_url || ""} onChange={e => setVehicleForm({...vehicleForm, document_image_url: e.target.value})} /></Field>
                <Field label="Trạng thái"><select className="input" value={vehicleForm.status} onChange={e => setVehicleForm({...vehicleForm, status: e.target.value as "active"|"inactive"})}><option value="active">Đang sử dụng</option><option value="inactive">Tạm ngưng</option></select></Field>
              </div>
              <button disabled={actionLoading} type="submit" className="w-full mt-6 bg-slate-900 text-white font-medium py-2.5 rounded-xl flex justify-center gap-2">{editingVehicle ? "Lưu thay đổi" : <><Plus size={16}/> Thêm mới</>}</button>
            </form>
            <DataTable title={searchVehicle ? `Tìm kiếm: ${searchVehicle}` : "Danh sách xe"} headers={["Mã xe", "Biển số", "Hạng xe", "Hiệu xe", "Hạn GP", "Hạn Đăng kiểm", "Hạn Bảo hiểm", "Hạn HĐ", "Trạng thái", "Thao tác"]} 
              rows={searchedVehicles.map(v => [ <span key="1" className="font-semibold text-green-700">{v.code}</span>, <span key="2" className="font-bold">{v.plate_number}</span>, v.vehicle_class||"—", v.name||"—", formatDate(v.license_expiry), formatDate(v.registry_expiry), formatDate(v.insurance_expiry), formatDate(v.contract_expiry), statusBadge(v.status), <div key="actions" className="flex gap-2"><button onClick={() => {setEditingVehicle(v);setVehicleForm(v);}} className="text-blue-600"><Pencil size={16}/></button><button onClick={() => remove("vehicles", v.id)} className="text-red-600"><Trash2 size={16}/></button></div> ])} 
            />
          </div>
        </section>}

        {/* COURSES TAB */}
        {tab === "courses" && <section>
          {!selectedCourseId ? (
            <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
              <form onSubmit={saveCourse} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-fit">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{editingCourse ? "Chỉnh sửa" : "Mở lớp mới"}</h2></div>
                <Field label="Mã lớp"><input required className="input" value={courseForm.code || ""} onChange={e => setCourseForm({...courseForm, code: e.target.value})} /></Field>
                <Field label="Tên lớp (Khóa)"><input required className="input" value={courseForm.name || ""} onChange={e => setCourseForm({...courseForm, name: e.target.value})} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Khai giảng"><input type="date" className="input" value={courseForm.start_date || ""} onChange={e => setCourseForm({...courseForm, start_date: e.target.value})} /></Field>
                  <Field label="Bế giảng"><input type="date" className="input" value={courseForm.completion_date || ""} onChange={e => setCourseForm({...courseForm, completion_date: e.target.value})} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Thi Lý thuyết"><input type="date" className="input" value={courseForm.theory_exam_date || ""} onChange={e => setCourseForm({...courseForm, theory_exam_date: e.target.value})} /></Field>
                  <Field label="Thi Thực hành"><input type="date" className="input" value={courseForm.practical_exam_date || ""} onChange={e => setCourseForm({...courseForm, practical_exam_date: e.target.value})} /></Field>
                </div>
                <Field label="Ngày Sát hạch chính thức"><input type="date" className="input" value={courseForm.exam_date || ""} onChange={e => setCourseForm({...courseForm, exam_date: e.target.value})} /></Field>
                <Field label="Trạng thái"><select className="input" value={courseForm.status} onChange={e => setCourseForm({...courseForm, status: e.target.value as "active"|"draft"|"archived"})}><option value="active">Đang học</option><option value="draft">Dự kiến</option><option value="archived">Đã kết thúc</option></select></Field>
                <button disabled={actionLoading} type="submit" className="w-full mt-6 bg-slate-900 text-white font-medium py-2.5 rounded-xl flex justify-center gap-2">{editingCourse ? "Lưu thay đổi" : <><Plus size={16}/> Thêm mới</>}</button>
              </form>
              <DataTable title="Danh sách Lớp học" headers={["Mã lớp", "Tên lớp", "Khai giảng", "Thi LT", "Thi TH", "Sát hạch", "Trạng thái", "Thao tác"]} 
                rows={courses.map(c => [ <span key="1" className="font-semibold text-purple-700 cursor-pointer hover:underline" onClick={() => setSelectedCourseId(c.id)} title="Xem danh sách học viên">{c.code}</span>, <span key="2" className="font-bold cursor-pointer hover:underline text-blue-800" onClick={() => setSelectedCourseId(c.id)} title="Xem danh sách học viên">{c.name}</span>, formatDate(c.start_date), formatDate(c.theory_exam_date), formatDate(c.practical_exam_date), <span key="3" className="text-orange-600 font-semibold">{formatDate(c.exam_date)}</span>, statusBadge(c.status), <div key="actions" className="flex gap-2"><button onClick={() => {setEditingCourse(c);setCourseForm(c);}} className="text-blue-600"><Pencil size={16}/></button><button onClick={() => remove("courses", c.id)} className="text-red-600"><Trash2 size={16}/></button></div> ])} 
              />
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const course = courses.find(c => c.id === selectedCourseId);
                const courseStudents = enrollments.filter(e => e.course_id === selectedCourseId).map(e => e.student).filter(Boolean) as Student[];
                return (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 shadow-sm gap-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedCourseId(null)} className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"><span className="text-xl">←</span> Quay lại</button>
                        <h2 className="text-lg font-bold border-l-2 pl-4 border-slate-200">Học viên lớp: {course?.name} ({course?.code})</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={downloadCourseStudentTemplate} className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline">Tải file mẫu (CSV)</button>
                        <label className="bg-slate-900 text-white px-4 py-2 rounded-xl font-medium cursor-pointer hover:bg-slate-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap">
                          <Upload size={16}/> Nhập file CSV vào lớp
                          <input type="file" accept=".csv" className="hidden" onChange={handleImportStudentsForCourse} />
                        </label>
                      </div>
                    </div>
                    <DataTable title={`Sĩ số: ${courseStudents.length} học viên`} headers={["Họ tên", "Ngày sinh", "Số CCCD", "Nơi cư trú", "Điện thoại", "Ghi chú"]} 
                      rows={courseStudents.map(s => [ <span key="1" className="font-bold">{s.full_name}</span>, formatDate(s.date_of_birth), <span key="2" className="text-indigo-600 font-semibold">{s.cccd}</span>, s.address||"—", s.phone||"—", s.note||"—" ])} 
                    />
                  </>
                );
              })()}
            </div>
          )}
        </section>}

        {/* STUDENTS TAB */}
        {tab === "students" && <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <form onSubmit={saveStudent} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{editingStudent ? "Chỉnh sửa học viên" : "Thêm học viên mới"}</h2></div>
            <Field label="Họ và tên"><input required className="input" value={studentForm.full_name || ""} onChange={e => setStudentForm({...studentForm, full_name: e.target.value})} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ngày sinh"><input type="date" className="input" value={studentForm.date_of_birth || ""} onChange={e => setStudentForm({...studentForm, date_of_birth: e.target.value})} /></Field>
              <Field label="Số CCCD"><input required className="input" value={studentForm.cccd || ""} onChange={e => setStudentForm({...studentForm, cccd: e.target.value})} placeholder="Nhập căn cước" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nơi cư trú"><input className="input" value={studentForm.address || ""} onChange={e => setStudentForm({...studentForm, address: e.target.value})} /></Field>
              <Field label="Điện thoại"><input className="input" value={studentForm.phone || ""} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} /></Field>
            </div>
            <Field label="Ghi chú"><textarea className="input min-h-[80px]" value={studentForm.note || ""} onChange={e => setStudentForm({...studentForm, note: e.target.value})} /></Field>
            <button disabled={actionLoading} type="submit" className="w-full mt-6 bg-slate-900 text-white font-medium py-2.5 rounded-xl flex justify-center gap-2">{editingStudent ? "Lưu thay đổi" : <><Plus size={16}/> Thêm mới</>}</button>
          </form>
          <DataTable title="Danh sách Học viên" headers={["Họ tên", "Ngày sinh", "Số CCCD", "Nơi cư trú", "Điện thoại", "Thao tác"]} 
            rows={students.map(s => [ <span key="1" className="font-bold">{s.full_name}</span>, formatDate(s.date_of_birth), <span key="2" className="text-indigo-600 font-semibold">{s.cccd}</span>, s.address||"—", s.phone||"—", <div key="actions" className="flex gap-2"><button onClick={() => {setEditingStudent(s);setStudentForm(s);}} className="text-blue-600"><Pencil size={16}/></button><button onClick={() => remove("students", s.id)} className="text-red-600"><Trash2 size={16}/></button></div> ])} 
          />
        </section>}

        {/* ENROLLMENTS / EXAM RESULTS TAB */}
        {tab === "enrollments" && <section className="space-y-6">
          <div className="flex gap-6">
            {/* Find and Manage Result */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2"><Search size={20} className="text-blue-600"/> Tra cứu CCCD & Cập nhật Kết quả</h2>
                <button onClick={exportFailedStudents} className="bg-red-50 text-red-600 hover:bg-red-100 font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-colors">
                  <Download size={16} /> Xuất DS Thi trượt
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <input type="text" placeholder="Nhập CCCD của học viên để tìm kiếm..." value={searchCccd} onChange={e => setSearchCccd(e.target.value)} className="input flex-1 max-w-md bg-slate-50 border-slate-200" />
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Cập nhật điểm thi:</h3>
                {editingEnrollment ? (
                  <form onSubmit={saveEnrollment} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                      <Field label="Lý thuyết"><input className="input" placeholder="Điểm LT" value={enrollmentForm.theory_result || ""} onChange={e=>setEnrollmentForm({...enrollmentForm, theory_result: e.target.value})} /></Field>
                      <Field label="Mô phỏng"><input className="input" placeholder="Điểm MP" value={enrollmentForm.simulation_result || ""} onChange={e=>setEnrollmentForm({...enrollmentForm, simulation_result: e.target.value})} /></Field>
                      <Field label="Sa hình"><input className="input" placeholder="Điểm SH" value={enrollmentForm.track_result || ""} onChange={e=>setEnrollmentForm({...enrollmentForm, track_result: e.target.value})} /></Field>
                      <Field label="Đường trường"><input className="input" placeholder="Điểm ĐT" value={enrollmentForm.road_result || ""} onChange={e=>setEnrollmentForm({...enrollmentForm, road_result: e.target.value})} /></Field>
                      <Field label="Kết quả cuối"><select className="input font-bold" value={enrollmentForm.final_result} onChange={e=>setEnrollmentForm({...enrollmentForm, final_result: e.target.value as any})}><option value="Chưa thi">Chưa thi</option><option value="Đạt">Đạt</option><option value="Trượt">Trượt</option></select></Field>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={actionLoading} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700">Lưu kết quả</button>
                      <button type="button" onClick={() => {setEditingEnrollment(null); setEnrollmentForm({ status: "enrolled", final_result: "Chưa thi" });}} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-xl font-medium hover:bg-slate-300">Hủy</button>
                    </div>
                  </form>
                ) : (
                  <p className="text-slate-500 text-sm italic">Bấm vào nút hình cây bút ✏️ ở danh sách bên dưới để bắt đầu nhập điểm cho học viên.</p>
                )}
              </div>
            </div>
            
            {/* Add Enrollment */}
            <form onSubmit={saveEnrollment} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm w-[350px]">
              <h2 className="text-lg font-bold mb-4">Ghi danh học viên vào lớp</h2>
              <Field label="Học viên">
                <select required className="input" value={enrollmentForm.student_id || ""} onChange={e => setEnrollmentForm({...enrollmentForm, student_id: e.target.value})}>
                  <option value="">-- Chọn học viên --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.cccd})</option>)}
                </select>
              </Field>
              <Field label="Lớp học (Khóa)">
                <select required className="input" value={enrollmentForm.course_id || ""} onChange={e => setEnrollmentForm({...enrollmentForm, course_id: e.target.value})}>
                  <option value="">-- Chọn lớp --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <button disabled={actionLoading} type="submit" className="w-full mt-6 bg-slate-900 text-white font-medium py-2.5 rounded-xl flex justify-center gap-2"><Plus size={16}/> Ghi danh</button>
            </form>
          </div>

          <DataTable title={searchCccd ? `Kết quả tìm kiếm cho CCCD: ${searchCccd}` : "Danh sách Hồ sơ Ghi danh & Điểm thi"} 
            headers={["Học viên", "CCCD", "Lớp học", "Lý thuyết", "Mô phỏng", "Sa hình", "Đường trường", "Đánh giá", "Thao tác"]} 
            rows={searchedEnrollments.map(e => [ 
              <span key="1" className="font-bold">{e.student?.full_name}</span>, 
              <span key="2" className="text-indigo-600 font-semibold">{e.student?.cccd}</span>, 
              <span key="3" className="font-medium text-slate-700">{e.course?.name}</span>, 
              <span key="4" className={e.theory_result ? "font-bold text-blue-700" : "text-slate-300"}>{e.theory_result||"Trống"}</span>, 
              <span key="5" className={e.simulation_result ? "font-bold text-blue-700" : "text-slate-300"}>{e.simulation_result||"Trống"}</span>, 
              <span key="6" className={e.track_result ? "font-bold text-blue-700" : "text-slate-300"}>{e.track_result||"Trống"}</span>, 
              <span key="7" className={e.road_result ? "font-bold text-blue-700" : "text-slate-300"}>{e.road_result||"Trống"}</span>, 
              statusBadge(e.final_result || "Chưa thi"), 
              <div key="actions" className="flex gap-2"><button onClick={() => {setEditingEnrollment(e);setEnrollmentForm(e);}} className="text-blue-600"><Pencil size={16}/></button><button onClick={() => remove("enrollments", e.id)} className="text-red-600"><Trash2 size={16}/></button></div> 
            ])} 
          />
        </section>}

      </div>
    </main>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="mt-4"><label className="label mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>{children}</div>; }
function DataTable({ title, headers, rows }: { title: string; headers: string[]; rows: React.ReactNode[][] }) { 
  return <div className="card overflow-hidden bg-white border border-slate-100 rounded-2xl h-fit">
    <div className="border-b border-slate-100 p-5 flex justify-between items-center"><h2 className="text-lg font-bold">{title}</h2></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100"><tr>{headers.map((h, i)=><th key={i} className="px-5 py-3 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td className="px-5 py-8 text-center text-slate-500" colSpan={headers.length}>Chưa có dữ liệu</td></tr>:rows.map((row,i)=><tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">{row.map((cell,j)=><td key={j} className="px-5 py-4 whitespace-nowrap">{cell}</td>)}</tr>)}</tbody></table></div>
  </div>; 
}
