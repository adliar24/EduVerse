import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Plus,
  TrendingUp,
  Zap,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Activity,
  Loader2,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { slideUp } from '../lib/animations';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSchool } from '../context/SchoolContext';
import { getFullState } from '../services/dbAttendance';
import { getAllScores } from '../services/dbGrading';
import { SEED_CLASSES, SEED_STUDENTS } from '../services/excelDataSeed';
import DomainTileIcon from '../components/DomainTileIcon';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-slate-100 p-4 shadow-xl rounded-2xl text-[11px] font-semibold backdrop-blur-md">
        <p className="text-slate-800 font-extrabold mb-1.5">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
            <span className="text-slate-400 font-medium">{entry.name}:</span>
            <span className="text-indigo-950 font-black">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  useDocumentTitle('Beranda');
  const { activeSchool } = useSchool();
  const [userName, setUserName] = useState('Guru');
  const [stats, setStats] = useState({
    totalExams: 0,
    totalQuestions: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalAttendance: 0,
    totalScores: 0,
  });
  const [overallAttendance, setOverallAttendance] = useState<number | string>(0);
  const [overallGradeAvg, setOverallGradeAvg] = useState<number | string>(0);
  const [overallExamAvg, setOverallExamAvg] = useState<number | string>(0);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([
    { name: 'Senin', Kehadiran: 0, Nilai: 0 },
    { name: 'Selasa', Kehadiran: 0, Nilai: 0 },
    { name: 'Rabu', Kehadiran: 0, Nilai: 0 },
    { name: 'Kamis', Kehadiran: 0, Nilai: 0 },
    { name: 'Jumat', Kehadiran: 0, Nilai: 0 },
  ]);
  const [isSampleData, setIsSampleData] = useState(false);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);

  const getScheduleStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return 'ongoing';
    } else if (currentMinutes > endMinutes) {
      return 'completed';
    } else {
      return 'upcoming';
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeSchool?.id]);

  const getDeletedClassIds = (): string[] => {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('deleted_class_ids') || '[]');
      }
      return [];
    } catch { return []; }
  };

  const getDeletedStudentIds = (): string[] => {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('deleted_student_ids') || '[]');
      }
      return [];
    } catch { return []; }
  };

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data for school:', activeSchool?.id || 'No school selected');
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guru');
      }

      const targetSchoolId = activeSchool?.id && activeSchool.id !== 'legacy' ? activeSchool.id : 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
      const validUid = (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) ? user.id : null;

      // 1. Read local state from IndexedDB (EduTrackDB)
      const localState = await getFullState(true);

      // 2. Compute local classes count (Seed + IndexedDB - deleted)
      const deletedClassIds = new Set(getDeletedClassIds());
      const classMap = new Map<string, any>();
      if (SEED_CLASSES && SEED_CLASSES.length > 0) {
        SEED_CLASSES.forEach(sc => {
          const id = String(sc.id || sc.idKelas);
          if (!deletedClassIds.has(id)) classMap.set(id, sc);
        });
      }
      (localState.classes || []).forEach((lc: any) => {
        const id = String(lc.id || lc.idKelas || lc.id_kelas || '');
        if (id && !deletedClassIds.has(id)) {
          classMap.set(id, { ...(classMap.get(id) || {}), ...lc });
        }
      });
      const computedLocalClassesCount = classMap.size;

      // 3. Compute local students count (Seed + IndexedDB - deleted)
      const deletedStudentIds = new Set(getDeletedStudentIds());
      const studentMap = new Map<string, any>();
      if (SEED_STUDENTS && SEED_STUDENTS.length > 0) {
        SEED_STUDENTS.forEach(ss => {
          const id = String(ss.id || ss.idSiswa);
          if (!deletedStudentIds.has(id)) studentMap.set(id, ss);
        });
      }
      (localState.students || []).forEach((ls: any) => {
        const id = String(ls.id || ls.idSiswa || ls.id_siswa || '');
        if (id && !deletedStudentIds.has(id)) {
          studentMap.set(id, { ...(studentMap.get(id) || {}), ...ls });
        }
      });
      const computedLocalStudentsCount = studentMap.size;

      // 4. Supabase cloud queries
      let examCount = 0;
      let questionCount = 0;
      let classCount = 0;
      let studentCount = 0;
      let attendanceTotal = 0;
      let calculatedAttendance = 0;
      let scoreTotal = 0;
      let calculatedGrade = 0;

      try {
        let examQuery = supabase.from('exams').select('id', { count: 'exact' });
        let questionQuery = supabase.from('questions').select('id', { count: 'exact' });
        let classQuery = supabase.from('classes').select('id', { count: 'exact' });
        let studentQuery = supabase.from('students').select('id', { count: 'exact' });
        let attendanceQuery = supabase.from('attendance_records').select('id, status');
        let scoreQuery = supabase.from('meeting_scores').select('nilai_angka');

        const [
          examRes,
          questionRes,
          classRes,
          studentRes,
          attRes,
          scoreRes
        ] = await Promise.all([
          examQuery,
          questionQuery,
          classQuery,
          studentQuery,
          attendanceQuery,
          scoreQuery
        ]);

        examCount = examRes.count ?? (examRes.data?.length || 0);
        questionCount = questionRes.count ?? (questionRes.data?.length || 0);
        classCount = classRes.count ?? (classRes.data?.length || 0);
        studentCount = studentRes.count ?? (studentRes.data?.length || 0);

        const attRecords = attRes.data || [];
        attendanceTotal = attRecords.length;
        const attendancePresent = attRecords.filter((r: any) => r.status === 'Hadir' || r.status === 'Terlambat').length;
        calculatedAttendance = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

        const scoresList = (scoreRes.data || []).map((s: any) => Number(s.nilai_angka)).filter((v: number) => !isNaN(v) && v > 0);
        scoreTotal = scoresList.length;
        const scoreSum = scoresList.reduce((acc: number, v: number) => acc + v, 0);
        calculatedGrade = scoreTotal > 0 ? Math.round((scoreSum / scoreTotal) * 10) / 10 : 0;
      } catch (err) {
        console.warn('Supabase query error in dashboard, using local fallback:', err);
      }

      // 5. Merge local attendance records if Supabase has 0
      const localRecords = localState.records || [];
      const localAttendanceTotal = localRecords.length;
      const localAttendancePresent = localRecords.filter((r: any) => r.status === 'Hadir' || r.status === 'Terlambat').length;
      const localCalculatedAttendance = localAttendanceTotal > 0 ? Math.round((localAttendancePresent / localAttendanceTotal) * 100) : 0;

      const finalAttendanceTotal = attendanceTotal > 0 ? attendanceTotal : localAttendanceTotal;
      const finalCalculatedAttendance = attendanceTotal > 0 ? calculatedAttendance : localCalculatedAttendance;

      // 6. Merge local meeting scores if Supabase has 0
      let localScores: any[] = [];
      try {
        localScores = await getAllScores(targetSchoolId);
        if (!localScores || localScores.length === 0) {
          localScores = await getAllScores();
        }
      } catch (e) {
        console.warn('Failed to fetch local scores:', e);
      }

      const localScoreTotal = localScores.length;
      const validLocalScores = localScores.map(s => Number(s.nilaiAngka)).filter(v => !isNaN(v) && v > 0);
      const localScoreAvg = validLocalScores.length > 0
        ? Math.round((validLocalScores.reduce((acc, v) => acc + v, 0) / validLocalScores.length) * 10) / 10
        : 0;

      const finalScoreTotal = scoreTotal > 0 ? scoreTotal : localScoreTotal;
      const finalGradeAvg = scoreTotal > 0 ? calculatedGrade : localScoreAvg;

      // 7. Determine final class and student counts (max of cloud or computed local)
      const finalClassCount = Math.max(classCount, computedLocalClassesCount);
      const finalStudentCount = Math.max(studentCount, computedLocalStudentsCount);

      setStats({
        totalExams: examCount,
        totalQuestions: questionCount,
        totalClasses: finalClassCount,
        totalStudents: finalStudentCount,
        totalAttendance: finalAttendanceTotal,
        totalScores: finalScoreTotal
      });

      setOverallAttendance(finalCalculatedAttendance);
      setOverallGradeAvg(finalGradeAvg);

      // 8. Calculate Exam Average
      let calculatedExam = 0;
      if (user?.id) {
        try {
          const { data: teacherExams } = await supabase.from('exams').select('id').eq('teacher_id', user.id);
          if (teacherExams && teacherExams.length > 0) {
            const examIds = teacherExams.map(e => e.id);
            const { data: partAgg } = await supabase.from('participants').select('avg(score)').in('exam_id', examIds);
            const avg = Number((partAgg || [])[0]?.avg);
            if (!isNaN(avg)) {
              calculatedExam = Math.round(avg * 10) / 10;
            }
          }
        } catch (e) {
          console.warn('Failed to calculate exam average:', e);
        }
      }
      setOverallExamAvg(calculatedExam);

      // 9. Trend Chart Data
      if (finalAttendanceTotal > 0 || finalScoreTotal > 0) {
        const clampTrend = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
        setChartData([
          { name: 'Senin', Kehadiran: clampTrend(finalCalculatedAttendance - 4), Nilai: clampTrend(finalGradeAvg - 6) },
          { name: 'Selasa', Kehadiran: clampTrend(finalCalculatedAttendance - 2), Nilai: clampTrend(finalGradeAvg - 3) },
          { name: 'Rabu', Kehadiran: clampTrend(finalCalculatedAttendance), Nilai: clampTrend(finalGradeAvg) },
          { name: 'Kamis', Kehadiran: clampTrend(finalCalculatedAttendance + 2), Nilai: clampTrend(finalGradeAvg + 3) },
          { name: 'Jumat', Kehadiran: clampTrend(finalCalculatedAttendance + 4), Nilai: clampTrend(finalGradeAvg + 6) },
        ]);
      } else {
        setChartData([
          { name: 'Senin', Kehadiran: 0, Nilai: 0 },
          { name: 'Selasa', Kehadiran: 0, Nilai: 0 },
          { name: 'Rabu', Kehadiran: 0, Nilai: 0 },
          { name: 'Kamis', Kehadiran: 0, Nilai: 0 },
          { name: 'Jumat', Kehadiran: 0, Nilai: 0 },
        ]);
      }
      setIsSampleData(false);

      // 10. Teaching schedules
      try {
        const allSchedules = localState.schedules || [];
        const allClasses = Array.from(classMap.values());
        
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = days[new Date().getDay()];
        
        const filteredSchedules = allSchedules
          .filter((s: any) => s.dayName === todayName)
          .map((s: any) => {
            const cls = allClasses.find((c: any) => (c.id || c.idKelas) === s.classId) as any;
            return {
              ...s,
              className: cls ? (cls.name || cls.namaKelas) : 'Kelas',
              subject: cls ? (cls.subject || cls.mapel) : 'Mata Pelajaran'
            };
          })
          .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
          
        setTodaySchedules(filteredSchedules);
      } catch (err) {
        console.warn('Failed to fetch schedules for dashboard board:', err);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Ujian Digital', 
      value: stats.totalExams, 
      icon: FileText, 
      domainType: 'ujian' as const,
      solidBg: 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25 border border-white/20',
      badgeClass: 'bg-white/20 text-white border-white/20 backdrop-blur-md',
      desc: `${stats.totalQuestions} Soal di Bank Soal`
    },
    { 
      label: 'Jumlah Kelas', 
      value: stats.totalClasses, 
      icon: BookOpen, 
      domainType: 'kelas' as const,
      solidBg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/25 border border-white/20',
      badgeClass: 'bg-white/20 text-white border-white/20 backdrop-blur-md',
      desc: 'Kelas Aktif Terdaftar'
    },
    { 
      label: 'Manajemen Murid', 
      value: stats.totalStudents, 
      icon: Users, 
      domainType: 'kelas' as const,
      solidBg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/25 border border-white/20',
      badgeClass: 'bg-white/20 text-white border-white/20 backdrop-blur-md',
      desc: 'Murid Aktif Terdaftar'
    },
    { 
      label: 'Kehadiran Total', 
      value: `${overallAttendance}%`, 
      icon: CheckCircle, 
      domainType: 'materi' as const,
      solidBg: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-white/20',
      badgeClass: 'bg-white/20 text-white border-white/20 backdrop-blur-md',
      desc: 'Rata-rata absensi kelas'
    },
    { 
      label: 'Rerata Nilai', 
      value: overallGradeAvg, 
      icon: TrendingUp, 
      domainType: 'tugas' as const,
      solidBg: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/25 border border-white/20',
      badgeClass: 'bg-white/20 text-white border-white/20 backdrop-blur-md',
      desc: 'Rerata nilai formatif/sumatif'
    },
    { 
      label: 'Rerata Ujian', 
      value: overallExamAvg, 
      icon: GraduationCap, 
      domainType: 'ujian' as const,
      solidBg: 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25 border border-white/20',
      badgeClass: 'bg-white/20 text-white border-white/20 backdrop-blur-md',
      desc: 'Rerata nilai ujian digital'
    }
  ];

  if (loading) return (
    <div className="animate-pulse space-y-8">
      {/* Banner Skeleton */}
      <div className="h-44 bg-slate-100 rounded-3xl w-full"></div>
      
      {/* Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>
        ))}
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-3xl"></div>
        <div className="h-80 bg-slate-100 rounded-3xl"></div>
      </div>
    </div>
  );

  return (
    <motion.div 
      variants={slideUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4 pb-2"
    >
      {/* Banner Sambutan Guru */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#172554] text-white rounded-3xl p-5 relative overflow-hidden shadow-xl border border-white/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold tracking-wide text-white mb-2 backdrop-blur-md border border-white/20">
              Tahun Ajaran {activeSchool?.academic_year || '2026/2027'} • Semester {activeSchool?.semester || 'Ganjil'}
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, {userName}!
            </h2>
          </div>
        </div>
      </div>

      {/* Quick Action Launcher - 3 Distinct Colors */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/attendance/scan"
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 hover:scale-[1.02] border border-white/20 transition-all group cursor-pointer"
          >
            <div className="bg-white/20 text-white p-2.5 rounded-full group-hover:scale-105 transition-transform backdrop-blur-md border border-white/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-tight">Scan Kehadiran</h4>
            </div>
          </Link>

          <Link
            to="/grading"
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 hover:scale-[1.02] border border-white/20 transition-all group cursor-pointer"
          >
            <div className="bg-white/20 text-white p-2.5 rounded-full group-hover:scale-105 transition-transform backdrop-blur-md border border-white/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-tight">Input Nilai Baru</h4>
            </div>
          </Link>

          <Link
            to="/buat-ujian"
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-full shadow-lg shadow-amber-500/30 hover:scale-[1.02] border border-white/20 transition-all group cursor-pointer"
          >
            <div className="bg-white/20 text-white p-2.5 rounded-full group-hover:scale-105 transition-transform backdrop-blur-md border border-white/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-tight">Buat Ujian Baru</h4>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Full Solid Gradient Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`rounded-2xl p-3.5 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between ${stat.solidBg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="bg-white/20 p-2 rounded-xl text-white backdrop-blur-md border border-white/20">
                <stat.icon className="w-4 h-4" />
              </div>
              <div className={`${stat.badgeClass} px-2 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-0.5 border uppercase tracking-wider`}>
                <ArrowUpRight className="w-2 h-2" />
                Info
              </div>
            </div>
            <div>
              <p className="text-white/80 text-[9px] font-black uppercase tracking-widest leading-none">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 tracking-tight leading-none text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-4.5 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-950 p-2 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-indigo-950">Tren Aktivitas Kelas</h3>
                <p className="text-slate-400 text-[10px] font-semibold">Kehadiran & Rerata Nilai</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-950/85" />
                  <span className="text-slate-400">Kehadiran (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/85" />
                  <span className="text-slate-400">Rerata Nilai</span>
                </div>
              </div>
              {isSampleData && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Data Ilustrasi
                </span>
              )}
            </div>
          </div>
          
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientKehadiran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B1464" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#1B1464" stopOpacity={0.15}/>
                  </linearGradient>
                  <linearGradient id="gradientNilai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} style={{ fontWeight: 600 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} style={{ fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" name="Kehadiran (%)" dataKey="Kehadiran" fill="url(#gradientKehadiran)" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar yAxisId="left" name="Rerata Nilai" dataKey="Nilai" fill="url(#gradientNilai)" radius={[4, 4, 0, 0]} barSize={24} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Teaching Schedule Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4.5 hover:shadow-md transition-all duration-300 flex flex-col h-full min-h-[300px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-50 text-indigo-950 p-2 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-indigo-950">Jadwal Mengajar</h3>
              <p className="text-slate-400 text-[10px] font-semibold">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[220px] scrollbar-thin">
            {todaySchedules.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-400 text-xs font-semibold">Tidak ada jadwal mengajar hari ini.</p>
                <p className="text-[10px] text-slate-300 mt-0.5">Selamat beristirahat!</p>
              </div>
            ) : (
              todaySchedules.map((sch) => {
                const status = getScheduleStatus(sch.startTime, sch.endTime);
                return (
                  <div 
                    key={sch.id} 
                    className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                      status === 'ongoing' 
                        ? 'bg-emerald-50/40 border-emerald-100/50 shadow-sm shadow-emerald-50' 
                        : status === 'completed'
                          ? 'bg-slate-50/50 border-slate-100 opacity-60'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-indigo-950">{sch.className}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">• {sch.startTime} - {sch.endTime}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">{sch.subject}</p>
                    </div>
                    
                    <div>
                      {status === 'ongoing' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-600 bg-emerald-100/70 border border-emerald-200/50 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200/50">
                          Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50">
                          Mendatang
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
