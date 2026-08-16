import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2,
  User,
  Menu,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  BarChart3,
  Eye,
  Settings,
  BookOpen,
  PlusCircle,
  ListTodo,
  X,
  ChevronDown,
  Check,
  CalendarClock,
  Sparkles,
  Trophy,
  Activity,
  ClipboardCheck,
  Loader2,
  Wrench
} from 'lucide-react';
import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';
import { useTheme } from '../context/ThemeContext';
import FluidCanvas from './FluidCanvas';
import { InstallPWA } from './InstallPWA';

const prefetchMap: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/bank-soal': () => import('../pages/BankSoal'),
  '/buat-ujian': () => import('../pages/BuatUjian'),
  '/daftar-ujian': () => import('../pages/DaftarUjian'),
  '/hasil-ujian': () => import('../pages/HasilUjian'),
  '/analisis': () => import('../pages/Analisis'),
  '/kelola-kelas': () => import('../pages/KelolaKelas'),
  '/kelola-siswa': () => import('../pages/KelolaSiswa'),
  '/monitor-ujian': () => import('../pages/MonitorUjian'),
  '/scan-ujian': () => import('../pages/ScanUjian'),
  '/profil': () => import('../pages/Profil'),
  '/attendance/scan': () => import('../pages/attendance/Attendance'),
  '/attendance/recap': () => import('../pages/attendance/AttendanceRecap'),
  '/attendance/schedule': () => import('../pages/attendance/AttendanceSchedule'),
  '/attendance/face-enrollment': () => import('../pages/attendance/FaceBulkEnrollment'),
  '/grading': () => import('../pages/grading/HomeScreen'),
  '/grading/recap': () => import('../pages/grading/FinalGradeRecapScreen'),
  '/grading/tp': () => import('../pages/grading/TPManagerScreen'),
  '/grading/points': () => import('../pages/grading/PointScreen'),
  '/tools/groups': () => import('../pages/tools/GroupGeneratorPage'),
  '/tools/randomizer': () => import('../pages/tools/RandomizerPage'),
  '/tools/certificates': () => import('../pages/tools/CertificateGeneratorPage'),
};

interface LayoutProps {
  session: any;
}

