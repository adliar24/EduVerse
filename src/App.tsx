import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import ErrorBoundary from './components/ErrorBoundary';

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

import { getFullState } from './services/dbAttendance';
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
  }, []);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    showToast(msg, type === 'success' ? 'success' : 'error');
  };

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-indigo-950 animate-spin" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-indigo-950 animate-spin" />
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
    refreshProfile().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-indigo-950 animate-spin" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-10 h-10 text-indigo-950 animate-spin" />
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

  useEffect(() => {
    const handleSync = () => {
      const savedStudent = localStorage.getItem('student_session');
      setStudentSession(savedStudent ? JSON.parse(savedStudent) : null);
    };

    window.addEventListener('student_session_change', handleSync);
    window.addEventListener('storage', handleSync);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setLoading(true);
        checkProfileCompletion(session.user.id, session);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        checkProfileCompletion(session.user.id, session);
      } else {
        setProfileCompleted(null);
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
      
      // Then check database
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

  if (loading && !studentSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fallback Loading UI for Lazy Components
  const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="w-10 h-10 text-indigo-950 animate-spin" />
    </div>
  );

  return (
    <AlertProvider>
      <ToastProvider>
        <SchoolProvider>
          <Router>
            <ErrorBoundary>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-slate-50">
                  <Loader2 className="w-12 h-12 text-indigo-950 animate-spin" />
                </div>
              }>
                <AnimatedRoutes session={session} studentSession={studentSession} profileCompleted={profileCompleted} userRole={userRole} />
              </Suspense>
            </ErrorBoundary>
          </Router>
        </SchoolProvider>
      </ToastProvider>
    </AlertProvider>
  );
}
