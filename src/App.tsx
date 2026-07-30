import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';
import ModernLoader from './components/ModernLoader';

// Prefetch helper
const preloadComponent = (importFn: () => Promise<any>) => {
  importFn().catch(console.error);
};

// Eagerly loaded components (Critical for initial paint)
import Login from './pages/Login';
import StudentJoin from './pages/student/Join';
import ProfileSetup from './pages/ProfileSetup';
import Layout from './components/Layout';
import { ToastProvider } from './pages/Layout';
import { AlertProvider } from './context/AlertContext';
import { SchoolProvider } from './context/SchoolContext';
import { ThemeProvider } from './context/ThemeContext';
import { Loader2 } from 'lucide-react';

// Eagerly loaded for student exam (prevents blank screen on navigation)
import StudentExam from './pages/student/Exam';
import StudentResult from './pages/student/Result';

// Lazy loaded pages (Code Splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const BankSoal = lazy(() => import('./pages/BankSoal'));
const BuatUjian = lazy(() => import('./pages/BuatUjian'));
const DaftarUjian = lazy(() => import('./pages/DaftarUjian'));
const HasilUjian = lazy(() => import('./pages/HasilUjian'));
const Analisis = lazy(() => import('./pages/Analisis'));
const Profil = lazy(() => import('./pages/Profil'));
const KelolaKelas = lazy(() => import('./pages/KelolaKelas'));
const MonitorUjian = lazy(() => import('./pages/MonitorUjian'));
const ScanUjian = lazy(() => import('./pages/ScanUjian'));
const KelolaSiswa = lazy(() => import('./pages/KelolaSiswa'));
const KelolaMateriTugas = lazy(() => import('./pages/KelolaMateriTugas'));
const MateriTugasSiswa = lazy(() => import('./pages/student/MateriTugasSiswa'));

// EduCheck (Attendance) Pages
const AttendanceScan = lazy(() => import('./pages/attendance/Attendance').then(m => ({ default: m.Attendance })));
const FaceBulkEnrollment = lazy(() => import('./pages/attendance/FaceBulkEnrollment')); // default export
const AttendanceRecap = lazy(() => import('./pages/attendance/AttendanceRecap').then(m => ({ default: m.Recap })));
const AttendanceSchedule = lazy(() => import('./pages/attendance/AttendanceSchedule').then(m => ({ default: m.Schedule })));
const AttendanceSettings = lazy(() => import('./pages/attendance/AttendanceSettings')); // default export
const AttendanceSetup = lazy(() => import('./pages/attendance/AttendanceSetup')); // default export
const AttendanceStudents = lazy(() => import('./pages/attendance/AttendanceStudents').then(m => ({ default: m.Students })));

// EduScore (Grading) Pages
const GradingDashboard = lazy(() => import('./pages/grading/MeetingListScreen').then(m => ({ default: m.MeetingListScreen })));
const GradingScreen = lazy(() => import('./pages/grading/GradingScreen').then(m => ({ default: m.GradingScreen })));
const GradingSettings = lazy(() => import('./pages/grading/GradingSettingsScreen').then(m => ({ default: m.GradingSettingsScreen })));
const MeetingList = lazy(() => import('./pages/grading/MeetingListScreen').then(m => ({ default: m.MeetingListScreen })));
const CreateMeetingScreen = lazy(() => import('./pages/grading/CreateMeetingScreen').then(m => ({ default: m.CreateMeetingScreen })));
const FinalGradeRecap = lazy(() => import('./pages/grading/FinalGradeRecapScreen').then(m => ({ default: m.FinalGradeRecapScreen })));
const PointScreen = lazy(() => import('./pages/grading/PointScreen').then(m => ({ default: m.PointScreen })));
const PointTemplates = lazy(() => import('./pages/grading/PointTemplateManagerScreen').then(m => ({ default: m.PointTemplateManagerScreen })));
const TPManager = lazy(() => import('./pages/grading/TPManagerScreen').then(m => ({ default: m.TPManagerScreen })));
const ReportScreen = lazy(() => import('./pages/grading/ReportScreen').then(m => ({ default: m.ReportScreen })));
const StudentReportDetail = lazy(() => import('./pages/grading/StudentReportDetailScreen').then(m => ({ default: m.StudentReportDetailScreen })));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const GroupGeneratorPage = lazy(() => import('./pages/tools/GroupGeneratorPage'));
const RandomizerPage = lazy(() => import('./pages/tools/RandomizerPage'));
const CertificateGeneratorPage = lazy(() => import('./pages/tools/CertificateGeneratorPage'));