export default function Layout({ session }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [isFullScreenScanMode, setIsFullScreenScanMode] = useState(false);
  const { showAlert } = useAlert();
  const { schools, activeSchool, setActiveSchool, loading: schoolLoading } = useSchool();

  const [studentSessionStr, setStudentSessionStr] = useState<string | null>(() => localStorage.getItem('student_session'));

  useEffect(() => {
    const handleStudentSessionChange = () => {
      setStudentSessionStr(localStorage.getItem('student_session'));
    };
    window.addEventListener('student_session_change', handleStudentSessionChange);
    window.addEventListener('storage', handleStudentSessionChange);
    return () => {
      window.removeEventListener('student_session_change', handleStudentSessionChange);
      window.removeEventListener('storage', handleStudentSessionChange);
    };
  }, []);

  const student = useMemo(() => {
    return studentSessionStr ? JSON.parse(studentSessionStr) : null;
  }, [studentSessionStr]);

  const userRole = session ? (session.user?.user_metadata?.role || 'guru') : (student ? 'siswa' : 'guru');

  const userName = useMemo(() => {
    return session
      ? (session.user?.user_metadata?.name || session.user?.email?.split('@')[0])
      : (student ? student.name : '');
  }, [session, student]);

  // Sync fullscreen scanning state based on URL path
  useEffect(() => {
    const isDedicatedScanner = location.pathname.startsWith('/scan-ujian');
    setIsFullScreenScanMode(isDedicatedScanner);
  }, [location.pathname]);

  // Sync fullscreen scan state based on custom event from non-dedicated pages (e.g. PointScreen)
  useEffect(() => {
    const handleScanModeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsFullScreenScanMode(customEvent.detail?.active === true);
    };

    window.addEventListener('scan_mode_change', handleScanModeChange);
    return () => window.removeEventListener('scan_mode_change', handleScanModeChange);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const { currentTheme, setTheme, availableThemes, themeConfig } = useTheme();
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isSchoolDropdownOpen && !target.closest('.school-selector-container')) {
        setIsSchoolDropdownOpen(false);
      }
      if (isThemeDropdownOpen && !target.closest('.theme-selector-container')) {
        setIsThemeDropdownOpen(false);
      }
    };
    
    if (isSchoolDropdownOpen || isThemeDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isSchoolDropdownOpen, isThemeDropdownOpen]);

  interface MenuItem {
    icon: any;
    label: string;
    path?: string;
    subItems?: { label: string; path: string }[];
  }

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const teacherMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Beranda', path: '/dashboard' },
    {
      icon: Users,
      label: 'Manajemen Kelola',
      subItems: [
        { label: 'Kelola Kelas', path: '/kelola-kelas' },
        { label: 'Kelola Murid', path: '/kelola-siswa' },
        { label: 'Jadwal Mengajar', path: '/attendance/schedule' },
      ]
    },
    { 
      icon: BookOpen, 
      label: 'Ujian Digital', 
      subItems: [
        { label: 'Bank Soal', path: '/bank-soal' },
        { label: 'Buat Ujian', path: '/buat-ujian' },
        { label: 'Daftar Ujian', path: '/daftar-ujian' },
        { label: 'Analisis Ujian', path: '/analisis' },
      ]
    },
    { icon: FileText, label: 'Materi & Tugas', path: '/kelola-materi-tugas' },
    {
      icon: ClipboardCheck,
      label: 'Absensi Kehadiran',
      subItems: [
        { label: 'Scan Kehadiran', path: '/attendance/scan' },
        { label: 'Rekap Absensi', path: '/attendance/recap' },
        { label: 'Pendaftaran Wajah', path: '/attendance/face-enrollment' },
      ]
    },
    {
      icon: Activity,
      label: 'Pengelola Nilai',
      subItems: [
        { label: 'Input Nilai', path: '/grading' },
        { label: 'Rekap e-Rapor', path: '/grading/recap' },
        { label: 'Tujuan Pembelajaran', path: '/grading/tp' },
      ]
    },
    { icon: Trophy, label: 'Poin Prestasi', path: '/grading/points' },
    {
      icon: Wrench,
      label: 'Alat Bantu',
      subItems: [
        { label: 'Pembagi Kelompok', path: '/tools/groups' },
        { label: 'Pemilihan Acak', path: '/tools/randomizer' },
        { label: 'Sertifikat Penghargaan', path: '/tools/certificates' },
      ]
    },
    { 
      icon: Settings, 
      label: 'Pengaturan', 
      subItems: [
        { label: 'Profil Saya', path: '/profil' },
        { label: 'Pengaturan Absensi', path: '/attendance/settings' },
        { label: 'Pengaturan Nilai', path: '/grading/settings' },
        { label: 'Cadangan & Pemulihan', path: '/settings/sync' },
      ]
    },
  ];

  const studentMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ListTodo, label: 'Ujian Saya', path: '/daftar-ujian-siswa' },
    { icon: FileText, label: 'Materi & Tugas', path: '/materi-tugas-siswa' },
    { icon: User, label: 'Profil Saya', path: '/profil' },
  ];

  const menuItems = userRole === 'guru' ? teacherMenuItems : studentMenuItems;

  useEffect(() => {
    // Auto expand active submenu on load
    const activeItem = menuItems.find(item => 
      item.subItems?.some(sub => location.pathname === sub.path)
    );
    if (activeItem) {
      setOpenSubmenu(activeItem.label);
    }
  }, [location.pathname]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    localStorage.removeItem('student_session');
    window.dispatchEvent(new Event('student_session_change'));
    
    try {
      const { clearSyncTimeout } = await import('../services/dbAttendance');
      clearSyncTimeout();
    } catch (e) {
      console.warn("Failed to clear sync timeout on logout:", e);
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut error:", e);
    }

    setTimeout(() => {
      navigate('/login', { replace: true });
      setIsLoggingOut(false);
    }, 1200);
  }, [navigate]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      handleLogout();
    };
    window.addEventListener('trigger_fluid_logout', handleLogoutEvent);
    return () => window.removeEventListener('trigger_fluid_logout', handleLogoutEvent);
  }, [handleLogout]);

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Logout Transition Overlay - Fluid Canvas Matching Login */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A] z-[9999] flex flex-col items-center justify-center text-white font-sans overflow-hidden"
          >
            {/* 60fps Fluid Wave Canvas */}
            <FluidCanvas />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-6 relative z-10"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-full shadow-2xl shadow-indigo-600/30 border border-white/20">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight">Mengamankan Sesi</h3>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Sampai jumpa kembali...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/20">
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-400/15 rounded-full blur-[120px] animate-float-slow transform-gpu hidden sm:block" 
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-15%] w-[55%] h-[55%] bg-purple-400/10 rounded-full blur-[140px] animate-float-reverse transform-gpu hidden sm:block" 
        />
        <motion.div 
          className="absolute top-[35%] left-[45%] w-[35%] h-[35%] bg-indigo-400/8 rounded-full blur-[100px] animate-float-slow transform-gpu hidden sm:block" 
        />
      </div>

      {/* Sidebar Desktop */}
      {!isFullScreenScanMode && (
        <aside className="w-[240px] sidebar-gradient hidden lg:flex flex-col sticky top-0 h-screen z-40 transition-all duration-300 shadow-xl">
          <div className="p-6 flex items-center gap-3 relative z-10 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">EduVerse</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 relative z-10 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-none">
            {menuItems.map((item) => {
              const hasSub = !!item.subItems;
              const isSubOpen = openSubmenu === item.label;
              const isAnySubActive = hasSub && item.subItems!.some(sub => location.pathname === sub.path);
              const isActive = location.pathname === item.path || isAnySubActive;

              if (hasSub) {
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-2xl transition-all duration-150 group text-left cursor-pointer",
                        isActive
                          ? "bg-white text-indigo-900 shadow-lg shadow-indigo-950/20 font-extrabold"
                          : "text-slate-200/90 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-105",
                          isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-white"
                        )} />
                        <span className="font-semibold text-[13px]">{item.label}</span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-white",
                        isSubOpen ? "transform rotate-180" : ""
                      )} />
                    </button>

                    <AnimatePresence initial={false}>
                      {isSubOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: 'easeInOut' }}
                          className="overflow-hidden pl-7 pr-2 py-1 space-y-1"
                        >
                          {item.subItems!.map((sub) => (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onMouseEnter={() => {
                                const prefetch = prefetchMap[sub.path];
                                if (prefetch) prefetch();
                              }}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors",
                                location.pathname === sub.path
                                  ? "text-white bg-white/20 font-bold backdrop-blur-sm"
                                  : "text-slate-300 hover:text-white hover:bg-white/10"
                              )}
                            >
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                location.pathname === sub.path ? "bg-white" : "bg-slate-500 group-hover:bg-white"
                              )} />
                              {sub.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.path!}
                  onMouseEnter={() => {
                    const prefetch = prefetchMap[item.path!];
                    if (prefetch) prefetch();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 group text-left cursor-pointer",
                    location.pathname === item.path
                      ? "bg-white text-indigo-900 shadow-lg shadow-indigo-950/20 font-extrabold"
                      : "text-slate-200/90 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-[18px] h-[18px]", location.pathname === item.path ? "text-indigo-600" : "text-slate-400 group-hover:text-white")} />
                  <span className="font-semibold text-[13px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 mb-6 pb-2 relative z-10">
            <button
              onClick={() => showAlert({
                title: 'Yakin Ingin Keluar?', message: 'Anda harus login kembali untuk mengakses data ujian.',
                type: 'confirm', confirmText: 'Ya, Keluar', onConfirm: handleLogout
              })}
              className="flex items-center gap-3 w-full px-4 py-3 bg-rose-500/20 border border-rose-500/30 text-rose-100 rounded-full hover:bg-rose-600 hover:text-white transition-all duration-200 group"
            >
              <LogOut className="w-[18px] h-[18px] transition-transform group-hover:-translate-x-0.5" />
              <span className="font-bold text-[13px]">Keluar</span>
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#1D4ED8]/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.2 }}
              className="fixed inset-y-0 left-0 w-[240px] sidebar-gradient z-50 lg:hidden flex flex-col shadow-xl overflow-y-auto scrollbar-none"
            >
              <div className="p-6 flex items-center justify-between relative z-10 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-sm shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-white">EduVerse</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/10 text-white"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-3 space-y-0.5">
                {menuItems.map((item) => {
                  const hasSub = !!item.subItems;
                  const isSubOpen = openSubmenu === item.label;
                  const isAnySubActive = hasSub && item.subItems!.some(sub => location.pathname === sub.path);
                  const isActive = location.pathname === item.path || isAnySubActive;

                  if (hasSub) {
                    return (
                      <div key={item.label} className="space-y-1">
                        <button
                          onClick={() => toggleSubmenu(item.label)}
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2.5 rounded-2xl transition-all duration-150 text-[13px] font-semibold text-left cursor-pointer group",
                            isActive
                              ? "bg-white text-[#1D4ED8] shadow-lg font-extrabold"
                              : "text-blue-100 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn(
                              "w-[18px] h-[18px]",
                              isActive ? "text-[#1D4ED8]" : "text-blue-200/80 group-hover:text-white"
                            )} />
                            <span className="font-semibold">{item.label}</span>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isActive ? "text-[#1D4ED8]" : "text-blue-200/80 group-hover:text-white",
                            isSubOpen ? "transform rotate-180" : ""
                          )} />
                        </button>

                        <AnimatePresence initial={false}>
                          {isSubOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15, ease: 'easeInOut' }}
                              className="overflow-hidden pl-7 pr-2 py-1 space-y-1"
                            >
                              {item.subItems!.map((sub) => (
                                <Link
                                  key={sub.path}
                                  to={sub.path}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  onMouseEnter={() => {
                                    const prefetch = prefetchMap[sub.path];
                                    if (prefetch) prefetch();
                                  }}
                                  className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors",
                                    location.pathname === sub.path
                                      ? "text-white bg-white/20 font-bold"
                                      : "text-blue-100/90 hover:text-white hover:bg-white/10"
                                  )}
                                >
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                    location.pathname === sub.path ? "bg-white" : "bg-blue-300/60"
                                  )} />
                                  {sub.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path} 
                      to={item.path!} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={() => {
                        const prefetch = prefetchMap[item.path!];
                        if (prefetch) prefetch();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 text-[13px] font-semibold group",
                        location.pathname === item.path
                          ? "bg-white text-[#1D4ED8] shadow-lg font-extrabold"
                          : "text-blue-100 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-[18px] h-[18px]", location.pathname === item.path ? "text-[#1D4ED8]" : "text-blue-200/80 group-hover:text-white")} />
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="px-4 mb-6 pb-2 mt-auto">
                <button
                  onClick={() => showAlert({
                    title: 'Yakin Ingin Keluar?', message: 'Anda harus login kembali untuk mengakses data ujian.',
                    type: 'confirm', confirmText: 'Ya, Keluar', onConfirm: handleLogout
                  })}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-rose-500/20 border border-rose-500/30 text-rose-100 font-bold text-sm rounded-full hover:bg-rose-600 hover:text-white transition-all group"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span>Keluar</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-scroll overflow-x-hidden relative z-10">
        {/* Navbar */}
        {!isFullScreenScanMode && (
          <header className="h-16 shrink-0 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-white rounded-full text-slate-600 border border-slate-200/50 transition-all active:scale-95 bg-white/50"
              >
                <Menu className="w-5 h-5" />
              </button>

            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* School Selector - Only for teachers with multiple schools */}
              {userRole === 'guru' && schools.length > 1 && !schoolLoading && (
                <div className="relative school-selector-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSchoolDropdownOpen(!isSchoolDropdownOpen);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#3B66F5]/5 hover:bg-[#3B66F5]/10 rounded-full transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-[#3B66F5]" />
                    <span className="text-sm font-medium text-blue-700 max-w-[120px] truncate">
                      {activeSchool?.name || 'Pilih Sekolah'}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-[#3B66F5]", isSchoolDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isSchoolDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                      >
                        <div className="p-2 border-b border-slate-100">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                            Ganti Sekolah
                          </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1">
                          {schools.map(school => (
                            <button
                              key={school.id}
                              onClick={() => {
                                setActiveSchool(school);
                                setIsSchoolDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                                activeSchool?.id === school.id 
                                  ? "bg-[#3B66F5]/5 text-blue-700" 
                                  : "hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                activeSchool?.id === school.id ? "bg-[#3B66F5]/50 border-blue-500" : "border-slate-300"
                              )}>
                                {activeSchool?.id === school.id && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{school.name}</p>
                                {school.address && (
                                  <p className="text-xs text-slate-400 truncate">{school.address}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Single school display */}
              {userRole === 'guru' && schools.length === 1 && schools[0] && !schoolLoading && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#3B66F5]/5 rounded-lg">
                  <Building2 className="w-4 h-4 text-[#3B66F5]" />
                  <span className="text-sm font-medium text-blue-700 max-w-[150px] truncate">
                    {schools[0]?.name || ''}
                  </span>
                </div>
              )}

              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              <Link to="/profil" className="flex items-center gap-2.5 group p-1 pr-3 rounded-full hover:bg-white hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4 text-[#3B66F5]" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-[#1D4ED8] leading-none mb-0.5 group-hover:text-[#3B66F5] transition-colors">{userName}</p>
                  <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 leading-none">
                    {userRole === 'guru' ? 'Administrator' : 'Murid'}
                  </p>
                </div>
              </Link>
            </div>
          </header>
        )}

        <div className={cn(
          isFullScreenScanMode 
            ? "p-0 w-full max-w-none h-full flex flex-col relative z-20"
            : cn(
                "p-4 lg:p-8 w-full mx-auto transition-all duration-300",
                location.pathname.startsWith('/monitor-ujian') 
                  ? "max-w-[1600px]" 
                  : "max-w-[1400px]"
              )
        )}>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh] w-full">
              <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin" />
            </div>
          }>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </div>
      </main>
      <InstallPWA />
    </div>
  );
}
