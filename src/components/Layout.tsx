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
import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';

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

  const studentSessionStr = localStorage.getItem('student_session');
  const student = studentSessionStr ? JSON.parse(studentSessionStr) : null;
  const userRole = session ? (session.user?.user_metadata?.role || 'guru') : (student ? 'siswa' : 'guru');
  const userName = session 
    ? (session.user?.user_metadata?.name || session.user?.email?.split('@')[0]) 
    : (student ? student.name : '');

  console.log('Layout - schools.length:', schools.length, 'schoolLoading:', schoolLoading);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // If click is outside the dropdown and outside the button, close it
      if (isSchoolDropdownOpen && !target.closest('.school-selector-container')) {
        setIsSchoolDropdownOpen(false);
      }
    };
    
    if (isSchoolDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isSchoolDropdownOpen]);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    localStorage.removeItem('student_session');
    window.dispatchEvent(new Event('student_session_change'));
    
    try {
      const { clearSyncTimeout } = await import('../services/dbAttendance');
      clearSyncTimeout();
    } catch (e) {
      console.warn("Failed to clear sync timeout on logout:", e);
    }

    await supabase.auth.signOut();
    setTimeout(() => {
      navigate('/login');
      setIsLoggingOut(false);
    }, 850);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Logout Transition Overlay */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-indigo-950 z-[9999] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="bg-white/10 p-5 rounded-[2rem] border border-white/10 shadow-2xl relative">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight">Mengamankan Sesi</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sedang keluar dari sistem...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[40%] h-[40%] bg-purple-400/15 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[25%] h-[25%] bg-blue-400/10 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar Desktop */}
      {!isFullScreenScanMode && (
        <aside className="w-[240px] bg-indigo-950 border-r border-indigo-900/50 hidden lg:flex flex-col sticky top-0 h-screen z-40 transition-all duration-300 shadow-2xl">
          <div className="p-6 flex items-center gap-3 relative z-10 border-b border-white/5">
            <GraduationCap className="w-6 h-6 text-white" />
            <span className="text-xl font-bold tracking-tight text-white">Edu<span className="text-blue-400">Verse</span></span>
          </div>

          <nav className="flex-1 px-4 py-3 space-y-1 relative z-10 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-none">
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
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-colors duration-150 group text-left cursor-pointer",
                        isActive
                          ? "bg-white text-indigo-950 shadow-lg shadow-white/5 font-semibold"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-105",
                          isActive ? "text-indigo-900" : "text-slate-500 group-hover:text-slate-200"
                        )} />
                        <span className="font-medium text-[13px]">{item.label}</span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isActive ? "text-indigo-900" : "text-slate-500 group-hover:text-slate-200",
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
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors",
                                location.pathname === sub.path
                                  ? "text-blue-400 bg-white/5 font-semibold"
                                  : "text-slate-400 hover:text-white"
                              )}
                            >
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                location.pathname === sub.path ? "bg-blue-400" : "bg-slate-700 group-hover:bg-slate-400"
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group text-left cursor-pointer",
                    location.pathname === item.path
                      ? "bg-white text-indigo-950 shadow-lg shadow-white/5 font-semibold"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-105",
                    location.pathname === item.path ? "text-indigo-900" : "text-slate-500 group-hover:text-slate-200"
                  )} />
                  <span className="font-medium text-[13px]">{item.label}</span>
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
              className="flex items-center gap-3 w-full px-4 py-3 bg-rose-500/20 border border-rose-500/30 text-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-200 group"
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
              className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.2 }}
              className="fixed inset-y-0 left-0 w-[260px] bg-indigo-950 z-50 lg:hidden flex flex-col shadow-xl overflow-y-auto"
            >
              <div className="p-6 flex items-center justify-between sticky top-0 bg-indigo-950 z-10 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-6 h-6 text-white" />
                  <span className="text-lg font-bold text-white">Edu<span className="text-blue-400">Verse</span></span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors bg-white/5">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-1">
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
                            "flex items-center justify-between w-full px-3 py-3 rounded-xl transition-colors duration-150 text-sm font-medium text-left cursor-pointer",
                            isActive
                              ? "bg-white text-indigo-950 shadow-md font-semibold"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn(
                              "w-[18px] h-[18px]",
                              isActive ? "text-indigo-900" : "text-slate-500"
                            )} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isActive ? "text-indigo-900" : "text-slate-500",
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
                                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname === sub.path
                                      ? "text-blue-400 bg-white/5 font-semibold"
                                      : "text-slate-400 hover:text-white"
                                  )}
                                >
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                    location.pathname === sub.path ? "bg-blue-400" : "bg-slate-700"
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
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium",
                        location.pathname === item.path
                          ? "bg-white text-indigo-950 shadow-md font-semibold"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-[18px] h-[18px]", location.pathname === item.path ? "text-indigo-900" : "text-slate-500")} />
                      <span>{item.label}</span>
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
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-rose-500/20 border border-rose-500/30 text-rose-100 font-bold text-sm rounded-xl hover:bg-rose-600 hover:text-white transition-all group"
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
          <header className="h-16 shrink-0 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-white rounded-lg text-slate-600 border border-slate-200/50 transition-all active:scale-95 bg-white/50"
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
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 max-w-[120px] truncate">
                      {activeSchool?.name || 'Pilih Sekolah'}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-blue-500", isSchoolDropdownOpen && "rotate-180")} />
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
                                  ? "bg-blue-50 text-blue-700" 
                                  : "hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                                activeSchool?.id === school.id ? "bg-blue-500 border-blue-500" : "border-slate-300"
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 max-w-[150px] truncate">
                    {schools[0]?.name || ''}
                  </span>
                </div>
              )}

              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              <Link to="/profil" className="flex items-center gap-2.5 group p-1 pr-3 rounded-full hover:bg-white hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-indigo-950 leading-none mb-0.5 group-hover:text-blue-600 transition-colors">{userName}</p>
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
              <Loader2 className="w-10 h-10 text-indigo-950 animate-spin" />
            </div>
          }>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