import { getFullState, registerSyncListeners } from './services/dbAttendance';
import * as dbGrading from './services/dbGrading';
import { useAlert } from './context/AlertContext';
import { AppState, TeacherProfile } from './types';

// Wrapper to load local IndexedDB state for attendance pages
const AttendancePageWrapper = ({ Component }: { Component: React.ComponentType<any> }) => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useAlert();

  const loadState = async (forceRefresh = false) => {
    try {
      const fullState = await getFullState(forceRefresh);
      setState(fullState);
    } catch (err) {
      console.error("Failed to load attendance state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Load local state instantly
    loadState();

    // 2. Fetch updates from cloud in background
    const autoPull = async () => {
      try {
        const { syncService } = await import('./services/sync');
        if (syncService.isConfigured()) {
          const user = await syncService.getUser();
          if (user) {
            await syncService.pullFromCloud();
            // Force reload database to pick up new items
            await loadState(true);
          }
        }
      } catch (err) {
        console.error("[AttendancePageWrapper] Auto-pull failed:", err);
      }
    };

    autoPull();

    // 3. Listen to realtime sync updates
    const handleCloudSync = () => {
      console.log('[AttendancePageWrapper] Realtime sync event received, reloading database state...');
      loadState(true);
    };
    window.addEventListener('cloud_data_synced', handleCloudSync);

    return () => {
      window.removeEventListener('cloud_data_synced', handleCloudSync);
    };
  }, []);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    showToast(msg, type === 'success' ? 'success' : 'error');
  };

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin" />
      </div>
    }>
      <Component state={state} refresh={loadState} notify={notify} />
    </Suspense>
  );
};

// Wrapper to load local IndexedDB state for grading pages
const GradingPageWrapper = ({ Component }: { Component: React.ComponentType<any> }) => {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const p = await dbGrading.getTeacherProfile();
      setProfile(p || null);
      return p || null;
    } catch (err) {
      console.error("Failed to load grading profile:", err);
      return null;
    }
  };

  useEffect(() => {
    // 1. Load local profile instantly
    refreshProfile().then(() => setLoading(false));

    // 2. Pull updates from cloud in background
    const autoPullGrading = async () => {
      try {
        await dbGrading.syncCloudToLocal();
        await refreshProfile();
      } catch (err) {
        console.error("[GradingPageWrapper] Auto-pull failed:", err);
      }
    };

    autoPullGrading();

    // 3. Listen to realtime sync updates
    const handleCloudSync = () => {
      console.log('[GradingPageWrapper] Realtime sync event received, refreshing profile...');
      refreshProfile();
    };
    window.addEventListener('cloud_data_synced', handleCloudSync);

    return () => {
      window.removeEventListener('cloud_data_synced', handleCloudSync);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin" />
      </div>
    }>
      <Component key={profile?.activeSchoolId} profile={profile} refreshProfile={refreshProfile} onUpdate={refreshProfile} />
    </Suspense>
  );
};

function AnimatedRoutes({ session, studentSession, profileCompleted, userRole }: { session: any, studentSession: any, profileCompleted: boolean | null, userRole: string | null }) {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={!session && !studentSession ? <Login /> : <Navigate to="/dashboard" />} />

      {/* Profile Setup (First Login) */}
      <Route 
        path="/setup-profile" 
        element={
          session && profileCompleted === false 
            ? <ProfileSetup /> 
            : <Navigate to={session || studentSession ? "/dashboard" : "/login"} />
        } 
      />

      {/* Dashboard Routes */}
      <Route element={<Layout session={session} />}>
        <Route 
          path="/dashboard" 
          element={
            session || studentSession
              ? (session && profileCompleted === false 
                  ? <Navigate to="/setup-profile" />
                  : (userRole === 'guru' ? <Dashboard /> : <StudentDashboard />)
                )
              : <Navigate to="/login" />
          } 
        />
        
        {/* Teacher Only Routes */}
        <Route path="/kelola-kelas" element={session && userRole === 'guru' ? <KelolaKelas /> : <Navigate to="/dashboard" />} />
        <Route path="/kelola-siswa" element={session && userRole === 'guru' ? <KelolaSiswa /> : <Navigate to="/dashboard" />} />
        <Route path="/kelola-materi-tugas" element={session && userRole === 'guru' ? <KelolaMateriTugas /> : <Navigate to="/dashboard" />} />
        <Route path="/bank-soal" element={session && userRole === 'guru' ? <BankSoal /> : <Navigate to="/dashboard" />} />
        <Route path="/buat-ujian" element={session && userRole === 'guru' ? <BuatUjian /> : <Navigate to="/dashboard" />} />
        <Route path="/daftar-ujian" element={session || studentSession ? <DaftarUjian /> : <Navigate to="/login" />} />
        <Route path="/monitor-ujian/:examId" element={session && userRole === 'guru' ? <MonitorUjian /> : <Navigate to="/dashboard" />} />
        <Route path="/scan-ujian/:examId" element={session && userRole === 'guru' ? <ScanUjian /> : <Navigate to="/dashboard" />} />
        <Route path="/hasil-ujian" element={session && userRole === 'guru' ? <HasilUjian /> : <Navigate to="/dashboard" />} />
        <Route path="/analisis" element={session && userRole === 'guru' ? <Analisis /> : <Navigate to="/dashboard" />} />
        <Route path="/profil" element={session || studentSession ? <Profil /> : <Navigate to="/login" />} />
        <Route path="/daftar-ujian-siswa" element={studentSession ? <StudentJoin isDashboardView={true} /> : <Navigate to="/login" />} />
        <Route path="/materi-tugas-siswa" element={studentSession ? <MateriTugasSiswa /> : <Navigate to="/login" />} />
        <Route path="/settings/sync" element={session && userRole === 'guru' ? <SystemSettings /> : <Navigate to="/dashboard" />} />

        {/* EduCheck (Attendance) Routes */}
        <Route path="/attendance/scan" element={session && userRole === 'guru' ? <AttendancePageWrapper Component={AttendanceScan} /> : <Navigate to="/dashboard" />} />
        <Route path="/attendance/face-enrollment" element={session && userRole === 'guru' ? <AttendancePageWrapper Component={FaceBulkEnrollment} /> : <Navigate to="/dashboard" />} />
        <Route path="/attendance/recap" element={session && userRole === 'guru' ? <AttendancePageWrapper Component={AttendanceRecap} /> : <Navigate to="/dashboard" />} />
        <Route path="/attendance/schedule" element={session && userRole === 'guru' ? <AttendancePageWrapper Component={AttendanceSchedule} /> : <Navigate to="/dashboard" />} />
        <Route path="/attendance/settings" element={session && userRole === 'guru' ? <AttendancePageWrapper Component={AttendanceSettings} /> : <Navigate to="/dashboard" />} />
        <Route path="/attendance/setup" element={session && userRole === 'guru' ? <AttendancePageWrapper Component={AttendanceSetup} /> : <Navigate to="/dashboard" />} />
        <Route path="/attendance/students" element={session && userRole === 'guru' ? <AttendancePageWrapper Component={AttendanceStudents} /> : <Navigate to="/dashboard" />} />

        {/* EduScore (Grading) Routes */}
        <Route path="/grading" element={session && userRole === 'guru' ? <GradingPageWrapper Component={GradingDashboard} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/score/:idPertemuan" element={session && userRole === 'guru' ? <GradingPageWrapper Component={GradingScreen} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/settings" element={session && userRole === 'guru' ? <GradingPageWrapper Component={GradingSettings} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/meetings" element={session && userRole === 'guru' ? <GradingPageWrapper Component={MeetingList} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/meetings/new" element={session && userRole === 'guru' ? <GradingPageWrapper Component={CreateMeetingScreen} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/recap" element={session && userRole === 'guru' ? <GradingPageWrapper Component={FinalGradeRecap} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/points" element={session && userRole === 'guru' ? <GradingPageWrapper Component={PointScreen} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/points/templates" element={session && userRole === 'guru' ? <GradingPageWrapper Component={PointTemplates} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/tp" element={session && userRole === 'guru' ? <GradingPageWrapper Component={TPManager} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/reports" element={session && userRole === 'guru' ? <GradingPageWrapper Component={ReportScreen} /> : <Navigate to="/dashboard" />} />
        <Route path="/grading/reports/detail/:idKelas/:idSiswa" element={session && userRole === 'guru' ? <GradingPageWrapper Component={StudentReportDetail} /> : <Navigate to="/dashboard" />} />

        {/* Alat Bantu / Helper Tools Routes */}
        <Route path="/tools/groups" element={session && userRole === 'guru' ? <GroupGeneratorPage /> : <Navigate to="/dashboard" />} />
        <Route path="/tools/randomizer" element={session && userRole === 'guru' ? <RandomizerPage /> : <Navigate to="/dashboard" />} />
        <Route path="/tools/certificates" element={session && userRole === 'guru' ? <CertificateGeneratorPage /> : <Navigate to="/dashboard" />} />
      </Route>

      {/* Student Exam Flow (Direct Access) */}
      <Route path="/exam" element={<Navigate to="/daftar-ujian-siswa" />} />
      <Route path="/exam/start/:examCode" element={<StudentExam />} />
      <Route path="/exam/result/:participantId" element={<StudentResult />} />

      {/* Default Redirect */}
      <Route path="/" element={
        !session && !studentSession
          ? <Navigate to="/login" />
          : (session && profileCompleted === false
            ? <Navigate to="/setup-profile" />
            : <Navigate to="/dashboard" />)
      } />
    </Routes>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [studentSession, setStudentSession] = useState<any>(() => {
    const saved = localStorage.getItem('student_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);

  const syncInProgressRef = useRef(false);
  const triggerInitialSync = async () => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    try {
      const { syncService } = await import('./services/sync');
      if (syncService.isConfigured()) {
        const user = await syncService.getUser();
        if (user) {
          // Gather local state counts for all relevant entities
          const { getFullState } = await import('./services/dbAttendance');
          const localState = await getFullState();
          const localCounts = {
            classes: (localState.classes?.length || 0),
            students: (localState.students?.length || 0),
            sessions: (localState.sessions?.length || 0),
            records: (localState.records?.length || 0),
            schedules: (localState.schedules?.length || 0),
            events: (localState.events?.length || 0),
            cancellations: (localState.cancellations?.length || 0),
            materials: (localState.materials?.length || 0),
            assignments: (localState.assignments?.length || 0),
          };
          const localTotal = Object.values(localCounts).reduce((a, b) => a + b, 0);

          // Determine active school ID for cloud queries
          const client = (await import('./services/supabase')).getSupabaseClient();
          const activeSchoolId = typeof window !== 'undefined' ? localStorage.getItem('active_school_id') : null;
          const schoolId = (activeSchoolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeSchoolId))
            ? activeSchoolId
            : 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';

          // Fetch cloud counts for each table (teacher_id OR school_id)
          const tables = ['classes', 'students', 'sessions', 'records', 'schedules', 'events', 'cancellations', 'materials', 'assignments'];
          let cloudTotal = 0;
          for (const tbl of tables) {
            const cloudName = tbl === 'sessions' ? 'attendance_sessions' : tbl === 'records' ? 'attendance_records' : tbl;
            const { count } = await client.from(cloudName).select('*', { count: 'exact', head: true }).or(`teacher_id.eq.${user.id},school_id.eq.${schoolId}`);
            cloudTotal += count || 0;
          }

          const needPull = localTotal === 0 || localTotal !== cloudTotal;
          if (needPull) {
            console.log(`[App] Pulling from cloud (local ${localTotal} vs cloud ${cloudTotal})`);
            await syncService.pullFromCloud();
            const dbGrading = await import('./services/dbGrading');
            await dbGrading.syncCloudToLocal();
          } else {
            console.log('[App] Local data up‑to‑date; no pull needed.');
          }

          // Auto‑seed only when both local and cloud are completely empty (first install)
          if (localTotal === 0 && cloudTotal === 0) {
            console.log('[App] Both local & cloud empty – seeding Excel data');
            const { seedExcelDataToLocalAndCloud } = await import('./services/excelDataSeed');
            await seedExcelDataToLocalAndCloud();
          }

          console.log('[App] Initial sync evaluation complete.');

          // Subscribe to realtime changes for future updates
          syncService.subscribeToRealtimeSync(user.id, async () => {
            console.log('[App Realtime] Triggering sync pull due to changes on other device...');
            try {
              const { syncService: liveSync } = await import('./services/sync');
              await liveSync.pullFromCloud();
              const dbGrading = await import('./services/dbGrading');
              await dbGrading.syncCloudToLocal();
              window.dispatchEvent(new Event('cloud_data_synced'));
            } catch (err) {
              console.error('[App Realtime] Auto-pull failed:', err);
            }
          });
        }
      }
    } catch (err) {
      console.error('[App] Failed to evaluate sync:', err);
    } finally {
      syncInProgressRef.current = false;
      setIsInitialSyncComplete(true);
    }
  };

  useEffect(() => {
    const handleSync = () => {
      const savedStudent = localStorage.getItem('student_session');
      setStudentSession(savedStudent ? JSON.parse(savedStudent) : null);
    };

    // Ensure active school ID points to canonical SMAN 19 Bandung if set to old ID
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('active_school_id');
      if (!storedId || storedId === '635fc13c-c85b-4e7a-8e4a-6c6e54d84076' || storedId === 'legacy') {
        localStorage.setItem('active_school_id', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7');
      }
    }

    window.addEventListener('student_session_change', handleSync);
    window.addEventListener('storage', handleSync);

    // Register global sync listeners (visibilitychange, online)
    registerSyncListeners();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setLoading(true);
        checkProfileCompletion(session.user.id, session);
        triggerInitialSync();
      } else {
        setIsInitialSyncComplete(true);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        checkProfileCompletion(session.user.id, session);
        triggerInitialSync();
      } else {
        setProfileCompleted(null);
        setIsInitialSyncComplete(true);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('student_session_change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const checkProfileCompletion = async (userId: string, currentSession?: any) => {
    try {
      const sessionToUse = currentSession || session;
      const metadataCompleted = sessionToUse?.user?.user_metadata?.is_profile_completed === true;

      // Optimistically resolve metadata status if present to eliminate lag
      if (metadataCompleted) {
        setProfileCompleted(true);
        setLoading(false);
      }
      
      // Then check database to confirm
      const { data, error } = await supabase
        .from('profiles')
        .select('is_profile_completed')
        .eq('id', userId)
        .maybeSingle();
      
      // If error or no data, use metadata
      if (error || !data) {
        setProfileCompleted(metadataCompleted);
        setLoading(false);
        return;
      }
      
      const dbCompleted = data?.is_profile_completed === true;
      setProfileCompleted(dbCompleted || metadataCompleted);
    } catch (err) {
      console.error('Error checking profile:', err);
      // Default to false (show setup) on error
      setProfileCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const userRole = session ? (session.user?.user_metadata?.role || 'guru') : (studentSession ? 'siswa' : null);

  const isAppReady = !loading && (session ? (profileCompleted !== null && isInitialSyncComplete) : true);

  if (!isAppReady && !studentSession) {
    return <ModernLoader />;
  }

  // Fallback Loading UI for Lazy Components
  const PageLoader = () => (
    <ModernLoader />
  );

  return (
    <ThemeProvider>
      <AlertProvider>
        <ToastProvider>
          <SchoolProvider>
            <Router>
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen bg-slate-50">
                    <Loader2 className="w-12 h-12 text-[#1D4ED8] animate-spin" />
                  </div>
                }>
                  <AnimatedRoutes session={session} studentSession={studentSession} profileCompleted={profileCompleted} userRole={userRole} />
                </Suspense>
              </ErrorBoundary>
            </Router>
          </SchoolProvider>
        </ToastProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
